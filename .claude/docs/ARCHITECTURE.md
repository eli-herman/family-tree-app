# System Architecture

> Complete technical overview of the multi-model AI orchestration system.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                YOUR MAC (Dev Machine)                             │
│                                                                                   │
│  ┌─────────────────┐         ┌─────────────────────────────────────────────────┐ │
│  │   Claude Code   │◄───────►│              ORCHESTRATOR MCP SERVER            │ │
│  │   (Anthropic)   │         │                                                 │ │
│  │                 │         │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │ │
│  │  - Architecture │         │  │   Router    │  │   Cache     │  │  Event  │ │ │
│  │  - Design       │         │  │             │  │   Layer     │  │ Emitter │ │ │
│  │  - Complex code │         │  │ Decides:    │  │             │  │         │ │ │
│  └─────────────────┘         │  │ local/remote│  │ file+resp   │  │ →WebSocket│ │
│                              │  └──────┬──────┘  └─────────────┘  └────┬────┘ │ │
│                              └─────────┼───────────────────────────────┼──────┘ │
│                                        │                               │        │
│                                        ▼                               ▼        │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────────┐│
│  │ Local Ollama    │◄────────│  Tool Handlers  │         │   JARVIS Dashboard  ││
│  │ (qwen2.5:7b)    │         │                 │         │   localhost:3333    ││
│  │                 │         │ - extract       │         │                     ││
│  │ Fast tasks:     │         │ - analyze       │         │ - 3D node graph     ││
│  │ - extraction    │         │ - verify        │         │ - Live data flow    ││
│  │ - simple verify │         │ - review        │         │ - Metrics panels    ││
│  │ - pattern match │         │ - search        │         │ - Event log         ││
│  └─────────────────┘         └────────┬────────┘         └─────────────────────┘│
│                                       │                                          │
└───────────────────────────────────────┼──────────────────────────────────────────┘
                                        │
                                        │ HTTP + WebSocket
                                        │ 192.168.1.190:4000
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          QUALITY SERVER (Windows 11 PC)                          │
│                          RTX 4060 Ti 8GB | Ryzen 7 5900X | 32GB RAM              │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         QUALITY API SERVER (Express)                        │ │
│  │                              Port 4000                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  /generate   │  │   /embed     │  │   /search    │  │    /qa       │    │ │
│  │  │              │  │              │  │              │  │              │    │ │
│  │  │  14B model   │  │  Embeddings  │  │  Semantic    │  │  Test/Lint   │    │ │
│  │  │  requests    │  │  generation  │  │  queries     │  │  results     │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘ │
│            │                 │                 │                 │              │
│            ▼                 ▼                 ▼                 ▼              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │  Ollama         │  │  Ollama         │  │   ChromaDB      │  │  Watcher   │ │
│  │  qwen2.5:32b    │  │  nomic-embed    │  │                 │  │  Service   │ │
│  │                 │  │                 │  │  Collections:   │  │            │ │
│  │  Complex:       │  │  768-dim        │  │  - codebase     │  │  Monitors: │ │
│  │  - code review  │  │  vectors        │  │  - docs         │  │  - .ts/.js │ │
│  │  - analysis     │  │                 │  │                 │  │  - tests   │ │
│  │  - refactoring  │  │                 │  │                 │  │            │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Task Routing Flow

When Claude Code calls an MCP tool:

```
Claude Code                    Orchestrator                     Models
    │                              │                               │
    │  local_analyze(complex)      │                               │
    │─────────────────────────────►│                               │
    │                              │                               │
    │                              │  1. Check cache               │
    │                              │  2. Assess complexity         │
    │                              │  3. Route decision            │
    │                              │                               │
    │                              │  complexity > threshold       │
    │                              │──────────────────────────────►│ Remote 14B
    │                              │                               │
    │                              │◄──────────────────────────────│
    │                              │  response                     │
    │                              │                               │
    │                              │  4. Cache response            │
    │                              │  5. Emit event (WebSocket)    │
    │                              │                               │
    │◄─────────────────────────────│                               │
    │  result                      │                               │
```

### 2. Semantic Search Flow

```
Claude: "Find code that handles user authentication"
    │
    ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Orchestrator  │─────►│  Quality Server │─────►│    ChromaDB     │
│                 │      │  /embed         │      │                 │
│  semantic_search│      │                 │      │  Vector search  │
└─────────────────┘      │  Query →        │      │  cosine sim     │
                         │  768-dim vector │      │                 │
                         └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Top 5 matches:  │
                                                  │                 │
                                                  │ src/auth/       │
                                                  │  login.ts (0.92)│
                                                  │  session.ts(0.87│
                                                  │  jwt.ts (0.84)  │
                                                  └─────────────────┘
```

### 3. Continuous QA Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  File Watcher   │─────►│   Test Runner   │─────►│  Results Store  │
│  (chokidar)     │      │                 │      │                 │
│                 │      │  On change:     │      │  .qa/latest/    │
│  Monitors:      │      │  1. tsc         │      │   status.json   │
│  - src/**/*.ts  │      │  2. eslint      │      │   errors.json   │
│  - app/**/*.tsx │      │  3. vitest      │      │   coverage.json │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Orchestrator   │
                                                  │  can query via  │
                                                  │  local_qa_status│
                                                  └─────────────────┘
```

---

## Component Details

### Orchestrator (Mac)

The brain that routes tasks. Lives in `.claude/mcp-local-model/`.

**Responsibilities:**
- Receive MCP tool calls from Claude
- Assess task complexity
- Route to appropriate model (local 7B, remote 14B, or return to Claude)
- Manage caches (file content, model responses)
- Emit events for visualization

**Key files:**
```
src/
├── index.ts           # MCP server entry
├── config.ts          # All configuration
├── router.ts          # Task routing logic      ← NEW
├── events.ts          # WebSocket event emitter ← NEW
├── cache/
│   ├── fileCache.ts   # File content cache
│   └── ollamaCache.ts # Response cache
├── ollama/
│   ├── client.ts      # Local Ollama client
│   ├── remote.ts      # Remote server client   ← NEW
│   └── prompts.ts     # System prompts
└── tools/
    ├── extract.ts
    ├── analyze.ts
    ├── verify.ts
    ├── review.ts      # Pre/post review        ← NEW
    └── search.ts      # Semantic search        ← NEW
```

### Quality Server (Windows PC)

Express server exposing AI capabilities over the network.

**Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server status |
| `/generate` | POST | 14B model inference |
| `/embed` | POST | Generate embeddings |
| `/search` | POST | Semantic search in ChromaDB |
| `/index` | POST | Add files to vector DB |
| `/qa/status` | GET | Latest QA results |
| `/qa/run` | POST | Trigger QA checks |

**WebSocket events:**
| Event | Payload | Purpose |
|-------|---------|---------|
| `model:start` | `{model, prompt_preview}` | Inference started |
| `model:complete` | `{model, tokens, duration}` | Inference done |
| `qa:update` | `{type, status, errors}` | QA check completed |
| `index:progress` | `{files_done, total}` | Indexing progress |

### ChromaDB Collections

**`codebase`** - Your project's source code
- Chunked by function/class
- Metadata: file path, line numbers, type
- Re-indexed on file change

**`docs`** - Stack documentation
- React Native, Expo, Firebase docs
- Chunked by section
- Static (re-index manually)

### JARVIS Dashboard

React + Three.js visualization at `localhost:3333`.

**Visual elements:**
- 3D node graph (Claude, Orchestrator, Local 7B, Remote 14B, ChromaDB)
- Animated particle streams showing data flow
- Holographic panels with metrics
- Real-time event log
- Glowing connections that pulse on activity

**Tech stack:**
- React 18
- Three.js + React Three Fiber
- Custom GLSL shaders for holographic effect
- Framer Motion for UI animations
- WebSocket for real-time updates

---

## Routing Logic

```typescript
interface RoutingDecision {
  target: 'local' | 'remote' | 'embeddings' | 'skip';
  reason: string;
  fallback?: 'local' | 'remote';
}

function routeTask(task: Task): RoutingDecision {
  // 1. Always-remote tasks (need 14B quality)
  if (['review_code', 'review_approach', 'complex_analysis'].includes(task.type)) {
    return { target: 'remote', reason: 'Task requires deep reasoning' };
  }

  // 2. Embedding tasks
  if (task.type === 'semantic_search') {
    return { target: 'embeddings', reason: 'Vector similarity search' };
  }

  // 3. Always-local tasks (speed matters, simple)
  if (['extract_simple', 'pattern_match', 'git_parse'].includes(task.type)) {
    return { target: 'local', reason: 'Simple task, optimize for speed' };
  }

  // 4. Complexity-based routing
  const complexity = assessComplexity(task);
  if (complexity > config.routing.complexityThreshold) {
    return {
      target: 'remote',
      reason: `Complexity ${complexity} exceeds threshold`,
      fallback: 'local'
    };
  }

  // 5. Default to local with remote fallback
  return {
    target: 'local',
    reason: 'Default routing',
    fallback: 'remote'
  };
}

function assessComplexity(task: Task): number {
  let score = 0;

  // File count
  if (task.files?.length > 3) score += 0.2;
  if (task.files?.length > 10) score += 0.3;

  // Content size
  const totalSize = task.files?.reduce((sum, f) => sum + f.length, 0) || 0;
  if (totalSize > 5000) score += 0.2;
  if (totalSize > 20000) score += 0.3;

  // Task type modifiers
  if (task.type.includes('analyze')) score += 0.2;
  if (task.type.includes('refactor')) score += 0.3;

  return Math.min(score, 1.0);
}
```

---

## Caching Strategy

### Layer 1: File Cache
- **Location:** Orchestrator (Mac)
- **Key:** File path
- **Invalidation:** mtime change
- **TTL:** 60 seconds
- **Max entries:** 100

### Layer 2: Response Cache
- **Location:** Orchestrator (Mac)
- **Key:** SHA256(system_prompt + user_prompt)
- **Invalidation:** TTL only
- **TTL:** 5 minutes
- **Max entries:** 500

### Layer 3: Embedding Cache
- **Location:** ChromaDB (Windows PC)
- **Key:** File path + content hash
- **Invalidation:** Content change
- **TTL:** None (persistent)

```
Request Flow:

  ┌──────────┐    miss    ┌──────────┐    miss    ┌──────────┐
  │  File    │───────────►│ Response │───────────►│  Model   │
  │  Cache   │            │  Cache   │            │          │
  └────┬─────┘            └────┬─────┘            └────┬─────┘
       │ hit                   │ hit                   │
       ▼                       ▼                       ▼
   Return                  Return                  Generate
   cached                  cached                  new
   content                 response               response
```

---

## Security Considerations

1. **Network exposure:** Quality Server only accessible on local network
2. **No authentication:** Trusted home network assumption
3. **File access:** Quality Server has read-only access to project via network share or sync
4. **No secrets in prompts:** Orchestrator filters sensitive patterns

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Local 7B response | < 2s | ~1.5s |
| Remote 14B response | < 8s | TBD |
| Semantic search | < 500ms | TBD |
| Cache hit rate | > 60% | ~62% |
| Dashboard FPS | 60 | TBD |

---

## Next Steps

See [Setup Guide](guides/setup-second-pc.md) to configure the Windows PC.
