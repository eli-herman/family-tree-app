# Quality Server — Mac Client Guide

This document describes how to connect to and use the Quality Server running on the Windows PC from the Mac.

## Windows Server Details

| Property | Value |
|----------|-------|
| Windows PC IP | `192.168.1.190` |
| Quality Server HTTP | `http://192.168.1.190:4000` |
| Quality Server WebSocket | `ws://192.168.1.190:4001` |
| ChromaDB (internal) | `http://192.168.1.190:8000` |
| Ollama (internal) | `http://192.168.1.190:11434` |

**Note:** ChromaDB and Ollama are accessed through the Quality Server API — you don't need to connect to them directly.

---

## Quick Connectivity Test

Run these commands from the Mac terminal to verify the Windows server is accessible:

```bash
# Health check — should return {"status":"ok",...}
curl http://192.168.1.190:4000/health

# Test text generation
curl -X POST http://192.168.1.190:4000/generate \
  -H "Content-Type: application/json" \
  -d '{"system":"You are a helpful assistant.","prompt":"Say hello in one sentence."}'

# Test embedding
curl -X POST http://192.168.1.190:4000/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"test embedding"}'
```

---

## API Reference

### Health & Status

#### `GET /health`
Returns server health and service availability.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890123,
  "services": {
    "ollama": true,
    "chromadb": true
  }
}
```

#### `GET /status`
Returns server metrics.

**Response:**
```json
{
  "uptime": 3600.5,
  "memory": { "heapUsed": 50000000, ... },
  "wsClients": 1
}
```

---

### Text Generation (14B Model)

#### `POST /generate`
Generate text using the `qwen2.5-coder:14b` model.

**Request:**
```json
{
  "system": "You are a code review assistant.",
  "prompt": "Review this function for bugs: ...",
  "format": "json"  // optional, forces JSON output
}
```

**Response:**
```json
{
  "response": "The generated text...",
  "tokensUsed": 1234,
  "durationMs": 5678
}
```

**Notes:**
- The 14B model is slower but more capable than smaller models
- Use `format: "json"` when you need structured output
- Temperature is set to 0.1 for consistent outputs
- Max tokens: 4096

---

### Embeddings

#### `POST /embed`
Generate embeddings using `nomic-embed-text` model.

**Single text:**
```json
{
  "text": "The text to embed"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...]  // 768-dimensional vector
}
```

**Batch texts:**
```json
{
  "texts": ["First text", "Second text", "Third text"]
}
```

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, ...],
    [0.789, -0.012, ...],
    [0.345, -0.678, ...]
  ]
}
```

---

### Vector Search (ChromaDB)

#### `POST /index`
Index files into ChromaDB for semantic search.

**Request:**
```json
{
  "collection": "codebase",
  "files": [
    {
      "path": "src/components/Button.tsx",
      "content": "import React from 'react';\n...",
      "metadata": {
        "language": "typescript",
        "type": "component"
      }
    }
  ]
}
```

**Response:**
```json
{
  "indexed": 1,
  "total": 1
}
```

**Notes:**
- Files are processed in batches of 20
- Content is truncated to 40,000 characters per file
- Progress is broadcast via WebSocket

#### `POST /search`
Semantic search across indexed files.

**Request:**
```json
{
  "query": "authentication middleware",
  "collection": "codebase",
  "limit": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "content": "import { auth } from './auth';\n...",
      "metadata": {
        "path": "src/middleware/auth.ts",
        "language": "typescript"
      },
      "similarity": 0.89
    }
  ]
}
```

---

### WebSocket Events

Connect to `ws://192.168.1.190:4001` for real-time updates.

#### Events Emitted:

| Event | Data | Description |
|-------|------|-------------|
| `connected` | `{message}` | Initial connection confirmed |
| `model:start` | `{model, prompt_preview}` | Generation started |
| `model:complete` | `{model, tokens, duration}` | Generation finished |
| `model:error` | `{model, error}` | Generation failed |
| `index:progress` | `{file, indexed, total}` | Indexing progress |
| `search:complete` | `{query, results}` | Search finished |

**JavaScript Example:**
```javascript
const ws = new WebSocket('ws://192.168.1.190:4001');

ws.onmessage = (event) => {
  const { event: eventName, data, timestamp } = JSON.parse(event.data);
  console.log(`[${eventName}]`, data);
};

ws.onopen = () => {
  console.log('Connected to Quality Server');
};
```

---

## Environment Variables (Optional)

If you need to override defaults on the Windows server:

```bash
CHROMA_URL=http://localhost:8000  # ChromaDB location
OLLAMA_URL=http://localhost:11434  # Ollama location
```

---

## Data Persistence

- **ChromaDB data**: `D:\chromadb-data` (persists across restarts)
- **Collections**: Created automatically on first use
- **Embeddings**: 768-dimensional vectors (nomic-embed-text)

---

## Troubleshooting

### Cannot connect to server
1. Verify Windows PC is on: `ping 192.168.1.190`
2. Check if Quality Server is running: `curl http://192.168.1.190:4000/health`
3. If firewall blocking, ensure ports 4000, 4001, 8000 are open on Windows

### Slow responses
- The 14B model takes 5-30 seconds depending on prompt length
- Use WebSocket to monitor progress in real-time
- Consider smaller prompts for faster responses

### ChromaDB errors
- Check ChromaDB is running: `curl http://192.168.1.190:8000/api/v2/heartbeat`
- Collection names must be alphanumeric with underscores/hyphens
- If index fails, check file content isn't empty

### Ollama errors
- Verify Ollama is running on Windows: `curl http://192.168.1.190:11434/api/tags`
- Check models are available: Should show `qwen2.5-coder:14b` and `nomic-embed-text`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mac (Client)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Claude Code    │  │   Dashboard     │  │   Other Apps    │ │
│  │  (CLI Agent)    │  │   (React UI)    │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┼────────────────────┘          │
│                                │                               │
│                    HTTP/WebSocket Requests                     │
└────────────────────────────────┼───────────────────────────────┘
                                 │
                    ─────────────┼─────────────
                     Network (192.168.1.x)
                    ─────────────┼─────────────
                                 │
┌────────────────────────────────┼───────────────────────────────┐
│                    Windows PC (192.168.1.190)                  │
│                                │                               │
│           ┌────────────────────┴────────────────────┐         │
│           │         Quality Server (Node.js)         │         │
│           │         HTTP :4000 / WS :4001           │         │
│           └────────────────┬────────────────────────┘         │
│                            │                                   │
│              ┌─────────────┴─────────────┐                    │
│              │                           │                    │
│    ┌─────────┴─────────┐     ┌──────────┴──────────┐         │
│    │      Ollama       │     │      ChromaDB       │         │
│    │    :11434         │     │       :8000         │         │
│    │                   │     │                     │         │
│    │ • qwen2.5-coder   │     │ • Vector storage    │         │
│    │   :14b (9GB)      │     │ • Semantic search   │         │
│    │ • nomic-embed     │     │ • D:\chromadb-data  │         │
│    │   -text (274MB)   │     │                     │         │
│    └───────────────────┘     └─────────────────────┘         │
│                                                               │
│    Managed by pm2:                                            │
│    • pm2 start/stop/restart chromadb                         │
│    • pm2 start/stop/restart quality-server                   │
│    • pm2 logs [name]                                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Service Management (Windows Side)

If you need to manage services on the Windows PC:

```powershell
# View running services
pm2 status

# Restart services
pm2 restart chromadb
pm2 restart quality-server

# View logs
pm2 logs chromadb --lines 50
pm2 logs quality-server --lines 50

# Stop services
pm2 stop all

# Start services
pm2 start C:\quality-server\ecosystem.config.js
```
