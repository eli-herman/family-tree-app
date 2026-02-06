# sync.ps1 - Cross-device synchronization script (Windows PowerShell)
# Run this when switching to this device to pull latest and get context

$ErrorActionPreference = "Continue"

# Find repo root
try {
    $RepoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $RepoRoot) { throw "Not a git repo" }
} catch {
    Write-Host "[ERROR] Not in a git repository. cd to the project first." -ForegroundColor Red
    exit 1
}

$HandoffFile = Join-Path $RepoRoot "HANDOFF.md"
$HooksDir = Join-Path $RepoRoot ".claude\git-hooks"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Device Sync - $env:COMPUTERNAME"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm UTC')"
Write-Host "============================================"
Write-Host ""

# 1. Pull latest changes
Write-Host "--- Step 1: Pull latest ---" -ForegroundColor Yellow
try {
    $pullResult = git pull --rebase origin main 2>&1
    Write-Host $pullResult
    Write-Host "[OK] Repository up to date" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Pull failed - you may need to resolve conflicts" -ForegroundColor Yellow
}
Write-Host ""

# 2. Display HANDOFF.md
Write-Host "--- Step 2: Session Handoff ---" -ForegroundColor Yellow
if (Test-Path $HandoffFile) {
    Write-Host ""
    Get-Content $HandoffFile | Write-Host
    Write-Host ""
} else {
    Write-Host "[INFO] No HANDOFF.md found - this may be a fresh start"
}
Write-Host ""

# 3. Validate environment
Write-Host "--- Step 3: Environment Check ---" -ForegroundColor Yellow

# Check Ollama
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $models = ($ollamaCheck.models | ForEach-Object { $_.name }) -join ", "
    Write-Host "[OK] Ollama running. Models: $models" -ForegroundColor Green

    if ($models -match "qwen2.5-coder") {
        Write-Host "[OK] qwen2.5-coder model loaded" -ForegroundColor Green
    } else {
        Write-Host "[WARN] qwen2.5-coder not found. Run: ollama pull qwen2.5-coder:14b" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Ollama not running. Start with: ollama serve" -ForegroundColor Yellow
}

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Node.js not found" -ForegroundColor Yellow
}

# Check node_modules
if (Test-Path (Join-Path $RepoRoot "node_modules")) {
    Write-Host "[OK] node_modules present" -ForegroundColor Green
} else {
    Write-Host "[WARN] node_modules missing. Run: npm install" -ForegroundColor Yellow
}

# Check jq
try {
    $null = Get-Command jq -ErrorAction Stop
    Write-Host "[OK] jq installed" -ForegroundColor Green
} catch {
    Write-Host "[WARN] jq not found. Install: choco install jq" -ForegroundColor Yellow
}
Write-Host ""

# 4. Configure core.hooksPath
Write-Host "--- Step 4: Git Hooks ---" -ForegroundColor Yellow
$currentHooksPath = git config --local core.hooksPath 2>$null
if ($currentHooksPath -eq ".claude/git-hooks") {
    Write-Host "[OK] core.hooksPath already set" -ForegroundColor Green
} elseif (Test-Path $HooksDir) {
    git config --local core.hooksPath ".claude/git-hooks"
    Write-Host "[OK] core.hooksPath configured -> .claude/git-hooks" -ForegroundColor Green
} else {
    Write-Host "[WARN] Git hooks directory not found at $HooksDir" -ForegroundColor Yellow
}
Write-Host ""

# 4b. Generate device-specific .mcp.json
Write-Host "--- Step 4b: MCP Server Config ---" -ForegroundColor Yellow
$McpJson = Join-Path $RepoRoot ".mcp.json"
$DistPath = Join-Path $RepoRoot ".claude\mcp-local-model\dist\index.js"
# Use forward slashes for the JSON (Node.js handles both)
$DistPathForJson = $DistPath -replace '\\', '/'

# Detect the right model for this device
$OllamaModel = "qwen2.5-coder:7b"
try {
    $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $models = $tags.models | ForEach-Object { $_.name }
    if ($models -match "qwen2.5-coder:14b") {
        $OllamaModel = "qwen2.5-coder:14b"
    }
} catch {}

$mcpContent = @"
{
  "mcpServers": {
    "local-model": {
      "type": "stdio",
      "command": "node",
      "args": ["$DistPathForJson"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434",
        "OLLAMA_MODEL": "$OllamaModel"
      }
    }
  }
}
"@
Set-Content -Path $McpJson -Value $mcpContent -Encoding UTF8
Write-Host "[OK] .mcp.json generated (model: $OllamaModel)" -ForegroundColor Green
Write-Host ""

# 5. Generate session brief using local model
Write-Host "--- Step 5: Session Brief ---" -ForegroundColor Yellow
try {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    $recentCommits = git log --oneline -5 2>$null | Out-String
    $status = git status --short 2>$null | Out-String

    $handoffContent = ""
    if (Test-Path $HandoffFile) {
        $handoffContent = Get-Content $HandoffFile -Raw
    }

    $promptText = @"
Generate a brief session startup summary for a developer switching devices. Be concise (3-5 bullet points).

Branch: $branch
Device: $env:COMPUTERNAME

Recent commits:
$recentCommits

Working tree status:
$status

Handoff notes:
$handoffContent

Format as bullet points: what's the current state, what was last worked on, what to do next.
"@

    $body = @{
        model = "qwen2.5-coder:14b"
        prompt = $promptText
        stream = $false
        options = @{
            temperature = 0.3
            num_predict = 300
        }
    } | ConvertTo-Json -Depth 3

    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
        -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15

    if ($response.response) {
        Write-Host $response.response
    } else {
        Write-Host "[INFO] Could not generate brief - Ollama may still be loading"
    }
} catch {
    Write-Host "[INFO] Ollama unavailable - skipping session brief"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Sync complete! Ready to work."
Write-Host "============================================"
