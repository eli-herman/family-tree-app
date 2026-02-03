# Architecture Patterns

**Domain:** React Native family app
**Researched:** 2026-02-02

## Data Flow: Mock → Store → Component

### Current Flow (To Implement)

```
mockData.ts
    ↓
Zustand Store (familyStore, feedStore)
    ↓
Screen Component (tree.tsx, index.tsx)
    ↓
UI Component (TreeNode, FeedItem)
    ↓
User Interaction
    ↓
Store Action (e.g., toggleHeart)
    ↓
Store Update → Re-render
```

### Store Initialization Pattern

```typescript
// src/stores/familyStore.ts
import { create } from 'zustand';
import { mockFamilyMembers } from '@/utils/mockData';
import { FamilyMember } from '@/types';

interface FamilyStore {
  members: FamilyMember[];
  selectedMemberId: string | null;

  // Selectors
  getMemberById: (id: string) => FamilyMember | undefined;
  getRelatives: (id: string) => FamilyMember[];

  // Actions
  selectMember: (id: string | null) => void;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  members: mockFamilyMembers,
  selectedMemberId: null,

  getMemberById: (id) => get().members.find(m => m.id === id),

  getRelatives: (id) => {
    const member = get().getMemberById(id);
    if (!member) return [];
    const relativeIds = member.relationships.map(r => r.memberId);
    return get().members.filter(m => relativeIds.includes(m.id));
  },

  selectMember: (id) => set({ selectedMemberId: id }),
}));
```

## Modal Navigation Architecture

### Route Structure

```
app/
├── _layout.tsx          # Root Stack with modal config
├── (tabs)/
│   ├── _layout.tsx      # Tab navigator
│   ├── index.tsx        # Feed
│   ├── tree.tsx         # Family tree
│   └── profile.tsx      # User profile
├── member/
│   └── [id].tsx         # Member profile modal
├── paywall.tsx          # Subscription modal
└── settings/
    ├── edit-profile.tsx
    ├── notifications.tsx
    └── privacy.tsx
```

### Root Layout Modal Configuration

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="member/[id]"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
    </Stack>
  );
}
```

## Component Composition: Member Profile

### Recommended Structure

```typescript
// app/member/[id].tsx
export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const member = useFamilyStore(state => state.getMemberById(id));
  const relatives = useFamilyStore(state => state.getRelatives(id));

  if (!member) return <NotFound />;

  return (
    <ScrollView>
      <ProfileHeader member={member} onClose={() => router.back()} />
      <ProfileInfo member={member} />
      <FamilyConnections relatives={relatives} />
      <MemberPosts memberId={id} />
      <MemberPhotos memberId={id} />
    </ScrollView>
  );
}
```

### Component Breakdown

| Component | Responsibility | Data Source |
|-----------|---------------|-------------|
| ProfileHeader | Avatar, name, close button | member prop |
| ProfileInfo | Bio, birthday, relationship | member prop |
| FamilyConnections | List of related members | relatives prop |
| MemberPosts | Feed items by this member | feedStore filtered |
| MemberPhotos | Photo grid | feedStore filtered |

## Event Handling Architecture

### Handler Placement

| Event Type | Handler Location | Why |
|------------|-----------------|-----|
| Navigation | Screen component | Access to router |
| Data mutation | Store action | Centralized state |
| UI-only state | Component useState | Local concern |

### Handler Flow Example

```typescript
// tree.tsx (screen)
const handleMemberPress = (memberId: string) => {
  router.push(`/member/${memberId}`);
};

// TreeNode.tsx (component)
interface TreeNodeProps {
  member: FamilyMember;
  onPress: (id: string) => void;
}

const TreeNode = ({ member, onPress }: TreeNodeProps) => (
  <Pressable onPress={() => onPress(member.id)}>
    {/* ... */}
  </Pressable>
);

// Usage in tree.tsx
<TreeNode member={member} onPress={handleMemberPress} />
```

## Settings Architecture

### Consistent Pattern

```typescript
// profile.tsx
const settingsItems = [
  { id: 'subscription', label: 'Subscription', icon: 'star', route: '/paywall' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', route: '/settings/notifications' },
  { id: 'privacy', label: 'Privacy', icon: 'lock', route: '/settings/privacy' },
  { id: 'help', label: 'Help', icon: 'help-circle', route: '/settings/help' },
  { id: 'about', label: 'About', icon: 'info', route: '/settings/about' },
];

const handleSettingPress = (route: string) => {
  router.push(route);
};

// Render
{settingsItems.map(item => (
  <SettingsRow
    key={item.id}
    label={item.label}
    icon={item.icon}
    onPress={() => handleSettingPress(item.route)}
  />
))}
```

## Key Files to Modify

| File | Changes Needed |
|------|----------------|
| `app/_layout.tsx` | Ensure modal presentation configured |
| `app/member/[id].tsx` | Full implementation with store data |
| `app/(tabs)/tree.tsx` | Wire up node press handlers |
| `app/(tabs)/profile.tsx` | Wire up settings navigation |
| `src/stores/familyStore.ts` | Create if not exists |
| `src/utils/mockData.ts` | Ensure complete mock data |
