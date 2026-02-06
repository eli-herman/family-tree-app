---
device: Mac.lan
branch: main
commit: 80847e6
timestamp: "2026-02-06T02:26:05Z"
---

# Session Handoff

## Summary
Last commit: `80847e6` on `main`
> feat: harden Quality Server + MCP with circuit breaker, validation, and new tools

Quality Server (server.ts):
- Request ID middleware + structured JSON logging on all endpoints
- Input validation on all POST endpoints (400 on missing/invalid fields)
- AbortSignal.timeout on all Ollama calls (120s generate, 30s embed)
- Graceful shutdown (SIGINT/SIGTERM) drains HTTP, notifies WS clients
- WebSocket ping/pong keepalive with dead connection cleanup
- Model verification in /health (checks both models are loaded)
- Parallel batch embeddings (4-way concurrency)
- GET /collections and DELETE /collections/:name
- Real /qa/status with uptime, memory, models, collection count
- Per-field size limits (100KB prompt, 200KB file content)
- X-Timeout-Ms header support for client-specified timeouts
- Fix stale remote-32b model name in error broadcasts

MCP Client (remote.ts + router.ts):
- Circuit breaker (CLOSED→OPEN after 3 failures, HALF_OPEN after 60s)
- Single retry with 2s backoff on all remote calls
- Auto-invalidate health cache when circuit opens
- Shorter health TTL (5s) for faster recovery detection
- Routing stats counter (local/remote/embeddings/fallback)

New MCP Tools:
- local_connectivity: tests health→generate→embed pipeline with latency
- local_index: reads local files, batches to remote ChromaDB

Dashboard: rename remote-32b → remote-14b across all components
Metrics: include routing stats and circuit breaker state
Integration test: 12-test suite covering all endpoints

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## Files Changed

- .claude/dashboard/src/components/DataStream.tsx
- .claude/dashboard/src/components/HUDPanel.tsx
- .claude/dashboard/src/hooks/useWebSocket.ts
- .claude/dashboard/src/stores/useStore.ts
- .claude/docs/quality-server/server.ts
- .claude/mcp-local-model/src/index.ts
- .claude/mcp-local-model/src/ollama/remote.ts
- .claude/mcp-local-model/src/router.ts
- .claude/mcp-local-model/src/tools/connectivity.ts
- .claude/mcp-local-model/src/tools/index-files.ts
- .claude/mcp-local-model/src/tools/metrics.ts
- .claude/mcp-local-model/test/integration.sh

## Diff Stats
```
 .claude/dashboard/src/components/DataStream.tsx   |   4 +-
 .claude/dashboard/src/components/HUDPanel.tsx     |   6 +-
 .claude/dashboard/src/hooks/useWebSocket.ts       |   2 +-
 .claude/dashboard/src/stores/useStore.ts          |   4 +-
 .claude/docs/quality-server/server.ts             | 497 ++++++++++++++++++----
 .claude/mcp-local-model/src/index.ts              |   6 +
 .claude/mcp-local-model/src/ollama/remote.ts      | 272 +++++++++---
 .claude/mcp-local-model/src/router.ts             |  44 +-
 .claude/mcp-local-model/src/tools/connectivity.ts | 166 ++++++++
 .claude/mcp-local-model/src/tools/index-files.ts  | 253 +++++++++++
 .claude/mcp-local-model/src/tools/metrics.ts      |   8 +
 .claude/mcp-local-model/test/integration.sh       | 140 ++++++
 12 files changed, 1248 insertions(+), 154 deletions(-)
```

## DEPLOY ON WINDOWS (ACTION REQUIRED)

The Quality Server (`server.ts`) was rewritten on Mac. You MUST deploy it on this Windows PC.

### Step 1: Pull latest
```bash
cd C:\Users\eli\projects\family-tree-app
git pull origin main
```

### Step 2: Copy server.ts to Quality Server location and restart
The source of truth is `.claude/docs/quality-server/server.ts` in the repo.
Copy it to wherever pm2 runs the quality-server process, then restart:
```bash
pm2 restart quality-server
```

If the server location is the repo itself (pm2 points at `.claude/docs/quality-server/server.ts`), then just `pm2 restart quality-server` after the pull.

### Step 3: Run integration tests
```bash
bash .claude/mcp-local-model/test/integration.sh http://localhost:4000
```
All 12 tests should pass. If any fail, check:
- Ollama is running with `qwen2.5-coder:14b` and `nomic-embed-text` pulled
- ChromaDB is running on port 8000

### What changed in server.ts
- All Ollama calls now have `AbortSignal.timeout()` (no more infinite hangs)
- All POST endpoints validate input (returns 400 instead of crashing)
- Every request gets a UUID in logs and responses (structured JSON logging)
- WebSocket ping/pong every 30s (dead clients get cleaned up)
- Graceful shutdown on SIGINT/SIGTERM
- `/health` now verifies both models are actually loaded
- `/embed` runs 4-way parallel (was sequential)
- New: `GET /collections`, `DELETE /collections/:name`
- `/qa/status` returns real stats (was placeholder zeros)
- `X-Timeout-Ms` header support
- Fixed `remote-32b` → `qwen2.5-coder:14b` in error broadcasts

## Blockers
_None._

## Next Steps
After deploying on Windows, resume app development (Firebase auth, connecting screens to real data).
