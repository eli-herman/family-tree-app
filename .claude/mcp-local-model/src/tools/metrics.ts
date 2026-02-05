import { getMetricsSummary } from "../utils/metrics.js";

export const metricsTool = {
  name: "local_metrics",
  description: "Get token usage metrics and savings report for local model usage",
  inputSchema: {
    type: "object" as const,
    properties: {
      format: {
        type: "string",
        enum: ["summary", "detailed"],
        description: "Output format",
      },
    },
  },
};

export async function metricsHandler(params: { format?: "summary" | "detailed" }) {
  const summary = await getMetricsSummary();

  if (summary.totalTasks === 0) {
    return {
      success: true,
      data: {
        message: "No metrics recorded yet. Use the local model tools to start tracking.",
        totalTasks: 0,
      },
    };
  }

  const report = {
    overview: {
      totalTasks: summary.totalTasks,
      successRate: `${summary.successRate}%`,
      tokenSavings: summary.tokenSavings,
      savingsPercent: `${summary.savingsPercent}%`,
    },
    tokens: {
      localModelUsed: summary.totalLocalTokens,
      estimatedClaudeWouldUse: summary.totalEstimatedClaudeTokens,
      saved: summary.tokenSavings,
    },
    byTool: summary.byTool,
  };

  return {
    success: true,
    data: report,
  };
}
