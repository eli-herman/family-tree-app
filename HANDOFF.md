---
device: Mac.lan
branch: main
commit: 25dfbbe
timestamp: "2026-02-06T00:11:32Z"
---

# Session Handoff

## Summary
Last commit: `25dfbbe` on `main`
> fix: auto-detect Ollama model in git hooks (7b vs 14b)

Hooks were hardcoded to qwen2.5-coder:7b which doesn't exist on the
Windows PC (which has 14b). Now queries /api/tags to find whatever
qwen2.5-coder variant is loaded locally.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## Files Changed

- .claude/git-hooks/post-commit
- .claude/git-hooks/pre-push

## Diff Stats
```
 .claude/git-hooks/post-commit | 13 ++++++++++++-
 .claude/git-hooks/pre-push    | 11 ++++++++++-
 2 files changed, 22 insertions(+), 2 deletions(-)
```

## Active Tasks
_Update manually or via MCP tool._

## Blockers
_None detected._

## Next Steps
_See AI Summary below for suggestions._

## AI Summary
This commit fixes an issue where git hooks were hardcoded to use a specific model version (qwen2.5-coder:7b) that didn't exist on the developer's Windows PC, which uses a different model version (14b). The changes now allow the hooks to automatically detect and use the locally loaded qwen2.5-coder variant by querying an API endpoint (`/api/tags`). This ensures compatibility across different devices without manual adjustments.
