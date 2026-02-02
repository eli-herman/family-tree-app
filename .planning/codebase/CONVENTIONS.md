# CONVENTIONS

## Overview

The Vine follows consistent React Native/Expo code style with TypeScript strict mode, component-driven architecture, and centralized design system management. The project emphasizes simplicity, self-documenting code, and clear separation of concerns through established patterns for state management, styling, and component composition.

## Details

### Language & Compiler Settings

**TypeScript Configuration** (`tsconfig.json`):
- Extends `expo/tsconfig.base`
- `strict: true` - Full type safety enabled
- Includes all `.ts` and `.tsx` files plus Expo type definitions

**Code is 100% TypeScript** - No JavaScript files in src/components, src/stores, or src/types directories.

### Naming Conventions

All naming follows the style guide documented in `.claude/style-guide.md`:

#### Components
- **Convention:** PascalCase
- **Files:** kebab-case (e.g., `FeedItem.tsx` → `feed-item.tsx` conceptually, but actual files use component name)
- **Actual file pattern:** Match component name (e.g., `Button.tsx`, `Avatar.tsx`, `FeedItem.tsx`)
- **Export:** Named exports (e.g., `export function Button(...)`)

Examples in codebase:
- `src/components/common/Button.tsx` exports `function Button`
- `src/components/feed/FeedItem.tsx` exports `function FeedItem`
- `src/components/common/FeatureGate.tsx` exports `function FeatureGate` + `function useFeatureAccess`

#### Variables & Functions
- **Convention:** camelCase
- **Examples:**
  - `userName`, `familyTree`, `isAuthenticated`
  - `getUserData()`, `buildTree()`, `handleHeart()`
  - `setFeedItems()`, `toggleHeart()`, `canAddMember()`

#### Constants
- **Convention:** UPPER_SNAKE_CASE
- **Scope:** Global constants only (rarely used; design tokens use `as const` instead)
- **Examples:** `API_URL`, `MAX_FAMILY_SIZE`

#### Design System/Constants Objects
- **Pattern:** camelCase for property names, `as const` suffix for type safety
- **Files:** `src/constants/colors.ts`, `src/constants/typography.ts`, `src/constants/spacing.ts`
- **Examples:**
  ```typescript
  // src/constants/colors.ts
  export const colors = {
    primary: { light: '#40916C', main: '#2D6A4F', dark: '#1B4332' },
    text: { primary: '#1C1917', secondary: '#57534E' },
  } as const;

  // src/constants/typography.ts
  export const typography = { fontSize: { xs: 12, sm: 14 } } as const;
  ```

#### Files & Folders
- **Folders:** kebab-case (e.g., `src/components/common/`, `src/stores/`)
- **Component files:** PascalCase matching export name (e.g., `Button.tsx`, `FeedItem.tsx`)
- **Utility files:** camelCase (e.g., `mockData.ts`, `dailyVerses.ts`)
- **Store files:** camelCase (e.g., `authStore.ts`, `feedStore.ts`)
- **Index files:** Used for barrel exports (e.g., `src/components/common/index.ts`)

#### Type/Interface Naming
- **Convention:** PascalCase with descriptive names
- **Props interfaces:** `{ComponentName}Props` or `{HookName}Props`
- **State interfaces:** `{StoreName}State` or `{ComponentName}State`
- **Example patterns:**
  ```typescript
  interface ButtonProps { title: string; onPress: () => void; }
  interface AuthState { user: User | null; isAuthenticated: boolean; }
  interface AvatarProps { uri?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; }
  ```

### Component Structure & Patterns

#### Functional Components with Props Interfaces
- All components are functional (no class components)
- Props always defined as TypeScript interfaces above component function
- Props destructured in function signature

Pattern from `src/components/common/Button.tsx`:
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) { ... }
```

#### StyleSheet Usage
- All components use `StyleSheet.create()` at bottom of file
- Styles defined in object after component definition
- Named `const styles = StyleSheet.create({...})`
- Multiple variants use array spreading: `[styles.base, styles[variant]]`

Pattern from `src/components/common/Button.tsx`:
```typescript
const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md },
  primary: { backgroundColor: colors.primary.main },
  disabled: { opacity: 0.5 },
});
```

#### Design System Imports
- All components import from centralized constants
- Standard import pattern: `import { colors, typography, spacing, borderRadius } from '../../constants'`
- No hardcoded values for colors, spacing, or typography
- Use `src/constants/index.ts` barrel export

#### State Management Pattern (Zustand)
- State defined as TypeScript interface
- Created with `create<StateInterface>()` generic
- Actions and selectors bundled with state
- Pattern from `src/stores/feedStore.ts`:
```typescript
interface FeedState {
  items: FeedItem[];
  isLoading: boolean;
  setItems: (items: FeedItem[]) => void;
  addItem: (item: FeedItem) => void;
  updateItem: (id: string, updates: Partial<FeedItem>) => void;
  toggleHeart: (itemId: string, userId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  toggleHeart: (itemId, userId) => set((state) => ({
    items: state.items.map((item) => {
      if (item.id !== itemId) return item;
      const hearts = item.hearts.includes(userId)
        ? item.hearts.filter((id) => id !== userId)
        : [...item.hearts, userId];
      return { ...item, hearts };
    }),
  })),
}));
```

#### Conditional Rendering
- Ternary operators for single conditions
- Logical `&&` for presence checks (showing/hiding)
- Switch statements for multiple cases
- Pattern from `src/components/feed/FeedItem.tsx`:
```typescript
{item.content.mediaURLs && item.content.mediaURLs.length > 0 ? (
  <View style={styles.mediaContainer}>...</View>
) : null}

{item.content.text && !item.content.mediaURLs?.length && (
  <Text style={styles.contentText}>{item.content.text}</Text>
)}
```

### Error Handling

#### Current State
- **Minimal explicit error handling** - App is MVP stage
- Firebase service uses environment variables with fallback defaults
- No try-catch blocks in current component code
- No error boundaries implemented yet

#### Patterns to Implement
- Use TypeScript strict mode to prevent null/undefined errors
- Optional chaining (`?.`) and nullish coalescing (`??`) used throughout
- Firebase async operations should add try-catch when connected
- Consider error boundary wrapper for screen-level error handling

#### Firebase Configuration
Pattern from `src/services/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  // ... other config with fallbacks
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
```

- Gracefully handles re-initialization
- Environment variables prefixed with `EXPO_PUBLIC_` for Expo config exposure

### Comments & Documentation

**Philosophy:** Self-documenting code preferred over comments

- **Type annotations** serve as inline documentation
- **Descriptive function names** explain purpose
- **JSDoc comments only where logic isn't obvious**
- **TODO comments** used sparingly (e.g., Firebase config setup)

Examples in codebase:
```typescript
// Only comments where logic needs explanation
// src/components/feed/FeedItem.tsx - line 19
// Alternate avatar colors
const avatarVariant = item.authorId.includes('1') || item.authorId.includes('3') ? 'green' : 'brown';

// Excellent JSDoc for complex components
// src/components/common/FeatureGate.tsx - line 24-27
/**
 * Wraps content that requires a subscription feature.
 * If the feature is available, renders children.
 * If locked, shows upgrade prompt or custom locked content.
 */
```

### Formatting

**Indentation:** 2 spaces (React Native convention)

**Line length:** ~100 characters (not strictly enforced, but preferred)

**Quotes:** Single quotes for strings in JavaScript/TypeScript code (React Native convention)

**Imports:** Organized in order:
1. React imports
2. React Native imports
3. Third-party libraries (Expo, date-fns, etc.)
4. Local imports (relative paths)
5. Blank line before any type-only imports if needed

Pattern from `src/components/feed/FeedItem.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { Avatar, Card } from '../common';
import { colors, typography, spacing, borderRadius } from '../../constants';
import { FeedItem as FeedItemType } from '../../types';
```

### Barrel Exports & Exports Index Files

**Pattern:** Components grouped in subdirectories use `index.ts` for barrel exports

Examples:
- `src/components/common/index.ts` exports Button, Avatar, Card, FeatureGate
- `src/components/feed/index.ts` exports FeedItem, PromptCard, DailyVerse
- `src/stores/index.ts` exports all Zustand stores

Usage simplifies imports:
```typescript
// With barrel export
import { Avatar, Card } from '../common';
// vs.
import { Avatar } from '../common/Avatar';
import { Card } from '../common/Card';
```

### Type Safety Patterns

**Optional Parameters:** Use `?:` in interfaces, provide default values in function signature

Pattern from `src/components/common/Avatar.tsx`:
```typescript
interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'green' | 'brown' | 'branch';
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 'md', variant = 'green', style }: AvatarProps) {
  // ...
}
```

**Union Types for Variants:** Used for component variants, subscription tiers, feed item types

Examples:
- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost'` (Button)
- `size?: 'sm' | 'md' | 'lg' | 'xl'` (Avatar)
- `type: FeedItemType` where `FeedItemType = 'photo' | 'memory' | 'milestone' | 'prompt_response'`

**Type Imports:** Used where applicable (TypeScript 4.5+), though generally mixing value + type imports in same statement

**Const Assertions:** Design system objects use `as const` for literal type inference

### No Linter Configuration

**Current State:**
- No `.eslintrc` or Prettier config files found
- Not enforced via pre-commit hooks
- Formatting is manual/IDE-dependent

**Recommendations for Future:**
- Add ESLint with Expo recommended config
- Add Prettier with 2-space indentation
- Configure pre-commit hooks via husky
- Keep rules aligned with current style patterns

### Architecture Patterns

#### Separation of Concerns
- **Components:** UI rendering only, no business logic
- **Stores:** State management (Zustand hooks)
- **Services:** External integrations (Firebase config)
- **Types:** Shared interfaces and type definitions
- **Utils:** Mock data, helper functions, constants
- **Constants:** Design system (colors, typography, spacing)

#### Data Flow
1. Components render based on Zustand store state
2. User interactions call store actions
3. Store updates state (immutably)
4. Components re-render automatically
5. No prop drilling - stores used directly via hooks

Example flow from FeedScreen:
```typescript
// Screen uses store hook
const [feedItems, setFeedItems] = useState<FeedItemType[]>(mockFeedItems);

// Handler calls store action
const handleHeart = (itemId: string) => {
  setFeedItems((items) => /* update logic */);
};

// Component uses handler
<FeedItem item={item} onHeart={handleHeart} currentUserId={currentUserId} />
```

## Key Files

- `src/constants/colors.ts` - Color palette (8-color design system)
- `src/constants/typography.ts` - Font sizes, weights, text styles
- `src/constants/spacing.ts` - Spacing scale
- `src/components/common/Button.tsx` - Reference component for styling pattern
- `src/components/common/Avatar.tsx` - Reference for variant pattern
- `src/stores/authStore.ts` - Zustand pattern example
- `src/stores/feedStore.ts` - Zustand with update logic example
- `src/types/user.ts` - User/FamilyMember type definitions
- `src/types/feed.ts` - Feed-related types
- `src/types/subscription.ts` - Subscription tier system
- `.claude/style-guide.md` - Official style guide documentation
- `tsconfig.json` - TypeScript strict mode configuration
- `package.json` - Dependencies (no ESLint/Prettier listed)

---

*Last updated: 2026-02-02*
