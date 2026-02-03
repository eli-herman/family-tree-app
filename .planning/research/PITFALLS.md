# Domain Pitfalls

**Domain:** React Native family app MVP
**Researched:** 2026-02-02

## Critical Pitfalls

### Pitfall 1: Modal Not Presenting Correctly

**What goes wrong:** Tapping a tree node navigates but modal doesn't slide up properly, or shows as full screen instead of modal.

**Why it happens:** Missing `presentation: 'modal'` in Stack.Screen options, or screen is nested incorrectly in route structure.

**Prevention:**
```typescript
// app/_layout.tsx - MUST configure at root level
<Stack.Screen
  name="member/[id]"
  options={{ presentation: 'modal' }}
/>
```

**Detection:** Modal appears as full page push instead of sliding up from bottom.

**Fix:** Check that modal route is defined in root `_layout.tsx`, not inside `(tabs)/_layout.tsx`.

### Pitfall 2: useLocalSearchParams Returns Undefined

**What goes wrong:** Member ID is undefined in modal, causing "member not found" errors.

**Why it happens:** Route params not typed correctly, or navigation called without params.

**Prevention:**
```typescript
// Correct typing
const { id } = useLocalSearchParams<{ id: string }>();

// Correct navigation
router.push(`/member/${memberId}`); // NOT router.push('/member/[id]')
```

**Detection:** Console shows undefined ID, or profile shows loading/error state.

**Fix:** Check navigation call includes actual ID value, not the route pattern.

### Pitfall 3: Store Data Not Updating UI

**What goes wrong:** Zustand store updates but component doesn't re-render.

**Why it happens:** Using store incorrectly (calling store outside component), or selector returning new reference each time.

**Prevention:**
```typescript
// WRONG - creates new function each render
const member = useFamilyStore(state => state.members.find(m => m.id === id));

// BETTER - stable selector
const getMemberById = useFamilyStore(state => state.getMemberById);
const member = getMemberById(id);

// BEST - selector in store
const member = useFamilyStore(state => state.getMemberById(id));
```

**Detection:** Data changes in store but UI shows stale data.

**Fix:** Use shallow equality or move selector logic into store.

## Moderate Pitfalls

### Pitfall 4: Pressable Not Responding

**What goes wrong:** Tapping button does nothing - no visual feedback, no handler called.

**Why it happens:** Touch target too small, handler not bound correctly, or parent View absorbing touches.

**Prevention:**
```typescript
// Add hitSlop for larger touch target
<Pressable
  onPress={handlePress}
  hitSlop={8}
  style={({ pressed }) => [
    styles.button,
    pressed && { opacity: 0.7 } // Visual feedback
  ]}
>
```

**Detection:** Tap does nothing, no console log if handler has logging.

**Fix:**
1. Add console.log in handler to verify it's called
2. Check parent Views for `pointerEvents="none"` or overlapping absolute positioned elements
3. Increase hitSlop

### Pitfall 5: SafeArea Content Clipping

**What goes wrong:** Content hidden behind notch or home indicator.

**Why it happens:** Missing SafeAreaView or incorrect inset usage.

**Prevention:**
```typescript
// For full-screen modals
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
```

**Detection:** Content visually cut off at top or bottom of screen.

**Fix:** Add SafeAreaView wrapper or use useSafeAreaInsets hook.

### Pitfall 6: Paywall Spacing Issues

**What goes wrong:** Elements overlap, spacing inconsistent, or content overflows.

**Why it happens:** Mixed padding/margin approaches, missing flex properties, or fixed heights on variable content.

**Prevention:**
- Use spacing constants consistently
- Prefer flex layouts over fixed heights
- Test on multiple screen sizes

**Detection:** Visual inspection shows crowded or misaligned elements.

**Fix:**
1. Add debug borders to visualize component boundaries
2. Replace fixed heights with flex
3. Use consistent spacing values from constants

## Minor Pitfalls

### Pitfall 7: Missing Loading States

**What goes wrong:** Screen shows briefly empty or errors before data loads.

**Why it happens:** No loading state handling, assuming synchronous data.

**Prevention:**
```typescript
if (!member) {
  return <LoadingSpinner />; // or skeleton
}
```

**Detection:** Flash of empty content or error message on navigation.

### Pitfall 8: Logout Not Clearing State

**What goes wrong:** User logs out but sees stale data on next login.

**Why it happens:** Stores not reset on logout.

**Prevention:**
```typescript
// In logout handler
authStore.logout();
feedStore.reset();
familyStore.reset();
router.replace('/login');
```

**Detection:** Log in as different user, see previous user's data.

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Paywall fix | Spacing issues | Debug borders, consistent constants |
| Member modal | Params undefined | Type params, verify navigation call |
| Tree interactions | Pressable not responding | hitSlop, check handler binding |
| Profile settings | Navigation not working | Verify route exists in _layout |
| Feed actions | Store not updating | Check selector patterns |

## Quick Debugging Checklist

When something doesn't work:

1. [ ] Console.log in handler - is it being called?
2. [ ] Check route params - are they defined?
3. [ ] Check store state - is data there?
4. [ ] Add debug borders - is layout correct?
5. [ ] Check _layout.tsx - is route configured?
6. [ ] Check navigation call - using correct path?
