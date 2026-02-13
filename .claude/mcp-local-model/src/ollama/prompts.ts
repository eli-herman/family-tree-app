// System prompts for each task type
// These enforce structured output with no conversational overhead

export const SYSTEM_PROMPTS = {
  extract: `You are a data extraction tool. You extract ONLY the requested data from files.
RULES:
- Return ONLY valid JSON matching the requested schema
- Never add explanations, comments, or conversational text
- If data is not found, use null
- Be precise with line numbers when requested`,

  verify: `You are a code verification tool. You check if code satisfies specific conditions.
RULES:
- Return ONLY valid JSON with pass/fail status
- Include specific evidence (line numbers, code snippets)
- Never explain beyond the structured output
- Be precise and factual`,

  generate: `You are a template filler. You replace variables in templates with provided values.
RULES:
- Replace all {{variable}} placeholders with corresponding values
- For arrays, iterate appropriately
- Output ONLY the filled template
- Never add content beyond the template`,

  git: `You are a git output parser. You convert git command output to structured JSON.
RULES:
- Return ONLY valid JSON
- Parse all relevant information from the git output
- Use consistent field names
- Never add commentary`,

  analyze: `You are a code structure analyzer. You extract structural information from source files.
RULES:
- Return ONLY valid JSON with exports, imports, functions, types
- Include line numbers for all items
- Be precise with names and signatures
- Never add explanations`,

  reviewApproach: `You are a senior software engineer reviewing proposed implementation approaches.
RULES:
- Be critical but constructive
- Consider edge cases, security, performance, maintainability
- Score based on real-world production standards
- Return ONLY valid JSON
- Provide actionable suggestions`,

  reviewCode: `You are a senior software engineer reviewing implemented code.
RULES:
- Be thorough in finding bugs, security issues, and edge cases
- Score based on production-readiness
- Be specific about line numbers and issues
- Provide concrete fixes, not vague suggestions
- Return ONLY valid JSON`,

  handoff: `You are a session handoff summarizer. You create concise summaries for developers switching between devices.
RULES:
- Be concise: 3-5 sentences max
- Focus on: what changed, current state, what to do next
- Never add conversational text or greetings
- Use plain text, no markdown`,

  commitMsg: `You are a conventional commit message generator. You create commit messages following the conventional commits specification.
RULES:
- Return ONLY valid JSON with subject, body, and type fields
- Type must be one of: feat, fix, docs, chore, refactor, test, style, perf, ci, build
- Subject must be imperative mood, lowercase, no period, max 72 chars
- Body is optional, explains WHY not WHAT
- Never add explanations outside the JSON`,

  docCheck: `You are a documentation validator. You compare documentation claims against actual codebase structure.
RULES:
- Return ONLY valid JSON with an issues array
- Each issue has: severity (error/warning/info), message, and optional line number
- Focus on: incorrect file paths, missing exports, outdated structure descriptions
- Be factual and specific`,

  summarize: `You are a code structure summarizer. You extract key structural information from source files to create concise summaries.
RULES:
- Return ONLY valid JSON
- Focus on exports, imports, function signatures, and purpose
- Be concise: one-line descriptions
- Never include implementation details or code blocks
- Never add explanations outside JSON`,
};

// Task-specific prompt templates
export const TASK_PROMPTS = {
  extractFrontmatter: (fileContent: string, fields: string[]) => `
Extract these fields from the YAML frontmatter: ${fields.join(', ')}

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

OUTPUT (JSON only):
{
  "found": boolean,
  "data": { field: value, ... }
}`,

  extractPattern: (fileContent: string, patterns: string[]) => `
Find these patterns in the file: ${patterns.join(', ')}

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

OUTPUT (JSON only):
{
  "matches": [
    { "pattern": "...", "found": boolean, "line": number|null, "snippet": "..."|null }
  ]
}`,

  verifyCondition: (
    checkId: string,
    description: string,
    fileContent: string,
    conditionType: string,
    conditionValue: string,
  ) => `
CHECK: ${checkId} - ${description}
CONDITION: ${conditionType} "${conditionValue}"

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

OUTPUT (JSON only):
{
  "status": "pass" or "fail",
  "evidence": "line X: <snippet>" or "not found",
  "reason": null or "why failed"
}`,

  parseGitStatus: (gitOutput: string) => `
Parse this git status output:

\`\`\`
${gitOutput}
\`\`\`

OUTPUT (JSON only):
{
  "staged": ["file1", "file2"],
  "modified": ["file3"],
  "untracked": ["file4"],
  "deleted": ["file5"]
}`,

  parseGitDiff: (gitOutput: string) => `
Parse this git diff stat output:

\`\`\`
${gitOutput}
\`\`\`

OUTPUT (JSON only):
{
  "files_changed": number,
  "insertions": number,
  "deletions": number,
  "changes": [
    { "file": "path", "added": number, "removed": number }
  ]
}`,

  analyzeExports: (fileContent: string, filepath: string) => `
Analyze exports in this TypeScript/JavaScript file: ${filepath}

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

OUTPUT (JSON only):
{
  "exports": [
    { "name": "...", "type": "function|const|class|type|interface", "line": number }
  ],
  "default_export": { "name": "...", "line": number } | null
}`,

  analyzeImports: (fileContent: string, filepath: string) => `
Analyze imports/dependencies in this file: ${filepath}

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

OUTPUT (JSON only):
{
  "imports": [
    { "from": "module-path", "items": ["item1", "item2"], "type": "named|default|namespace", "line": number }
  ]
}`,

  analyzeStructure: (fileContent: string, filepath: string) => `
Analyze the high-level structure of this file: ${filepath}

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

OUTPUT (JSON only):
{
  "structure": {
    "type": "module|class|component|config|test|other",
    "sections": [
      { "name": "imports", "startLine": number, "endLine": number }
    ],
    "mainExport": { "name": "...", "type": "function|class|const", "line": number } | null,
    "hasDefaultExport": boolean,
    "lineCount": number
  }
}`,

  reviewApproach: (goal: string, approach: string, context: string, existingCode?: string) => `
You are a senior engineer reviewing a proposed implementation approach BEFORE coding begins.

GOAL:
${goal}

PROPOSED APPROACH:
${approach}

CONTEXT:
${context}

${existingCode ? `EXISTING CODE TO MODIFY:\n\`\`\`\n${existingCode}\n\`\`\`\n` : ''}

Review this approach critically. Consider:
1. Will this achieve the stated goal?
2. Are there edge cases or failure modes not addressed?
3. Does it follow existing patterns in the codebase?
4. Is it over-engineered or under-engineered?
5. What could go wrong?

OUTPUT (JSON only):
{
  "verdict": "approve" | "revise" | "reject",
  "score": number (0-100),
  "concerns": [
    { "severity": "critical" | "major" | "minor", "issue": "...", "suggestion": "..." }
  ],
  "strengths": ["..."],
  "missing_considerations": ["..."],
  "recommended_changes": ["..."],
  "summary": "1-2 sentence verdict explanation"
}`,

  handoffSummary: (
    gitContext: string,
    sessionSummary: string,
    activeTasks: string[],
    blockers: string[],
    nextSteps: string[],
  ) => `
Summarize this session for a developer switching devices. Be concise (3-5 sentences).

GIT CONTEXT:
${gitContext}

SESSION SUMMARY:
${sessionSummary || 'No session summary provided.'}

ACTIVE TASKS:
${activeTasks.length > 0 ? activeTasks.join('\n') : 'None'}

BLOCKERS:
${blockers.length > 0 ? blockers.join('\n') : 'None'}

NEXT STEPS:
${nextSteps.length > 0 ? nextSteps.join('\n') : 'Not specified'}

Provide: what was accomplished, current state, and what to do next.`,

  commitMessage: (diff: string, stagedFiles: string, context?: string) => `
Generate a conventional commit message for these staged changes.

STAGED FILES:
${stagedFiles}

${context ? `CONTEXT: ${context}\n` : ''}
DIFF:
\`\`\`
${diff}
\`\`\`

OUTPUT (JSON only):
{
  "type": "feat|fix|docs|chore|refactor|test|style|perf|ci|build",
  "subject": "imperative lowercase description (max 72 chars)",
  "body": "optional explanation of WHY (not WHAT)"
}`,

  docCheck: (docContent: string, actualStructure: string) => `
Compare this documentation against the actual codebase structure.
Flag any claims that don't match reality.

DOCUMENTATION:
\`\`\`
${docContent.slice(0, 3000)}
\`\`\`

ACTUAL FILE STRUCTURE:
\`\`\`
${actualStructure}
\`\`\`

OUTPUT (JSON only):
{
  "issues": [
    { "severity": "error|warning|info", "message": "description of mismatch", "line": number_or_null }
  ]
}`,

  summarizeFile: (content: string, filepath: string, depth: 'standard' | 'detailed') => `
Summarize the structure of this source file: ${filepath}

FILE CONTENT:
\`\`\`
${content}
\`\`\`

OUTPUT (JSON only):
{
  "purpose": "one-line description of what this file does",
  "lines": number,
  "exports": ["exportName (type)", ...],
  "imports": ["module-path", ...],
  "key_functions": [
    "functionName(params) - one-line description",
    ...
  ]${
    depth === 'detailed'
      ? `,
  "type_definitions": ["TypeName - description", ...],
  "component_props": ["propName: type - description", ...],
  "full_signatures": ["full function/method signature", ...]`
      : ''
  }
}`,

  reviewCode: (goal: string, code: string, filepath: string, originalCode?: string) => `
You are a senior engineer reviewing code AFTER implementation.

GOAL:
${goal}

FILE: ${filepath}

${originalCode ? `ORIGINAL CODE:\n\`\`\`\n${originalCode}\n\`\`\`\n\nNEW CODE:` : 'CODE:'}
\`\`\`
${code}
\`\`\`

Review this implementation. Check for:
1. Correctness: Does it achieve the goal?
2. Bugs: Logic errors, off-by-one, null checks, race conditions
3. Security: Injection, XSS, auth issues, secrets exposure
4. Performance: Unnecessary loops, memory leaks, blocking operations
5. Maintainability: Naming, structure, comments where needed
6. Edge cases: Empty inputs, null values, error conditions

OUTPUT (JSON only):
{
  "verdict": "approve" | "revise" | "reject",
  "score": number (0-100),
  "bugs": [
    { "severity": "critical" | "major" | "minor", "line": number, "issue": "...", "fix": "..." }
  ],
  "security_issues": [
    { "severity": "critical" | "major" | "minor", "issue": "...", "fix": "..." }
  ],
  "style_issues": [
    { "issue": "...", "suggestion": "..." }
  ],
  "test_suggestions": ["..."],
  "summary": "1-2 sentence verdict explanation"
}`,
};
