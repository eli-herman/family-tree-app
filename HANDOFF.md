---
device: Mac.lan
branch: fix/tree-focus-anchor
commit: fa3deb3
timestamp: '2026-02-08T02:48:57Z'
---

# Session Handoff

## Summary

Last commit: `fa3deb3` on `fix/tree-focus-anchor`

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
- Added app-level ErrorBoundary with safe fallback UI and retry action.
- Added accessibility labels/roles to interactive controls across the app.
- Removed relationship labels (Parent/Grandparent/Sibling) from tree nodes; kept relationships for layout only.
- Tree now re-centers focus on the tapped member; add-sibling anchors to a parent so new siblings appear in the tree.
- Open PR: `fix/tree-focus-anchor` → `main` (merge after CI passes).
- Planning next: Relationship wizard to add extended relatives (uncle/cousin/grandparent) via guided questions.
- User is enrolled in the GitHub Education Benefits program.
- Added Dependabot config for npm + GitHub Actions updates.
- Added README note for enabling GitHub secret scanning.

## Files Changed (this session)

- app/(tabs)/tree.tsx
- app/(tabs)/\_layout.tsx
- app/(tabs)/profile.tsx
- app/\_layout.tsx
- app/(auth)/login.tsx
- app/(auth)/signup.tsx
- app/(auth)/forgot-password.tsx
- app/member/[id].tsx
- app/paywall.tsx
- src/stores/familyStore.ts
- src/stores/subscriptionStore.ts
- src/types/tree.ts
- src/types/user.ts
- src/utils/relationships.ts
- src/utils/**tests**/relationships.test.ts
- src/components/common/Avatar.tsx
- src/components/common/ErrorBoundary.tsx
- src/components/common/index.ts
- src/components/common/Button.tsx
- src/components/common/FeatureGate.tsx
- src/components/common/UpgradeBanner.tsx
- src/components/feed/FeedItem.tsx
- src/components/feed/PromptCard.tsx
- src/components/profile/ProfileHeader.tsx
- src/components/tree/TreeNode.tsx
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

- Merge PR `fix/tree-focus-anchor` after CI.
- Define relationship wizard flow + mapping rules for extended relatives.
- Verify add-member flow on device (spouse + parent + child + sibling + uncle/cousin) and confirm connectors remain stable.

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

## Relationship Wizard Plan (Most Recent)

1. **Question flow (simple UX)**: Who is this related to? → relationship type → clarifying parent/relative only when needed → basic details → review.
2. **Mapping engine**: add `addRelative()` to translate high-level relations into base ops (addParent/addChild/addSibling/addSpouse).
3. **Auto-focus**: after save, center tree on the correct anchor unit so the new member is visible immediately.
4. **Validation**: explain missing anchors and offer to add them first.
5. **Verification**: test parent/child/sibling + uncle/cousin/grandparent flows; confirm connectors and focus.

## Student Pack Tools (Recommended)

**Use now**

- Sentry (crash + error tracking)
- Doppler (secrets management)
- 1Password (shared credentials)
- BrowserStack (real device testing)
- GitHub Pages (project landing page)

**Next stage**

- New Relic (performance/observability)
- GitHub Codespaces (reproducible dev env)
- Namecheap (domain + SSL)
- Heroku (simple backend services)

## Next Steps

1. Merge PR `fix/tree-focus-anchor`.
2. Implement relationship wizard (guided questions → base relations).
3. Add explicit “Add Member” entry point on the tree header (if desired).
4. Decide if/when to allow sequential partners (divorced/widowed history).
5. Run a quick VoiceOver/TalkBack pass to confirm labels read well.
