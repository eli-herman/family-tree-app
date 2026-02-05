/**
 * Task Router - Decides which model handles each task
 * Routes between: local 7B, remote 32B, embeddings
 */

import { config } from "./config.js";

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
];

const ALWAYS_EMBEDDINGS = [
  'semantic_search',
  'find_similar',
];

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
 * Route a task to the appropriate model
 */
export function routeTask(task: TaskInfo): RoutingDecision {
  // Check if remote server is configured
  const remoteAvailable = !!config.remote?.host;

  // 1. Embedding tasks
  if (ALWAYS_EMBEDDINGS.includes(task.type)) {
    return {
      target: 'embeddings',
      reason: 'Vector similarity search required',
    };
  }

  // 2. Always-remote tasks (if remote available)
  if (ALWAYS_REMOTE.includes(task.type)) {
    if (remoteAvailable) {
      return {
        target: 'remote',
        reason: 'Task requires deep reasoning',
        fallback: 'local',
      };
    }
    return {
      target: 'local',
      reason: 'Remote unavailable, using local',
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

  if (complexity >= threshold && remoteAvailable) {
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
    fallback: remoteAvailable ? 'remote' : undefined,
  };
}

/**
 * Get routing summary for debugging
 */
export function getRoutingSummary(task: TaskInfo): string {
  const decision = routeTask(task);
  const complexity = assessComplexity(task);
  return `[Router] ${task.type} → ${decision.target} (complexity: ${complexity.toFixed(2)}, reason: ${decision.reason})`;
}
