/**
 * Quality Server - Runs on Windows PC (192.168.1.190)
 * Provides: 14B model inference, embeddings, vector search, file watching
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
// Health & Status Endpoints
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      ollama: true, // TODO: actual health check
      chromadb: true, // TODO: actual health check
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
// Ollama 32B Generation
// ============================================

app.post('/generate', async (req: Request, res: Response) => {
  const { system, prompt, format } = req.body;
  const startTime = Date.now();

  broadcast('model:start', {
    model: 'qwen2.5-coder:14b',
    prompt_preview: (prompt as string).substring(0, 100) + '...'
  });

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
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
      const response = await fetch('http://localhost:11434/api/embeddings', {
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
// ChromaDB Operations
// ============================================

// In-memory store (replace with actual ChromaDB when installed)
const vectorStore: Map<string, {
  id: string;
  embedding: number[];
  document: string;
  metadata: Record<string, unknown>;
}> = new Map();

app.post('/index', async (req: Request, res: Response) => {
  const { files, collection = 'codebase' } = req.body;
  // files: [{ path: string, content: string, metadata?: object }]

  try {
    let indexed = 0;
    for (const file of files) {
      // Generate embedding
      const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
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

      // Store in memory (replace with ChromaDB)
      const id = `${collection}:${file.path}`;
      vectorStore.set(id, {
        id,
        embedding: embeddingData.embedding,
        document: file.content,
        metadata: { path: file.path, collection, ...file.metadata }
      });

      indexed++;
      broadcast('index:progress', { file: file.path, indexed, total: files.length });
    }

    res.json({ indexed, total: files.length });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/search', async (req: Request, res: Response) => {
  const { query, collection = 'codebase', limit = 5 } = req.body;

  try {
    // Get query embedding
    const embeddingResponse = await fetch('http://localhost:11434/api/embeddings', {
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
    const queryEmbedding = embeddingData.embedding;

    // Calculate cosine similarity with all stored vectors
    const results: Array<{
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }> = [];

    for (const [, entry] of vectorStore) {
      if (entry.metadata.collection !== collection) continue;

      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      results.push({
        content: entry.document,
        metadata: entry.metadata,
        similarity
      });
    }

    // Sort by similarity and take top N
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    broadcast('search:complete', { query, results: topResults.length });

    res.json({ results: topResults });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

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
