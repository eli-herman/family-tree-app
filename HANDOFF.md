---
device: Mac.lan
branch: main
commit: 5039aca
timestamp: '2026-02-07T08:27:10Z'
---

# Session Handoff

## Summary

Last commit: `5039aca` on `main`

> chore: update HANDOFF.md [31624c0]

- Implemented Firestore-backed **family units** with single-parent support and typed child links.
- Added `addSpouse`, `addChild`, `addSibling`, and `addParent` actions with relationship normalization.
- Member profile now supports **Add Spouse/Add Parent/Add Child/Add Sibling** + relation type chips.
- Tree layout + connectors now support single-parent units (no spouse line).
- Enforced **one partner at a time** (blocks adding spouse if already partnered).
- Tree nodes now navigate to member modal on tap.
- Dev-only seed: if Firestore is empty, mock data is written to `families/demo-family/*`.
- Added repo professionalism baseline: README, CONTRIBUTING, LICENSE.
- Added ESLint + Prettier configs and lint/format scripts.
- Added Jest config + initial relationship utility tests.
- Added GitHub Actions CI plus issue/PR templates.
- Added Husky + lint-staged pre-commit hooks.
- Added a terminal-style README banner ("The Vine" + John 15:5).
- Added `react-dom@19.1.0` to align with React and fix npm ERESOLVE on install.
- Updated `eslint-config-expo` to `55.0.0`; `npm install`, lint, test, and typecheck now succeed.
- Removed deprecated `@testing-library/jest-native` and updated Jest setup.
- Ran `npm audit fix` and cleared the high-severity vulnerability.
- Reset Watchman watch to remove recrawl warnings.
- Updated README with CI + secret scanning badges; removed ASCII banner.
- Added Dependabot config for npm + GitHub Actions updates.
- Added README note for enabling GitHub secret scanning.

## Files Changed (this session)

- app/(tabs)/tree.tsx
- app/(tabs)/\_layout.tsx
- app/(tabs)/profile.tsx
- app/member/[id].tsx
- app/paywall.tsx
- src/stores/familyStore.ts
- src/stores/subscriptionStore.ts
- src/types/tree.ts
- src/types/user.ts
- src/utils/relationships.ts
- src/utils/**tests**/relationships.test.ts
- src/components/common/Avatar.tsx
- src/components/feed/FeedItem.tsx
- src/components/feed/PromptCard.tsx
- src/components/profile/ProfileHeader.tsx
- HANDOFF.md
- .claude/agents/status-board.md
- .claude/agents/updates-log.md
- .claude/changelog.md
- .codex/quick/006-add-member-plan/006-SUMMARY.md
- README.md
- CONTRIBUTING.md
- LICENSE
- package.json
- package-lock.json
- .eslintrc.js
- .eslintignore
- .prettierrc
- .prettierignore
- jest.config.js
- jest.setup.ts
- .github/workflows/ci.yml
- .github/pull_request_template.md
- .github/ISSUE_TEMPLATE/bug_report.md
- .github/ISSUE_TEMPLATE/feature_request.md
- .github/dependabot.yml
- .husky/pre-commit

## Unrelated Local Changes

- Existing unstaged tooling changes under `.claude/mcp-local-model/` (left untouched).

## Active Tasks

- Verify add-member flow on device (spouse + parent + child + sibling) and confirm connectors remain stable.
- If tree shows only a small subset, clear `families/demo-family/*` so dev seed re-runs.

## Blockers

- None known (Firebase project exists; Storage still on Spark).

## Notes

- Canonical units live in Firestore: `families/{familyId}/units` with `partnerIds` + `childLinks`.
- Child links support per-parent relation types: `biological`, `adopted`, `step`, `guardian`.
- Relationships are derived on load and after writes; member docs do not store relationships.
- Single-parent supported; only one partner at a time enforced.
- `npm audit` is clean; watchman recrawl warnings resolved.
- `npm install` reported deprecated packages; consider dependency refresh later.
- Secret scanning must be enabled in GitHub settings (Repository Settings → Security & analysis).

## Next Steps

1. Add spouse + parent + child + sibling on device; confirm layout/connector stability.
2. If desired, add an explicit “Add Member” entry point on the tree header.
3. Decide if/when to allow sequential partners (divorced/widowed history).
