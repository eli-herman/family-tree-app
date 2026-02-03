# Technology Stack Patterns

**Project:** The Vine MVP Stabilization
**Researched:** 2026-02-02
**Focus:** Patterns for existing stack, not stack changes

## Existing Stack (Confirmed)

| Technology | Version | Status |
|------------|---------|--------|
| Expo | ~54.0.33 | Established |
| React Native | 0.81.5 | Established |
| TypeScript | ~5.9.2 | Established |
| expo-router | ~6.0.23 | Established |
| Zustand | ^5.0.11 | Established |
| Firebase | ^12.8.0 | Configured, not connected |
| react-native-purchases | ^9.7.5 | Configured, not connected |

## Modal Navigation Patterns (expo-router)

**Confidence:** HIGH (verified with expo-router docs)

### Presentation Modes

```typescript
// In _layout.tsx - configure modal presentation
<Stack.Screen
  name="member/[id]"
  options={{
    presentation: 'modal',
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'vertical'
  }}
/>
```

### Navigation to Modal

```typescript
// From any screen - navigate with params
import { router } from 'expo-router';

// Push modal with member ID
router.push(`/member/${memberId}`);

// Or with typed routes
router.push({ pathname: '/member/[id]', params: { id: memberId } });
```

### Dismissing Modal

```typescript
// Inside modal component
import { router } from 'expo-router';

// Dismiss modal
router.back();
// or
router.dismiss();
```

## Mock Data Patterns (Zustand)

**Confidence:** HIGH (standard Zustand patterns)

### Initialize Store with Mock Data

```typescript
// src/stores/familyStore.ts
import { create } from 'zustand';
import { mockFamilyMembers } from '@/utils/mockData';

interface FamilyStore {
  members: FamilyMember[];
  getMemberById: (id: string) => FamilyMember | undefined;
  // Actions for future Firebase integration
  loadMembers: () => void;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  members: mockFamilyMembers, // Initialize with mock data
  getMemberById: (id) => get().members.find(m => m.id === id),
  loadMembers: () => {
    // Currently uses mock, later: fetch from Firebase
    set({ members: mockFamilyMembers });
  },
}));
```

### Selector Pattern for Performance

```typescript
// In components - use selectors to prevent re-renders
const member = useFamilyStore(state =>
  state.members.find(m => m.id === memberId)
);
```

## Button/Interaction Patterns

**Confidence:** HIGH (React Native standard patterns)

### Pressable over TouchableOpacity

```typescript
import { Pressable, StyleSheet } from 'react-native';

// Modern approach with feedback states
<Pressable
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed
  ]}
  hitSlop={8} // Increase touch target
>
  {({ pressed }) => (
    <Text style={pressed ? styles.textPressed : styles.text}>
      Button Text
    </Text>
  )}
</Pressable>
```

### Handler Patterns

```typescript
// Consistent handler naming
const handleMemberPress = (memberId: string) => {
  router.push(`/member/${memberId}`);
};

const handleHeartPress = (itemId: string) => {
  feedStore.toggleHeart(itemId);
};

const handleSettingsPress = (setting: string) => {
  router.push(`/settings/${setting}`);
};
```

## Layout Debugging

**Confidence:** MEDIUM (common patterns)

### Debugging Spacing Issues

```typescript
// Temporary debug styles
const debugBorder = { borderWidth: 1, borderColor: 'red' };

// Apply to components to visualize boundaries
<View style={[styles.container, __DEV__ && debugBorder]}>
```

### Common Spacing Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Content cut off | Missing flex: 1 | Add flex: 1 to parent containers |
| Uneven spacing | Mixed padding/margin | Use consistent spacing constants |
| Safe area issues | No SafeAreaView | Wrap in SafeAreaView or use useSafeAreaInsets |
| Keyboard overlap | No KeyboardAvoidingView | Wrap forms in KeyboardAvoidingView |

### SafeAreaView Pattern

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Component = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }}>
      {/* Content */}
    </View>
  );
};
```

## Sources

- Expo Router documentation (modal presentation)
- Zustand documentation (store patterns)
- React Native documentation (Pressable, layout)
