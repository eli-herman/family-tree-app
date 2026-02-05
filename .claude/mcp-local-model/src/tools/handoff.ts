import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { generate } from "../ollama/client.js";
import { SYSTEM_PROMPTS, TASK_PROMPTS } from "../ollama/prompts.js";
import { logMetric, estimateClaudeTokens } from "../utils/metrics.js";
import { fileCache } from "../cache/index.js";

const EXEC_TIMEOUT = 10_000; // 10s timeout for all shell commands

export const handoffTool = {
  name: "local_handoff",
  description:
    "Read or generate HANDOFF.md for cross-device session handoffs. Use 'read' to parse existing handoff (zero model cost) or 'generate' to create a new one with AI summary.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["read", "generate"],
        description:
          "read: parse and return existing HANDOFF.md. generate: create new HANDOFF.md with AI summary.",
      },
      session_summary: {
        type: "string",
        description:
          "Summary of current session work (for generate action)",
      },
      active_tasks: {
        type: "array",
        items: { type: "string" },
        description: "List of active tasks (for generate action)",
      },
      blockers: {
        type: "array",
        items: { type: "string" },
        description: "List of blockers (for generate action)",
      },
      next_steps: {
        type: "array",
        items: { type: "string" },
        description: "Suggested next steps (for generate action)",
      },
    },
    required: ["action"],
  },
};

interface HandoffParams {
  action: "read" | "generate";
  session_summary?: string;
  active_tasks?: string[];
  blockers?: string[];
  next_steps?: string[];
}

/** Safe execSync wrapper with timeout */
function exec(cmd: string): string {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      timeout: EXEC_TIMEOUT,
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch {
    return "";
  }
}

function getRepoRoot(): string {
  const root = exec("git rev-parse --show-toplevel");
  return root || process.cwd();
}

export async function handoffHandler(params: HandoffParams) {
  const startTime = Date.now();
  const repoRoot = getRepoRoot();
  const handoffPath = `${repoRoot}/HANDOFF.md`;

  if (params.action === "read") {
    if (!existsSync(handoffPath)) {
      return {
        success: false,
        error: "HANDOFF.md not found",
        error_category: "file_not_found",
        recoverable: true,
        suggestion: "Run with action 'generate' to create one",
      };
    }

    // Use fileCache for consistency with other tools
    const content = await fileCache.get(handoffPath);

    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let metadata: Record<string, string> = {};
    if (frontmatterMatch) {
      const lines = frontmatterMatch[1].split("\n");
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
          metadata[key] = value;
        }
      }
    }

    return {
      success: true,
      data: {
        metadata,
        content,
        file: handoffPath,
      },
      tokens_used: 0,
    };
  }

  // Generate action
  let totalTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;

  // Gather git context (all with timeouts via safe exec wrapper)
  const branch = exec("git rev-parse --abbrev-ref HEAD") || "unknown";
  const commitHash = exec("git rev-parse --short HEAD") || "none";
  const recentCommits = exec("git log --oneline -5") || "No recent commits";
  const diffStat = exec("git diff --stat HEAD~1..HEAD") || "No diff available";
  const changedFiles = exec("git diff --name-only HEAD~1..HEAD") || "";
  const device = exec("hostname") || "unknown";
  const timestamp = new Date().toISOString();

  const gitContext = `Branch: ${branch}\nCommit: ${commitHash}\nRecent commits:\n${recentCommits}\n\nDiff stat:\n${diffStat}\n\nChanged files:\n${changedFiles}`;

  // Build AI summary
  let aiSummary = "_Ollama unavailable._";
  try {
    const prompt = TASK_PROMPTS.handoffSummary(
      gitContext,
      params.session_summary || "",
      params.active_tasks || [],
      params.blockers || [],
      params.next_steps || []
    );
    totalInputChars += prompt.length;

    const { response, tokensUsed } = await generate({
      system: SYSTEM_PROMPTS.handoff,
      prompt,
    });
    totalTokens += tokensUsed;
    totalOutputChars += response.length;
    aiSummary = response;
  } catch {
    // Fallback - template-only handoff
  }

  // Build sections
  const tasksSection =
    params.active_tasks && params.active_tasks.length > 0
      ? params.active_tasks.map((t) => `- ${t}`).join("\n")
      : "_None_";

  const blockersSection =
    params.blockers && params.blockers.length > 0
      ? params.blockers.map((b) => `- ${b}`).join("\n")
      : "_None_";

  const nextStepsSection =
    params.next_steps && params.next_steps.length > 0
      ? params.next_steps.map((s) => `- ${s}`).join("\n")
      : "_See AI Summary below._";

  const handoffContent = `---
device: ${device}
branch: ${branch}
commit: ${commitHash}
timestamp: "${timestamp}"
---

# Session Handoff

## Summary
${params.session_summary || "No session summary provided."}

## Files Changed
${gitContext}

## Active Tasks
${tasksSection}

## Blockers
${blockersSection}

## Next Steps
${nextStepsSection}

## AI Summary
${aiSummary}
`;

  await writeFile(handoffPath, handoffContent);

  // Invalidate cache since we just wrote the file
  fileCache.invalidate(handoffPath);

  const estimatedClaude = estimateClaudeTokens({
    inputChars: totalInputChars,
    outputChars: totalOutputChars,
    taskComplexity: "medium",
  });

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_handoff",
    task_type: params.action,
    local_tokens: totalTokens,
    estimated_claude_tokens: estimatedClaude,
    duration_ms: Date.now() - startTime,
    success: true,
    files_processed: 1,
  }).catch(() => {});

  return {
    success: true,
    data: {
      file: handoffPath,
      action: params.action,
      ai_summary_generated: aiSummary !== "_Ollama unavailable._",
    },
    tokens_used: totalTokens,
  };
}
