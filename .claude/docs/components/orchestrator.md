# Orchestrator (MCP Server)

> The brain of the multi-model system - routes tasks to the right model.

## Overview

The Orchestrator is an MCP (Model Context Protocol) server that runs on your Mac. It receives tool calls from Claude Code and intelligently routes them to the most appropriate model:

- **Local 7B** - Fast, simple tasks (extraction, pattern matching)
- **Remote 14B** - Complex tasks (code review, deep analysis)
- **Embeddings** - Semantic search queries

## Location

```
.claude/mcp-local-model/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── config.ts          # Configuration
│   ├── router.ts          # Task routing logic
│   ├── events.ts          # WebSocket event emitter
│   ├── cache/
│   │   ├── fileCache.ts   # LRU file content cache
│   │   ├── ollamaCache.ts # Response cache with TTL
│   │   └── index.ts       # Singleton exports
│   ├── ollama/
│   │   ├── client.ts      # Local Ollama client
│   │   ├── remote.ts      # Remote Quality Server client
│   │   └── prompts.ts     # System prompts for each task
│   ├── tools/
│   │   ├── extract.ts     # Data extraction tool
│   │   ├── analyze.ts     # Code structure analysis
│   │   ├── verify.ts      # Condition verification
│   │   ├── generate.ts    # Template generation
│   │   ├── git.ts         # Git output parsing
│   │   ├── search.ts      # Semantic search
│   │   ├── review.ts      # Pre/post implementation review
│   │   └── metrics.ts     # Token savings metrics
│   └── utils/
│       ├── helpers.ts     # JSON validation, retry logic
│       └── metrics.ts     # Metric logging
├── dist/                  # Compiled JavaScript
└── package.json
```

## Available Tools

| Tool | Purpose | Default Model |
|------|---------|---------------|
| `local_extract` | Extract data from files (frontmatter, patterns, imports, exports, structure) | Local 7B |
| `local_analyze` | Analyze code structure (dependencies, functions, types) | Local 7B |
| `local_verify` | Check if code satisfies conditions | Local 7B |
| `local_generate` | Fill templates with provided values | Local 7B |
| `local_git` | Parse git command output | Local 7B |
| `local_search` | Semantic similarity search | Embeddings |
| `local_review_approach` | Review proposed implementation before coding | Remote 14B |
| `local_review_code` | Review implemented code after coding | Remote 14B |
| `local_metrics` | Get token savings statistics | None (local computation) |

## Configuration

Edit `.claude/mcp-local-model/src/config.ts`:

```typescript
export const config = {
  // Local Ollama settings
  ollama: {
    host: "http://localhost:11434",
    model: "qwen2.5-coder:7b",
    timeoutMs: 30000,
    maxRetries: 2,
  },

  // Remote Quality Server settings
  remote: {
    host: "http://192.168.1.190:4000",
    model: "qwen2.5-coder:14b-q4_K_M",
    timeoutMs: 60000,
    wsPort: 4001,
  },

  // Routing thresholds
  routing: {
    complexityThreshold: 0.7,  // Route to remote if complexity > 0.7
    enableFallback: true,       // Fall back to local if remote fails
    preferQuality: false,       // Bias toward remote
    preferSpeed: false,         // Bias toward local
  },

  // Dashboard WebSocket
  dashboard: {
    enabled: true,
    wsPort: 3334,
  },

  // Caching
  cache: {
    enabled: true,
    fileMaxSize: 100,           // Max cached files
    fileTtlMs: 60000,           // 1 minute TTL
    ollamaMaxSize: 500,         // Max cached responses
    ollamaTtlMs: 300000,        // 5 minute TTL
  },
};
```

## Routing Logic

Tasks are routed based on:

1. **Task type** - Some tasks always go to specific models
2. **Complexity score** - Based on file count, content size, task modifiers
3. **Fallback** - If remote fails, fall back to local

### Always Remote (14B)
- `review_code`, `review_approach`
- `complex_analysis`, `refactor_suggest`

### Always Local (7B)
- `frontmatter`, `pattern_match`
- `git_parse`, `extract_simple`

### Always Embeddings
- `semantic_search`, `find_similar`

### Complexity-Based
Everything else uses the complexity formula:

```typescript
complexity = 0
  + (files > 3 ? 0.2 : 0)
  + (files > 10 ? 0.3 : 0)
  + (contentSize > 5KB ? 0.2 : 0)
  + (contentSize > 20KB ? 0.3 : 0)
  + (type includes 'analyze' ? 0.2 : 0)
  + (type includes 'refactor' ? 0.3 : 0)
  + (type includes 'review' ? 0.4 : 0)
  + (preferQuality ? 0.3 : 0)
  - (preferSpeed ? 0.3 : 0)
```

If `complexity > complexityThreshold`, route to remote.

## Events

The orchestrator emits WebSocket events for the dashboard:

| Event | Payload | When |
|-------|---------|------|
| `model:start` | `{model, task}` | Model begins inference |
| `model:complete` | `{model, tokens, duration}` | Model finishes |
| `model:error` | `{model, error}` | Model fails |
| `route:decision` | `{target, reason}` | Task routed |
| `cache:hit` | `{type, key}` | Cache hit (file or response) |

## Building

```bash
cd .claude/mcp-local-model
npm install
npm run build
```

## Using with Claude Code

Add to `claude_desktop_config.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "local-model": {
      "command": "node",
      "args": ["/path/to/.claude/mcp-local-model/dist/index.js"]
    }
  }
}
```

## Metrics

View token savings:

```typescript
// Call local_metrics tool
{
  "totalTasks": 142,
  "totalLocalTokens": 45000,
  "totalEstimatedClaudeTokens": 180000,
  "tokenSavings": 135000,
  "savingsPercent": 75,
  "byTool": {
    "local_extract": { "count": 80, "localTokens": 20000, "estimatedSavings": 60000 },
    "local_analyze": { "count": 42, "localTokens": 15000, "estimatedSavings": 45000 },
    ...
  }
}
```
