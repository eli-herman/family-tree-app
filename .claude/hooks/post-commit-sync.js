#!/usr/bin/env node
// PostToolUse hook: when Claude runs a git commit, auto-commit any dirty .planning/ files.
// Keeps planning docs in lockstep with code commits. Runs async — never blocks Claude.

const { execSync } = require('child_process');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  // Only fire on Bash tool calls
  if (input.tool_name !== 'Bash') process.exit(0);

  const command = (input.tool_input?.command || '').toLowerCase();

  // Only fire when Claude ran a git commit
  if (!command.includes('git commit')) process.exit(0);

  // Skip our own auto-generated commits to prevent loops
  if (
    command.includes('auto-update') ||
    command.includes('sync planning') ||
    command.includes('handoff.md') ||
    command.includes('--no-verify')
  ) {
    process.exit(0);
  }

  const cwd = input.cwd || process.cwd();
  try {
    process.chdir(cwd);
  } catch {
    process.exit(0);
  }

  // Only in git repos
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    process.exit(0);
  }

  // Check if .planning/ has any uncommitted changes (modified or untracked)
  const planningStatus = run('git status --porcelain .planning/');
  if (!planningStatus) process.exit(0);

  try {
    execSync('git add .planning/', { stdio: 'ignore' });

    // Verify something is actually staged before committing
    const staged = run('git diff --cached --stat .planning/');
    if (!staged) process.exit(0);

    const shortHash = run('git rev-parse --short HEAD') || 'init';
    execSync(`git commit -m "docs: sync planning docs [${shortHash}]" --no-verify`, {
      stdio: 'ignore',
    });
  } catch {
    // Fail silently
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
