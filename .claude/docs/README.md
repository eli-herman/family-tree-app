# AI Development Infrastructure

> A multi-model AI orchestration system that coordinates Claude, local models, and a dedicated quality server to maximize development speed and code quality.

## What This Is

This system creates a network of AI models working together, each handling what it does best:

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR MAC                                 │
│   Claude Code ◄──► Orchestrator ◄──► Local Ollama (7B)         │
│                         │                                       │
│                    Dashboard ◄─── Real-time visualization       │
└─────────────────────────────────────────────────────────────────┘
                          │
                     Network Link
                          │
┌─────────────────────────────────────────────────────────────────┐
│                   QUALITY SERVER (Windows PC)                   │
│   Ollama 14B │ Embeddings │ ChromaDB │ File Watcher │ Tests    │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Exists

**Problem:** Using Claude for everything is expensive and sometimes overkill. Simple tasks don't need a frontier model.

**Solution:** Route tasks to the right model:
- **Simple extraction** → Local 7B (free, fast)
- **Complex analysis** → Remote 14B (free, thorough)
- **Semantic search** → Embeddings (find by meaning, not keywords)
- **Creative/architecture** → Claude (best reasoning)

**Bonus features:**
- Real-time visualization of all AI activity
- Pre/post implementation code review
- Semantic code search with embeddings
- Response and file caching for efficiency

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| [Orchestrator](components/orchestrator.md) | Mac | Routes tasks to appropriate model |
| [Local Model](components/local-model.md) | Mac | Fast 7B for simple tasks |
| [Remote Server](components/remote-server.md) | Windows PC | 14B model, embeddings, search |
| [Embeddings](components/embeddings.md) | Windows PC | Semantic code search |
| [ChromaDB](components/chromadb.md) | Windows PC | Vector storage |
| [Dashboard](components/dashboard.md) | Mac | Monochrome visualization |
| [Caching](components/caching.md) | Mac | File and response caching |
| [Review Tools](components/review-tools.md) | Mac | Pre/post implementation review |

## Quick Start

### 1. Your Mac (already done)
The MCP local model server is already running.

### 2. Windows PC Setup
See [Second PC Setup Guide](guides/setup-second-pc.md)

### 3. Start the Dashboard
```bash
cd .claude/dashboard
npm run dev
# Open http://localhost:5173
```

## Configuration

All configuration in `.claude/mcp-local-model/src/config.ts`:

```typescript
{
  // Local model (Mac)
  ollama: {
    host: "http://localhost:11434",
    model: "qwen2.5-coder:7b",
  },

  // Remote model (Windows PC)
  remote: {
    host: "http://192.168.1.190:4000",
    model: "qwen2.5-coder:14b-q4_K_M",
  },

  // Task routing thresholds
  routing: {
    complexityThreshold: 0.7,  // Above this → remote
    enableFallback: true,
  },

  // Caching
  cache: {
    enabled: true,
    fileTtlMs: 60000,      // 1 minute
    ollamaTtlMs: 300000,   // 5 minutes
  },
}
```

## Available MCP Tools

| Tool | Purpose | Model |
|------|---------|-------|
| `local_extract` | Extract data from files | Local 7B |
| `local_analyze` | Analyze code structure | Local 7B |
| `local_verify` | Check conditions | Local 7B |
| `local_generate` | Fill templates | Local 7B |
| `local_git` | Parse git output | Local 7B |
| `local_search` | Semantic search | Embeddings |
| `local_review_approach` | Pre-implementation review | Remote 14B |
| `local_review_code` | Post-implementation review | Remote 14B |
| `local_metrics` | Token savings stats | Local |

## Learn More

- [Architecture Overview](ARCHITECTURE.md) - How all the pieces connect
- [Concepts](concepts/) - Theory behind embeddings and routing
  - [Embeddings 101](concepts/embeddings-101.md)
  - [LLM Routing](concepts/llm-routing.md)
- [Guides](guides/) - Step-by-step tutorials
  - [Second PC Setup](guides/setup-second-pc.md)

## Metrics

The system tracks:
- Token usage per model
- Response times
- Cache hit rates
- Estimated Claude token savings

View in the dashboard or query via `local_metrics` MCP tool.
