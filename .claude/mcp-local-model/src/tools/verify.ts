import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { validateJson, withRetry } from "../utils/helpers.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { fileCache } from "../cache/index.js";

export const verifyTool = {
  name: "local_verify",
  description: "Run verification checklist against code files",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_type: {
        type: "string",
        enum: ["must_haves", "patterns", "exports", "imports"],
        description: "Type of verification",
      },
      checks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Check identifier" },
            description: { type: "string", description: "What to verify" },
            file: { type: "string", description: "File to check" },
            condition: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["contains", "exports", "imports", "pattern"],
                },
                value: { type: "string", description: "String/pattern to find" },
              },
              required: ["type", "value"],
            },
          },
          required: ["id", "description", "file", "condition"],
        },
        description: "List of checks to perform",
      },
    },
    required: ["task_type", "checks"],
  },
};

interface Check {
  id: string;
  description: string;
  file: string;
  condition: {
    type: "contains" | "exports" | "imports" | "pattern";
    value: string;
  };
}

interface VerifyParams {
  task_type: "must_haves" | "patterns" | "exports" | "imports";
  checks: Check[];
}

export async function verifyHandler(params: VerifyParams) {
  const { task_type, checks } = params;
  const results: Array<{
    id: string;
    status: "pass" | "fail";
    evidence: string;
    reason?: string;
  }> = [];

  let passed = 0;
  let failed = 0;
  let totalTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;
  const startTime = Date.now();

  for (const check of checks) {
    try {
      const content = await fileCache.get(check.file);
      totalInputChars += content.length;

      const result = await withRetry(async () => {
        const { response, tokensUsed } = await generate({
          system: SYSTEM_PROMPTS.verify,
          prompt: TASK_PROMPTS.verifyCondition(
            check.id,
            check.description,
            content,
            check.condition.type,
            check.condition.value
          ),
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

      if (result.status === "pass") {
        passed++;
      } else {
        failed++;
      }

      results.push({
        id: check.id,
        status: result.status,
        evidence: result.evidence,
        reason: result.reason || undefined,
      });
    } catch (error) {
      failed++;
      results.push({
        id: check.id,
        status: "fail",
        evidence: "error",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Log metrics
  const estimatedClaude = estimateClaudeTokens({
    inputChars: totalInputChars,
    outputChars: totalOutputChars,
    taskComplexity: "medium", // Verification requires analysis
  });

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_verify",
    task_type,
    local_tokens: totalTokens,
    estimated_claude_tokens: estimatedClaude,
    duration_ms: Date.now() - startTime,
    success: failed === 0,
    files_processed: checks.length,
  }).catch(() => {});

  return {
    success: true,
    data: {
      passed,
      failed,
      results,
    },
    confidence: passed / (passed + failed),
    tokens_used: totalTokens,
  };
}
