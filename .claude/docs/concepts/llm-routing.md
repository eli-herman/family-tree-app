# Multi-Model Routing

> How the orchestrator decides which AI model handles each task

## The Core Idea

Not every task needs the smartest (and most expensive) model. A simple extraction doesn't need GPT-4 or Claude. A complex architectural decision shouldn't go to a 7B model.

**Smart routing = right model for the job**

## Model Tiers

| Tier | Model | Best For | Cost/Speed |
|------|-------|----------|------------|
| **Fast** | Local 7B | Simple extraction, pattern matching | Free, ~1.5s |
| **Thorough** | Remote 32B | Complex analysis, code review | Free, ~6s |
| **Semantic** | Embeddings | Finding similar code | Free, ~200ms |
| **Frontier** | Claude | Architecture, creative solutions | Paid, ~3s |

## Routing Decision Tree

```
                    ┌─────────────────┐
                    │   Incoming      │
                    │   Task          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Is it semantic  │──── Yes ───▶ Embeddings
                    │ search?         │
                    └────────┬────────┘
                             │ No
                             ▼
                    ┌─────────────────┐
                    │ Always-remote   │──── Yes ───▶ Remote 32B
                    │ task type?      │
                    │ (review, etc)   │
                    └────────┬────────┘
                             │ No
                             ▼
                    ┌─────────────────┐
                    │ Always-local    │──── Yes ───▶ Local 7B
                    │ task type?      │
                    │ (extract, etc)  │
                    └────────┬────────┘
                             │ No
                             ▼
                    ┌─────────────────┐
                    │ Assess          │
                    │ complexity      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
        Low (< 0.7)                   High (≥ 0.7)
              │                             │
              ▼                             ▼
         Local 7B                      Remote 32B
    (fallback: remote)            (fallback: local)
```

## Complexity Assessment

The orchestrator scores each task from 0.0 to 1.0:

```typescript
function assessComplexity(task: Task): number {
  let score = 0;

  // More files = more complex
  if (task.files.length > 3)  score += 0.2;
  if (task.files.length > 10) score += 0.3;

  // Bigger content = more complex
  const totalSize = task.files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > 5000)  score += 0.2;
  if (totalSize > 20000) score += 0.3;

  // Task type modifiers
  if (task.type.includes('analyze'))   score += 0.2;
  if (task.type.includes('refactor'))  score += 0.3;
  if (task.type.includes('review'))    score += 0.4;

  // Explicit hints
  if (task.hints?.preferQuality) score += 0.3;
  if (task.hints?.preferSpeed)   score -= 0.3;

  return Math.max(0, Math.min(1, score));
}
```

## Task Type Routing

Some tasks always go to specific models:

### Always Remote (32B)
- `review_code` - Needs deep understanding
- `review_approach` - Needs architectural knowledge
- `complex_analysis` - Multi-file reasoning
- `refactor_suggest` - Needs to see patterns

### Always Local (7B)
- `extract_frontmatter` - Simple YAML parsing
- `extract_pattern` - Regex matching
- `git_parse` - Structured output
- `verify_simple` - Basic checks

### Always Embeddings
- `semantic_search` - Vector similarity
- `find_similar` - Code similarity

### Dynamic (Complexity-Based)
- `analyze_exports` - Depends on file count
- `analyze_structure` - Depends on file size
- `verify_complex` - Depends on check count

## Fallback Behavior

If a model fails:

```
1. Local 7B fails → Try Remote 32B
2. Remote 32B fails → Return error (let Claude handle)
3. Embeddings fail → Fall back to keyword search
```

Example:
```typescript
async function executeWithFallback(task: Task, routing: RoutingDecision) {
  try {
    return await execute(task, routing.target);
  } catch (error) {
    if (routing.fallback) {
      console.log(`Falling back to ${routing.fallback}`);
      return await execute(task, routing.fallback);
    }
    throw error;
  }
}
```

## Why Not Always Use the Best Model?

1. **Cost**: Claude API costs money. Local models are free.
2. **Speed**: 7B responds in ~1.5s. 32B takes ~6s. For simple tasks, faster is better.
3. **Capacity**: Running everything through one model creates bottlenecks.
4. **Appropriateness**: Using Claude to parse JSON is wasteful.

## Metrics to Track

| Metric | Purpose |
|--------|---------|
| `routing_decisions` | Count per model |
| `fallback_rate` | How often primary fails |
| `latency_by_model` | Speed comparison |
| `tokens_by_model` | Usage distribution |
| `error_rate_by_model` | Reliability |

## Configuration

```typescript
routing: {
  // Complexity threshold for remote routing
  complexityThreshold: 0.7,

  // Override: always use these targets
  alwaysRemote: ['review_code', 'review_approach'],
  alwaysLocal: ['extract_frontmatter', 'pattern_match'],

  // Fallback behavior
  enableFallback: true,
  maxRetries: 1,

  // Model preferences
  preferQuality: false,  // Bias toward 32B
  preferSpeed: false,    // Bias toward 7B
}
```

## Real-World Example

Claude asks the orchestrator to analyze a file:

```
Input:
  tool: local_analyze
  task_type: exports
  files: ['src/auth/login.ts']  (1 file, 2KB)

Routing:
  1. Not semantic search
  2. Not always-remote type
  3. Not always-local type
  4. Complexity: 0.2 (1 small file)
  5. Below threshold 0.7
  → Route to Local 7B

Result:
  Completed in 1.2s
  Tokens: 450
  Status: Success
```

Another example:

```
Input:
  tool: local_analyze
  task_type: complex_analysis
  files: [12 files, 45KB total]

Routing:
  1. Not semantic search
  2. Not always-remote (but close)
  3. Not always-local
  4. Complexity: 0.8 (12 files + 45KB + "complex" type)
  5. Above threshold 0.7
  → Route to Remote 32B

Result:
  Completed in 5.8s
  Tokens: 2100
  Status: Success
```

## Summary

- **Local 7B**: Fast, simple tasks. Your workhorse.
- **Remote 32B**: Complex tasks that need reasoning. Your expert.
- **Embeddings**: Semantic search. Your librarian.
- **Claude**: Architecture and creativity. Your architect.

The orchestrator makes sure each task goes to the right specialist.
