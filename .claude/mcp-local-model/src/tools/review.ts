/**
 * Review Tools - Pre and post implementation code review
 * Uses higher-quality model (remote 14B) for deep analysis
 */

import { generate, generateRemote } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { validateJson } from "../utils/helpers.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { fileCache } from "../cache/index.js";
import { routeTask } from "../router.js";
import { events } from "../events.js";

// Tool: Review Approach (pre-implementation)
export const reviewApproachTool = {
  name: "local_review_approach",
  description:
    "Review a proposed implementation approach BEFORE coding. Returns verdict, concerns, and suggestions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      goal: {
        type: "string",
        description: "What the implementation should achieve",
      },
      approach: {
        type: "string",
        description: "The proposed implementation approach/plan",
      },
      context: {
        type: "string",
        description: "Context about the codebase, constraints, requirements",
      },
      existing_file: {
        type: "string",
        description: "Path to existing file being modified (optional)",
      },
    },
    required: ["goal", "approach", "context"],
  },
};

interface ReviewApproachParams {
  goal: string;
  approach: string;
  context: string;
  existing_file?: string;
}

export async function reviewApproachHandler(params: ReviewApproachParams) {
  const { goal, approach, context, existing_file } = params;
  const startTime = Date.now();

  // Get existing code if file provided
  let existingCode: string | undefined;
  if (existing_file) {
    try {
      existingCode = await fileCache.get(existing_file);
    } catch {
      // File doesn't exist yet, that's ok
    }
  }

  // Route to determine which model to use
  const routing = routeTask({ type: "review_approach" });
  events.emit("route:decision", { model: routing.target, reason: routing.reason });

  const prompt = TASK_PROMPTS.reviewApproach(goal, approach, context, existingCode);
  const inputChars = prompt.length;

  try {
    events.emit("model:start", { model: routing.target, task: "review_approach" });

    let response: string;
    let tokensUsed: number;

    // Use remote model if routed there, otherwise local
    if (routing.target === "remote") {
      const result = await generateRemote({
        system: SYSTEM_PROMPTS.reviewApproach,
        prompt,
        format: "json",
      });
      response = result.response;
      tokensUsed = result.tokensUsed;
    } else {
      const result = await generate({
        system: SYSTEM_PROMPTS.reviewApproach,
        prompt,
        format: "json",
      });
      response = result.response;
      tokensUsed = result.tokensUsed;
    }

    const parsed = validateJson(response);
    if (!parsed.valid) {
      throw new Error(`Invalid JSON response: ${parsed.error}`);
    }

    const duration = Date.now() - startTime;
    events.emit("model:complete", { model: routing.target, tokens: tokensUsed, duration });

    // Log metrics
    const estimatedClaude = estimateClaudeTokens({
      inputChars,
      outputChars: response.length,
      taskComplexity: "high",
    });

    await logMetric({
      timestamp: new Date().toISOString(),
      tool: "local_review_approach",
      task_type: "review_approach",
      local_tokens: tokensUsed,
      estimated_claude_tokens: estimatedClaude,
      duration_ms: duration,
      success: true,
      model_used: routing.target,
    }).catch(() => {});

    return {
      success: true,
      data: parsed.data,
      model_used: routing.target,
      tokens_used: tokensUsed,
      duration_ms: duration,
    };
  } catch (error) {
    events.emit("model:error", { model: routing.target, error: String(error) });

    // Try fallback if available
    if (routing.fallback && routing.target === "remote") {
      try {
        const result = await generate({
          system: SYSTEM_PROMPTS.reviewApproach,
          prompt,
          format: "json",
        });

        const parsed = validateJson(result.response);
        if (!parsed.valid) {
          throw new Error(`Invalid JSON response: ${parsed.error}`);
        }

        return {
          success: true,
          data: parsed.data,
          model_used: "local",
          tokens_used: result.tokensUsed,
          duration_ms: Date.now() - startTime,
          note: "Fell back to local model",
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: `Both remote and local failed: ${error}, ${fallbackError}`,
          error_category: "execution_error",
          recoverable: true,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      error_category: "execution_error",
      recoverable: true,
    };
  }
}

// Tool: Review Code (post-implementation)
export const reviewCodeTool = {
  name: "local_review_code",
  description:
    "Review implemented code AFTER coding. Checks for bugs, security issues, and quality problems.",
  inputSchema: {
    type: "object" as const,
    properties: {
      goal: {
        type: "string",
        description: "What the code should achieve",
      },
      file: {
        type: "string",
        description: "Path to the file to review",
      },
      original_file: {
        type: "string",
        description: "Path to original file before changes (for diff review)",
      },
      code: {
        type: "string",
        description: "Code to review (alternative to file path)",
      },
    },
    required: ["goal"],
  },
};

interface ReviewCodeParams {
  goal: string;
  file?: string;
  original_file?: string;
  code?: string;
}

export async function reviewCodeHandler(params: ReviewCodeParams) {
  const { goal, file, original_file, code } = params;
  const startTime = Date.now();

  if (!file && !code) {
    return {
      success: false,
      error: "Must provide either 'file' path or 'code' content",
      error_category: "invalid_params",
      recoverable: false,
    };
  }

  // Get code to review
  let codeToReview: string;
  let filepath: string;
  if (file) {
    try {
      codeToReview = await fileCache.get(file);
      filepath = file;
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error}`,
        error_category: "file_error",
        recoverable: true,
      };
    }
  } else {
    codeToReview = code!;
    filepath = "<inline code>";
  }

  // Get original code for diff review
  let originalCode: string | undefined;
  if (original_file) {
    try {
      originalCode = await fileCache.get(original_file);
    } catch {
      // Original file doesn't exist, skip diff
    }
  }

  // Route to determine which model to use
  const routing = routeTask({
    type: "review_code",
    contentSize: codeToReview.length,
  });
  events.emit("route:decision", { model: routing.target, reason: routing.reason });

  const prompt = TASK_PROMPTS.reviewCode(goal, codeToReview, filepath, originalCode);
  const inputChars = prompt.length;

  try {
    events.emit("model:start", { model: routing.target, task: "review_code" });

    let response: string;
    let tokensUsed: number;

    // Use remote model if routed there, otherwise local
    if (routing.target === "remote") {
      const result = await generateRemote({
        system: SYSTEM_PROMPTS.reviewCode,
        prompt,
        format: "json",
      });
      response = result.response;
      tokensUsed = result.tokensUsed;
    } else {
      const result = await generate({
        system: SYSTEM_PROMPTS.reviewCode,
        prompt,
        format: "json",
      });
      response = result.response;
      tokensUsed = result.tokensUsed;
    }

    const parsed = validateJson(response);
    if (!parsed.valid) {
      throw new Error(`Invalid JSON response: ${parsed.error}`);
    }

    const duration = Date.now() - startTime;
    events.emit("model:complete", { model: routing.target, tokens: tokensUsed, duration });

    // Log metrics
    const estimatedClaude = estimateClaudeTokens({
      inputChars,
      outputChars: response.length,
      taskComplexity: "high",
    });

    await logMetric({
      timestamp: new Date().toISOString(),
      tool: "local_review_code",
      task_type: "review_code",
      local_tokens: tokensUsed,
      estimated_claude_tokens: estimatedClaude,
      duration_ms: duration,
      success: true,
      model_used: routing.target,
      file: filepath,
    }).catch(() => {});

    return {
      success: true,
      data: parsed.data,
      model_used: routing.target,
      tokens_used: tokensUsed,
      duration_ms: duration,
      file: filepath,
    };
  } catch (error) {
    events.emit("model:error", { model: routing.target, error: String(error) });

    // Try fallback if available
    if (routing.fallback && routing.target === "remote") {
      try {
        const result = await generate({
          system: SYSTEM_PROMPTS.reviewCode,
          prompt,
          format: "json",
        });

        const parsed = validateJson(result.response);
        if (!parsed.valid) {
          throw new Error(`Invalid JSON response: ${parsed.error}`);
        }

        return {
          success: true,
          data: parsed.data,
          model_used: "local",
          tokens_used: result.tokensUsed,
          duration_ms: Date.now() - startTime,
          note: "Fell back to local model",
          file: filepath,
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: `Both remote and local failed: ${error}, ${fallbackError}`,
          error_category: "execution_error",
          recoverable: true,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      error_category: "execution_error",
      recoverable: true,
    };
  }
}
