/**
 * Remote Quality Server Client
 * Handles communication with the Windows PC running the 14B model.
 * Includes circuit breaker to avoid 60s timeouts when server is down.
 */

import { config } from "../config.js";
import { events } from "../events.js";
import { invalidateRemoteHealth } from "../router.js";

// ============================================
// Circuit Breaker
// ============================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

const circuitBreaker = {
  state: 'CLOSED' as CircuitState,
  failureCount: 0,
  lastFailureTime: 0,
  failureThreshold: 3,
  resetTimeoutMs: 60_000, // Try again after 60s
};

function recordSuccess(): void {
  circuitBreaker.state = 'CLOSED';
  circuitBreaker.failureCount = 0;
}

function recordFailure(): void {
  circuitBreaker.failureCount++;
  circuitBreaker.lastFailureTime = Date.now();
  if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
    circuitBreaker.state = 'OPEN';
    invalidateRemoteHealth();
  }
}

function checkCircuit(): { allowed: boolean; reason?: string } {
  if (circuitBreaker.state === 'CLOSED') {
    return { allowed: true };
  }
  if (circuitBreaker.state === 'OPEN') {
    const elapsed = Date.now() - circuitBreaker.lastFailureTime;
    if (elapsed >= circuitBreaker.resetTimeoutMs) {
      circuitBreaker.state = 'HALF_OPEN';
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Circuit OPEN (${circuitBreaker.failureCount} failures, retry in ${Math.ceil((circuitBreaker.resetTimeoutMs - elapsed) / 1000)}s)`,
    };
  }
  // HALF_OPEN: allow one request through
  return { allowed: true };
}

/** Get circuit breaker state for diagnostics */
export function getCircuitBreakerState(): { state: CircuitState; failureCount: number; lastFailureTime: number } {
  return { ...circuitBreaker };
}

// ============================================
// Retry helper
// ============================================

async function withRetry<T>(fn: () => Promise<T>, retries = 1, backoffMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    return withRetry(fn, retries - 1, backoffMs);
  }
}

// ============================================
// Types
// ============================================

export interface RemoteGenerateResult {
  response: string;
  tokensUsed: number;
  durationMs: number;
}

export interface SearchResult {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// ============================================
// Health Check
// ============================================

/**
 * Check if remote server is available (respects circuit breaker)
 */
export async function isRemoteAvailable(): Promise<boolean> {
  if (!config.remote?.host) return false;

  const circuit = checkCircuit();
  if (!circuit.allowed) return false;

  try {
    const response = await fetch(`${config.remote.host}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      recordSuccess();
      return true;
    }
    recordFailure();
    return false;
  } catch {
    recordFailure();
    return false;
  }
}

// ============================================
// Generate
// ============================================

/**
 * Generate with remote 14B model
 */
export async function remoteGenerate(params: {
  system: string;
  prompt: string;
  format?: 'json';
}): Promise<RemoteGenerateResult> {
  if (!config.remote?.host) {
    throw new Error('Remote server not configured');
  }

  const circuit = checkCircuit();
  if (!circuit.allowed) {
    throw new Error(`Remote unavailable: ${circuit.reason}`);
  }

  const startTime = Date.now();
  events.modelStart('remote-14b', params.prompt);

  try {
    const result = await withRetry(async () => {
      const response = await fetch(`${config.remote.host}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: params.system,
          prompt: params.prompt,
          format: params.format,
        }),
        signal: AbortSignal.timeout(config.remote.timeoutMs || 60000),
      });

      if (!response.ok) {
        throw new Error(`Remote server error: ${response.status}`);
      }

      return response.json() as Promise<{
        response: string;
        tokensUsed: number;
        durationMs: number;
      }>;
    });

    const duration = Date.now() - startTime;
    recordSuccess();
    events.modelComplete('remote-14b', result.tokensUsed, duration);

    return {
      response: result.response,
      tokensUsed: result.tokensUsed,
      durationMs: duration,
    };
  } catch (error) {
    recordFailure();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    events.modelError('remote-14b', errorMsg);
    throw error;
  }
}

// ============================================
// Embeddings
// ============================================

/**
 * Generate embeddings via remote server
 */
export async function remoteEmbed(text: string): Promise<number[]> {
  if (!config.remote?.host) {
    throw new Error('Remote server not configured');
  }

  const circuit = checkCircuit();
  if (!circuit.allowed) {
    throw new Error(`Remote unavailable: ${circuit.reason}`);
  }

  try {
    const result = await withRetry(async () => {
      const response = await fetch(`${config.remote.host}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Embedding error: ${response.status}`);
      }

      return response.json() as Promise<{ embedding: number[] }>;
    });

    recordSuccess();
    return result.embedding;
  } catch (error) {
    recordFailure();
    throw error;
  }
}

// ============================================
// Search
// ============================================

/**
 * Semantic search via remote ChromaDB
 */
export async function remoteSearch(params: {
  query: string;
  collection?: string;
  limit?: number;
}): Promise<SearchResult[]> {
  if (!config.remote?.host) {
    throw new Error('Remote server not configured');
  }

  const circuit = checkCircuit();
  if (!circuit.allowed) {
    throw new Error(`Remote unavailable: ${circuit.reason}`);
  }

  events.modelStart('embeddings', params.query);

  try {
    const result = await withRetry(async () => {
      const response = await fetch(`${config.remote.host}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          collection: params.collection || 'codebase',
          limit: params.limit || 5,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Search error: ${response.status}`);
      }

      return response.json() as Promise<{ results: SearchResult[] }>;
    });

    recordSuccess();
    events.modelComplete('embeddings', 0, 0);
    return result.results;
  } catch (error) {
    recordFailure();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    events.modelError('embeddings', errorMsg);
    throw error;
  }
}

// ============================================
// Index
// ============================================

/**
 * Index files into remote ChromaDB
 */
export async function remoteIndex(files: Array<{
  path: string;
  content: string;
  metadata?: Record<string, unknown>;
}>, collection = 'codebase'): Promise<{ indexed: number; total: number }> {
  if (!config.remote?.host) {
    throw new Error('Remote server not configured');
  }

  const circuit = checkCircuit();
  if (!circuit.allowed) {
    throw new Error(`Remote unavailable: ${circuit.reason}`);
  }

  try {
    const response = await fetch(`${config.remote.host}/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, collection }),
      signal: AbortSignal.timeout(300000), // 5 min for large indexing
    });

    if (!response.ok) {
      throw new Error(`Index error: ${response.status}`);
    }

    recordSuccess();
    return await response.json() as { indexed: number; total: number };
  } catch (error) {
    recordFailure();
    throw error;
  }
}
