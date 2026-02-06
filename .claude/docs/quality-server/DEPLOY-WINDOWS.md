# Quality Server — Windows PC Deployment

Run these steps on the Windows PC (192.168.1.190) to deploy the Quality Server with ChromaDB.

## Current Deployment Status

| Component | Status | Location |
|-----------|--------|----------|
| Quality Server | ✅ Running | `C:\quality-server` |
| ChromaDB | ✅ Running | `D:\chromadb-data` |
| Ollama | ✅ Running | Default location |
| pm2 | ✅ Managing services | `C:\Users\elijh\.pm2` |
| Firewall | ✅ Ports 4000, 4001, 8000 open | Windows Firewall |

**Services are managed by pm2 and will auto-restart on failure.**

---

## Step 1: Verify Prerequisites

```powershell
node --version        # Need 18+ (current: v24.13.0)
ollama list           # Check models
py --list             # Check Python versions
```

**Required Python version:** Python 3.12 (ChromaDB is NOT compatible with Python 3.14)

If Python 3.12 is missing:
```powershell
winget install Python.Python.3.12
```

## Step 2: Pull Ollama Models (if missing)

```powershell
ollama pull qwen2.5-coder:14b    # ~9GB, used for generation
ollama pull nomic-embed-text     # ~274MB, used for embeddings
```

Verify models are available:
```powershell
ollama list
# Should show:
# qwen2.5-coder:14b    9.0 GB
# nomic-embed-text     274 MB
```

## Step 3: Install and Start ChromaDB

**Important:** Use Python 3.12, not Python 3.14 (incompatible with pydantic v1)

```powershell
# Install chromadb with Python 3.12
py -3.12 -m pip install chromadb

# Create data directory on D: drive (more space)
mkdir D:\chromadb-data
```

Test it works:
```powershell
# Use full path to Python 3.12's chroma
C:\Users\elijh\AppData\Local\Programs\Python\Python312\Scripts\chroma.exe run --path D:\chromadb-data --host 0.0.0.0 --port 8000
```

In a new terminal, verify:
```powershell
curl http://localhost:8000/api/v2/heartbeat
# Should return: {"nanosecond heartbeat":...}
```

## Step 4: Clone/Pull the Repo and Install Quality Server

```powershell
# Clone the family-tree-app repo (if not already done)
cd C:\Users\elijh\projects
git clone https://github.com/eli-herman/family-tree-app.git

# Create quality-server directory and copy files
mkdir C:\quality-server
copy C:\Users\elijh\projects\family-tree-app\.claude\docs\quality-server\* C:\quality-server\

# Install dependencies
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
ChromaDB API: v2 detected
Quality Server WebSocket running on ws://0.0.0.0:4001
Quality Server HTTP running on http://0.0.0.0:4000
```

## Step 6: Open Firewall (Admin PowerShell)

Run PowerShell as Administrator and execute:

```powershell
New-NetFirewallRule -DisplayName "Quality Server HTTP" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Quality Server WS" -Direction Inbound -LocalPort 4001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "ChromaDB" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

Verify rules were created:
```powershell
Get-NetFirewallRule -DisplayName "Quality*" | Select-Object DisplayName, Enabled
Get-NetFirewallRule -DisplayName "ChromaDB" | Select-Object DisplayName, Enabled
```

## Step 7: Test from Mac

From the Mac, run:
```bash
# Health check
curl http://192.168.1.190:4000/health
# Expected: {"status":"ok","timestamp":...,"services":{"ollama":true,"chromadb":true}}

# Test generation
curl -X POST http://192.168.1.190:4000/generate \
  -H "Content-Type: application/json" \
  -d '{"system":"test","prompt":"say hello in one word"}'

# Test embedding
curl -X POST http://192.168.1.190:4000/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"test embedding"}'
```

## Step 8: Make Services Persistent with pm2

```powershell
# Install pm2 globally
npm install -g pm2

# Copy the ecosystem config to the quality-server directory
copy C:\Users\elijh\projects\family-tree-app\.claude\docs\quality-server\ecosystem.config.js C:\quality-server\

# Start services using ecosystem config
cd C:\quality-server
pm2 start ecosystem.config.js

# Verify both services are running
pm2 status
# Should show:
# │ chromadb        │ online │
# │ quality-server  │ online │

# Save the process list so pm2 restores on reboot
pm2 save
```

### pm2 Quick Reference

```powershell
pm2 status                    # View all services
pm2 logs                      # View all logs
pm2 logs chromadb             # View ChromaDB logs
pm2 logs quality-server       # View Quality Server logs
pm2 restart all               # Restart all services
pm2 restart chromadb          # Restart ChromaDB only
pm2 stop all                  # Stop all services
pm2 start ecosystem.config.js # Start from config file
```

---

## Troubleshooting

### ChromaDB won't start with Python 3.14
ChromaDB uses pydantic v1 which is incompatible with Python 3.14. Use Python 3.12:
```powershell
py -3.12 -m pip install chromadb
# Use the Python 3.12 chroma executable
C:\Users\elijh\AppData\Local\Programs\Python\Python312\Scripts\chroma.exe run ...
```

### Port already in use
```powershell
# Find process using the port
netstat -ano | findstr :4000

# Kill the process (replace PID with actual number)
powershell -Command "Stop-Process -Id <PID> -Force"
```

### pm2 can't run npm scripts on Windows
Use the ecosystem.config.js which runs ts-node directly:
```javascript
{
  name: 'quality-server',
  script: 'node_modules/ts-node/dist/bin.js',
  args: 'server.ts',
  cwd: 'C:\\quality-server',
  // ...
}
```

### Ollama not running
```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Firewall blocking connections
Verify firewall rules exist:
```powershell
Get-NetFirewallRule -DisplayName "Quality*"
Get-NetFirewallRule -DisplayName "ChromaDB"
```

If missing, re-run Step 6 in an Admin PowerShell.

### ChromaDB API version mismatch
The server auto-detects v1 vs v2. Check logs:
```powershell
pm2 logs quality-server --lines 20
# Should show: "ChromaDB API: v2 detected"
```

---

## File Locations Summary

| Item | Path |
|------|------|
| Quality Server code | `C:\quality-server\` |
| Quality Server source | `C:\Users\elijh\projects\family-tree-app\.claude\docs\quality-server\` |
| ChromaDB data | `D:\chromadb-data\` |
| ChromaDB executable | `C:\Users\elijh\AppData\Local\Programs\Python\Python312\Scripts\chroma.exe` |
| pm2 config | `C:\quality-server\ecosystem.config.js` |
| pm2 logs | `C:\Users\elijh\.pm2\logs\` |
| pm2 dump (saved processes) | `C:\Users\elijh\.pm2\dump.pm2` |

---

## Network Configuration

| Service | Port | Bind Address | Protocol |
|---------|------|--------------|----------|
| Quality Server HTTP | 4000 | 0.0.0.0 | TCP |
| Quality Server WebSocket | 4001 | 0.0.0.0 | TCP |
| ChromaDB | 8000 | 0.0.0.0 | TCP |
| Ollama | 11434 | localhost | TCP |

**Windows PC IP:** 192.168.1.190

---

## Deployed: 2026-02-05

Last successful deployment completed with:
- Node.js v24.13.0
- Python 3.12.10
- ChromaDB 1.4.1
- Ollama models: qwen2.5-coder:14b, nomic-embed-text
- pm2 managing both services
