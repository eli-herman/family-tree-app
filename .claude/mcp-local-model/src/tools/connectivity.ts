/**
 * Connectivity Tool
 * Tests the full pipeline: health → generate → embed.
 * Returns latency for each step and overall status.
 */

import { config } from "../config.js";
import { getCircuitBreakerState } from "../ollama/remote.js";

export const connectivityTool = {
  name: "local_connectivity",
  description:
    "Test connectivity to the remote Quality Server. Tests health, generation, and embedding endpoints. Returns latency for each step.",
  inputSchema: {
    type: "object" as const,
    properties: {
      full: {
        type: "boolean",
        description:
          "Run full pipeline test including generate and embed (default: false, health-only)",
      },
    },
  },
};

interface ConnectivityParams {
  full?: boolean;
}

interface StepResult {
  status: "pass" | "fail";
  latencyMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export async function connectivityHandler(params: ConnectivityParams) {
  const { full = false } = params;
  const host = config.remote?.host;

  if (!host) {
    return {
      success: true,
      data: {
        overall: "not_configured",
        message: "Remote server not configured (no REMOTE_HOST)",
        circuitBreaker: getCircuitBreakerState(),
      },
    };
  }

  const results: Record<string, StepResult> = {};
  let overallStatus: "pass" | "degraded" | "fail" = "pass";

  // Step 1: Health check
  const healthStart = Date.now();
  try {
    const res = await fetch(`${host}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    const healthData = await res.json() as Record<string, unknown>;
    results.health = {
      status: res.ok ? "pass" : "fail",
      latencyMs: Date.now() - healthStart,
      details: healthData,
    };
    if (!res.ok) overallStatus = "fail";
  } catch (error) {
    results.health = {
      status: "fail",
      latencyMs: Date.now() - healthStart,
      error: error instanceof Error ? error.message : String(error),
    };
    overallStatus = "fail";
  }

  // If health failed or not doing full test, return early
  if (overallStatus === "fail" || !full) {
    return {
      success: true,
      data: {
        overall: overallStatus,
        host,
        steps: results,
        circuitBreaker: getCircuitBreakerState(),
      },
    };
  }

  // Step 2: Generate test
  const genStart = Date.now();
  try {
    const res = await fetch(`${host}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "You are a test assistant.",
        prompt: "Reply with exactly: CONNECTIVITY_OK",
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const genData = await res.json() as { response: string; tokensUsed: number; durationMs: number };
    results.generate = {
      status: "pass",
      latencyMs: Date.now() - genStart,
      details: {
        tokensUsed: genData.tokensUsed,
        serverDurationMs: genData.durationMs,
        responsePreview: genData.response.substring(0, 100),
      },
    };
  } catch (error) {
    results.generate = {
      status: "fail",
      latencyMs: Date.now() - genStart,
      error: error instanceof Error ? error.message : String(error),
    };
    overallStatus = "degraded";
  }

  // Step 3: Embed test
  const embedStart = Date.now();
  try {
    const res = await fetch(`${host}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "connectivity test embedding" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const embedData = await res.json() as { embedding: number[] };
    results.embed = {
      status: "pass",
      latencyMs: Date.now() - embedStart,
      details: {
        dimensions: embedData.embedding.length,
      },
    };
  } catch (error) {
    results.embed = {
      status: "fail",
      latencyMs: Date.now() - embedStart,
      error: error instanceof Error ? error.message : String(error),
    };
    overallStatus = "degraded";
  }

  const totalLatency = Object.values(results).reduce((sum, r) => sum + r.latencyMs, 0);

  return {
    success: true,
    data: {
      overall: overallStatus,
      host,
      totalLatencyMs: totalLatency,
      steps: results,
      circuitBreaker: getCircuitBreakerState(),
    },
  };
}
