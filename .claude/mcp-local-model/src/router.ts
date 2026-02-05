/**
 * Task Router - Decides which model handles each task
 * Routes between: local 7B, remote 14B, embeddings
 * Caches remote health check to avoid repeated pings
 */

import { config } from "./config.js";
import { events } from "./events.js";

export type ModelTarget = 'local' | 'remote' | 'embeddings';

export interface RoutingDecision {
  target: ModelTarget;
  reason: string;
  fallback?: ModelTarget;
}

export interface TaskInfo {
  type: string;
  files?: string[];
  contentSize?: number;
  hints?: {
    preferQuality?: boolean;
    preferSpeed?: boolean;
  };
}

// Tasks that always go to specific models
const ALWAYS_REMOTE = [
  'review_code',
  'review_approach',
  'complex_analysis',
  'refactor_suggest',
];

const ALWAYS_LOCAL = [
  'frontmatter',
  'pattern_match',
  'git_parse',
  'extract_simple',
  'handoff_read',
  'handoff_generate',
  'commit_msg',
  'doc_check_paths',
  'doc_check_exports',
  'doc_check_structure',
];

const ALWAYS_EMBEDDINGS = [
  'semantic_search',
  'find_similar',
];

// Cached remote health status (avoids pinging on every call)
let remoteHealthy: boolean | null = null;
let remoteHealthCheckedAt = 0;
const HEALTH_CHECK_TTL_MS = 30_000; // Re-check every 30s

/**
 * Check if remote server is actually reachable (cached)
 */
async function checkRemoteHealth(): Promise<boolean> {
  if (!config.remote?.host) return false;

  const now = Date.now();
  if (remoteHealthy !== null && now - remoteHealthCheckedAt < HEALTH_CHECK_TTL_MS) {
    return remoteHealthy;
  }

  try {
    const response = await fetch(`${config.remote.host}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    remoteHealthy = response.ok;
  } catch {
    remoteHealthy = false;
  }

  remoteHealthCheckedAt = now;
  return remoteHealthy;
}

/**
 * Invalidate the cached health status (call when remote errors occur)
 */
export function invalidateRemoteHealth(): void {
  remoteHealthy = null;
  remoteHealthCheckedAt = 0;
}

/**
 * Assess task complexity on a 0-1 scale
 */
function assessComplexity(task: TaskInfo): number {
  let score = 0;

  // File count factor
  const fileCount = task.files?.length || 0;
  if (fileCount > 3) score += 0.2;
  if (fileCount > 10) score += 0.3;

  // Content size factor
  const contentSize = task.contentSize || 0;
  if (contentSize > 5000) score += 0.2;
  if (contentSize > 20000) score += 0.3;

  // Task type modifiers
  if (task.type.includes('analyze')) score += 0.2;
  if (task.type.includes('refactor')) score += 0.3;
  if (task.type.includes('review')) score += 0.4;

  // Explicit hints
  if (task.hints?.preferQuality) score += 0.3;
  if (task.hints?.preferSpeed) score -= 0.3;

  return Math.max(0, Math.min(1, score));
}

/**
 * Route a task to the appropriate model.
 * Async because it pings the remote server for health.
 */
export async function routeTask(task: TaskInfo): Promise<RoutingDecision> {
  const remoteConfigured = !!config.remote?.host;
  const remoteUp = remoteConfigured ? await checkRemoteHealth() : false;

  // 1. Embedding tasks (with local fallback)
  if (ALWAYS_EMBEDDINGS.includes(task.type)) {
    if (remoteUp) {
      return {
        target: 'embeddings',
        reason: 'Vector similarity search required',
        fallback: 'local',
      };
    }
    events.routeDecision(task.type, 'local', 'Remote unavailable, using local grep fallback');
    return {
      target: 'local',
      reason: 'Remote unavailable, falling back to local keyword search',
    };
  }

  // 2. Always-remote tasks (if remote actually reachable)
  if (ALWAYS_REMOTE.includes(task.type)) {
    if (remoteUp) {
      events.routeDecision(task.type, 'remote', 'Task requires deep reasoning');
      return {
        target: 'remote',
        reason: 'Task requires deep reasoning',
        fallback: 'local',
      };
    }
    events.routeDecision(task.type, 'local', 'Remote unreachable, falling back to local 7B');
    return {
      target: 'local',
      reason: `Remote ${remoteConfigured ? 'unreachable' : 'not configured'}, using local 7B`,
    };
  }

  // 3. Always-local tasks
  if (ALWAYS_LOCAL.includes(task.type)) {
    return {
      target: 'local',
      reason: 'Simple task, optimize for speed',
    };
  }

  // 4. Complexity-based routing
  const complexity = assessComplexity(task);
  const threshold = config.routing?.complexityThreshold || 0.7;

  if (complexity >= threshold && remoteUp) {
    events.routeDecision(task.type, 'remote', `Complexity ${complexity.toFixed(2)} >= ${threshold}`);
    return {
      target: 'remote',
      reason: `Complexity ${complexity.toFixed(2)} exceeds threshold ${threshold}`,
      fallback: 'local',
    };
  }

  // 5. Default to local
  return {
    target: 'local',
    reason: 'Default routing (low complexity)',
    fallback: remoteUp ? 'remote' : undefined,
  };
}

/**
 * Get routing summary for debugging
 */
export async function getRoutingSummary(task: TaskInfo): Promise<string> {
  const decision = await routeTask(task);
  const complexity = assessComplexity(task);
  return `[Router] ${task.type} → ${decision.target} (complexity: ${complexity.toFixed(2)}, reason: ${decision.reason})`;
}
