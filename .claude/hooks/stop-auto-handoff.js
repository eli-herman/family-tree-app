#!/usr/bin/env node
// Stop hook: auto-generates and commits HANDOFF.md when Claude session ends.
// Fires on every Stop event. Fails silently — never blocks session end.
// Appends system health snapshot from Quality Server so next session has
// immediate situational awareness on pickup.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const QUALITY_SERVER = 'http://192.168.1.190:4000';
const HEALTH_TIMEOUT_MS = 2000;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', async () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch {}

  // Prevent recursion — if a Stop hook is already running, exit immediately
  if (input.stop_hook_active) process.exit(0);

  const cwd = input.cwd || process.cwd();
  try {
    process.chdir(cwd);
  } catch {
    process.exit(0);
  }

  // Only run in git repos
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    process.exit(0);
  }

  // Gather git context
  const branch = run('git branch --show-current') || 'main';
  const commit = run('git rev-parse --short HEAD') || 'init';
  const lastMsg = run('git log -1 --pretty=format:"%s"') || 'no commit message';
  const recentCommits = run('git log --oneline -8') || '(no commits)';
  const workingTree = run('git status --short') || 'clean';
  const timestamp = new Date().toISOString();
  const device = os.hostname();

  // Read current planning state (first 30 lines covers the key info)
  let stateContent = '';
  try {
    stateContent = fs
      .readFileSync(path.join(cwd, '.planning', 'STATE.md'), 'utf8')
      .split('\n')
      .slice(0, 30)
      .join('\n');
  } catch {}

  // Query Quality Server health (2s timeout — fails silently if Windows is off)
  const healthSection = await fetchHealthSection();

  // Build HANDOFF.md with YAML frontmatter (parsed by handoff-reader.js on next SessionStart)
  const handoff = `---
device: ${device}
branch: ${branch}
commit: ${commit}
timestamp: ${timestamp}
---
# Session Handoff

## Summary

Last commit: \`${commit}\` on \`${branch}\`

> ${lastMsg}

${stateContent}

## Recent Commits

\`\`\`
${recentCommits}
\`\`\`

## Working Tree

\`\`\`
${workingTree}
\`\`\`

${healthSection}

## Next Steps

- Run \`/gsd:progress\` to see current position and next action
- See \`.planning/STATE.md\` for full project state
- See \`.planning/v1.0-MILESTONE-AUDIT.md\` for gap analysis (16 requirements missing)
- Run \`/gsd:plan-milestone-gaps\` to create new roadmap phases
`;

  try {
    fs.writeFileSync(path.join(cwd, 'HANDOFF.md'), handoff);
    execSync('git add HANDOFF.md', { stdio: 'ignore' });

    // Only commit if HANDOFF.md actually changed
    const diff = run('git diff --cached --stat HANDOFF.md');
    if (diff) {
      execSync(`git commit -m "chore: auto-update HANDOFF.md [${commit}]" --no-verify`, {
        stdio: 'ignore',
      });
    }
  } catch {
    // Fail silently — never block session end
  }

  process.exit(0);
});

async function fetchHealthSection() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const res = await fetch(`${QUALITY_SERVER}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return `## Quality Server Health\n\n**Status:** degraded (HTTP ${res.status})`;
    }

    const data = await res.json();
    const status = data.status === 'ok' ? '✓ online' : '⚠ degraded';
    const ollama = data.services?.ollama ? '✓' : '✗';
    const chroma = data.services?.chromadb ? '✓' : '✗';
    const models = (data.models || [])
      .map((m) => `${m.name} ${m.available ? '✓' : '✗'}`)
      .join(' | ');

    return `## Quality Server Health

**Status:** ${status} | Ollama: ${ollama} | ChromaDB: ${chroma}
**Models:** ${models || 'none reported'}`;
  } catch {
    return `## Quality Server Health

**Status:** unreachable — Windows PC may be off or quality-server not running`;
  }
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}
