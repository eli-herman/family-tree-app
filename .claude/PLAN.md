# Family Tree App - Development Setup Plan

## Current Development Environment Scan

### Installed (Ready to Use)

| Tool | Version | Status |
|------|---------|--------|
| Node.js | v24.11.1 | Latest |
| npm | 11.6.2 | Latest |
| Git | 2.50.1 | Ready |
| Expo CLI | 54.0.23 | Ready |
| Xcode | 26.1.1 | Ready |
| Xcode CLI Tools | Installed | Ready |
| VS Code | 1.108.2 | Ready |
| Homebrew | 5.0.12 | Ready |
| Ruby | 2.6.10 | Ready |
| Python | 3.14.2 | Ready |
| iOS Simulators | iPhone 16 Pro, Pro Max, 16e | Ready |

### Need to Install

| Tool | Purpose | Priority | Install Command |
|------|---------|----------|-----------------|
| Firebase CLI | Backend deployment & management | **Required** | `npm install -g firebase-tools` |
| CocoaPods | iOS native dependencies | **Required** | `sudo gem install cocoapods` |
| Watchman | File watching for hot reload | **Recommended** | `brew install watchman` |
| EAS CLI | Expo build service | **Required for builds** | `npm install -g eas-cli` |

### Optional (Can Install Later)

| Tool | Purpose | When Needed |
|------|---------|-------------|
| Android Studio | Android development & emulators | When building for Android |
| Yarn | Alternative package manager | If npm causes issues |
| Figma | Design mockups | For detailed design work |

### Account Setup Needed

| Service | Purpose | Status |
|---------|---------|--------|
| Expo Account | App builds & updates | **Not logged in** |
| Firebase Project | Backend services | **Need to create** |
| Apple Developer | App Store publishing | Check if enrolled |

---

## Phase 1: Environment Setup

### Step 1.1: Install Required Tools

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Install CocoaPods (for iOS native modules)
sudo gem install cocoapods

# Install Watchman (improves hot reload)
brew install watchman

# Install EAS CLI (for Expo builds)
npm install -g eas-cli
```

### Step 1.2: Account Setup

```bash
# Login to Expo
npx expo login

# Login to Firebase
firebase login

# Verify logins
npx expo whoami
firebase projects:list
```

### Step 1.3: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "family-tree-app"
3. Enable services:
   - Authentication (Email/Password, Google, Apple)
   - Firestore Database
   - Storage
4. Download config files:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)

---

## Phase 2: Project Initialization

### Step 2.1: Create Expo Project

```bash
cd ~/projects/family-tree-app
npx create-expo-app@latest . --template blank-typescript
```

### Step 2.2: Install Core Dependencies

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Firebase
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage

# UI & Animation
npx expo install react-native-reanimated react-native-gesture-handler expo-image expo-av

# Utilities
npm install date-fns zustand react-native-mmkv

# Icons
npx expo install @expo/vector-icons
```

### Step 2.3: Configure Expo

Update `app.json` with:
- App name & slug
- iOS bundle identifier
- Android package name
- Firebase plugin configuration

---

## Phase 3: Project Structure

```
~/projects/family-tree-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Feed screen
│   │   ├── tree.tsx       # Family tree screen
│   │   └── profile.tsx    # Profile screen
│   ├── member/[id].tsx    # Member profile page
│   └── _layout.tsx        # Root layout
├── components/
│   ├── common/            # Shared UI components
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── HeartButton.tsx
│   ├── feed/              # Feed-specific components
│   │   ├── FeedItem.tsx
│   │   └── PromptCard.tsx
│   ├── tree/              # Tree-specific components
│   │   ├── TreeNode.tsx
│   │   └── TreeCanvas.tsx
│   └── profile/           # Profile-specific components
│       ├── ProfileHeader.tsx
│       ├── MemoryCard.tsx
│       └── AudioPlayer.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useFamily.ts
│   └── useFeed.ts
├── services/              # Firebase & API services
│   ├── firebase.ts
│   ├── auth.ts
│   ├── firestore.ts
│   └── storage.ts
├── stores/                # Zustand state stores
│   ├── authStore.ts
│   └── familyStore.ts
├── types/                 # TypeScript types
│   ├── family.ts
│   ├── feed.ts
│   └── user.ts
├── utils/                 # Helper functions
│   ├── dates.ts
│   └── media.ts
├── constants/             # App constants
│   ├── colors.ts
│   └── typography.ts
├── assets/                # Static assets
│   ├── fonts/
│   └── images/
└── .claude/               # Claude context (already set up)
```

---

## Phase 4: Firebase Data Model

### Collections

```typescript
// families/{familyId}
{
  name: string;
  createdAt: timestamp;
  createdBy: string; // userId
  plan: 'free' | 'premium';
}

// families/{familyId}/members/{memberId}
{
  name: string;
  relation: string;
  bio?: string;
  photoUrl?: string;
  isDeceased: boolean;
  birthDate?: timestamp;
  deathDate?: timestamp;
  userId?: string; // linked user account (optional)
  parentIds: string[]; // for tree relationships
  createdAt: timestamp;
}

// families/{familyId}/feed/{feedItemId}
{
  type: 'photo' | 'memory' | 'audio' | 'profile_update';
  memberId: string;
  memberName: string;
  content?: string;
  mediaUrl?: string;
  hearts: string[]; // array of userIds who hearted
  createdAt: timestamp;
}

// families/{familyId}/memories/{memoryId}
{
  memberId: string;
  authorId: string;
  type: 'text' | 'audio';
  content?: string;
  audioUrl?: string;
  prompt?: string; // if created from a prompt
  createdAt: timestamp;
}

// users/{userId}
{
  email: string;
  name: string;
  familyIds: string[];
  memberId?: string; // linked family member
  createdAt: timestamp;
}
```

---

## Phase 5: MVP Feature Checklist

### Must Have (Week 1-2)
- [ ] Project setup & configuration
- [ ] Authentication (sign up, login, logout)
- [ ] Bottom tab navigation (Feed, Tree, Profile)
- [ ] Basic feed display
- [ ] Family tree visualization (simple)
- [ ] Profile page (view only)

### Should Have (Week 3-4)
- [ ] Add photo to feed
- [ ] Heart reactions
- [ ] Edit own profile
- [ ] Add family member
- [ ] Tree node interactions

### Nice to Have (Week 5+)
- [ ] Audio memories
- [ ] Memory prompts
- [ ] Deceased member handling
- [ ] Invite family members
- [ ] Push notifications

---

## Pre-Build Checklist

Before running `npx create-expo-app`:

- [ ] Install Firebase CLI
- [ ] Install CocoaPods
- [ ] Install Watchman
- [ ] Install EAS CLI
- [ ] Create Expo account & login
- [ ] Create Firebase project
- [ ] Download Firebase config files
- [ ] Decide on app bundle ID (e.g., `com.yourname.familytree`)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase costs | Medium | Implement pagination, caching, optimize queries |
| Complex tree rendering | High | Start with simple tree, iterate |
| Audio recording issues | Medium | Use Expo AV, test early |
| iOS build issues | Medium | Keep Xcode updated, test on simulator frequently |

---

*Plan created: 2026-02-01*
*Status: Ready for review*
