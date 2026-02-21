#!/usr/bin/env node
// Stop hook: auto-generates and commits HANDOFF.md when Claude session ends.
// Fires on every Stop event. Fails silently — never blocks session end.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
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

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}
