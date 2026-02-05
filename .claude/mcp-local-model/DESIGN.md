# Local Model MCP Server Design

## Overview

An MCP server that wraps Ollama to offload structured, repetitive tasks from Claude. The server enforces strict JSON schemas for all communication—no conversational overhead.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude (Orchestrator)                   │
│  - Complex reasoning, planning, decisions                    │
│  - Calls local model for structured tasks                    │
│  - Validates and acts on results                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol (JSON-RPC)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (Node.js)                      │
│  - Tool definitions with strict schemas                      │
│  - Task-specific prompt templates                            │
│  - Output validation layer                                   │
│  - Retry logic with backoff                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP API (localhost:11434)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama + Local Model                      │
│  - Qwen2.5-Coder 7B (recommended)                           │
│  - Runs on Apple Silicon                                     │
│  - ~6GB memory footprint                                     │
└─────────────────────────────────────────────────────────────┘
```

## Communication Protocol

### Principle: Zero Ambiguity

All communication follows this contract:
1. **Input**: Structured JSON with all required context
2. **Output**: Structured JSON matching declared schema
3. **No conversation**: Single request → single response
4. **Validation**: Server validates output before returning to Claude

### Request Format (Claude → MCP Server)

```typescript
interface MCPToolCall {
  tool: string;           // Tool name
  params: {
    task_type: string;    // Specific task variant
    context: object;      // All required context (no follow-ups)
    schema: object;       // Expected output schema (for validation)
  };
}
```

### Response Format (MCP Server → Claude)

```typescript
interface MCPToolResult {
  success: boolean;
  data: object | null;      // Validated output matching schema
  error: string | null;     // Error message if failed
  confidence: number;       // 0-1, local model's self-assessment
  tokens_used: number;      // For tracking savings
}
```

## Tool Definitions

### 1. `local_extract` — Extract structured data from files

**Purpose**: Read files and extract specific information into structured format.

**Input Schema**:
```typescript
{
  task_type: "pattern_match" | "frontmatter" | "exports" | "imports" | "structure",
  files: string[],              // Absolute paths
  extract: {
    patterns?: string[],        // Regex patterns to find
    fields?: string[],          // Frontmatter fields to extract
    format: "json" | "list"     // Output format
  }
}
```

**Output Schema**:
```typescript
{
  results: {
    [filepath: string]: {
      found: boolean,
      data: object | string[],
      line_numbers?: number[]
    }
  }
}
```

**Example Call**:
```json
{
  "tool": "local_extract",
  "params": {
    "task_type": "frontmatter",
    "files": [".planning/phases/01-data-foundation/01-01-PLAN.md"],
    "extract": {
      "fields": ["wave", "autonomous", "depends_on"],
      "format": "json"
    }
  }
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "results": {
      ".planning/phases/01-data-foundation/01-01-PLAN.md": {
        "found": true,
        "data": {
          "wave": 1,
          "autonomous": true,
          "depends_on": []
        }
      }
    }
  },
  "confidence": 0.95,
  "tokens_used": 342
}
```

---

### 2. `local_verify` — Run verification checklist against code

**Purpose**: Check if code satisfies a list of requirements.

**Input Schema**:
```typescript
{
  task_type: "must_haves" | "patterns" | "exports" | "imports",
  checks: Array<{
    id: string,                 // Check identifier
    description: string,        // What to verify
    file: string,               // File to check
    condition: {
      type: "contains" | "exports" | "imports" | "pattern",
      value: string             // String/pattern to find
    }
  }>
}
```

**Output Schema**:
```typescript
{
  passed: number,
  failed: number,
  results: Array<{
    id: string,
    status: "pass" | "fail",
    evidence: string,           // Line number or snippet
    reason?: string             // Why it failed (if failed)
  }>
}
```

**Example Call**:
```json
{
  "tool": "local_verify",
  "params": {
    "task_type": "must_haves",
    "checks": [
      {
        "id": "DATA-01",
        "description": "familyStore exports useFamilyStore",
        "file": "src/stores/familyStore.ts",
        "condition": {
          "type": "exports",
          "value": "useFamilyStore"
        }
      },
      {
        "id": "DATA-02",
        "description": "feedStore has loadData function",
        "file": "src/stores/feedStore.ts",
        "condition": {
          "type": "contains",
          "value": "loadData"
        }
      }
    ]
  }
}
```

---

### 3. `local_generate` — Generate boilerplate from templates

**Purpose**: Fill templates with provided data. No creativity—strict substitution.

**Input Schema**:
```typescript
{
  task_type: "summary" | "plan" | "verification" | "state_update",
  template: string,             // Template name or inline template
  variables: {
    [key: string]: string | number | boolean | object
  },
  output_path?: string          // Optional: write directly to file
}
```

**Output Schema**:
```typescript
{
  content: string,              // Generated content
  written: boolean,             // If output_path provided
  path?: string                 // Where it was written
}
```

**Example Call**:
```json
{
  "tool": "local_generate",
  "params": {
    "task_type": "summary",
    "template": "summary",
    "variables": {
      "phase": "01-data-foundation",
      "plan": "01",
      "plan_name": "Herman Family Mock Data",
      "tasks": [
        {"name": "Update FamilyMember type", "commit": "e012012", "status": "complete"},
        {"name": "Replace mock data", "commit": "596c479", "status": "complete"},
        {"name": "Create relationship utility", "commit": "51d5a62", "status": "complete"}
      ],
      "files_modified": ["src/types/user.ts", "src/utils/mockData.ts", "src/utils/relationships.ts"],
      "deviations": "none",
      "next_plan": "01-02"
    },
    "output_path": ".planning/phases/01-data-foundation/01-01-SUMMARY.md"
  }
}
```

---

### 4. `local_git` — Summarize git state

**Purpose**: Parse git output into structured format.

**Input Schema**:
```typescript
{
  task_type: "status" | "diff" | "log" | "changed_files",
  options?: {
    paths?: string[],           // Filter to specific paths
    limit?: number,             // For log: number of commits
    format?: "summary" | "detailed"
  }
}
```

**Output Schema**:
```typescript
{
  // For status:
  staged: string[],
  modified: string[],
  untracked: string[],

  // For diff:
  files_changed: number,
  insertions: number,
  deletions: number,
  changes: Array<{file: string, added: number, removed: number}>,

  // For log:
  commits: Array<{hash: string, message: string, date: string}>
}
```

---

### 5. `local_analyze` — Analyze code structure

**Purpose**: Extract structural information from code files.

**Input Schema**:
```typescript
{
  task_type: "dependencies" | "exports" | "functions" | "types",
  files: string[],
  depth?: number                // How deep to analyze imports
}
```

**Output Schema**:
```typescript
{
  analysis: {
    [filepath: string]: {
      exports: string[],
      imports: Array<{from: string, items: string[]}>,
      functions: Array<{name: string, line: number, params: string[]}>,
      types: Array<{name: string, kind: "interface" | "type" | "enum", line: number}>
    }
  }
}
```

---

## Prompt Templates

The MCP server stores task-specific prompts that enforce structured output.

### Template: Extract Frontmatter

```
You are a data extraction tool. Extract ONLY the requested fields from the YAML frontmatter.

INPUT FILE:
{file_content}

EXTRACT THESE FIELDS: {fields}

OUTPUT FORMAT (strict JSON, no explanation):
{
  "found": true/false,
  "data": {
    "field1": value1,
    "field2": value2
  }
}

RULES:
- Return ONLY valid JSON
- If a field is missing, use null
- Do not add fields not requested
- Do not explain or comment
```

### Template: Verify Checklist

```
You are a code verification tool. Check if each condition is satisfied.

CHECK {check_id}: {description}
FILE: {file_path}
CONDITION: {condition_type} "{condition_value}"

FILE CONTENT:
{file_content}

OUTPUT FORMAT (strict JSON, no explanation):
{
  "status": "pass" or "fail",
  "evidence": "line X: <relevant code snippet>" or "not found",
  "reason": null or "why it failed"
}

RULES:
- Return ONLY valid JSON
- Evidence must be specific (line number + snippet)
- Do not explain beyond the structured output
```

### Template: Generate from Template

```
You are a template filler. Replace variables in the template with provided values.

TEMPLATE:
{template_content}

VARIABLES:
{variables_json}

RULES:
- Replace all {{variable_name}} with corresponding values
- For arrays, iterate and format appropriately
- Do not add content beyond what the template specifies
- Output ONLY the filled template, no commentary
```

---

## Validation Layer

Before returning results to Claude, the server validates:

### 1. Schema Validation
```typescript
function validateOutput(output: any, schema: JSONSchema): ValidationResult {
  // Use ajv or similar JSON schema validator
  const valid = ajv.validate(schema, output);
  return {
    valid,
    errors: ajv.errors
  };
}
```

### 2. Confidence Threshold
```typescript
const CONFIDENCE_THRESHOLD = 0.7;

if (result.confidence < CONFIDENCE_THRESHOLD) {
  // Retry with more explicit prompt, or return error
  return {
    success: false,
    error: `Low confidence (${result.confidence}). Manual review needed.`,
    data: result.data  // Still include for human review
  };
}
```

### 3. Retry Logic
```typescript
async function executeWithRetry(task: Task, maxRetries = 2): Promise<Result> {
  for (let i = 0; i <= maxRetries; i++) {
    const result = await executeTask(task);

    if (result.success && validateOutput(result.data, task.schema).valid) {
      return result;
    }

    if (i < maxRetries) {
      // Add correction hint to prompt
      task.prompt += `\n\nPREVIOUS OUTPUT WAS INVALID: ${result.error}\nTry again with valid JSON.`;
    }
  }

  return { success: false, error: "Max retries exceeded", data: null };
}
```

---

## Integration with GSD Workflow

### Where Local Model Gets Used

| GSD Step | Local Model Task | Claude Task |
|----------|------------------|-------------|
| Discover plans | `local_extract` frontmatter | Orchestrate waves |
| Execute plan | — | Full execution (complex) |
| Verify phase | `local_verify` checklist | Interpret gaps, decide action |
| Generate SUMMARY | `local_generate` template | Review and commit |
| Update STATE | `local_generate` template | — |
| Git operations | `local_git` status/diff | Decide what to commit |

### Token Savings Estimate

| Task | Claude Tokens | Local Model | Savings |
|------|---------------|-------------|---------|
| Read 4 plan frontmatters | ~2000 | ~400 | 80% |
| Run 10-item verification | ~4000 | ~800 | 80% |
| Generate SUMMARY.md | ~1500 | ~300 | 80% |
| Parse git status | ~500 | ~100 | 80% |

**Estimated overall savings: 60-70% token reduction for structured tasks**

---

## Error Handling

### Error Categories

```typescript
enum ErrorCategory {
  OLLAMA_UNAVAILABLE = "ollama_unavailable",
  MODEL_NOT_LOADED = "model_not_loaded",
  INVALID_OUTPUT = "invalid_output",
  TIMEOUT = "timeout",
  FILE_NOT_FOUND = "file_not_found"
}
```

### Error Response Format

```typescript
{
  success: false,
  error: "Human-readable error message",
  error_category: ErrorCategory,
  recoverable: boolean,
  suggestion: "What Claude should do instead"
}
```

### Fallback Behavior

When local model fails, Claude gets a clear signal to handle it directly:

```json
{
  "success": false,
  "error": "Ollama not responding after 3 retries",
  "error_category": "ollama_unavailable",
  "recoverable": false,
  "suggestion": "Handle this task directly"
}
```

---

## Configuration

### MCP Server Config (`config.json`)

```json
{
  "ollama": {
    "host": "http://localhost:11434",
    "model": "qwen2.5-coder:7b",
    "timeout_ms": 30000,
    "max_retries": 2
  },
  "validation": {
    "confidence_threshold": 0.7,
    "strict_schema": true
  },
  "templates_dir": "./templates",
  "logging": {
    "level": "info",
    "token_tracking": true
  }
}
```

### Claude Code MCP Config (`.claude/mcp.json`)

```json
{
  "mcpServers": {
    "local-model": {
      "command": "node",
      "args": ["/path/to/mcp-local-model/server.js"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434"
      }
    }
  }
}
```

---

## File Structure

```
mcp-local-model/
├── DESIGN.md              # This file
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── tools/
│   │   ├── extract.ts     # local_extract implementation
│   │   ├── verify.ts      # local_verify implementation
│   │   ├── generate.ts    # local_generate implementation
│   │   ├── git.ts         # local_git implementation
│   │   └── analyze.ts     # local_analyze implementation
│   ├── ollama/
│   │   ├── client.ts      # Ollama API client
│   │   └── prompts.ts     # Prompt templates
│   ├── validation/
│   │   ├── schemas.ts     # JSON schemas for each tool
│   │   └── validator.ts   # Validation logic
│   └── utils/
│       ├── retry.ts       # Retry logic
│       └── logging.ts     # Token tracking, logs
├── templates/
│   ├── summary.md.hbs     # SUMMARY.md template
│   ├── verification.md.hbs
│   └── state-update.md.hbs
└── config.json
```

---

## Next Steps

1. **Install Ollama**: `brew install ollama`
2. **Pull model**: `ollama pull qwen2.5-coder:7b`
3. **Implement MCP server**: Start with `local_extract` and `local_verify`
4. **Test integration**: Verify Claude can call tools and receive structured output
5. **Iterate**: Add more tools as patterns emerge

---

## Open Questions

1. **Model fine-tuning**: Should we create Modelfiles with system prompts baked in for each task type?
2. **Caching**: Should we cache extraction results for files that haven't changed?
3. **Parallel execution**: Should the MCP server support batching multiple checks in one call?

These can be decided during implementation based on actual usage patterns.
