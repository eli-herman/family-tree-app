# Phase 1: Data Foundation - Research

**Researched:** 2026-02-02
**Domain:** Zustand state management, family relationship calculation
**Confidence:** HIGH

## Summary

This phase involves creating Zustand stores (familyStore, feedStore, userStore) and wiring them with mock data representing the Herman family. The project already has Zustand 5.0.11 installed with existing stores (authStore, feedStore, subscriptionStore) that follow good patterns.

The key technical challenges are:
1. Relationship calculation algorithm for in-laws (Preston as brother-in-law)
2. Store initialization with async `loadData()` pattern
3. Selector design for optimal re-render performance

**Primary recommendation:** Extend the existing store patterns. Store current user in `userStore` (not familyStore) to maintain separation of concerns. Use a two-hop traversal algorithm for in-law relationship calculation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | State management | Already installed, lightweight, React Native optimized |
| date-fns | 4.1.0 | Date formatting | Already installed, tree-shakeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand/react/shallow | 5.0.11 | Selector optimization | When returning objects from selectors |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zustand | Redux Toolkit | Zustand is lighter, already in project |
| Custom relationship calc | Genealogy library | Overkill for 9-member family tree |

**Installation:**
```bash
# Already installed - no new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   ├── authStore.ts      # EXISTS - User authentication state
│   ├── feedStore.ts      # EXISTS - Needs updates for selectors
│   ├── familyStore.ts    # NEW - Family members and relationships
│   ├── userStore.ts      # NEW - Current user profile (separate from auth)
│   └── index.ts          # EXISTS - Export all stores
├── types/
│   ├── user.ts           # EXISTS - Update FamilyMember interface
│   └── feed.ts           # EXISTS - FeedItem types
└── utils/
    ├── mockData.ts       # EXISTS - Update with Herman family data
    └── relationships.ts  # NEW - Relationship calculation utilities
```

### Pattern 1: Store with Async Loading
**What:** Initialize stores via `loadData()` action with loading/error states
**When to use:** All stores that will later connect to Firebase
**Example:**
```typescript
// Source: Zustand docs + existing authStore pattern
interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;
  getMemberById: (id: string) => FamilyMember | undefined;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate async load (later: Firebase)
      await new Promise(resolve => setTimeout(resolve, 100));
      set({ members: mockFamilyMembers, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load family data', isLoading: false });
    }
  },

  getMemberById: (id) => get().members.find(m => m.id === id),
}));
```

### Pattern 2: Optimistic Updates for Actions
**What:** Update UI immediately, then sync to backend (roll back on error)
**When to use:** toggleHeart, any user-facing actions
**Example:**
```typescript
// Source: Existing feedStore.ts pattern - already implemented correctly
toggleHeart: (itemId, userId) =>
  set((state) => ({
    items: state.items.map((item) => {
      if (item.id !== itemId) return item;
      const hearts = item.hearts.includes(userId)
        ? item.hearts.filter((id) => id !== userId)
        : [...item.hearts, userId];
      return { ...item, hearts };
    }),
  })),
```

### Pattern 3: Selector with useShallow for Objects
**What:** Use `useShallow` when selecting multiple values as object
**When to use:** Selecting multiple state pieces in one call
**Example:**
```typescript
// Source: Zustand v5 docs
import { useShallow } from 'zustand/react/shallow';

// In component:
const { members, isLoading } = useFamilyStore(
  useShallow(state => ({
    members: state.members,
    isLoading: state.isLoading,
  }))
);

// Better pattern - select individually for simple values:
const members = useFamilyStore(state => state.members);
const isLoading = useFamilyStore(state => state.isLoading);
```

### Pattern 4: Relationship Calculation Algorithm
**What:** Calculate relationship labels from current user's perspective
**When to use:** Profile display, tree node labels
**Algorithm:**
```typescript
// Fundamental relationships stored: parent, child, spouse
// Derived relationships calculated via traversal

type StoredRelationType = 'parent' | 'child' | 'spouse';

// Algorithm for in-laws:
// 1. Get path from current user to target
// 2. If path includes spouse->sibling, target is sibling-in-law
// 3. If path includes sibling->spouse, target is sibling-in-law

function calculateRelationship(
  currentUserId: string,
  targetId: string,
  members: FamilyMember[]
): string {
  const user = members.find(m => m.id === currentUserId);
  const target = members.find(m => m.id === targetId);

  if (!user || !target) return 'Unknown';
  if (currentUserId === targetId) return 'You';

  // Direct relationships
  const directRel = user.relationships.find(r => r.memberId === targetId);
  if (directRel) {
    return formatDirectRelationship(directRel.type, target);
  }

  // In-law: sibling's spouse
  const siblings = user.relationships.filter(r => r.type === 'sibling');
  for (const sibling of siblings) {
    const siblingMember = members.find(m => m.id === sibling.memberId);
    const isSpouseOfSibling = siblingMember?.relationships.find(
      r => r.type === 'spouse' && r.memberId === targetId
    );
    if (isSpouseOfSibling) {
      return target.gender === 'male' ? 'Your Brother-in-law' : 'Your Sister-in-law';
    }
  }

  // Grandparents: parent's parents
  // ... continue for other derived relationships

  return 'Family';
}
```

### Anti-Patterns to Avoid
- **Storing derived relationships:** Don't store "grandparent" or "brother-in-law" - calculate from parent/child/spouse
- **Mutating state directly:** Always use `set()` function
- **Selecting new objects without useShallow:** Causes unnecessary re-renders
- **Pre-loading stores:** Use `loadData()` pattern for future Firebase compatibility

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date logic | date-fns (already installed) | Edge cases, localization |
| Deep equality for selectors | Custom comparison | useShallow from zustand | Tested, optimized |
| Complex genealogy | Full genealogy algorithm | Simple 2-hop traversal | Family is small (9), MVP scope |

**Key insight:** The Herman family has only 9 members with 3 generations. A full genealogy algorithm (common ancestor, cousin removal, etc.) is overkill. Simple direct traversal for parent/child/spouse/sibling plus one-hop for in-laws covers all needed cases.

## Common Pitfalls

### Pitfall 1: Zustand v5 Selector Breaking Changes
**What goes wrong:** Runtime errors after creating selectors that return objects
**Why it happens:** Zustand v5 changed reference equality checks
**How to avoid:**
- Select primitive values individually (preferred)
- Use `useShallow` for object selections
**Warning signs:** Components re-render when unrelated state changes

### Pitfall 2: Circular Relationships in Mock Data
**What goes wrong:** Parent lists child, but child doesn't list parent
**Why it happens:** Manual mock data entry errors
**How to avoid:** Helper function to ensure bidirectional relationships
**Warning signs:** Relationship calculation fails or returns wrong values
```typescript
// Helper to ensure bidirectional relationships
function addRelationship(
  members: FamilyMember[],
  member1Id: string,
  member2Id: string,
  type1: RelationType,
  type2: RelationType
) {
  const m1 = members.find(m => m.id === member1Id);
  const m2 = members.find(m => m.id === member2Id);
  if (m1) m1.relationships.push({ memberId: member2Id, type: type1 });
  if (m2) m2.relationships.push({ memberId: member1Id, type: type2 });
}
```

### Pitfall 3: Current User Not Found
**What goes wrong:** Relationship calculation fails when current user not in store
**Why it happens:** User ID mismatch between authStore and familyStore
**How to avoid:** Store current user's memberId in userStore, validate on load
**Warning signs:** "Unknown" relationship labels for all members

### Pitfall 4: Async Initialization Race Conditions
**What goes wrong:** Components render before store data loads
**Why it happens:** `loadData()` is async, components mount immediately
**How to avoid:** Check `isLoading` state, show loading UI
**Warning signs:** Empty screens, undefined errors in selectors

## Code Examples

### FamilyMember Type (Updated)
```typescript
// Source: Extending existing types/user.ts
export interface FamilyMember {
  id: string;
  userId?: string;           // Links to User if they have an account
  firstName: string;
  lastName: string;
  nickname?: string;
  photoURL?: string;
  birthDate?: Date;
  deathDate?: Date;
  bio?: string;
  gender?: 'male' | 'female'; // Needed for relationship labels
  relationships: Relationship[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  memberId: string;
  type: 'parent' | 'child' | 'spouse'; // Only fundamental types stored
}
```

### Mock Data Structure (Herman Family)
```typescript
// Generation structure:
// Gen 1: Peggy (grandma), Ron (grandpa) - married
// Gen 2: Shelby (mom), Timothy (dad) - married (Shelby is Peggy+Ron's child)
// Gen 3: Ella, Eli, Bennett, Ember - children of Shelby+Timothy
// Plus: Preston (Ella's husband) - in-law

const mockHermanFamily: FamilyMember[] = [
  {
    id: 'peggy',
    firstName: 'Peggy',
    lastName: 'Deleenheer',
    nickname: 'Grandma',
    gender: 'female',
    relationships: [
      { memberId: 'ron', type: 'spouse' },
      { memberId: 'shelby', type: 'child' },
    ],
    // ... other fields
  },
  // ... remaining 8 members
];
```

### Store Initialization in App
```typescript
// Source: App entry point pattern
// In app/_layout.tsx or similar

import { useEffect } from 'react';
import { useFamilyStore, useUserStore, useFeedStore } from '@/stores';

export default function RootLayout() {
  const loadFamily = useFamilyStore(state => state.loadData);
  const loadUser = useUserStore(state => state.loadData);
  const loadFeed = useFeedStore(state => state.loadData);

  useEffect(() => {
    // Initialize all stores on app mount
    Promise.all([loadFamily(), loadUser(), loadFeed()]);
  }, []);

  // ... rest of layout
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing all relationship types | Store only parent/child/spouse | N/A | Simpler data, calculated labels |
| zustand v4 selectors | useShallow for object selectors | Zustand v5 (2024) | Must update selector patterns |
| Pre-loaded mock data | Async loadData() pattern | Best practice | Firebase-ready architecture |

**Deprecated/outdated:**
- Direct sibling storage: Calculate from shared parents instead
- Implicit equality checks: Zustand v5 requires explicit shallow comparison

## Recommendations for Claude's Discretion Areas

### Current User Location: userStore (Recommended)
**Rationale:**
- Separates authentication (authStore) from profile data (userStore)
- familyStore contains all family members including current user as FamilyMember
- userStore contains current user's memberId and preferences
- Cleaner separation of concerns

```typescript
// userStore structure
interface UserState {
  currentMemberId: string | null;  // Links to FamilyMember.id
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
}
```

### Additional Selectors for Tree Layout
- `getMembersByGeneration(generation: number)` - for tree row layout
- `getSpouseOf(memberId: string)` - for spouse connectors
- `getChildrenOf(memberId: string)` - for parent-child connectors
- `getParentsOf(memberId: string)` - for tree traversal

### Relationship Calculation Algorithm
See Pattern 4 above. Simple approach for MVP:
1. Check direct relationships first
2. One-hop check for in-laws (sibling's spouse)
3. Two-hop check for grandparents (parent's parent)
4. Default to "Family" for complex relationships

### Mock Data Details
- Use real birthdates for age calculations
- Short, warm bios reflecting each person
- 7-8 feed items testing different types (photo, memory, milestone, prompt_response)
- Feed items should have realistic dates and author distribution

## Open Questions

1. **Gender field on FamilyMember**
   - What we know: Needed for "Brother-in-law" vs "Sister-in-law" labels
   - What's unclear: Does existing FamilyMember type have gender?
   - Recommendation: Add optional `gender` field to FamilyMember type

2. **Sibling relationships**
   - What we know: Can be calculated from shared parents
   - What's unclear: Should siblings be stored directly or always calculated?
   - Recommendation: Calculate from shared parents, don't store sibling relationships

3. **Tree generation assignment**
   - What we know: Need to group members by generation for tree layout
   - What's unclear: Best algorithm for auto-detecting generation
   - Recommendation: Use parent depth from oldest generation (count hops to find root)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `/Users/eli.j.herman/projects/family-tree-app/src/stores/` - Current patterns
- Existing codebase: `/Users/eli.j.herman/projects/family-tree-app/src/types/` - Type definitions
- Zustand GitHub: https://github.com/pmndrs/zustand - Official documentation

### Secondary (MEDIUM confidence)
- [Zustand v5 selector discussion](https://github.com/pmndrs/zustand/discussions/2867) - Best practices
- [Lineage algorithm](https://github.com/williamcasey/lineage) - Relationship calculation approach
- [Family relationship calculator](https://www.codeproject.com/Articles/30315/Tree-Relationship-Calculator) - Algorithm reference
- [Sibling-in-law definition](https://en.wikipedia.org/wiki/Sibling-in-law) - In-law relationship rules

### Tertiary (LOW confidence)
- [Zustand React Native guide](https://www.djamware.com/post/68e0a9e01cbb3805f6ae8609/using-zustand-in-react-native-lightweight-state-management-done-right) - General patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Already installed, verified in package.json
- Architecture: HIGH - Based on existing codebase patterns
- Relationship algorithm: MEDIUM - Custom implementation, but simple for 9-member family
- Pitfalls: HIGH - Documented in Zustand v5 migration guide

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable libraries)
