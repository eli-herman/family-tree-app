# TESTING

## Overview

The Vine currently has **no automated tests implemented**. This is typical for MVP-stage React Native projects but represents a critical gap as the app scales. The project has no test runner configuration, testing framework, or mocking utilities set up. This document outlines the current state and recommendations for establishing testing practices.

## Current State: No Tests Exist

### File Scan Results

**Test files found:**
- None in `src/` directory
- None in `app/` directory
- Verified via: `find /Users/eli.j.herman/projects/family-tree-app/src /Users/eli.j.herman/projects/family-tree-app/app -name "*.test.*" -o -name "*.spec.*"` → No results

**Test framework packages:**
- No Jest, Vitest, or other test runner in dependencies
- No @testing-library packages
- No Detox or other E2E framework

**Configuration files:**
- No `jest.config.js` or test configuration
- No test setup files
- No test utilities directory

### Dependencies Analysis (package.json)

**Production dependencies:**
```json
{
  "react": "19.1.0",
  "react-native": "0.81.5",
  "zustand": "^5.0.11",
  "firebase": "^12.8.0",
  "@react-navigation/*": "^7.x.x",
  "expo": "~54.0.33"
}
```

**Dev dependencies (minimal):**
```json
{
  "@types/react": "~19.1.0",
  "typescript": "~5.9.2"
}
```

**Notably absent:**
- No test runner (Jest, Vitest, etc.)
- No testing libraries (React Testing Library, React Native Testing Library)
- No component test utilities
- No E2E testing framework
- No mock/stub libraries

## Recommendations: Testing Strategy

### Suggested Architecture

#### 1. Unit Testing Framework

**Recommended:** Jest (industry standard for React Native)

**Setup steps:**
```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest @types/jest ts-jest
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
```

**TypeScript + Jest:**
- Use `ts-jest` preset
- Create `src/__tests__/setup.ts` for shared test utilities
- Include `.test.ts` and `.spec.ts` files in tsconfig include

#### 2. Testing Areas & Priority

**Priority 1 (Critical - MVP blockers):**
- **Store logic** (Zustand hooks): `src/stores/__tests__/*.test.ts`
  - `authStore.ts` - User state management
  - `feedStore.ts` - Feed item mutations (add, heart, remove)
  - `subscriptionStore.ts` - Feature gating logic
- **Type safety**: Verify interfaces match implementation
- **Constants**: Design system exports

**Priority 2 (High - User-facing):**
- **Components**: `src/components/**/__tests__/*.test.tsx`
  - `Button.tsx` - Variant rendering, disabled state, loading
  - `Avatar.tsx` - Size variants, fallback initials
  - `FeedItem.tsx` - Heart toggle, content rendering
  - `FeatureGate.tsx` - Feature access logic, locked state rendering
- **Firebase service**: `src/services/__tests__/*.test.ts`
  - Configuration initialization
  - Mock Firebase client

**Priority 3 (Medium - Business logic):**
- **Utilities**: `src/utils/__tests__/*.test.ts`
  - `dailyVerses.ts` - Verse selection by date
  - `mockData.ts` - Data structure validation
- **Type validation**: Runtime checks for API responses

**Priority 4 (Low - Integration):**
- **Screens**: `app/__tests__/*.test.tsx`
- **Navigation** flows
- **E2E testing** (consider Detox for native testing)

### Test Structure Proposal

```
src/
├── __tests__/
│   ├── setup.ts                    # Jest setup, mocks
│   └── test-utils.ts               # Custom render, helpers
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── __tests__/
│   │   │   └── Button.test.tsx
│   │   ├── Avatar.tsx
│   │   └── __tests__/
│   │       └── Avatar.test.tsx
│   ├── feed/
│   │   ├── FeedItem.tsx
│   │   └── __tests__/
│   │       └── FeedItem.test.tsx
├── stores/
│   ├── authStore.ts
│   ├── __tests__/
│   │   ├── authStore.test.ts
│   │   ├── feedStore.test.ts
│   │   └── subscriptionStore.test.ts
├── services/
│   ├── firebase.ts
│   └── __tests__/
│       └── firebase.test.ts
└── utils/
    ├── dailyVerses.ts
    └── __tests__/
        ├── dailyVerses.test.ts
        └── mockData.test.ts
```

### Testing Patterns for The Vine

#### Pattern 1: Zustand Store Testing

**Example: authStore.test.ts**
```typescript
import { useAuthStore } from '../authStore';
import { User } from '../../types';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('should set user and update isAuthenticated', () => {
    const mockUser: User = {
      id: 'user1',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should logout and clear user', () => {
    useAuthStore.getState().setUser({ /* mock user */ });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
```

#### Pattern 2: Component Testing

**Example: Button.test.tsx**
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with title', () => {
    const { getByText } = render(
      <Button title="Press me" onPress={jest.fn()} />
    );
    expect(getByText('Press me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const handlePress = jest.fn();
    const { getByRole } = render(
      <Button title="Click" onPress={handlePress} />
    );
    fireEvent.press(getByRole('button'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('should disable when loading', () => {
    const handlePress = jest.fn();
    const { getByRole } = render(
      <Button title="Load" onPress={handlePress} loading />
    );
    fireEvent.press(getByRole('button'));
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('should apply variant styles', () => {
    const { getByTestId } = render(
      <Button title="Primary" onPress={jest.fn()} variant="primary" testID="btn" />
    );
    const button = getByTestId('btn');
    expect(button.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: expect.any(String) })
    );
  });
});
```

#### Pattern 3: Store Feature Logic Testing

**Example: subscriptionStore.test.ts**
```typescript
import { useSubscriptionStore } from '../subscriptionStore';

describe('useSubscriptionStore - Feature Gating', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({ tier: 'free' });
  });

  it('should allow limited members on free tier', () => {
    const store = useSubscriptionStore.getState();
    expect(store.canAddMember(2)).toBe(true);  // 3 member limit
    expect(store.canAddMember(3)).toBe(false); // At limit
  });

  it('should allow unlimited members on premium tier', () => {
    useSubscriptionStore.setState({ tier: 'premium' });
    const store = useSubscriptionStore.getState();
    expect(store.canAddMember(100)).toBe(true);
  });

  it('should calculate remaining members correctly', () => {
    const store = useSubscriptionStore.getState();
    expect(store.getRemainingMembers(1)).toBe(2);  // 3 - 1
    expect(store.getRemainingMembers(3)).toBe(0);  // 3 - 3
  });

  it('should return Infinity for unlimited tiers', () => {
    useSubscriptionStore.setState({ tier: 'legacy' });
    const store = useSubscriptionStore.getState();
    expect(store.getRemainingMembers(1000)).toBe(Infinity);
  });
});
```

#### Pattern 4: Type Validation Testing

**Example: types.test.ts**
```typescript
import { User, FamilyMember, FeedItem } from '../index';

describe('Type Validation', () => {
  it('should have correct User shape', () => {
    const user: User = {
      id: '1',
      email: 'test@test.com',
      displayName: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
  });

  it('should enforce required FeedItem fields', () => {
    // TypeScript compilation check - this would error if types wrong
    const item: FeedItem = {
      id: '1',
      type: 'photo',
      authorId: 'user1',
      authorName: 'Test',
      content: { text: 'Hello' },
      hearts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(item.hearts).toEqual([]);
  });
});
```

### Mocking Strategy

#### Mock Firebase Service

**src/__tests__/setup.ts:**
```typescript
// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => null),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
```

#### Mock Zustand Stores

**Example in test:**
```typescript
import { useAuthStore } from '../authStore';

// Save original implementation
const originalState = useAuthStore.getState();

beforeEach(() => {
  // Reset to initial state between tests
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
});

afterAll(() => {
  // Restore if needed
  useAuthStore.setState(originalState);
});
```

#### Mock React Native Modules

**For expo-router, react-navigation:**
```typescript
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
```

### Coverage Goals

**Target metrics:**
- **Statements:** 70% minimum (MVP stage)
- **Branches:** 65% minimum
- **Functions:** 75% minimum
- **Lines:** 70% minimum

**Coverage reporting:**
```bash
npm test -- --coverage
```

### CI/CD Integration

**Recommended:** Add to package.json scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

**GitHub Actions workflow (.github/workflows/test.yml):**
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Implementation Roadmap

### Phase 1: Setup (Week 1)
- [ ] Install Jest + React Native Testing Library
- [ ] Configure jest.config.js and TypeScript
- [ ] Create test setup file and utilities
- [ ] Add test scripts to package.json

### Phase 2: Core Store Tests (Week 2)
- [ ] Write 100% coverage for `authStore.ts`
- [ ] Write 100% coverage for `feedStore.ts`
- [ ] Write 100% coverage for `subscriptionStore.ts`
- [ ] Add GitHub Actions CI

### Phase 3: Component Tests (Week 3)
- [ ] Test all common components (Button, Avatar, Card)
- [ ] Test feed components (FeedItem, DailyVerse)
- [ ] Test FeatureGate component
- [ ] Achieve 70% coverage threshold

### Phase 4: Integration & E2E (Week 4+)
- [ ] Test screen-level logic
- [ ] Consider Detox for E2E (native testing)
- [ ] Setup pre-commit hook to run tests
- [ ] Establish testing culture with team

## Considerations for The Vine

### React Native Specific Challenges

1. **Platform differences** - Component behavior differs on iOS/Android
   - Tests should run on both platforms or use platform-specific mocks
   - Use `Platform.select()` in tests where needed

2. **Async storage** - AsyncStorage is async
   - Mock or use jest-async-storage-mock
   - Test async flows with `waitFor()` from testing library

3. **Navigation** - Expo Router integration
   - Mock router.push, router.back
   - Test route params passed to screens

4. **Firebase integration** - Not tested until connected
   - Mock all Firebase calls
   - Unit test data transformation logic separately
   - Add integration tests once Firebase connected

5. **Zustand subscriptions** - Store updates need listeners
   - Use `getState()` for direct state access in tests
   - Test subscription cleanup if using `subscribe()`

### Testing Best Practices for This Project

1. **Keep tests simple and focused** - One assertion per test where possible
2. **Use mock data consistently** - Leverage mockData.ts utilities
3. **Test behavior, not implementation** - Verify output, not internals
4. **Test accessibility** - Use getByRole, getByLabelText
5. **Test edge cases** - Empty states, error conditions, limits
6. **Snapshot testing sparingly** - Use for design system only
7. **Keep tests maintainable** - Refactor test code like production code

## Limitations & Known Gaps

- **No E2E testing yet** - Need Detox or similar for full user flows
- **No performance testing** - No Lighthouse or rendering benchmarks
- **No visual regression testing** - No Percy or similar for UI changes
- **No mutation testing** - Can't measure test quality yet
- **Firebase integration untested** - Requires test Firebase project
- **Native modules (react-native-mmkv, react-native-purchases)** - Hard to test without native setup

## Key Files for Reference

- `package.json` - Where test dependencies should be added
- `.claude/style-guide.md` - Testing philosophy should align with code style
- `tsconfig.json` - May need `include` adjustment for test files
- `src/constants/` - Design system to test
- `src/types/` - Interfaces to validate
- `src/stores/` - Business logic to test
- `src/components/common/` - Reusable UI to test

---

*Last updated: 2026-02-02*
*Status: No tests implemented - Planning phase only*
