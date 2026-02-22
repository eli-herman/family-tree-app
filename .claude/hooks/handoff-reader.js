#!/usr/bin/env node
// SessionStart hook: injects HANDOFF.md, dev-os PRIORITIES.md, and lessons-learned.md
// Fails silently if files don't exist

const fs = require('fs');
const path = require('path');
const os = require('os');

const cwd = process.cwd();
const devOsDir = path.join(os.homedir(), 'projects', 'dev-os');

function readFileSilent(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch {
    return null;
  }
}

try {
  const sections = [];

  // --- HANDOFF.md ---
  const handoffRaw = readFileSilent(path.join(cwd, 'HANDOFF.md'));
  if (handoffRaw) {
    const frontmatterMatch = handoffRaw.match(/^---\n([\s\S]*?)\n---/);
    let metadata = {};
    if (frontmatterMatch) {
      for (const line of frontmatterMatch[1].split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line
            .slice(colonIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
          metadata[key] = value;
        }
      }
    }

    const lines = [
      '--- Cross-Device Handoff Context ---',
      `Device: ${metadata.device || 'unknown'} | Branch: ${metadata.branch || 'unknown'} | Commit: ${metadata.commit || 'unknown'}`,
      `Last updated: ${metadata.timestamp || 'unknown'}`,
    ];
    if (metadata.timestamp) {
      const hoursDiff = (new Date() - new Date(metadata.timestamp)) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        lines.push(
          `[NOTE: This handoff is ${Math.round(hoursDiff)} hours old - context may be stale]`,
        );
      }
    }
    lines.push(handoffRaw.replace(/^---[\s\S]*?---\n/, '').trim());
    lines.push('--- End Handoff Context ---');
    sections.push(lines.join('\n'));
  }

  // --- PRIORITIES.md ---
  const priorities = readFileSilent(path.join(devOsDir, 'PRIORITIES.md'));
  if (priorities) {
    sections.push(`--- dev-os PRIORITIES ---\n${priorities}\n--- End PRIORITIES ---`);
  }

  // --- lessons-learned.md ---
  const lessons = readFileSilent(path.join(devOsDir, 'patterns', 'lessons-learned.md'));
  if (lessons) {
    sections.push(`--- Lessons Learned ---\n${lessons}\n--- End Lessons Learned ---`);
  }

  if (sections.length > 0) {
    process.stdout.write(sections.join('\n\n'));
  }
} catch {
  process.exit(0);
}
