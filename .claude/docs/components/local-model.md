# Local Model (Ollama 7B)

> Fast local inference for simple tasks. Runs on your Mac.

## Overview

The local model handles quick, straightforward tasks that don't need the reasoning power of larger models. It provides sub-2-second responses for:

- Data extraction (frontmatter, patterns, imports/exports)
- Git output parsing
- Simple verification checks
- Template generation

## Model

**qwen2.5-coder:7b** - A code-focused model optimized for:
- Code understanding and generation
- Structured JSON output
- Following precise instructions

### Alternatives

| Model | VRAM | Best For |
|-------|------|----------|
| `qwen2.5-coder:7b` | ~5GB | Default, good balance |
| `qwen2.5-coder:7b-q8_0` | ~8GB | Higher quality, same speed |
| `codellama:7b` | ~5GB | Alternative if qwen unavailable |
| `deepseek-coder:6.7b` | ~5GB | Good for Python-heavy projects |

## Setup

### Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### Pull the Model

```bash
ollama pull qwen2.5-coder:7b
```

### Verify

```bash
ollama list
# Should show qwen2.5-coder:7b

ollama run qwen2.5-coder:7b "Say hello in JSON format"
# Should return {"message": "hello"} or similar
```

## Configuration

In `.claude/mcp-local-model/src/config.ts`:

```typescript
ollama: {
  host: "http://localhost:11434",  // Default Ollama address
  model: "qwen2.5-coder:7b",       // Model name
  timeoutMs: 30000,                // 30 second timeout
  maxRetries: 2,                   // Retry on failure
},
```

## Usage Patterns

### JSON Mode

All local model calls use JSON mode for structured output:

```typescript
const result = await generate({
  system: "You extract data. Return only JSON.",
  prompt: "Extract the function name: function hello() {}",
  format: "json"
});
// result.response = '{"functionName": "hello"}'
```

### Temperature

Low temperature (0.1) is used for deterministic output:

```typescript
options: {
  temperature: 0.1,  // Very deterministic
  num_predict: 2048, // Max output tokens
}
```

## Performance

| Metric | Target | Typical |
|--------|--------|---------|
| First token | < 500ms | ~300ms |
| Full response | < 2s | ~1.5s |
| Tokens/second | > 30 | ~40 |

### Warm vs Cold

- **Cold start**: First request after idle takes longer (~3s) as model loads into memory
- **Warm**: Subsequent requests are fast (~1.5s)

Ollama keeps the model in memory for 5 minutes by default.

## Prompt Engineering

The local model works best with:

1. **Clear system prompts** - Define the exact output format
2. **No conversation** - Single-turn, no chat history
3. **JSON schema** - Specify the exact JSON structure expected
4. **Examples** - One-shot examples help

### Example Prompts

See `.claude/mcp-local-model/src/ollama/prompts.ts` for all prompts.

**Extract Frontmatter:**
```
Extract these fields from the YAML frontmatter: title, date, author

FILE CONTENT:
---
title: Hello World
date: 2024-01-15
author: Jane Doe
---

OUTPUT (JSON only):
{
  "found": true,
  "data": { "title": "Hello World", "date": "2024-01-15", "author": "Jane Doe" }
}
```

**Analyze Exports:**
```
Analyze exports in this TypeScript file: src/utils.ts

FILE CONTENT:
export function add(a: number, b: number) { return a + b; }
export const PI = 3.14159;
export default class Calculator {}

OUTPUT (JSON only):
{
  "exports": [
    { "name": "add", "type": "function", "line": 1 },
    { "name": "PI", "type": "const", "line": 2 }
  ],
  "default_export": { "name": "Calculator", "line": 3 }
}
```

## Troubleshooting

### Model Not Found
```bash
ollama list  # Check available models
ollama pull qwen2.5-coder:7b  # Pull if missing
```

### Timeout Errors
- Increase `timeoutMs` in config
- Check if another process is using GPU

### Slow Responses
```bash
# Check if model is loaded
curl http://localhost:11434/api/tags

# Check GPU usage
nvidia-smi  # or Activity Monitor on Mac
```

### Out of Memory
- Close other GPU-intensive apps
- Try smaller quantization: `qwen2.5-coder:7b-q4_K_M`
