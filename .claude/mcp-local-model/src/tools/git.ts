import { exec } from "child_process";
import { promisify } from "util";
import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { validateJson, withRetry } from "../utils/helpers.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";

const execAsync = promisify(exec);

export const gitTool = {
  name: "local_git",
  description: "Parse git command output into structured JSON",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_type: {
        type: "string",
        enum: ["status", "diff", "log", "changed_files"],
        description: "Type of git information to retrieve",
      },
      options: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Filter to specific paths",
          },
          limit: {
            type: "number",
            description: "For log: number of commits",
          },
          format: {
            type: "string",
            enum: ["summary", "detailed"],
          },
        },
      },
    },
    required: ["task_type"],
  },
};

interface GitParams {
  task_type: "status" | "diff" | "log" | "changed_files";
  options?: {
    paths?: string[];
    limit?: number;
    format?: "summary" | "detailed";
  };
}

export async function gitHandler(params: GitParams) {
  const { task_type, options } = params;
  let totalTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;
  const startTime = Date.now();

  try {
    let gitCommand: string;
    let parsePrompt: (output: string) => string;

    switch (task_type) {
      case "status":
        gitCommand = "git status --porcelain";
        parsePrompt = TASK_PROMPTS.parseGitStatus;
        break;

      case "diff":
        gitCommand = "git diff --stat";
        if (options?.paths?.length) {
          gitCommand += ` -- ${options.paths.join(" ")}`;
        }
        parsePrompt = TASK_PROMPTS.parseGitDiff;
        break;

      case "log":
        const limit = options?.limit || 5;
        gitCommand = `git log --oneline -n ${limit}`;
        parsePrompt = (output: string) => `
Parse this git log output:

\`\`\`
${output}
\`\`\`

OUTPUT (JSON only):
{
  "commits": [
    { "hash": "abc1234", "message": "commit message" }
  ]
}`;
        break;

      case "changed_files":
        gitCommand = "git diff --name-only";
        if (options?.paths?.length) {
          gitCommand += ` -- ${options.paths.join(" ")}`;
        }
        // Simple parse - no Ollama needed
        const { stdout } = await execAsync(gitCommand);
        const files = stdout.trim().split("\n").filter(Boolean);

        // Log metrics even for simple operations
        await logMetric({
          timestamp: new Date().toISOString(),
          tool: "local_git",
          task_type,
          local_tokens: 0,
          estimated_claude_tokens: Math.ceil(stdout.length / 4) * 2,
          duration_ms: Date.now() - startTime,
          success: true,
          files_processed: 1,
        }).catch(() => {});

        return {
          success: true,
          data: { files },
          confidence: 1.0,
          tokens_used: 0,
        };

      default:
        throw new Error(`Unsupported task_type: ${task_type}`);
    }

    // Execute git command
    const { stdout } = await execAsync(gitCommand);
    totalInputChars = stdout.length;

    if (!stdout.trim()) {
      // Empty output - return appropriate empty structure
      await logMetric({
        timestamp: new Date().toISOString(),
        tool: "local_git",
        task_type,
        local_tokens: 0,
        estimated_claude_tokens: 50,
        duration_ms: Date.now() - startTime,
        success: true,
        files_processed: 1,
      }).catch(() => {});

      return {
        success: true,
        data:
          task_type === "status"
            ? { staged: [], modified: [], untracked: [], deleted: [] }
            : task_type === "diff"
              ? { files_changed: 0, insertions: 0, deletions: 0, changes: [] }
              : { commits: [] },
        confidence: 1.0,
        tokens_used: 0,
      };
    }

    // Use Ollama to parse complex output
    const result = await withRetry(async () => {
      const { response, tokensUsed } = await generate({
        system: SYSTEM_PROMPTS.git,
        prompt: parsePrompt(stdout),
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

    // Log metrics
    const estimatedClaude = estimateClaudeTokens({
      inputChars: totalInputChars,
      outputChars: totalOutputChars,
      taskComplexity: "low",
    });

    await logMetric({
      timestamp: new Date().toISOString(),
      tool: "local_git",
      task_type,
      local_tokens: totalTokens,
      estimated_claude_tokens: estimatedClaude,
      duration_ms: Date.now() - startTime,
      success: true,
      files_processed: 1,
    }).catch(() => {});

    return {
      success: true,
      data: result,
      confidence: 0.9,
      tokens_used: totalTokens,
    };
  } catch (error) {
    await logMetric({
      timestamp: new Date().toISOString(),
      tool: "local_git",
      task_type,
      local_tokens: totalTokens,
      estimated_claude_tokens: 0,
      duration_ms: Date.now() - startTime,
      success: false,
      files_processed: 0,
    }).catch(() => {});

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      error_category: "execution_error",
      recoverable: true,
      suggestion: "Check git repository state",
    };
  }
}
