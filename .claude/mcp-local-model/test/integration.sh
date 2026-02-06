#!/bin/bash
# Integration test for Quality Server + MCP pipeline
# Usage: bash test/integration.sh [host]
#
# Tests:
#   1. Health check (services + models)
#   2. Generate (14B model)
#   3. Embed (nomic-embed-text)
#   4. Index + Search (ChromaDB pipeline)
#   5. Collections management
#   6. Input validation (400 errors)
#   7. QA status endpoint

set -euo pipefail

HOST="${1:-http://192.168.1.190:4000}"
PASS=0
FAIL=0
TOTAL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local name="$1"
  local expected_status="$2"
  local actual_status="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$actual_status" = "$expected_status" ]; then
    green "  PASS: $name (HTTP $actual_status)"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $name (expected $expected_status, got $actual_status)"
    FAIL=$((FAIL + 1))
  fi
}

bold "=== Quality Server Integration Tests ==="
echo "Target: $HOST"
echo ""

# 1. Health
bold "1. Health Check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/health")
check "GET /health" "200" "$STATUS"

HEALTH_DATA=$(curl -s "$HOST/health")
echo "   Response: $HEALTH_DATA" | head -c 200
echo ""

# 2. Status
bold "2. Status"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/status")
check "GET /status" "200" "$STATUS"

# 3. Generate
bold "3. Generate"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Reply with exactly: TEST_OK","system":"You are a test."}')
check "POST /generate" "200" "$STATUS"

# 4. Generate - validation
bold "4. Input Validation"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/generate" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /generate (no prompt) → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/embed" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /embed (no text) → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/search" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /search (no query) → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/index" \
  -H "Content-Type: application/json" \
  -d '{}')
check "POST /index (no files) → 400" "400" "$STATUS"

# 5. Embed
bold "5. Embed"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/embed" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world integration test"}')
check "POST /embed (single)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/embed" \
  -H "Content-Type: application/json" \
  -d '{"texts":["hello","world"]}')
check "POST /embed (batch)" "200" "$STATUS"

# 6. Index + Search
bold "6. Index + Search Pipeline"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/index" \
  -H "Content-Type: application/json" \
  -d '{"files":[{"path":"test/hello.ts","content":"export function hello() { return \"world\"; }"}],"collection":"integration-test"}')
check "POST /index" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$HOST/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"hello function","collection":"integration-test","limit":3}')
check "POST /search" "200" "$STATUS"

# 7. Collections
bold "7. Collections"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/collections")
check "GET /collections" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$HOST/collections/integration-test")
check "DELETE /collections/integration-test" "200" "$STATUS"

# 8. QA Status
bold "8. QA Status"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/qa/status")
check "GET /qa/status" "200" "$STATUS"

# Summary
echo ""
bold "=== Results ==="
echo "Total: $TOTAL | $(green "Pass: $PASS") | $(red "Fail: $FAIL")"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
