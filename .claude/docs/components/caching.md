# Caching System

> Two-layer caching to reduce redundant work and API calls.

## Overview

The caching system has two layers:

```
Request
   │
   ▼
┌──────────────┐  miss   ┌──────────────┐  miss   ┌──────────────┐
│  File Cache  │────────►│ Response     │────────►│    Model     │
│  (mtime)     │         │ Cache (TTL)  │         │  Inference   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │ hit                    │ hit                    │
       ▼                        ▼                        ▼
   Return                   Return                   Generate
   cached                   cached                   new
   content                  response                 response
```

## Layer 1: File Cache

Caches file contents in memory with mtime-based invalidation.

### Location
`.claude/mcp-local-model/src/cache/fileCache.ts`

### How It Works

```typescript
interface CacheEntry {
  content: string;
  mtime: number;      // File modification time
  cachedAt: number;   // When we cached it
}
```

1. **Request file** → Check cache
2. **Cache hit** → Check if mtime changed
3. **mtime unchanged** → Return cached content
4. **mtime changed** → Re-read file, update cache
5. **Cache miss** → Read file, add to cache

### Configuration

```typescript
cache: {
  fileMaxSize: 100,    // Max files to cache
  fileTtlMs: 60000,    // 1 minute TTL (safety net)
}
```

### API

```typescript
import { fileCache } from "./cache/index.js";

// Get file (auto-caches)
const content = await fileCache.get("/path/to/file.ts");

// Invalidate specific file
fileCache.invalidate("/path/to/file.ts");

// Clear entire cache
fileCache.clear();

// Get stats
const stats = fileCache.stats();
// { size: 42, hits: 156, misses: 23 }
```

### LRU Eviction

When cache is full, least recently used entries are evicted:

```
[file1] [file2] [file3] ... [file100]
   ▲                            │
   │                            │
oldest (evict first)       most recent
```

## Layer 2: Response Cache

Caches Ollama model responses with TTL-based expiration.

### Location
`.claude/mcp-local-model/src/cache/ollamaCache.ts`

### How It Works

```typescript
interface ResponseEntry {
  response: string;
  tokensUsed: number;
  cachedAt: number;   // For TTL check
}
```

1. **Request** → Hash `system + prompt` with SHA256
2. **Check cache** with hash as key
3. **Cache hit** → Check if TTL expired
4. **TTL valid** → Return cached response
5. **TTL expired or miss** → Call model, cache response

### Configuration

```typescript
cache: {
  ollamaMaxSize: 500,    // Max responses to cache
  ollamaTtlMs: 300000,   // 5 minute TTL
}
```

### API

```typescript
import { ollamaCache } from "./cache/index.js";

// Check cache
const cached = ollamaCache.get(systemPrompt, userPrompt);
if (cached) {
  return cached; // { response, tokensUsed }
}

// After model call, cache result
ollamaCache.set(systemPrompt, userPrompt, response, tokensUsed);

// Clear cache
ollamaCache.clear();

// Get stats
const stats = ollamaCache.stats();
// { size: 234, hits: 89, misses: 145 }
```

### Cache Key

SHA256 hash of concatenated prompts:

```typescript
const key = sha256(systemPrompt + "|||" + userPrompt);
// "a4d5e6f7..."
```

Same prompts always produce same key, enabling exact match caching.

## Cache Events

Both caches emit events for the dashboard:

```typescript
events.emit("cache:hit", { type: "file", key: filepath });
events.emit("cache:hit", { type: "response", key: hash });
```

## Enabling/Disabling

```typescript
// In config.ts
cache: {
  enabled: true,  // Set to false to disable all caching
  ...
}

// Or via environment variable
CACHE_ENABLED=false
```

## Performance Impact

| Scenario | Without Cache | With Cache |
|----------|---------------|------------|
| Same file read 10x | 10 disk reads | 1 disk read |
| Same extraction 5x | 5 model calls | 1 model call |
| Typical session | ~500 API calls | ~200 API calls |

**Typical hit rates:**
- File cache: 70-80%
- Response cache: 40-60%

## Best Practices

### When to Invalidate

**File cache:**
- Automatically invalidated on mtime change
- Manually invalidate after writes: `fileCache.invalidate(path)`

**Response cache:**
- Relies on TTL (5 min default)
- Clear on major code changes: `ollamaCache.clear()`

### TTL Tuning

**Short TTL (1-2 min):**
- Rapid iteration
- Frequently changing code

**Long TTL (10+ min):**
- Stable codebase
- Repeated analysis

### Memory Usage

Each cache entry uses:
- File cache: ~10KB average (file content)
- Response cache: ~2KB average (JSON response)

With defaults (100 files, 500 responses):
- Max memory: ~2MB total

## Troubleshooting

### Stale Data

If seeing outdated results:
1. Check file mtime is updating on save
2. Clear caches: `fileCache.clear()` and `ollamaCache.clear()`
3. Reduce TTL in config

### High Memory

If memory is an issue:
1. Reduce `fileMaxSize` and `ollamaMaxSize`
2. Reduce TTLs for faster eviction
3. Disable caching: `cache.enabled = false`

### Cache Not Working

1. Verify `cache.enabled = true` in config
2. Check cache stats for hits/misses
3. Ensure prompts are exactly identical (spaces matter)
