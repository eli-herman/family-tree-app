/**
 * Quality Server - Runs on Windows PC (192.168.1.190)
 * Provides: 14B model inference, embeddings, vector search via ChromaDB
 *
 * Prerequisites:
 *   - Ollama running with qwen2.5-coder:14b and nomic-embed-text
 *   - ChromaDB running: chroma run --path C:\chromadb-data --host 0.0.0.0 --port 8000
 *
 * To run: npx ts-node server.ts
 * Or build: tsc && node dist/server.js
 */

import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 4000;
const WS_PORT = 4001;
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Timeouts
const GENERATE_TIMEOUT_MS = 120_000;
const EMBED_TIMEOUT_MS = 30_000;
const CHROMA_TIMEOUT_MS = 10_000;

// Size limits
const MAX_PROMPT_BYTES = 100 * 1024;   // 100KB
const MAX_FILE_CONTENT_BYTES = 200 * 1024; // 200KB

// ChromaDB API prefix — detected at startup (v0.4.x uses /api/v1, v0.5+ uses /api/v2)
let chromaApiPrefix = '/api/v1';

// Server start time for uptime tracking
const serverStartTime = Date.now();

// Store for WebSocket clients
const wsClients: Set<WebSocket> = new Set();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================
// Request ID + Structured Logging Middleware
// ============================================

interface RequestWithId extends Request {
  requestId: string;
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  const r = req as RequestWithId;
  r.requestId = randomUUID();
  const log: Record<string, unknown> = {
    requestId: r.requestId,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  };
  if (req.method === 'POST' && req.body) {
    // Log body size but not the full body (may contain large prompts)
    log.bodySize = JSON.stringify(req.body).length;
  }
  console.log(JSON.stringify(log));
  next();
});

// ============================================
// Input Validation Helpers
// ============================================

function validateString(value: unknown, name: string, maxBytes = MAX_PROMPT_BYTES): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${name} is required and must be a non-empty string`;
  }
  if (Buffer.byteLength(value, 'utf-8') > maxBytes) {
    return `${name} exceeds maximum size of ${maxBytes} bytes`;
  }
  return null;
}

function validateArray(value: unknown, name: string): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return `${name} is required and must be a non-empty array`;
  }
  return null;
}

// ============================================
// Broadcast to WebSocket clients
// ============================================

function broadcast(event: string, data: Record<string, unknown>) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch {
        // Dead client, will be cleaned up by ping/pong
      }
    }
  });
}

// ============================================
// ChromaDB Helpers
// ============================================

async function detectChromaApiVersion(): Promise<void> {
  // Try v2 first (ChromaDB 0.5+)
  try {
    const res = await fetch(`${CHROMA_URL}/api/v2/heartbeat`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      chromaApiPrefix = '/api/v2';
      console.log(JSON.stringify({ event: 'chroma_api_detected', version: 'v2' }));
      return;
    }
  } catch { /* fall through */ }

  // Try v1 (ChromaDB 0.4.x)
  try {
    const res = await fetch(`${CHROMA_URL}/api/v1/heartbeat`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      chromaApiPrefix = '/api/v1';
      console.log(JSON.stringify({ event: 'chroma_api_detected', version: 'v1' }));
      return;
    }
  } catch { /* fall through */ }

  console.warn(JSON.stringify({ event: 'chroma_unreachable', message: 'Will retry on first request' }));
}

async function chromaFetch(path: string, options?: RequestInit): Promise<globalThis.Response> {
  const signal = options?.signal || AbortSignal.timeout(CHROMA_TIMEOUT_MS);
  return fetch(`${CHROMA_URL}${chromaApiPrefix}${path}`, { ...options, signal });
}

/**
 * Ensure a ChromaDB collection exists, return its id
 */
async function ensureCollection(name: string): Promise<string> {
  // Try to get existing collection
  const getRes = await chromaFetch(`/collections/${name}`);
  if (getRes.ok) {
    const data = await getRes.json() as { id: string };
    return data.id;
  }

  // Create it
  const createRes = await chromaFetch('/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      metadata: { 'hnsw:space': 'cosine' },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create collection "${name}": ${err}`);
  }

  const data = await createRes.json() as { id: string };
  return data.id;
}

// ============================================
// Health & Status Endpoints
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;
  let ollamaOk = false;
  let chromaOk = false;
  const models: { name: string; available: boolean }[] = [];

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (ollamaRes.ok) {
      ollamaOk = true;
      // Verify required models are loaded
      const tags = await ollamaRes.json() as { models: { name: string }[] };
      const modelNames = tags.models.map((m: { name: string }) => m.name);
      for (const required of ['qwen2.5-coder:14b', 'nomic-embed-text']) {
        const found = modelNames.some((n: string) => n.startsWith(required));
        models.push({ name: required, available: found });
      }
    }
  } catch { /* leave false */ }

  try {
    const chromaRes = await fetch(`${CHROMA_URL}${chromaApiPrefix}/heartbeat`, { signal: AbortSignal.timeout(3000) });
    chromaOk = chromaRes.ok;
  } catch { /* leave false */ }

  const allModelsAvailable = models.length > 0 && models.every(m => m.available);

  res.json({
    status: ollamaOk && allModelsAvailable ? 'ok' : 'degraded',
    requestId: reqId,
    timestamp: Date.now(),
    services: {
      ollama: ollamaOk,
      chromadb: chromaOk,
    },
    models,
  });
});

app.get('/status', (_req: Request, res: Response) => {
  res.json({
    uptime: process.uptime(),
    uptimeMs: Date.now() - serverStartTime,
    memory: process.memoryUsage(),
    wsClients: wsClients.size,
  });
});

// ============================================
// Ollama 14B Generation
// ============================================

app.post('/generate', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;
  const { system, prompt, format } = req.body;

  // Input validation
  const promptErr = validateString(prompt, 'prompt');
  if (promptErr) {
    res.status(400).json({ error: promptErr, requestId: reqId });
    return;
  }

  // Respect client-specified timeout if provided
  const clientTimeout = parseInt(req.headers['x-timeout-ms'] as string, 10);
  const timeout = (clientTimeout > 0 && clientTimeout <= GENERATE_TIMEOUT_MS)
    ? clientTimeout
    : GENERATE_TIMEOUT_MS;

  const startTime = Date.now();

  broadcast('model:start', {
    model: 'qwen2.5-coder:14b',
    prompt_preview: (prompt as string).substring(0, 100) + '...'
  });

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:14b',
        prompt: system ? `${system}\n\n${prompt}` : prompt,
        stream: false,
        format: format === 'json' ? 'json' : undefined,
        options: {
          temperature: 0.1,
          num_predict: 4096,
        }
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json() as {
      response: string;
      prompt_eval_count?: number;
      eval_count?: number;
      total_duration?: number;
    };

    const duration = Date.now() - startTime;
    const tokensUsed = (data.prompt_eval_count || 0) + (data.eval_count || 0);

    broadcast('model:complete', {
      model: 'qwen2.5-coder:14b',
      tokens: tokensUsed,
      duration
    });

    console.log(JSON.stringify({
      event: 'generate_complete',
      requestId: reqId,
      tokens: tokensUsed,
      durationMs: duration,
    }));

    res.json({
      response: data.response,
      tokensUsed,
      durationMs: duration,
      requestId: reqId,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errMsg = String(error);
    broadcast('model:error', { model: 'qwen2.5-coder:14b', error: errMsg });
    console.log(JSON.stringify({
      event: 'generate_error',
      requestId: reqId,
      error: errMsg,
      durationMs: duration,
    }));
    res.status(500).json({ error: errMsg, requestId: reqId });
  }
});

// ============================================
// Embeddings
// ============================================

app.post('/embed', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;
  const { text, texts } = req.body;

  // Input validation
  if (texts) {
    const arrErr = validateArray(texts, 'texts');
    if (arrErr) {
      res.status(400).json({ error: arrErr, requestId: reqId });
      return;
    }
    for (let i = 0; i < texts.length; i++) {
      const err = validateString(texts[i], `texts[${i}]`);
      if (err) {
        res.status(400).json({ error: err, requestId: reqId });
        return;
      }
    }
  } else {
    const textErr = validateString(text, 'text');
    if (textErr) {
      res.status(400).json({ error: textErr, requestId: reqId });
      return;
    }
  }

  // Respect client-specified timeout if provided
  const clientTimeout = parseInt(req.headers['x-timeout-ms'] as string, 10);
  const perItemTimeout = (clientTimeout > 0 && clientTimeout <= EMBED_TIMEOUT_MS * 4)
    ? clientTimeout
    : EMBED_TIMEOUT_MS;

  try {
    // Handle single text or batch
    const inputTexts: string[] = texts || [text];
    const CONCURRENCY = 4;
    const embeddings: number[][] = new Array(inputTexts.length);

    // Process in parallel batches of CONCURRENCY
    for (let i = 0; i < inputTexts.length; i += CONCURRENCY) {
      const batch = inputTexts.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (t: string) => {
          const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'nomic-embed-text',
              prompt: t
            }),
            signal: AbortSignal.timeout(perItemTimeout),
          });

          if (!response.ok) {
            throw new Error(`Embedding error: ${response.status}`);
          }

          const data = await response.json() as { embedding: number[] };
          return data.embedding;
        })
      );
      for (let j = 0; j < results.length; j++) {
        embeddings[i + j] = results[j];
      }
    }

    res.json({
      embeddings: texts ? embeddings : undefined,
      embedding: texts ? undefined : embeddings[0],
      requestId: reqId,
    });
  } catch (error) {
    res.status(500).json({ error: String(error), requestId: reqId });
  }
});

// ============================================
// ChromaDB Operations (Persistent Vector Store)
// ============================================

app.post('/index', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;
  const { files, collection = 'codebase' } = req.body;

  // Input validation
  const filesErr = validateArray(files, 'files');
  if (filesErr) {
    res.status(400).json({ error: filesErr, requestId: reqId });
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const pathErr = validateString(f?.path, `files[${i}].path`);
    if (pathErr) {
      res.status(400).json({ error: pathErr, requestId: reqId });
      return;
    }
    const contentErr = validateString(f?.content, `files[${i}].content`, MAX_FILE_CONTENT_BYTES);
    if (contentErr) {
      res.status(400).json({ error: contentErr, requestId: reqId });
      return;
    }
  }

  try {
    const collectionId = await ensureCollection(collection);
    let indexed = 0;

    // Process in batches of 20 to avoid overwhelming Ollama
    const BATCH_SIZE = 20;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const ids: string[] = [];
      const embeddings: number[][] = [];
      const documents: string[] = [];
      const metadatas: Record<string, string>[] = [];

      // Generate embeddings in parallel (4-way concurrency)
      const CONCURRENCY = 4;
      for (let j = 0; j < batch.length; j += CONCURRENCY) {
        const subBatch = batch.slice(j, j + CONCURRENCY);
        const embeddingResults = await Promise.all(
          subBatch.map(async (file: { path: string; content: string; metadata?: Record<string, unknown> }) => {
            const embeddingResponse = await fetch(`${OLLAMA_URL}/api/embeddings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'nomic-embed-text',
                prompt: file.content
              }),
              signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
            });

            if (!embeddingResponse.ok) {
              throw new Error(`Embedding error for ${file.path}`);
            }

            const embeddingData = await embeddingResponse.json() as { embedding: number[] };
            return { file, embedding: embeddingData.embedding };
          })
        );

        for (const result of embeddingResults) {
          ids.push(result.file.path);
          embeddings.push(result.embedding);
          documents.push(result.file.content.substring(0, 40000));
          const meta: Record<string, string> = { path: result.file.path };
          if (result.file.metadata) {
            for (const [k, v] of Object.entries(result.file.metadata)) {
              meta[k] = String(v);
            }
          }
          metadatas.push(meta);
          indexed++;
          broadcast('index:progress', { file: result.file.path, indexed, total: files.length });
        }
      }

      // Upsert batch into ChromaDB
      const upsertRes = await chromaFetch(`/collections/${collectionId}/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          embeddings,
          documents,
          metadatas,
        }),
      });

      if (!upsertRes.ok) {
        const err = await upsertRes.text();
        throw new Error(`ChromaDB upsert error: ${err}`);
      }
    }

    console.log(JSON.stringify({
      event: 'index_complete',
      requestId: reqId,
      indexed,
      total: files.length,
      collection,
    }));

    res.json({ indexed, total: files.length, requestId: reqId });
  } catch (error) {
    res.status(500).json({ error: String(error), requestId: reqId });
  }
});

app.post('/search', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;
  const { query, collection = 'codebase', limit = 5 } = req.body;

  // Input validation
  const queryErr = validateString(query, 'query');
  if (queryErr) {
    res.status(400).json({ error: queryErr, requestId: reqId });
    return;
  }

  try {
    // Get query embedding from Ollama
    const embeddingResponse = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: query
      }),
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding');
    }

    const embeddingData = await embeddingResponse.json() as { embedding: number[] };

    // Query ChromaDB
    const collectionId = await ensureCollection(collection);
    const queryRes = await chromaFetch(`/collections/${collectionId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embeddings: [embeddingData.embedding],
        n_results: limit,
        include: ['documents', 'metadatas', 'distances'],
      }),
    });

    if (!queryRes.ok) {
      const err = await queryRes.text();
      throw new Error(`ChromaDB query error: ${err}`);
    }

    const queryData = await queryRes.json() as {
      ids: string[][];
      documents: (string | null)[][];
      metadatas: (Record<string, unknown> | null)[][];
      distances: number[][];
    };

    // Transform ChromaDB response to match our API contract
    const results: Array<{
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }> = [];

    if (queryData.ids && queryData.ids[0]) {
      for (let i = 0; i < queryData.ids[0].length; i++) {
        // ChromaDB returns cosine distance; similarity = 1 - distance
        const distance = queryData.distances?.[0]?.[i] ?? 0;
        results.push({
          content: queryData.documents?.[0]?.[i] ?? '',
          metadata: queryData.metadatas?.[0]?.[i] ?? {},
          similarity: 1 - distance,
        });
      }
    }

    broadcast('search:complete', { query, results: results.length });

    res.json({ results, requestId: reqId });
  } catch (error) {
    res.status(500).json({ error: String(error), requestId: reqId });
  }
});

// ============================================
// Collection Management
// ============================================

app.get('/collections', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;

  try {
    const listRes = await chromaFetch('/collections');
    if (!listRes.ok) {
      throw new Error(`ChromaDB list error: ${listRes.status}`);
    }
    const collections = await listRes.json() as Array<{ id: string; name: string; metadata: unknown }>;
    res.json({ collections, requestId: reqId });
  } catch (error) {
    res.status(500).json({ error: String(error), requestId: reqId });
  }
});

app.delete('/collections/:name', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;
  const { name } = req.params;

  try {
    const delRes = await chromaFetch(`/collections/${name}`, { method: 'DELETE' });
    if (!delRes.ok) {
      const err = await delRes.text();
      throw new Error(`Failed to delete collection "${name}": ${err}`);
    }
    console.log(JSON.stringify({ event: 'collection_deleted', requestId: reqId, name }));
    res.json({ deleted: name, requestId: reqId });
  } catch (error) {
    res.status(500).json({ error: String(error), requestId: reqId });
  }
});

// ============================================
// QA Status (real server stats)
// ============================================

app.get('/qa/status', async (req: Request, res: Response) => {
  const reqId = (req as RequestWithId).requestId;

  let collectionCount = 0;
  try {
    const listRes = await chromaFetch('/collections');
    if (listRes.ok) {
      const collections = await listRes.json() as unknown[];
      collectionCount = collections.length;
    }
  } catch { /* leave 0 */ }

  const mem = process.memoryUsage();

  res.json({
    requestId: reqId,
    uptime: process.uptime(),
    uptimeMs: Date.now() - serverStartTime,
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    models: {
      generation: 'qwen2.5-coder:14b',
      embedding: 'nomic-embed-text',
    },
    chromadb: {
      collections: collectionCount,
    },
    wsClients: wsClients.size,
  });
});

// ============================================
// Start Servers
// ============================================

let httpServer: ReturnType<typeof app.listen> | null = null;
let wss: WebSocketServer | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;

async function start() {
  // Detect ChromaDB API version
  await detectChromaApiVersion();

  // HTTP Server
  httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(JSON.stringify({ event: 'http_started', port: PORT }));
  });

  // WebSocket Server
  wss = new WebSocketServer({ port: WS_PORT, host: '0.0.0.0' });

  wss.on('connection', (ws) => {
    console.log(JSON.stringify({ event: 'ws_connected', clients: wsClients.size + 1 }));
    wsClients.add(ws);

    // Mark alive for ping/pong
    (ws as any).isAlive = true;
    ws.on('pong', () => { (ws as any).isAlive = true; });

    ws.on('close', () => {
      wsClients.delete(ws);
      console.log(JSON.stringify({ event: 'ws_disconnected', clients: wsClients.size }));
    });

    ws.on('error', () => {
      wsClients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      event: 'connected',
      data: { message: 'Connected to Quality Server' },
      timestamp: Date.now()
    }));
  });

  // Ping/pong keepalive: detect dead connections every 30s
  pingInterval = setInterval(() => {
    wsClients.forEach(ws => {
      if ((ws as any).isAlive === false) {
        wsClients.delete(ws);
        ws.terminate();
        return;
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30_000);

  console.log(JSON.stringify({ event: 'ws_started', port: WS_PORT }));
}

// ============================================
// Graceful Shutdown
// ============================================

async function shutdown(signal: string) {
  console.log(JSON.stringify({ event: 'shutdown_start', signal }));

  // Stop ping interval
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  // Close WebSocket connections
  if (wss) {
    wsClients.forEach(ws => {
      try {
        ws.send(JSON.stringify({
          event: 'server:shutdown',
          data: { reason: signal },
          timestamp: Date.now()
        }));
        ws.close(1001, 'Server shutting down');
      } catch { /* ignore */ }
    });
    wsClients.clear();

    await new Promise<void>((resolve) => {
      wss!.close(() => resolve());
    });
    wss = null;
  }

  // Drain HTTP server (stop accepting, finish in-flight)
  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer!.close(() => resolve());
    });
    httpServer = null;
  }

  console.log(JSON.stringify({ event: 'shutdown_complete', signal }));
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch(err => {
  console.error('Failed to start Quality Server:', err);
  process.exit(1);
});
