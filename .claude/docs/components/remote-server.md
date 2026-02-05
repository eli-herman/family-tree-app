# Remote Quality Server

> Express server on Windows PC exposing the 14B model and ChromaDB.

## Overview

The Quality Server runs on your Windows PC with GPU, providing:

- **14B model inference** - For complex analysis and code review
- **Embeddings generation** - nomic-embed-text for semantic search
- **ChromaDB access** - Vector similarity search
- **WebSocket events** - Real-time status updates

## Hardware Requirements

| Component | Minimum | Your PC |
|-----------|---------|---------|
| GPU VRAM | 8GB | 8GB (RTX 4060 Ti) |
| RAM | 16GB | 32GB |
| Storage | 50GB free | Plenty |

## Endpoints

### Health Check
```http
GET /health
Response: { "status": "ok", "timestamp": 1234567890 }
```

### Generate (14B Model)
```http
POST /generate
Content-Type: application/json

{
  "system": "You are a code reviewer...",
  "prompt": "Review this code: ...",
  "format": "json"  // optional
}

Response: {
  "response": "{ ... }",
  "tokensUsed": 1234,
  "durationMs": 5432
}
```

### Embed (Embeddings)
```http
POST /embed
Content-Type: application/json

{ "text": "function handleAuth() { ... }" }

Response: {
  "embedding": [0.123, -0.456, ...]  // 768 dimensions
}
```

### Search (ChromaDB)
```http
POST /search
Content-Type: application/json

{
  "query": "authentication handling",
  "collection": "codebase",
  "limit": 5
}

Response: {
  "results": [
    { "content": "...", "metadata": { "path": "src/auth.ts" }, "distance": 0.15 },
    ...
  ]
}
```

### Index (Add to ChromaDB)
```http
POST /index
Content-Type: application/json

{
  "files": [
    { "path": "src/auth.ts", "content": "...", "metadata": { "type": "service" } }
  ],
  "collection": "codebase"
}

Response: { "indexed": 5, "total": 5 }
```

## WebSocket Events

Connect to `ws://192.168.1.190:4001` for real-time events:

| Event | Payload | When |
|-------|---------|------|
| `model:start` | `{model, prompt_preview}` | Inference begins |
| `model:complete` | `{model, tokens, duration}` | Inference done |
| `model:error` | `{model, error}` | Inference failed |
| `index:progress` | `{file, indexed, total}` | File indexed |

## Setup

See [Second PC Setup Guide](../guides/setup-second-pc.md) for complete instructions.

Quick summary:
1. Install Ollama for Windows
2. Set `OLLAMA_HOST=0.0.0.0:11434`
3. Pull models: `qwen2.5-coder:14b-q4_K_M`, `nomic-embed-text`
4. Install Node.js, Python, ChromaDB
5. Create server at `C:\quality-server\`
6. Configure Windows Firewall for ports 4000, 4001
7. Start with `npm start` or pm2

## Model Details

### qwen2.5-coder:14b-q4_K_M

- **Parameters**: 14 billion
- **Quantization**: 4-bit (fits in 8GB VRAM)
- **Download size**: ~9GB
- **Best for**: Code review, complex analysis, refactoring suggestions

### nomic-embed-text

- **Output dimensions**: 768
- **Download size**: ~275MB
- **Best for**: Semantic similarity, code search
- **Speed**: ~100ms per embedding

## Security

The server is designed for **local network use only**:

- No authentication (trusted network assumption)
- Binds to `0.0.0.0` (all interfaces)
- Firewall rules limit access to local network

**Do not expose to the internet.**

## Testing

From your Mac:

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

## Troubleshooting

### Connection Refused
- Check Windows Firewall rules
- Verify `OLLAMA_HOST=0.0.0.0:11434` is set
- Ensure server is running: `npm start`

### Slow Responses
- First request loads model into VRAM (takes longer)
- Check GPU usage with `nvidia-smi`
- Close other GPU apps

### Out of Memory
- 14B-q4 needs ~6GB VRAM
- Try `qwen2.5-coder:7b-q8` (~5GB) as fallback
- Monitor with Task Manager
