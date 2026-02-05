/**
 * Remote Quality Server Client
 * Handles communication with the Windows PC running the 32B model
 */

import { config } from "../config.js";
import { events } from "../events.js";

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

/**
 * Check if remote server is available
 */
export async function isRemoteAvailable(): Promise<boolean> {
  if (!config.remote?.host) return false;

  try {
    const response = await fetch(`${config.remote.host}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate with remote 32B model
 */
export async function remoteGenerate(params: {
  system: string;
  prompt: string;
  format?: 'json';
}): Promise<RemoteGenerateResult> {
  if (!config.remote?.host) {
    throw new Error('Remote server not configured');
  }

  const startTime = Date.now();
  events.modelStart('remote-32b', params.prompt);

  try {
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

    const data = await response.json() as {
      response: string;
      tokensUsed: number;
      durationMs: number;
    };

    const duration = Date.now() - startTime;
    events.modelComplete('remote-32b', data.tokensUsed, duration);

    return {
      response: data.response,
      tokensUsed: data.tokensUsed,
      durationMs: duration,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    events.modelError('remote-32b', errorMsg);
    throw error;
  }
}

/**
 * Generate embeddings via remote server
 */
export async function remoteEmbed(text: string): Promise<number[]> {
  if (!config.remote?.host) {
    throw new Error('Remote server not configured');
  }

  const response = await fetch(`${config.remote.host}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Embedding error: ${response.status}`);
  }

  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}

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

  events.modelStart('embeddings', params.query);

  try {
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

    const data = await response.json() as { results: SearchResult[] };
    events.modelComplete('embeddings', 0, 0);

    return data.results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    events.modelError('embeddings', errorMsg);
    throw error;
  }
}

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

  const response = await fetch(`${config.remote.host}/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, collection }),
    signal: AbortSignal.timeout(300000), // 5 min for large indexing
  });

  if (!response.ok) {
    throw new Error(`Index error: ${response.status}`);
  }

  return await response.json() as { indexed: number; total: number };
}
