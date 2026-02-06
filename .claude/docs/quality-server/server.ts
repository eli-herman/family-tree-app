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

import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';

const app = express();
const PORT = 4000;
const WS_PORT = 4001;
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// ChromaDB API prefix — detected at startup (v0.4.x uses /api/v1, v0.5+ uses /api/v2)
let chromaApiPrefix = '/api/v1';

// Store for WebSocket clients
const wsClients: Set<WebSocket> = new Set();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Broadcast to all WebSocket clients
function broadcast(event: string, data: Record<string, unknown>) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
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
      console.log('ChromaDB API: v2 detected');
      return;
    }
  } catch { /* fall through */ }

  // Try v1 (ChromaDB 0.4.x)
  try {
    const res = await fetch(`${CHROMA_URL}/api/v1/heartbeat`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      chromaApiPrefix = '/api/v1';
      console.log('ChromaDB API: v1 detected');
      return;
    }
  } catch { /* fall through */ }

  console.warn('ChromaDB not reachable — will retry on first request');
}

async function chromaFetch(path: string, options?: RequestInit): Promise<globalThis.Response> {
  return fetch(`${CHROMA_URL}${chromaApiPrefix}${path}`, options);
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

app.get('/health', async (_req: Request, res: Response) => {
  let ollamaOk = false;
  let chromaOk = false;

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    ollamaOk = ollamaRes.ok;
  } catch { /* leave false */ }

  try {
    const chromaRes = await fetch(`${CHROMA_URL}${chromaApiPrefix}/heartbeat`, { signal: AbortSignal.timeout(3000) });
    chromaOk = chromaRes.ok;
  } catch { /* leave false */ }

  res.json({
    status: ollamaOk ? 'ok' : 'degraded',
    timestamp: Date.now(),
    services: {
      ollama: ollamaOk,
      chromadb: chromaOk,
    }
  });
});

app.get('/status', (_req: Request, res: Response) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    wsClients: wsClients.size,
  });
});

// ============================================
// Ollama 14B Generation
// ============================================

app.post('/generate', async (req: Request, res: Response) => {
  const { system, prompt, format } = req.body;
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
        prompt: `${system}\n\n${prompt}`,
        stream: false,
        format: format === 'json' ? 'json' : undefined,
        options: {
          temperature: 0.1,
          num_predict: 4096,
        }
      })
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

    res.json({
      response: data.response,
      tokensUsed,
      durationMs: duration
    });
  } catch (error) {
    broadcast('model:error', { model: 'remote-32b', error: String(error) });
    res.status(500).json({ error: String(error) });
  }
});

// ============================================
// Embeddings
// ============================================

app.post('/embed', async (req: Request, res: Response) => {
  const { text, texts } = req.body;

  try {
    // Handle single text or batch
    const inputTexts = texts || [text];
    const embeddings: number[][] = [];

    for (const t of inputTexts) {
      const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: t
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding error: ${response.status}`);
      }

      const data = await response.json() as { embedding: number[] };
      embeddings.push(data.embedding);
    }

    res.json({
      embeddings: texts ? embeddings : undefined,
      embedding: texts ? undefined : embeddings[0]
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ============================================
// ChromaDB Operations (Persistent Vector Store)
// ============================================

app.post('/index', async (req: Request, res: Response) => {
  const { files, collection = 'codebase' } = req.body;
  // files: [{ path: string, content: string, metadata?: object }]

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

      for (const file of batch) {
        // Generate embedding via Ollama
        const embeddingResponse = await fetch(`${OLLAMA_URL}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: file.content
          })
        });

        if (!embeddingResponse.ok) {
          throw new Error(`Embedding error for ${file.path}`);
        }

        const embeddingData = await embeddingResponse.json() as { embedding: number[] };

        ids.push(file.path);
        embeddings.push(embeddingData.embedding);
        // ChromaDB documents have a max size; truncate if needed
        documents.push(file.content.substring(0, 40000));
        // ChromaDB metadata values must be string, number, or boolean
        const meta: Record<string, string> = { path: file.path };
        if (file.metadata) {
          for (const [k, v] of Object.entries(file.metadata)) {
            meta[k] = String(v);
          }
        }
        metadatas.push(meta);

        indexed++;
        broadcast('index:progress', { file: file.path, indexed, total: files.length });
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

    res.json({ indexed, total: files.length });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/search', async (req: Request, res: Response) => {
  const { query, collection = 'codebase', limit = 5 } = req.body;

  try {
    // Get query embedding from Ollama
    const embeddingResponse = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: query
      })
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

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ============================================
// QA Status (placeholder)
// ============================================

app.get('/qa/status', (_req: Request, res: Response) => {
  res.json({
    lastRun: null,
    typescript: { errors: 0, warnings: 0 },
    eslint: { errors: 0, warnings: 0 },
    tests: { passed: 0, failed: 0 },
  });
});

// ============================================
// Start Servers
// ============================================

async function start() {
  // Detect ChromaDB API version
  await detectChromaApiVersion();

  // HTTP Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quality Server HTTP running on http://0.0.0.0:${PORT}`);
  });

  // WebSocket Server
  const wss = new WebSocketServer({ port: WS_PORT, host: '0.0.0.0' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsClients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      event: 'connected',
      data: { message: 'Connected to Quality Server' },
      timestamp: Date.now()
    }));
  });

  console.log(`Quality Server WebSocket running on ws://0.0.0.0:${WS_PORT}`);
}

start().catch(err => {
  console.error('Failed to start Quality Server:', err);
  process.exit(1);
});
