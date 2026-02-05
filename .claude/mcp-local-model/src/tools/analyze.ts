import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { validateJson, withRetry } from "../utils/helpers.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { fileCache } from "../cache/index.js";

export const analyzeTool = {
  name: "local_analyze",
  description: "Analyze code structure (exports, imports, functions, types)",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_type: {
        type: "string",
        enum: ["dependencies", "exports", "functions", "types"],
        description: "Type of analysis",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "Files to analyze",
      },
      depth: {
        type: "number",
        description: "How deep to analyze imports (for dependencies)",
      },
    },
    required: ["task_type", "files"],
  },
};

interface AnalyzeParams {
  task_type: "dependencies" | "exports" | "functions" | "types";
  files: string[];
  depth?: number;
}

export async function analyzeHandler(params: AnalyzeParams) {
  const { task_type, files } = params;
  const analysis: Record<string, any> = {};
  let totalTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;
  const startTime = Date.now();
  let hasErrors = false;

  for (const filepath of files) {
    try {
      const content = await fileCache.get(filepath);
      totalInputChars += content.length;

      const result = await withRetry(async () => {
        let prompt: string;

        switch (task_type) {
          case "exports":
            prompt = TASK_PROMPTS.analyzeExports(content, filepath);
            break;

          case "functions":
            prompt = `
Analyze functions in this file: ${filepath}

FILE CONTENT:
\`\`\`
${content}
\`\`\`

OUTPUT (JSON only):
{
  "functions": [
    { "name": "...", "line": number, "params": ["param1", "param2"], "async": boolean, "exported": boolean }
  ]
}`;
            break;

          case "types":
            prompt = `
Analyze type definitions in this TypeScript file: ${filepath}

FILE CONTENT:
\`\`\`
${content}
\`\`\`

OUTPUT (JSON only):
{
  "types": [
    { "name": "...", "kind": "interface|type|enum", "line": number, "exported": boolean }
  ]
}`;
            break;

          case "dependencies":
            prompt = `
Analyze imports/dependencies in this file: ${filepath}

FILE CONTENT:
\`\`\`
${content}
\`\`\`

OUTPUT (JSON only):
{
  "imports": [
    { "from": "module-path", "items": ["item1", "item2"], "type": "named|default|namespace", "line": number }
  ]
}`;
            break;

          default:
            throw new Error(`Unsupported task_type: ${task_type}`);
        }

        const { response, tokensUsed } = await generate({
          system: SYSTEM_PROMPTS.analyze,
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

      analysis[filepath] = result;
    } catch (error) {
      hasErrors = true;
      analysis[filepath] = {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Log metrics
  const estimatedClaude = estimateClaudeTokens({
    inputChars: totalInputChars,
    outputChars: totalOutputChars,
    taskComplexity: "high", // Code analysis is complex
  });

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_analyze",
    task_type,
    local_tokens: totalTokens,
    estimated_claude_tokens: estimatedClaude,
    duration_ms: Date.now() - startTime,
    success: !hasErrors,
    files_processed: files.length,
  }).catch(() => {});

  return {
    success: true,
    data: { analysis },
    confidence: 0.85,
    tokens_used: totalTokens,
  };
}
