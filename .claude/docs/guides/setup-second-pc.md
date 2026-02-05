# Second PC Setup Guide

> Complete setup for the Quality Server on Windows 11 (192.168.1.190)

## Overview

Your Windows PC will run:
- **Ollama** with qwen2.5-coder:32b (complex analysis)
- **Ollama** with nomic-embed-text (embeddings)
- **ChromaDB** for vector storage
- **Quality API Server** (Express + WebSocket)
- **File Watcher** for continuous QA

## Hardware Requirements

| Component | Minimum | Your PC |
|-----------|---------|---------|
| GPU VRAM | 8GB | 8GB (RTX 4060 Ti) |
| RAM | 16GB | 32GB |
| Storage | 50GB free | Plenty |
| CPU | 8 cores | Ryzen 7 5900X |

You're well over spec. The 32B model will run comfortably.

---

## Step 1: Install Ollama

1. Download Ollama for Windows: https://ollama.ai/download/windows

2. Run the installer

3. Open PowerShell and verify:
   ```powershell
   ollama --version
   ```

4. Configure Ollama to accept network connections. Create/edit the environment variable:
   ```powershell
   # Run as Administrator
   [System.Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0:11434', 'Machine')
   ```

5. Restart Ollama service or reboot

---

## Step 2: Download Models

Open PowerShell and run:

```powershell
# Main model - 14B quantized (fits in 8GB VRAM)
ollama pull qwen2.5-coder:14b-q4_K_M

# Embedding model
ollama pull nomic-embed-text

# Verify
ollama list
```

The 14B model is ~9GB download. Embedding model is ~275MB.

---

## Step 3: Install Node.js

1. Download Node.js LTS: https://nodejs.org/

2. Verify:
   ```powershell
   node --version   # Should be 18+
   npm --version
   ```

---

## Step 4: Install Python (for ChromaDB)

1. Download Python 3.11: https://www.python.org/downloads/

2. During install, check "Add Python to PATH"

3. Verify:
   ```powershell
   python --version
   pip --version
   ```

---

## Step 5: Install ChromaDB

```powershell
pip install chromadb

# Verify
python -c "import chromadb; print(chromadb.__version__)"
```

---

## Step 6: Create Quality Server Directory

```powershell
mkdir C:\quality-server
cd C:\quality-server
npm init -y
```

---

## Step 7: Install Dependencies

```powershell
npm install express ws cors chromadb ollama chokidar
npm install -D typescript @types/express @types/ws @types/cors ts-node
```

---

## Step 8: Create the Server

Create `C:\quality-server\server.ts`:

```typescript
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { ChromaClient } from 'chromadb';
import Ollama from 'ollama';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// WebSocket server for real-time events
const wss = new WebSocketServer({ port: 4001 });
const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(event: string, data: any) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Ollama client
const ollama = new Ollama({ host: 'http://localhost:11434' });

// ChromaDB client
const chroma = new ChromaClient();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Generate with 32B model
app.post('/generate', async (req, res) => {
  const { system, prompt, format } = req.body;
  const startTime = Date.now();

  broadcast('model:start', {
    model: 'qwen2.5-coder:32b',
    prompt_preview: prompt.substring(0, 100) + '...'
  });

  try {
    const response = await ollama.generate({
      model: 'qwen2.5-coder:32b-q4_K_M',
      prompt: `${system}\n\n${prompt}`,
      stream: false,
      format: format === 'json' ? 'json' : undefined,
      options: {
        temperature: 0.1,
        num_predict: 4096,
      }
    });

    const duration = Date.now() - startTime;
    const tokensUsed = (response.prompt_eval_count || 0) + (response.eval_count || 0);

    broadcast('model:complete', {
      model: 'qwen2.5-coder:32b',
      tokens: tokensUsed,
      duration
    });

    res.json({
      response: response.response,
      tokensUsed,
      durationMs: duration
    });
  } catch (error) {
    broadcast('model:error', { model: 'qwen2.5-coder:32b', error: String(error) });
    res.status(500).json({ error: String(error) });
  }
});

// Generate embeddings
app.post('/embed', async (req, res) => {
  const { text } = req.body;

  try {
    const response = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: text
    });

    res.json({ embedding: response.embedding });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Semantic search
app.post('/search', async (req, res) => {
  const { query, collection = 'codebase', limit = 5 } = req.body;

  try {
    // Get query embedding
    const embeddingResponse = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: query
    });

    // Search ChromaDB
    const coll = await chroma.getOrCreateCollection({ name: collection });
    const results = await coll.query({
      queryEmbeddings: [embeddingResponse.embedding],
      nResults: limit
    });

    res.json({
      results: results.documents?.[0]?.map((doc, i) => ({
        content: doc,
        metadata: results.metadatas?.[0]?.[i],
        distance: results.distances?.[0]?.[i]
      })) || []
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Index files into ChromaDB
app.post('/index', async (req, res) => {
  const { files, collection = 'codebase' } = req.body;
  // files: [{ path: string, content: string, metadata?: object }]

  try {
    const coll = await chroma.getOrCreateCollection({ name: collection });

    let indexed = 0;
    for (const file of files) {
      // Generate embedding
      const embeddingResponse = await ollama.embeddings({
        model: 'nomic-embed-text',
        prompt: file.content
      });

      // Upsert into ChromaDB
      await coll.upsert({
        ids: [file.path],
        embeddings: [embeddingResponse.embedding],
        documents: [file.content],
        metadatas: [{ path: file.path, ...file.metadata }]
      });

      indexed++;
      broadcast('index:progress', { file: file.path, indexed, total: files.length });
    }

    res.json({ indexed, total: files.length });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quality Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket on ws://0.0.0.0:4001`);
});
```

---

## Step 9: Create TypeScript Config

Create `C:\quality-server\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./",
    "resolveJsonModule": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 10: Create Start Script

Add to `package.json`:

```json
{
  "scripts": {
    "start": "ts-node server.ts",
    "build": "tsc",
    "serve": "node dist/server.js"
  }
}
```

---

## Step 11: Configure Windows Firewall

Allow inbound connections on ports 4000 and 4001:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Quality Server HTTP" -Direction Inbound -Port 4000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Quality Server WebSocket" -Direction Inbound -Port 4001 -Protocol TCP -Action Allow
```

---

## Step 12: Start the Server

```powershell
cd C:\quality-server
npm start
```

You should see:
```
Quality Server running on http://0.0.0.0:4000
WebSocket on ws://0.0.0.0:4001
```

---

## Step 13: Test from Mac

From your Mac terminal:

```bash
# Health check
curl http://192.168.1.190:4000/health

# Test generation
curl -X POST http://192.168.1.190:4000/generate \
  -H "Content-Type: application/json" \
  -d '{"system": "You are helpful.", "prompt": "Say hello", "format": "text"}'

# Test embedding
curl -X POST http://192.168.1.190:4000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "function handleAuth() { ... }"}'
```

---

## Step 14: Run as Windows Service (Optional)

To keep the server running after logout:

1. Install pm2:
   ```powershell
   npm install -g pm2
   pm2 install pm2-windows-startup
   pm2-startup install
   ```

2. Start with pm2:
   ```powershell
   cd C:\quality-server
   pm2 start "npm start" --name quality-server
   pm2 save
   ```

---

## Troubleshooting

### Ollama not accessible from network
- Check `OLLAMA_HOST` environment variable is set to `0.0.0.0:11434`
- Restart Ollama after changing

### Model loading slowly
- First load takes longer (loading into VRAM)
- Subsequent calls are fast

### Out of memory
- The 14B-q4 model uses ~6GB VRAM
- Close other GPU-intensive apps
- If still OOM, try qwen2.5-coder:7b-q8 (~5GB)

### Port already in use
- Check with `netstat -ano | findstr :4000`
- Kill process or use different port

---

## What's Next

1. Update Mac orchestrator to use remote server
2. Set up file syncing between Mac and PC
3. Configure continuous QA watcher
4. Test semantic search

See [Orchestrator Upgrade](../components/orchestrator.md) for next steps.
