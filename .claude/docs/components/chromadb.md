# ChromaDB (Vector Store)

> Persistent vector database for semantic search.

## Overview

ChromaDB stores embeddings and enables fast similarity search:

```
┌──────────────────────────────────────────────────┐
│                   ChromaDB                        │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Collection: "codebase"                       │ │
│  │                                              │ │
│  │ ID          │ Embedding     │ Metadata       │ │
│  │─────────────┼───────────────┼────────────────│ │
│  │ src/auth.ts │ [0.02, -0.15] │ {type: "svc"} │ │
│  │ src/db.ts   │ [0.11, 0.08]  │ {type: "util"}│ │
│  │ ...         │ ...           │ ...           │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Collection: "docs"                           │ │
│  │ (React Native, Expo, Firebase documentation) │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Installation

On Windows PC:

```powershell
pip install chromadb
python -c "import chromadb; print(chromadb.__version__)"
```

## Collections

### `codebase`

Your project's source code, chunked and embedded.

**Fields:**
- `id` - File path or chunk identifier
- `embedding` - 768-dim vector from nomic-embed-text
- `document` - Original text content
- `metadata` - `{path, type, lines, hash}`

### `docs`

Stack documentation (optional).

**Fields:**
- `id` - Doc section identifier
- `embedding` - 768-dim vector
- `document` - Documentation text
- `metadata` - `{source, section, url}`

## API Usage

### Create/Get Collection

```python
import chromadb

client = chromadb.Client()
collection = client.get_or_create_collection("codebase")
```

### Add Documents

```python
collection.add(
    ids=["src/auth.ts"],
    embeddings=[[0.02, -0.15, ...]],
    documents=["export function login() { ... }"],
    metadatas=[{"type": "service", "lines": "1-50"}]
)
```

### Query (Similarity Search)

```python
results = collection.query(
    query_embeddings=[[0.02, -0.15, ...]],
    n_results=5
)
# Returns: {ids, documents, metadatas, distances}
```

### Upsert (Update or Insert)

```python
collection.upsert(
    ids=["src/auth.ts"],
    embeddings=[[0.02, -0.15, ...]],
    documents=["updated code..."],
    metadatas=[{"type": "service", "lines": "1-60"}]
)
```

### Delete

```python
collection.delete(ids=["src/auth.ts"])
```

## Quality Server Integration

The Quality Server wraps ChromaDB:

### Index Files

```http
POST /index
{
  "files": [
    {"path": "src/auth.ts", "content": "...", "metadata": {"type": "service"}}
  ],
  "collection": "codebase"
}
```

### Search

```http
POST /search
{
  "query": "authentication handling",
  "collection": "codebase",
  "limit": 5
}
```

## Persistence

By default, ChromaDB runs in-memory. For persistence:

```python
client = chromadb.PersistentClient(path="C:/chromadb-data")
```

The Quality Server uses persistent storage at `C:\quality-server\chromadb-data\`.

## Distance Metrics

ChromaDB supports multiple distance functions:

| Metric | Formula | Use Case |
|--------|---------|----------|
| `cosine` (default) | 1 - cos(a,b) | Text similarity |
| `l2` | Euclidean distance | Image features |
| `ip` | Inner product | Normalized vectors |

For text embeddings, `cosine` is recommended.

## Performance

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Add 1 doc | < 1ms | Embedding already computed |
| Add 100 docs | < 100ms | Batch insert |
| Query (100K docs) | < 50ms | HNSW index |
| Query (1M docs) | < 100ms | Scales well |

ChromaDB uses HNSW (Hierarchical Navigable Small World) for fast approximate nearest neighbor search.

## Metadata Filtering

Filter results by metadata:

```python
results = collection.query(
    query_embeddings=[...],
    where={"type": "service"},
    n_results=5
)
```

Supports: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`

## Best Practices

### Collection Design

- **One collection per purpose** - Don't mix code and docs
- **Meaningful IDs** - Use file paths for easy lookup
- **Rich metadata** - Include type, category, timestamp

### Embedding Quality

- **Chunk appropriately** - Too large = diluted meaning, too small = lost context
- **Include context** - Function signatures, imports
- **Avoid noise** - Skip minified code, binaries

### Maintenance

- **Re-index on changes** - Use file hashes to detect changes
- **Periodic cleanup** - Remove deleted files
- **Backup data** - Copy `chromadb-data/` directory

## Troubleshooting

### Slow Queries

- Check collection size: `collection.count()`
- Consider metadata filtering to narrow scope
- Rebuild index if corrupted

### Duplicate Results

- Use `upsert` instead of `add`
- Ensure unique IDs

### Data Not Persisting

- Use `PersistentClient` instead of default `Client`
- Check write permissions on data directory
