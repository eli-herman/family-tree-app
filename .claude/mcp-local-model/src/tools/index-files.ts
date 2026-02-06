/**
 * Index Files Tool
 * Bridges local files → remote ChromaDB.
 * Reads files from disk, sends to remote /index endpoint.
 */

import { readFile } from "fs/promises";
import { execSync } from "child_process";
import { basename, extname, relative } from "path";
import { remoteIndex, isRemoteAvailable } from "../ollama/remote.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";

const MAX_FILE_SIZE = 100 * 1024; // 100KB

// File extensions to index
const INDEXABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".go", ".rs", ".java", ".kt",
  ".css", ".scss", ".html", ".vue", ".svelte",
  ".json", ".yaml", ".yml", ".toml",
  ".md", ".mdx", ".txt",
  ".sh", ".bash", ".zsh",
  ".sql",
  ".graphql", ".gql",
]);

// Directories to skip
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next",
  ".expo", "__pycache__", ".venv", "venv",
  "coverage", ".nyc_output", ".cache",
]);

export const indexFilesTool = {
  name: "local_index",
  description:
    "Index local files into remote ChromaDB for semantic search. Reads files from disk, generates embeddings via remote server, and stores in ChromaDB.",
  inputSchema: {
    type: "object" as const,
    properties: {
      paths: {
        type: "array",
        items: { type: "string" },
        description:
          "File paths or glob patterns to index (e.g., ['src/**/*.ts'])",
      },
      collection: {
        type: "string",
        description: "ChromaDB collection name (default: 'codebase')",
      },
    },
    required: ["paths"],
  },
};

interface IndexFilesParams {
  paths: string[];
  collection?: string;
}

/**
 * Expand glob patterns to file paths using git ls-files or find
 */
function expandGlobs(patterns: string[]): string[] {
  const files: string[] = [];

  let repoRoot: string;
  try {
    repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
  } catch {
    repoRoot = process.cwd();
  }

  for (const pattern of patterns) {
    try {
      // Use git ls-files to respect .gitignore
      const output = execSync(
        `cd "${repoRoot}" && git ls-files --cached --others --exclude-standard "${pattern}"`,
        { encoding: "utf-8", timeout: 10000, maxBuffer: 1024 * 1024 }
      ).trim();

      if (output) {
        for (const f of output.split("\n")) {
          const fullPath = f.startsWith("/") ? f : `${repoRoot}/${f}`;
          files.push(fullPath);
        }
      }
    } catch {
      // If git ls-files fails, treat as literal path
      files.push(pattern);
    }
  }

  return [...new Set(files)]; // deduplicate
}

/**
 * Check if a file should be indexed
 */
function shouldIndex(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  if (!INDEXABLE_EXTENSIONS.has(ext)) return false;

  const parts = filePath.split("/");
  for (const dir of parts) {
    if (SKIP_DIRS.has(dir)) return false;
  }

  return true;
}

export async function indexFilesHandler(params: IndexFilesParams) {
  const { paths, collection = "codebase" } = params;
  const startTime = Date.now();

  // Check remote availability
  const available = await isRemoteAvailable();
  if (!available) {
    return {
      success: false,
      error: "Remote server unavailable. Start the Quality Server on Windows to index files.",
      error_category: "remote_unavailable",
      recoverable: true,
    };
  }

  // Expand globs
  const allFiles = expandGlobs(paths);
  const filesToIndex = allFiles.filter(shouldIndex);

  if (filesToIndex.length === 0) {
    return {
      success: true,
      data: {
        message: "No indexable files found matching the given patterns",
        patterns: paths,
        totalFound: allFiles.length,
        filteredOut: allFiles.length,
      },
    };
  }

  // Read files and prepare batch
  let repoRoot: string;
  try {
    repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
  } catch {
    repoRoot = process.cwd();
  }

  const batch: Array<{
    path: string;
    content: string;
    metadata: Record<string, string>;
  }> = [];
  const skipped: Array<{ path: string; reason: string }> = [];

  for (const filePath of filesToIndex) {
    try {
      const content = await readFile(filePath, "utf-8");
      const byteSize = Buffer.byteLength(content, "utf-8");

      if (byteSize > MAX_FILE_SIZE) {
        skipped.push({ path: filePath, reason: `Too large (${Math.round(byteSize / 1024)}KB > ${MAX_FILE_SIZE / 1024}KB)` });
        continue;
      }

      if (byteSize === 0) {
        skipped.push({ path: filePath, reason: "Empty file" });
        continue;
      }

      const relativePath = relative(repoRoot, filePath);
      batch.push({
        path: relativePath,
        content,
        metadata: {
          extension: extname(filePath),
          filename: basename(filePath),
          size: String(byteSize),
        },
      });
    } catch (error) {
      skipped.push({
        path: filePath,
        reason: error instanceof Error ? error.message : "Read failed",
      });
    }
  }

  if (batch.length === 0) {
    return {
      success: true,
      data: {
        message: "All files were skipped (too large, empty, or unreadable)",
        skipped,
      },
    };
  }

  // Send to remote in chunks of 50 to avoid request size issues
  const CHUNK_SIZE = 50;
  let totalIndexed = 0;
  const errors: string[] = [];

  for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
    const chunk = batch.slice(i, i + CHUNK_SIZE);
    try {
      const result = await remoteIndex(chunk, collection);
      totalIndexed += result.indexed;
    } catch (error) {
      errors.push(
        `Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const duration = Date.now() - startTime;

  // Log metrics
  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_index",
    task_type: "index_files",
    local_tokens: 0,
    estimated_claude_tokens: estimateClaudeTokens({
      inputChars: batch.reduce((sum, f) => sum + f.content.length, 0),
      outputChars: 100,
      taskComplexity: "low",
    }),
    duration_ms: duration,
    success: errors.length === 0,
    files_processed: totalIndexed,
  }).catch(() => {});

  return {
    success: errors.length === 0,
    data: {
      indexed: totalIndexed,
      total: batch.length,
      collection,
      skipped: skipped.length > 0 ? skipped : undefined,
      errors: errors.length > 0 ? errors : undefined,
      durationMs: duration,
    },
  };
}
