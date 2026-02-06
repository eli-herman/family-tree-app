# Quality Server — Windows PC Deployment

Run these steps on the Windows PC (192.168.1.190) to deploy the Quality Server with ChromaDB.

## Step 1: Verify Prerequisites

```powershell
node --version        # Need 18+
ollama list           # Check models
python --version      # Need 3.8+ for ChromaDB
```

## Step 2: Pull Ollama Models (if missing)

```powershell
ollama pull qwen2.5-coder:14b
ollama pull nomic-embed-text
```

## Step 3: Install and Start ChromaDB

```powershell
pip install chromadb
mkdir C:\chromadb-data
```

Test it works:
```powershell
chroma run --path C:\chromadb-data --host 0.0.0.0 --port 8000
```

In a new terminal, verify:
```powershell
curl http://localhost:8000/api/v2/heartbeat
# If that fails, try: curl http://localhost:8000/api/v1/heartbeat
```

## Step 4: Clone/Pull the Repo and Install Quality Server

```powershell
# If repo not cloned yet:
cd C:\
git clone <your-repo-url> quality-server-repo

# Copy quality server files:
mkdir C:\quality-server
copy C:\quality-server-repo\.claude\docs\quality-server\* C:\quality-server\

# Or if using Claude Code on Windows, just navigate to the repo:
cd C:\quality-server
npm install
```

## Step 5: Start Quality Server

```powershell
cd C:\quality-server
npm start
```

You should see:
```
ChromaDB API: v2 detected  (or v1)
Quality Server HTTP running on http://0.0.0.0:4000
Quality Server WebSocket running on ws://0.0.0.0:4001
```

## Step 6: Open Firewall (Admin PowerShell)

```powershell
New-NetFirewallRule -DisplayName "Quality Server HTTP" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Quality Server WS" -Direction Inbound -LocalPort 4001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "ChromaDB" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

## Step 7: Test from Mac

From the Mac, run:
```bash
curl http://192.168.1.190:4000/health
curl -X POST http://192.168.1.190:4000/generate -H "Content-Type: application/json" -d '{"system":"test","prompt":"say hello"}'
curl -X POST http://192.168.1.190:4000/embed -H "Content-Type: application/json" -d '{"text":"test embedding"}'
```

## Step 8: Make Services Persistent with pm2

```powershell
npm install -g pm2

# Start ChromaDB via pm2
pm2 start "chroma run --path C:\chromadb-data --host 0.0.0.0 --port 8000" --name chromadb

# Start Quality Server via pm2
cd C:\quality-server
pm2 start "npm start" --name quality-server --cwd C:\quality-server

# Save so they restart on reboot
pm2 save

# Optional: set pm2 to start on Windows login
pm2-startup
```

## Troubleshooting

- **ChromaDB API version**: The server auto-detects v1 vs v2. If detection fails, set `CHROMA_URL` env var.
- **Ollama not running**: Start it with `ollama serve` in a terminal.
- **Port already in use**: `netstat -ano | findstr :4000` to find the process, then `taskkill /PID <pid> /F`.
- **Firewall blocking**: Run Step 6 in an Admin PowerShell.
