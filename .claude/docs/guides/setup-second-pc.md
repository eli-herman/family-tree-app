# Second PC Setup Guide

> Complete setup for the Quality Server on Windows 11

## Overview

Your Windows PC will run:
- **Ollama** with qwen2.5-coder:14b (code analysis, ~9GB)
- **Ollama** with nomic-embed-text (embeddings, ~274MB)
- **Quality API Server** (Express + WebSocket)
- In-memory vector store (ChromaDB optional)

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU VRAM | 8GB | 8GB+ (RTX 4060 Ti or better) |
| RAM | 16GB | 32GB |
| Storage | 15GB free on models drive | 50GB+ |
| CPU | 6 cores | 8+ cores |

## Completed Setup (2026-02-05)

| Component | Status | Location |
|-----------|--------|----------|
| Ollama | v0.15.4 | C:\Users\{user}\AppData\Local\Programs\Ollama |
| Models | D:\ollama\models | OLLAMA_MODELS env var |
| Quality Server | Running | C:\quality-server |
| HTTP API | Port 4000 | http://localhost:4000 |
| WebSocket | Port 4001 | ws://localhost:4001 |

---

## Step 1: Install Ollama

**Option A: Using winget (recommended)**
```powershell
winget install Ollama.Ollama
```

**Option B: Manual download**
Download from: https://ollama.ai/download/windows

Verify installation:
```powershell
# May need to open new terminal after install
ollama --version
```

---

## Step 2: Configure Models Storage (Important!)

By default, Ollama stores models in `C:\Users\{user}\.ollama\models`. If C: drive has limited space, configure D: drive:

```powershell
# Set models directory to D: drive
SETX OLLAMA_MODELS "D:/ollama/models"

# Create the directory
mkdir D:\ollama\models
```

**Restart Ollama** (quit from system tray, reopen) for changes to take effect.

---

## Step 3: Download Models

```powershell
# Main coding model (9GB download, fits in 8GB VRAM)
ollama pull qwen2.5-coder:14b

# Embedding model (274MB)
ollama pull nomic-embed-text

# Verify
ollama list
```

Expected output:
```
NAME                       ID              SIZE      MODIFIED
qwen2.5-coder:14b          9ec8897f747e    9.0 GB    ...
nomic-embed-text:latest    0a109f422b47    274 MB    ...
```

---

## Step 4: Install Node.js

**Option A: Using winget**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Option B: Manual download**
Download from: https://nodejs.org/

Verify:
```powershell
node --version   # Should be 18+
npm --version
```

---

## Step 5: Create Quality Server Directory

```powershell
mkdir C:\quality-server
cd C:\quality-server
```

Copy the server files from the repo:
- `.claude/docs/quality-server/server.ts`
- `.claude/docs/quality-server/package.json`
- `.claude/docs/quality-server/tsconfig.json`

Or create manually (see Step 6).

---

## Step 6: Install Dependencies

```powershell
cd C:\quality-server
npm install
```

This installs: express, ws, cors, chokidar, typescript, ts-node

---

## Step 7: Set Up the Server

The server source lives in the repo at `.claude/docs/quality-server/server.ts`.

Copy it to `C:\quality-server\server.ts`, or if you cloned the repo on this PC:

```powershell
copy C:\Users\{user}\projects\family-tree-app\.claude\docs\quality-server\server.ts C:\quality-server\server.ts
```

**Key details about the server:**
- Uses `qwen2.5-coder:14b` via Ollama's HTTP API (fetch-based, no SDK import needed)
- In-memory vector store (no ChromaDB dependency required for MVP)
- HTTP API on port 4000, WebSocket on port 4001
- Endpoints: `/health`, `/status`, `/generate`, `/embed`, `/index`, `/search`, `/qa/status`

---

## Step 8: Create TypeScript Config

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

## Step 9: Create Start Script

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

## Step 10: Configure Windows Firewall

Allow inbound connections on ports 4000 and 4001:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Quality Server HTTP" -Direction Inbound -Port 4000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Quality Server WebSocket" -Direction Inbound -Port 4001 -Protocol TCP -Action Allow
```

---

## Step 11: Start the Server

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

## Step 12: Test from Mac

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

## Step 13: Run as Windows Service (Optional)

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
- The 14B model uses ~9GB VRAM (may offload some layers to CPU with 8GB VRAM)
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
