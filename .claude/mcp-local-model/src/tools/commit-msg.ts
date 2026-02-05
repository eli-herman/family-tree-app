import { execSync } from "child_process";
import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";

const EXEC_TIMEOUT = 10_000; // 10s timeout for all shell commands

export const commitMsgTool = {
  name: "local_commit_msg",
  description:
    "Generate a conventional commit message (feat/fix/docs/chore) from staged changes using local model. Reads git diff --cached automatically.",
  inputSchema: {
    type: "object" as const,
    properties: {
      context: {
        type: "string",
        description:
          "Optional additional context about the change (e.g., ticket number, feature name)",
      },
    },
    required: [],
  },
};

interface CommitMsgParams {
  context?: string;
}

export async function commitMsgHandler(params: CommitMsgParams) {
  const startTime = Date.now();

  // Get staged diff (limited to 200 lines to keep prompt reasonable)
  let diff: string;
  try {
    const fullDiff = execSync("git diff --cached", {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
      timeout: EXEC_TIMEOUT,
    });

    const lines = fullDiff.split("\n");
    if (lines.length > 200) {
      diff = lines.slice(0, 200).join("\n") + "\n\n... (truncated, " + lines.length + " total lines)";
    } else {
      diff = fullDiff;
    }
  } catch {
    return {
      success: false,
      error: "No staged changes found. Stage files with 'git add' first.",
      error_category: "no_staged_changes",
      recoverable: true,
      suggestion: "Run 'git add <files>' then try again",
    };
  }

  if (!diff.trim()) {
    return {
      success: false,
      error: "No staged changes found. Stage files with 'git add' first.",
      error_category: "no_staged_changes",
      recoverable: true,
      suggestion: "Run 'git add <files>' then try again",
    };
  }

  // Get list of staged files for context
  let stagedFiles: string;
  try {
    stagedFiles = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT,
    }).trim();
  } catch {
    stagedFiles = "unknown";
  }

  const prompt = TASK_PROMPTS.commitMessage(diff, stagedFiles, params.context);
  const totalInputChars = prompt.length;

  try {
    const { response, tokensUsed } = await generate({
      system: SYSTEM_PROMPTS.commitMsg,
      prompt,
      format: "json",
    });

    // Parse the JSON response
    let parsed: { subject: string; body?: string; type?: string };
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, use the raw response as the subject
      parsed = { subject: response.trim().split("\n")[0] };
    }

    const estimatedClaude = estimateClaudeTokens({
      inputChars: totalInputChars,
      outputChars: response.length,
      taskComplexity: "low",
    });

    await logMetric({
      timestamp: new Date().toISOString(),
      tool: "local_commit_msg",
      task_type: "generate",
      local_tokens: tokensUsed,
      estimated_claude_tokens: estimatedClaude,
      duration_ms: Date.now() - startTime,
      success: true,
      files_processed: stagedFiles.split("\n").length,
    }).catch(() => {});

    return {
      success: true,
      data: {
        message: parsed.body
          ? `${parsed.subject}\n\n${parsed.body}`
          : parsed.subject,
        subject: parsed.subject,
        body: parsed.body || null,
        type: parsed.type || null,
        staged_files: stagedFiles.split("\n"),
      },
      tokens_used: tokensUsed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate commit message",
      error_category: "model_error",
      recoverable: true,
      suggestion: "Check if Ollama is running and model is loaded",
    };
  }
}
