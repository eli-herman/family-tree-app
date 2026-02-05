import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { validateJson, withRetry } from "../utils/helpers.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { fileCache } from "../cache/index.js";

export const extractTool = {
  name: "local_extract",
  description:
    "Extract structured data from files (frontmatter, patterns, exports, imports)",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_type: {
        type: "string",
        enum: ["frontmatter", "pattern_match", "exports", "imports", "structure"],
        description: "Type of extraction to perform",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "Absolute paths to files to extract from",
      },
      extract: {
        type: "object",
        properties: {
          patterns: {
            type: "array",
            items: { type: "string" },
            description: "Regex patterns to find (for pattern_match)",
          },
          fields: {
            type: "array",
            items: { type: "string" },
            description: "Frontmatter fields to extract (for frontmatter)",
          },
          format: {
            type: "string",
            enum: ["json", "list"],
            description: "Output format",
          },
        },
      },
    },
    required: ["task_type", "files"],
  },
};

interface ExtractParams {
  task_type: "frontmatter" | "pattern_match" | "exports" | "imports" | "structure";
  files: string[];
  extract?: {
    patterns?: string[];
    fields?: string[];
    format?: "json" | "list";
  };
}

export async function extractHandler(params: ExtractParams) {
  const { task_type, files, extract } = params;
  const results: Record<string, any> = {};
  let totalTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;
  const startTime = Date.now();
  let success = true;

  for (const filepath of files) {
    try {
      const content = await fileCache.get(filepath);
      totalInputChars += content.length;

      let prompt: string;
      switch (task_type) {
        case "frontmatter":
          prompt = TASK_PROMPTS.extractFrontmatter(content, extract?.fields || []);
          break;
        case "pattern_match":
          prompt = TASK_PROMPTS.extractPattern(content, extract?.patterns || []);
          break;
        case "exports":
          prompt = TASK_PROMPTS.analyzeExports(content, filepath);
          break;
        case "imports":
          prompt = TASK_PROMPTS.analyzeImports(content, filepath);
          break;
        case "structure":
          prompt = TASK_PROMPTS.analyzeStructure(content, filepath);
          break;
        default:
          throw new Error(`Unsupported task_type: ${task_type}`);
      }

      const result = await withRetry(async () => {
        const { response, tokensUsed } = await generate({
          system: SYSTEM_PROMPTS.extract,
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

      results[filepath] = {
        found: true,
        data: result,
      };
    } catch (error) {
      success = false;
      results[filepath] = {
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Log metrics for analysis
  const estimatedClaude = estimateClaudeTokens({
    inputChars: totalInputChars,
    outputChars: totalOutputChars,
    taskComplexity: "low",
  });

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_extract",
    task_type,
    local_tokens: totalTokens,
    estimated_claude_tokens: estimatedClaude,
    duration_ms: Date.now() - startTime,
    success,
    files_processed: files.length,
  }).catch(() => {}); // Don't fail if metrics logging fails

  return {
    success,
    data: { results },
    confidence: 0.9,
    tokens_used: totalTokens,
  };
}
