# Phase 1: Data Foundation - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Create and wire Zustand stores with mock data so all components have reliable data sources. Stores include familyStore, feedStore, authStore, and userStore. Components will read from stores instead of local state.

</domain>

<decisions>
## Implementation Decisions

### Store Structure
- Four stores: `familyStore`, `feedStore`, `authStore` (exists), `userStore`
- Claude decides whether current user is in familyStore or separate
- Initialize stores on app mount via `loadData()` call (not pre-loaded)
- Include `isLoading` and `error` states in stores for future Firebase migration

### Mock Data Scope
- **9 family members** (real Herman family):
  1. Peggy Deleenheer — Grandma (Mom's mom)
  2. Ron Deleenheer — Grandpa (Mom's dad)
  3. Shelby Herman — Mom
  4. Timothy Herman — Dad
  5. Ella Fu — Older sister
  6. Preston Fu — Ella's husband (brother-in-law)
  7. Eli Herman — Current user
  8. Bennett Herman — Younger brother
  9. Ember Herman — Younger sister
- **5-10 feed items** for testing scroll and interactions

### Data Relationships
- Store fundamental relationships only: parent/child, spouse
- Relationship labels calculated client-side from current user's perspective
- When Eli views Shelby's profile → "Your Mom"
- When Eli views Preston's profile → "Your Brother-in-law" (calculated via Ella)
- Profile shows single relationship label, not a connections list (tree handles that)

### Selectors & Actions
- **familyStore:**
  - `getMemberById(id)` — get single member
  - `calculateRelationship(memberId)` — relationship label from user's perspective
  - Claude adds other needed selectors (getMembersByGeneration, etc.)
- **feedStore:**
  - `getItemsByAuthor(memberId)` — posts by a member
  - `toggleHeart(itemId)` — toggle heart reaction
  - `getComments(itemId)` — comments for a post
- All actions are **optimistic** — UI updates immediately

### Claude's Discretion
- Whether current user lives in familyStore or userStore
- Additional selectors needed for tree layout
- Exact relationship calculation algorithm
- Mock data details (birthdays, bios, feed content)

</decisions>

<specifics>
## Specific Ideas

- Use real Herman family names and relationships for authentic testing
- Relationship calculation should handle in-laws (Preston is Ella's spouse → brother-in-law to Eli)
- 9 members tests tree scrolling with 3 generations (grandparents, parents, siblings + spouse)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-foundation*
*Context gathered: 2026-02-02*
