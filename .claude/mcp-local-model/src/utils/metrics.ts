/**
 * Simple metrics tracking for measuring local model effectiveness
 * Logs to a JSON file for later analysis
 */

import { appendFile, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const METRICS_FILE = join(__dirname, "../../metrics.jsonl");

export interface TaskMetric {
  timestamp: string;
  tool: string;
  task_type: string;
  local_tokens: number;
  estimated_claude_tokens: number;
  duration_ms: number;
  success: boolean;
  files_processed?: number;
  model_used?: string;
  file?: string;
}

/**
 * Estimate how many Claude tokens this task would have used
 * Based on: input context + reasoning + output
 */
export function estimateClaudeTokens(params: {
  inputChars: number;
  outputChars: number;
  taskComplexity: "low" | "medium" | "high";
}): number {
  // Rough token estimate: ~4 chars per token
  const inputTokens = Math.ceil(params.inputChars / 4);
  const outputTokens = Math.ceil(params.outputChars / 4);

  // Claude overhead multiplier for reasoning/explanation
  const complexityMultiplier = {
    low: 1.5,    // Simple extraction
    medium: 2.5, // Verification with analysis
    high: 4.0,   // Complex analysis
  };

  return Math.ceil(
    (inputTokens + outputTokens) * complexityMultiplier[params.taskComplexity]
  );
}

/**
 * Log a task metric
 */
export async function logMetric(metric: TaskMetric): Promise<void> {
  const line = JSON.stringify(metric) + "\n";
  try {
    await appendFile(METRICS_FILE, line);
  } catch {
    // File might not exist, create it
    await writeFile(METRICS_FILE, line);
  }
}

/**
 * Get metrics summary
 */
export async function getMetricsSummary(): Promise<{
  totalTasks: number;
  totalLocalTokens: number;
  totalEstimatedClaudeTokens: number;
  tokenSavings: number;
  savingsPercent: number;
  byTool: Record<string, { count: number; localTokens: number; estimatedSavings: number }>;
  successRate: number;
}> {
  if (!existsSync(METRICS_FILE)) {
    return {
      totalTasks: 0,
      totalLocalTokens: 0,
      totalEstimatedClaudeTokens: 0,
      tokenSavings: 0,
      savingsPercent: 0,
      byTool: {},
      successRate: 0,
    };
  }

  const content = await readFile(METRICS_FILE, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const metrics: TaskMetric[] = lines.map((line) => JSON.parse(line));

  const byTool: Record<string, { count: number; localTokens: number; estimatedSavings: number }> = {};
  let totalLocalTokens = 0;
  let totalEstimatedClaudeTokens = 0;
  let successCount = 0;

  for (const m of metrics) {
    totalLocalTokens += m.local_tokens;
    totalEstimatedClaudeTokens += m.estimated_claude_tokens;
    if (m.success) successCount++;

    if (!byTool[m.tool]) {
      byTool[m.tool] = { count: 0, localTokens: 0, estimatedSavings: 0 };
    }
    byTool[m.tool].count++;
    byTool[m.tool].localTokens += m.local_tokens;
    byTool[m.tool].estimatedSavings += m.estimated_claude_tokens - m.local_tokens;
  }

  const tokenSavings = totalEstimatedClaudeTokens - totalLocalTokens;
  const savingsPercent = totalEstimatedClaudeTokens > 0
    ? Math.round((tokenSavings / totalEstimatedClaudeTokens) * 100)
    : 0;

  return {
    totalTasks: metrics.length,
    totalLocalTokens,
    totalEstimatedClaudeTokens,
    tokenSavings,
    savingsPercent,
    byTool,
    successRate: metrics.length > 0 ? Math.round((successCount / metrics.length) * 100) : 0,
  };
}
