# Embeddings (nomic-embed-text)

> Vector representations for semantic code search.

## Overview

Embeddings convert text into 768-dimensional vectors that capture semantic meaning. Similar code has similar vectors, enabling:

- **Semantic search** - "Find code that handles user authentication"
- **Similar file discovery** - "Show files similar to this one"
- **Concept matching** - Find code by intent, not keywords

## How It Works

```
"function login(user, password) { ... }"
              │
              ▼
     ┌─────────────────┐
     │ nomic-embed-text│
     │                 │
     │ Transformer     │
     │ 137M params     │
     └────────┬────────┘
              │
              ▼
[0.023, -0.156, 0.089, ..., 0.042]  (768 numbers)
```

## Model: nomic-embed-text

| Property | Value |
|----------|-------|
| Parameters | 137M |
| Dimensions | 768 |
| Max tokens | 8192 |
| Download size | ~275MB |
| Inference time | ~100ms |

### Why This Model?

- **Open source** - No API costs
- **Small** - Runs fast on CPU or GPU
- **High quality** - Comparable to OpenAI's ada-002
- **Long context** - 8192 tokens covers most files

## Usage

### Generate Embedding

```bash
curl -X POST http://192.168.1.190:4000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "function handleAuth() { ... }"}'
```

Response:
```json
{
  "embedding": [0.023, -0.156, 0.089, ..., 0.042]
}
```

### Search Similar Code

```bash
curl -X POST http://192.168.1.190:4000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication handling", "limit": 5}'
```

Response:
```json
{
  "results": [
    {
      "content": "export async function login(email, password) { ... }",
      "metadata": { "path": "src/auth/login.ts", "line": 15 },
      "distance": 0.15
    },
    {
      "content": "export function validateSession(token) { ... }",
      "metadata": { "path": "src/auth/session.ts", "line": 42 },
      "distance": 0.23
    }
  ]
}
```

## Similarity Metrics

ChromaDB uses **cosine distance** by default:

- **0.0** - Identical (same vector)
- **0.0-0.3** - Very similar (same concept)
- **0.3-0.6** - Somewhat related
- **0.6+** - Different concepts

## Chunking Strategy

Large files are split into semantic chunks:

```
┌─────────────────────────────────┐
│ src/auth.ts (500 lines)         │
├─────────────────────────────────┤
│ Chunk 1: imports (lines 1-20)   │ → embedding_1
│ Chunk 2: login fn (lines 22-80) │ → embedding_2
│ Chunk 3: logout fn (lines 82-120│ → embedding_3
│ ...                             │
└─────────────────────────────────┘
```

### Chunking Rules

1. **By function/class** - Natural boundaries
2. **Max 500 lines** - Keep chunks focused
3. **Overlap 50 lines** - Catch context at boundaries
4. **Include metadata** - File path, line numbers, type

## Indexing Code

### Index a Directory

```bash
# Index all TypeScript files
find src -name "*.ts" -exec curl -X POST http://192.168.1.190:4000/index \
  -H "Content-Type: application/json" \
  -d "{\"files\": [{\"path\": \"{}\", \"content\": \"$(cat {})\"}]}" \;
```

### Orchestrator Tool

```typescript
// Call local_search MCP tool
{
  "query": "database connection handling",
  "collection": "codebase",
  "limit": 10
}
```

## Best Practices

### Query Formatting

| Bad Query | Good Query |
|-----------|------------|
| "auth" | "user authentication and login handling" |
| "db" | "database connection and query execution" |
| "bug" | "error handling for network failures" |

More descriptive queries get better semantic matches.

### What to Index

**Index:**
- Source code (`.ts`, `.tsx`, `.js`)
- Documentation (`.md`)
- Configuration with comments

**Don't index:**
- Binary files
- `node_modules`
- Generated code
- Minified files

### Re-indexing

Re-index when:
- Code changes significantly
- Adding new features
- Changing file structure

The Quality Server tracks file hashes to avoid re-indexing unchanged files.

## Troubleshooting

### Poor Search Results

1. Check query is descriptive enough
2. Verify file was indexed: check ChromaDB collection
3. Try different phrasing

### Slow Indexing

- Indexing is CPU/GPU bound
- Index in batches of 10-50 files
- Run during idle time

### Out of Memory

- nomic-embed-text is small (~500MB in memory)
- Usually not an issue
- If so, restart Ollama: `ollama stop nomic-embed-text`
