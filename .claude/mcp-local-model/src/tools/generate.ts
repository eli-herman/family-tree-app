import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import Handlebars from "handlebars";
import { config } from "../config.js";
import { logMetric } from "../utils/metrics.js";

export const generateTool = {
  name: "local_generate",
  description: "Generate boilerplate from templates with variable substitution",
  inputSchema: {
    type: "object" as const,
    properties: {
      task_type: {
        type: "string",
        enum: ["summary", "plan", "verification", "state_update"],
        description: "Type of document to generate",
      },
      template: {
        type: "string",
        description: "Template name or inline template content",
      },
      variables: {
        type: "object",
        description: "Variables to substitute in template",
      },
      output_path: {
        type: "string",
        description: "Optional: write directly to this file path",
      },
    },
    required: ["task_type", "template", "variables"],
  },
};

interface GenerateParams {
  task_type: "summary" | "plan" | "verification" | "state_update";
  template: string;
  variables: Record<string, any>;
  output_path?: string;
}

// Built-in templates (no Ollama needed - pure substitution)
const BUILT_IN_TEMPLATES: Record<string, string> = {
  summary: `---
phase: {{phase}}
plan: {{plan}}
completed_at: {{timestamp}}
status: complete
---

# Plan {{phase}}-{{plan}} Summary: {{plan_name}}

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
{{#each tasks}}
| {{@index}} | {{this.name}} | \`{{this.commit}}\` | {{this.status}} |
{{/each}}

## Files Modified

{{#each files_modified}}
- \`{{this}}\`
{{/each}}

## Deviations

{{#if deviations}}
{{deviations}}
{{else}}
None - plan executed as specified.
{{/if}}

## Next

{{#if next_plan}}
Proceed to plan {{next_plan}}.
{{else}}
Phase complete.
{{/if}}
`,

  verification: `---
phase: {{phase}}
verified_at: {{timestamp}}
status: {{status}}
score: {{passed}}/{{total}} must-haves verified
---

# Phase {{phase_number}}: {{phase_name}} - Verification Report

## Must-Haves Checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
{{#each checks}}
| {{this.id}} | {{this.description}} | {{this.status}} | {{this.evidence}} |
{{/each}}

## Summary

{{summary}}
`,

  state_update: `## Recent Activity

{{#each activities}}
- {{this.date}}: {{this.description}}
{{/each}}

## Current Position

Phase: {{current_phase}} of {{total_phases}}
Plan: {{current_plan}} of {{total_plans}} in current phase
Status: {{status}}

Progress: {{progress_bar}} {{progress_percent}}%
`,
};

export async function generateHandler(params: GenerateParams) {
  const { task_type, template, variables, output_path } = params;
  const startTime = Date.now();

  let templateContent: string;

  // Check if template is a built-in name or inline content
  if (BUILT_IN_TEMPLATES[template]) {
    templateContent = BUILT_IN_TEMPLATES[template];
  } else if (template.includes("{{")) {
    // Inline template
    templateContent = template;
  } else {
    // Load from templates directory
    try {
      const templatePath = join(config.templatesDir, `${template}.md.hbs`);
      templateContent = await readFile(templatePath, "utf-8");
    } catch {
      return {
        success: false,
        error: `Template not found: ${template}`,
        error_category: "file_not_found",
        recoverable: false,
        suggestion: "Use a built-in template name or provide inline template",
      };
    }
  }

  // Add timestamp if not provided
  if (!variables.timestamp) {
    variables.timestamp = new Date().toISOString();
  }

  // Compile and render template
  const compiled = Handlebars.compile(templateContent);
  const content = compiled(variables);

  // Write to file if output_path provided
  let written = false;
  if (output_path) {
    try {
      await writeFile(output_path, content, "utf-8");
      written = true;
    } catch (error) {
      return {
        success: false,
        error: `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
        error_category: "file_write_error",
        recoverable: true,
        suggestion: "Check file permissions and path",
      };
    }
  }

  // Log metrics - no Ollama tokens but still tracks offloaded work
  // Estimate Claude tokens: would need to understand template + variables + generate
  const estimatedClaudeTokens = Math.ceil(
    (templateContent.length + JSON.stringify(variables).length + content.length) / 4
  ) * 2;

  await logMetric({
    timestamp: new Date().toISOString(),
    tool: "local_generate",
    task_type,
    local_tokens: 0, // No Ollama used
    estimated_claude_tokens: estimatedClaudeTokens,
    duration_ms: Date.now() - startTime,
    success: true,
    files_processed: written ? 1 : 0,
  }).catch(() => {});

  return {
    success: true,
    data: {
      content,
      written,
      path: written ? output_path : undefined,
    },
    confidence: 1.0, // Template substitution is deterministic
    tokens_used: 0, // No Ollama call needed
  };
}
