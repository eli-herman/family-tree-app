#!/usr/bin/env bash
# sync.sh - Cross-device synchronization script (Mac/Linux)
# Run this when switching to this device to pull latest and get context

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$REPO_ROOT" ]; then
  echo "[ERROR] Not in a git repository. cd to the project first."
  exit 1
fi

HANDOFF_FILE="${REPO_ROOT}/HANDOFF.md"
HOOKS_DIR="${REPO_ROOT}/.claude/git-hooks"

echo "============================================"
echo "  Device Sync - $(hostname)"
echo "  $(date -u +"%Y-%m-%d %H:%M UTC")"
echo "============================================"
echo ""

# 1. Pull latest changes
echo "--- Step 1: Pull latest ---"
if git pull --rebase origin main 2>&1; then
  echo "[OK] Repository up to date"
else
  echo "[WARN] Pull failed - you may need to resolve conflicts"
fi
echo ""

# 2. Display HANDOFF.md
echo "--- Step 2: Session Handoff ---"
if [ -f "$HANDOFF_FILE" ]; then
  echo ""
  cat "$HANDOFF_FILE"
  echo ""
else
  echo "[INFO] No HANDOFF.md found - this may be a fresh start"
fi
echo ""

# 3. Validate environment
echo "--- Step 3: Environment Check ---"

# Check Ollama
if curl -s --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
  MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null || echo "unknown")
  echo "[OK] Ollama running. Models: ${MODELS}"

  # Check for expected model
  if echo "$MODELS" | grep -q "qwen2.5-coder"; then
    echo "[OK] qwen2.5-coder model loaded"
  else
    echo "[WARN] qwen2.5-coder not found. Run: ollama pull qwen2.5-coder:7b"
  fi
else
  echo "[WARN] Ollama not running. Start with: ollama serve"
fi

# Check Node.js
if command -v node &>/dev/null; then
  echo "[OK] Node.js $(node --version)"
else
  echo "[WARN] Node.js not found"
fi

# Check node_modules
if [ -d "${REPO_ROOT}/node_modules" ]; then
  echo "[OK] node_modules present"
else
  echo "[WARN] node_modules missing. Run: npm install"
fi

# Check jq
if command -v jq &>/dev/null; then
  echo "[OK] jq installed"
else
  echo "[WARN] jq not found. Install: brew install jq"
fi
echo ""

# 4. Configure core.hooksPath
echo "--- Step 4: Git Hooks ---"
CURRENT_HOOKS_PATH=$(git config --local core.hooksPath 2>/dev/null || echo "")
if [ "$CURRENT_HOOKS_PATH" = ".claude/git-hooks" ]; then
  echo "[OK] core.hooksPath already set"
elif [ -d "$HOOKS_DIR" ]; then
  git config --local core.hooksPath .claude/git-hooks
  echo "[OK] core.hooksPath configured -> .claude/git-hooks"
else
  echo "[WARN] Git hooks directory not found at ${HOOKS_DIR}"
fi
echo ""

# 5. Generate session brief using local model
echo "--- Step 5: Session Brief ---"
if command -v jq &>/dev/null && command -v curl &>/dev/null; then
  # Gather context for the brief
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  RECENT_COMMITS=$(git log --oneline -5 2>/dev/null || echo "No recent commits")
  STATUS=$(git status --short 2>/dev/null || echo "Clean")

  HANDOFF_CONTENT=""
  if [ -f "$HANDOFF_FILE" ]; then
    HANDOFF_CONTENT=$(cat "$HANDOFF_FILE")
  fi

  PROMPT_TEXT="Generate a brief session startup summary for a developer switching devices. Be concise (3-5 bullet points).

Branch: ${BRANCH}
Device: $(hostname)

Recent commits:
${RECENT_COMMITS}

Working tree status:
${STATUS}

Handoff notes:
${HANDOFF_CONTENT}

Format as bullet points: what's the current state, what was last worked on, what to do next."

  JSON_PAYLOAD=$(jq -n \
    --arg model "qwen2.5-coder:7b" \
    --arg prompt "$PROMPT_TEXT" \
    '{model: $model, prompt: $prompt, stream: false, options: {temperature: 0.3, num_predict: 300}}')

  RESPONSE=$(curl -s --max-time 15 \
    -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" 2>/dev/null || echo "")

  if [ -n "$RESPONSE" ]; then
    BRIEF=$(echo "$RESPONSE" | jq -r '.response // empty' 2>/dev/null || echo "")
    if [ -n "$BRIEF" ]; then
      echo "$BRIEF"
    else
      echo "[INFO] Could not generate brief - Ollama may still be loading"
    fi
  else
    echo "[INFO] Ollama unavailable - skipping session brief"
  fi
else
  echo "[SKIP] jq or curl not available - install for AI-powered briefs"
fi

echo ""
echo "============================================"
echo "  Sync complete! Ready to work."
echo "============================================"
