# Embeddings 101

> Understanding how AI turns text into searchable vectors

## The Problem

Traditional search (grep, find) matches exact keywords:

```
Search: "authentication"
Results: Files containing the literal word "authentication"
```

But what if the code says "login", "auth", "session", or "verify user"? You miss it.

## The Solution: Embeddings

An embedding model converts text into a list of numbers (a vector) that captures its **meaning**, not just its words.

```
"Handle user authentication"  →  [0.23, -0.41, 0.87, ..., 0.12]  (768 numbers)
"Verify login credentials"    →  [0.21, -0.39, 0.85, ..., 0.14]  (768 numbers)
"Parse JSON config file"      →  [-0.67, 0.12, 0.03, ..., -0.45] (768 numbers)
```

Notice: The first two vectors are similar (authentication-related). The third is different (config parsing).

## How It Works

### 1. Training
The embedding model learned from millions of text examples. It discovered that:
- "auth" and "login" appear in similar contexts
- "user" and "session" often go together
- These concepts are different from "config", "JSON", "parse"

### 2. Vector Space
Each dimension captures some aspect of meaning:
- Maybe dimension 42 relates to "security concepts"
- Maybe dimension 156 relates to "user-related operations"
- The model figured this out automatically during training

### 3. Similarity = Distance
To find similar code, we measure distance between vectors:

```
distance("Handle user authentication", "Verify login credentials") = 0.08  (very close!)
distance("Handle user authentication", "Parse JSON config file")   = 0.91  (far apart)
```

## In Practice

### Indexing Your Codebase

```
1. Read each file
2. Split into chunks (by function, class, or fixed size)
3. Generate embedding for each chunk
4. Store in ChromaDB: (embedding, content, metadata)
```

### Searching

```
1. User asks: "Where do we handle auth?"
2. Generate embedding for the query
3. Find nearest vectors in ChromaDB
4. Return the matching code chunks
```

## Visual Explanation

Imagine a 2D map (real embeddings are 768D, but the idea is the same):

```
                    Security-related →

         ┌────────────────────────────────────────┐
         │                                        │
         │     • login.ts                         │
     U   │         • session.ts                   │
     s   │              • jwt.ts                  │
     e   │                                        │
     r   │                      ✕ Query:          │
     |   │                       "auth code"      │
     r   │                                        │
     e   │                                        │
     l   │                                        │
     a   │                                        │
     t   ├────────────────────────────────────────│
     e   │                                        │
     d   │                                        │
         │  • config.ts                           │
     ↓   │       • parser.ts                      │
         │            • utils.ts                  │
         │                                        │
         └────────────────────────────────────────┘
```

The query "auth code" lands near the authentication files, not the config files.

## The Model We Use

**nomic-embed-text**
- Produces 768-dimensional vectors
- Trained on code + natural language
- Small (275MB) and fast
- Runs on CPU or GPU

## Why This Matters

| Search Type | How It Works | Best For |
|-------------|--------------|----------|
| Keyword (grep) | Exact match | "Find all TODO comments" |
| Semantic | Meaning match | "Find authentication code" |

Combined, they're powerful:
1. Use semantic search to find relevant areas
2. Use keyword search to find specific patterns

## Code Example

```typescript
// Generate an embedding
const response = await ollama.embeddings({
  model: 'nomic-embed-text',
  prompt: 'function handleUserLogin(email, password) { ... }'
});
// response.embedding = [0.23, -0.41, 0.87, ..., 0.12]

// Store in ChromaDB
await collection.add({
  ids: ['src/auth/login.ts:42'],
  embeddings: [response.embedding],
  documents: ['function handleUserLogin(email, password) { ... }'],
  metadatas: [{ file: 'src/auth/login.ts', line: 42, type: 'function' }]
});

// Search
const queryEmbedding = await ollama.embeddings({
  model: 'nomic-embed-text',
  prompt: 'user authentication'
});

const results = await collection.query({
  queryEmbeddings: [queryEmbedding.embedding],
  nResults: 5
});
// Returns the 5 most similar code chunks
```

## Limitations

1. **Chunk size matters**: Too small = loses context. Too large = diluted meaning.
2. **Stale index**: Need to re-embed when files change.
3. **Not magic**: Still needs good queries. "that thing" won't work well.
4. **Language**: Works best with English and common programming languages.

## Further Reading

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Nomic Embed](https://www.nomic.ai/blog/posts/nomic-embed-text-v1)
- [What are Vector Embeddings?](https://www.pinecone.io/learn/vector-embeddings/)
