#!/usr/bin/env node
// Reads HANDOFF.md on session start and outputs context for Claude
// Fails silently if no HANDOFF.md exists

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const handoffFile = path.join(cwd, 'HANDOFF.md');

try {
  if (!fs.existsSync(handoffFile)) {
    // No handoff file - silent exit
    process.exit(0);
  }

  const content = fs.readFileSync(handoffFile, 'utf-8');

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let metadata = {};
  if (frontmatterMatch) {
    const lines = frontmatterMatch[1].split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
        metadata[key] = value;
      }
    }
  }

  // Check freshness - warn if handoff is older than 24 hours
  let freshnessNote = '';
  if (metadata.timestamp) {
    const handoffTime = new Date(metadata.timestamp);
    const now = new Date();
    const hoursDiff = (now - handoffTime) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      freshnessNote = `\n[NOTE: This handoff is ${Math.round(hoursDiff)} hours old - context may be stale]`;
    }
  }

  // Output context for Claude to consume
  const output = [
    '--- Cross-Device Handoff Context ---',
    `Device: ${metadata.device || 'unknown'} | Branch: ${metadata.branch || 'unknown'} | Commit: ${metadata.commit || 'unknown'}`,
    `Last updated: ${metadata.timestamp || 'unknown'}`,
    freshnessNote,
    '',
    content.replace(/^---[\s\S]*?---\n/, '').trim(),
    '',
    '--- End Handoff Context ---',
  ].filter(Boolean).join('\n');

  process.stdout.write(output);
} catch (err) {
  // Fail silently - don't disrupt session start
  process.exit(0);
}
