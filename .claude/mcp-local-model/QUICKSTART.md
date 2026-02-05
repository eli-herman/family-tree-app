# Quick Start: Local Model MCP Server

## 1. Install Ollama

```bash
brew install ollama
```

## 2. Pull the Model

```bash
# Recommended: Qwen2.5-Coder 7B (~4.5GB download)
ollama pull qwen2.5-coder:7b

# Alternative: Mistral 7B (good general purpose)
ollama pull mistral:7b

# Alternative: Smaller/faster for basic tasks
ollama pull llama3.2:3b
```

## 3. Start Ollama

```bash
# Ollama runs as a service - start it
ollama serve

# Or it may already be running after install
# Verify with:
curl http://localhost:11434/api/tags
```

## 4. Install MCP Server Dependencies

```bash
cd ~/.claude/mcp-local-model
npm install
npm run build
```

## 5. Configure Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "local-model": {
      "command": "node",
      "args": ["/Users/eli.j.herman/projects/family-tree-app/.claude/mcp-local-model/dist/index.js"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434",
        "OLLAMA_MODEL": "qwen2.5-coder:7b"
      }
    }
  }
}
```

## 6. Restart Claude Code

Restart your Claude Code session to pick up the new MCP server.

## 7. Test It

Ask Claude to use the local model:

```
Use local_extract to get the frontmatter from .planning/phases/01-data-foundation/01-01-PLAN.md
```

---

## Tools Available

| Tool | Purpose | Ollama Used? |
|------|---------|--------------|
| `local_extract` | Extract data from files (frontmatter, patterns) | Yes |
| `local_verify` | Run verification checklists | Yes |
| `local_generate` | Fill templates with variables | No (pure substitution) |
| `local_git` | Parse git output to JSON | Yes (for complex output) |
| `local_analyze` | Analyze code structure | Yes |

## Token Savings

Estimated savings when using local model for structured tasks:

| Task Type | Claude Tokens | Local Model | Savings |
|-----------|---------------|-------------|---------|
| Extract frontmatter (4 files) | ~2000 | ~400 | 80% |
| Verify 10 conditions | ~4000 | ~800 | 80% |
| Generate SUMMARY.md | ~1500 | 0 | 100% |
| Parse git status | ~500 | ~100 | 80% |

## Troubleshooting

### Ollama not responding

```bash
# Check if running
curl http://localhost:11434/api/tags

# Restart
killall ollama
ollama serve
```

### Model not found

```bash
# List installed models
ollama list

# Pull if missing
ollama pull qwen2.5-coder:7b
```

### MCP server errors

```bash
# Run manually to see errors
cd ~/.claude/mcp-local-model
npm run dev
```

### Slow responses

- First request loads model into memory (~10-20s)
- Subsequent requests are faster (~1-5s)
- Consider smaller model (llama3.2:3b) for speed
