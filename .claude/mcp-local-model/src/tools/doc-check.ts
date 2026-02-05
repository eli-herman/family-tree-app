import { readFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { join, relative } from "path";
import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { validateJson, withRetry } from "../utils/helpers.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { fileCache } from "../cache/index.js";

const EXEC_TIMEOUT = 10_000; // 10s timeout for all shell commands

export const docCheckTool = {
  name: "local_doc_check",
  description:
    "Validate documentation against codebase reality. Checks file paths, exports, and structure claims in doc files against actual files.",
  inputSchema: {
    type: "object" as const,
    properties: {
      doc_file: {
        type: "string",
        description:
          "Absolute path to the documentation file to validate",
      },
      check_types: {
        type: "array",
        items: {
          type: "string",
          enum: ["file_paths", "exports", "structure", "all"],
        },
        description:
          "Types of checks to perform (default: all)",
      },
    },
    required: ["doc_file"],
  },
};

interface DocCheckParams {
  doc_file: string;
  check_types?: ("file_paths" | "exports" | "structure" | "all")[];
}

function getRepoRoot(): string {
  try {
    return execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT,
    }).trim();
  } catch {
    return process.cwd();
  }
}

/**
 * Recursively collect .ts/.tsx/.js files under a directory (Node API, no shell).
 * Returns paths relative to repoRoot. Caps at maxFiles.
 */
async function collectSourceFiles(
  dir: string,
  repoRoot: string,
  maxFiles: number = 50
): Promise<string[]> {
  const results: string[] = [];

  async function walk(d: string) {
    if (results.length >= maxFiles) return;
    if (!existsSync(d)) return;

    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;
      const fullPath = join(d, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        await walk(fullPath);
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        results.push(relative(repoRoot, fullPath));
      }
    }
  }

  await walk(dir);
  return results.sort();
}

/**
 * Search for an export name in source files using Node file I/O (no shell grep).
 * Returns true if found in any file.
 */
async function findExportInFiles(
  exportName: string,
  searchDirs: string[]
): Promise<boolean> {
  // Validate exportName is a safe identifier (alphanumeric + underscore only)
  if (!/^\w+$/.test(exportName)) return false;

  const pattern = new RegExp(`export.*\\b${exportName}\\b`);

  for (const dir of searchDirs) {
    if (!existsSync(dir)) continue;

    const files = await collectSourceFiles(dir, dir, 200);
    for (const file of files) {
      try {
        const content = await readFile(join(dir, file), "utf-8");
        if (pattern.test(content)) return true;
      } catch {
        continue;
      }
    }
  }
  return false;
}

export async function docCheckHandler(params: DocCheckParams) {
  const startTime = Date.now();
  const repoRoot = getRepoRoot();
  const checkTypes = params.check_types || ["all"];
  const doAll = checkTypes.includes("all");

  if (!existsSync(params.doc_file)) {
    return {
      success: false,
      error: `Documentation file not found: ${params.doc_file}`,
      error_category: "file_not_found",
      recoverable: false,
      suggestion: "Check the file path and try again",
    };
  }

  const docContent = await fileCache.get(params.doc_file);
  let totalTokens = 0;
  let totalInputChars = docContent.length;
  let totalOutputChars = 0;
  const issues: Array<{
    type: string;
    severity: "error" | "warning" | "info";
    message: string;
    line?: number;
  }> = [];

  // 1. File path validation (no model needed)
  if (doAll || checkTypes.includes("file_paths")) {
    const pathPatterns = [
      /`([./][\w./\-[\]{}]+\.\w+)`/g,
      /\*\*([./][\w./\-[\]{}]+\.\w+)\*\*/g,
    ];

    const foundPaths = new Set<string>();
    for (const pattern of pathPatterns) {
      let match;
      while ((match = pattern.exec(docContent)) !== null) {
        const p = match[1];
        if (
          p.includes("{{") ||
          p.includes("$") ||
          p.startsWith("http") ||
          p.includes("*")
        ) {
          continue;
        }
        foundPaths.add(p);
      }
    }

    for (const filePath of foundPaths) {
      const resolvedPath = filePath.startsWith("/")
        ? filePath
        : join(repoRoot, filePath.replace(/^\.\//, ""));

      if (!existsSync(resolvedPath)) {
        const lines = docContent.split("\n");
        const lineNum = lines.findIndex((l) => l.includes(filePath)) + 1;
        issues.push({
          type: "file_paths",
          severity: "error",
          message: `Referenced file not found: ${filePath}`,
          line: lineNum || undefined,
        });
      }
    }
  }

  // 2. Export validation (Node API - no shell injection risk)
  if (doAll || checkTypes.includes("exports")) {
    const codeBlocks = docContent.match(/```[\s\S]*?```/g) || [];
    const mentionedExports: string[] = [];
    for (const block of codeBlocks) {
      const exportMatches = block.match(
        /(?:export\s+(?:default\s+)?(?:function|const|class|type|interface)\s+)(\w+)/g
      );
      if (exportMatches) {
        for (const m of exportMatches) {
          const name = m.match(/(\w+)$/)?.[1];
          if (name) mentionedExports.push(name);
        }
      }
    }

    if (mentionedExports.length > 0) {
      const searchDirs = [
        join(repoRoot, "src"),
        join(repoRoot, "app"),
      ];

      for (const exportName of mentionedExports.slice(0, 20)) {
        const found = await findExportInFiles(exportName, searchDirs);
        if (!found) {
          issues.push({
            type: "exports",
            severity: "warning",
            message: `Documented export '${exportName}' not found in codebase`,
          });
        }
      }
    }
  }

  // 3. Structure validation (uses model)
  if (doAll || checkTypes.includes("structure")) {
    let actualFiles: string[];
    try {
      const srcFiles = await collectSourceFiles(join(repoRoot, "src"), repoRoot);
      const appFiles = await collectSourceFiles(join(repoRoot, "app"), repoRoot);
      actualFiles = [...srcFiles, ...appFiles];
    } catch {
      actualFiles = [];
    }

    const actualStructure = actualFiles.length > 0
      ? actualFiles.join("\n")
      : "Could not read directory structure";

    const prompt = TASK_PROMPTS.docCheck(docContent, actualStructure);
    totalInputChars += prompt.length;

    try {
      const result = await withRetry(async () => {
        const { response, tokensUsed } = await generate({
          system: SYSTEM_PROMPTS.docCheck,
          prompt,
          format: "json",
        });
        totalTokens += tokensUsed;
        totalOutputChars += response.length;

        const parsed = validateJson(response);
        if (!parsed.valid) {
          throw new Error(`Invalid JSON: ${parsed.error}`);
        }
        return parsed.data;
      });

      if (result.issues && Array.isArray(result.issues)) {
        for (const issue of result.issues) {
          issues.push({
            type: "structure",
            severity: issue.severity || "warning",
            message: issue.message || issue.issue || "Unknown issue",
            line: issue.line,
          });
        }
      }
    } catch {
      issues.push({
        type: "structure",
        severity: "info",
        message: "Structure validation skipped - Ollama unavailable",
      });
    }
  }

  const estimatedClaude = estimateClaudeTokens({
    inputChars: totalInputChars,
    outputChars: totalOutputChars,
    taskComplexity: "medium",
  });

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_doc_check",
    task_type: checkTypes.join(","),
    local_tokens: totalTokens,
    estimated_claude_tokens: estimatedClaude,
    duration_ms: Date.now() - startTime,
    success: true,
    files_processed: 1,
    file: params.doc_file,
  }).catch(() => {});

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    success: true,
    data: {
      doc_file: params.doc_file,
      checks_performed: doAll ? ["file_paths", "exports", "structure"] : checkTypes,
      issues,
      summary: {
        errors: errorCount,
        warnings: warningCount,
        total: issues.length,
        verdict: errorCount > 0 ? "fail" : warningCount > 0 ? "warn" : "pass",
      },
    },
    tokens_used: totalTokens,
  };
}
