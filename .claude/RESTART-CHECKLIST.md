# Restart Checklist — After Reopening Claude Code on Mac

You just deployed a major hardening update to the Quality Server + MCP system.
This document tells you (and Claude) exactly where we left off and what to verify.

## What Was Done (commit ab5322b)

Rewrote the entire Quality Server and MCP client layer:

- **server.ts**: Request IDs, structured logging, input validation, Ollama timeouts,
  graceful shutdown, WS ping/pong, model verification, parallel embeddings,
  collection management endpoints, real /qa/status, size limits, X-Timeout-Ms
- **remote.ts**: Circuit breaker (3 failures → OPEN, 60s → HALF_OPEN), retry with 2s backoff
- **router.ts**: 5s health TTL (was 30s), routing stats counter
- **metrics.ts**: Now includes routing stats + circuit breaker state
- **New tool: local_connectivity** — tests health→generate→embed pipeline
- **New tool: local_index** — reads local files, sends to remote ChromaDB
- **Dashboard**: All `remote-32b` → `remote-14b`
- **Integration test**: `.claude/mcp-local-model/test/integration.sh`

MCP was rebuilt (`npm run build` passed). You restarted Claude Code to load the new tools.

---

## Step 1: Verify MCP loaded the new tools

Run this to confirm the 2 new tools are registered:

```
Use local_connectivity tool with full: false
```

Expected: Returns health status of the Windows server with circuit breaker state.
If it says "Unknown tool", the MCP didn't reload — check `npm run build` in `.claude/mcp-local-model/`.

## Step 2: Full pipeline test

```
Use local_connectivity tool with full: true
```

Expected: All 3 steps pass (health, generate, embed) with latency numbers.
If health fails, the Windows PC may be off or the server isn't deployed yet.

## Step 3: Test indexing

```
Use local_index tool with paths: ["src/**/*.ts", "src/**/*.tsx"] and collection: "codebase"
```

Expected: Files get indexed into ChromaDB on Windows. Should report indexed count.

## Step 4: Test semantic search

```
Use local_search tool with query: "family tree node component"
```

Expected: Returns semantic results from ChromaDB (not grep fallback).
Look for `mode: "semantic"` in the response.

## Step 5: Test circuit breaker (optional)

Kill Ollama on Windows, then:
```
Use local_review_code tool on any file
```
Expected: Should fail fast (not 60s timeout). Circuit breaker should open.
Then restart Ollama — within 60s the circuit should recover to HALF_OPEN.

## Step 6: Check metrics

```
Use local_metrics tool
```

Expected: Shows routing stats (local/remote/embeddings counts) and circuit breaker state.

---

## If Something Is Wrong

| Symptom | Fix |
|---------|-----|
| "Unknown tool: local_connectivity" | MCP didn't reload. Run `cd .claude/mcp-local-model && npm run build`, then restart Claude Code |
| Health returns fail | Windows PC off, or server not deployed. On Windows: `git pull && pm2 restart quality-server` |
| Circuit breaker stuck OPEN | Wait 60s or restart Claude Code (resets in-memory state) |
| Semantic search returns grep fallback | Remote unavailable. Check Windows server health: `curl http://192.168.1.190:4000/health` |
| Integration tests fail | Run on Windows: `bash .claude/mcp-local-model/test/integration.sh http://localhost:4000` |

---

## What's Next After Verification

All infrastructure work is done. Resume app development:
- Firebase project setup and configuration
- Authentication flow
- Connect screens to real Firebase data
- See `.claude/PRD.md` and `CLAUDE.md` for the full roadmap
