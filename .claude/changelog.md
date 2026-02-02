# Changelog & Learnings

> This file tracks decisions, learnings, and updates over time.
> Claude will update this file as significant decisions are made.

---

## 2026-02-02 - Subscription System Implementation

### What Changed
- **RevenueCat integration** - Installed `react-native-purchases` SDK
- **Subscription types** - Created tier definitions (free/family/legacy) with limits
- **Subscription store** - Zustand store with feature gating methods
- **Paywall screen** - Full paywall UI matching The Vine design system
- **Feature gating** - `FeatureGate` component and `useFeatureAccess` hook
- **Upgrade banners** - Soft paywall prompts at 80% of limits

### Files Created
- `src/types/subscription.ts` - Tier definitions, limits, product IDs
- `src/stores/subscriptionStore.ts` - Zustand subscription state
- `src/services/purchases.ts` - RevenueCat API wrapper
- `src/components/common/FeatureGate.tsx` - Feature gating component
- `src/components/common/UpgradeBanner.tsx` - Soft paywall banner
- `app/paywall.tsx` - Full paywall screen UI

### Subscription Tiers
| Tier | Price | Members | Photos | Audio | Video |
|------|-------|---------|--------|-------|-------|
| Free | $0 | 5 | 50 | No | No |
| Family | $4.99/mo | Unlimited | Unlimited | Yes | No |
| Legacy | $9.99/mo | Unlimited | Unlimited | Yes | Yes |

### Next Steps (Manual)
1. Create RevenueCat account at https://www.revenuecat.com
2. Create App Store Connect subscription products
3. Create Google Play subscription products
4. Add API keys to `src/services/purchases.ts`
5. Test on TestFlight / Internal Testing

---

## 2026-02-01 (Evening) - App Renamed to "The Vine"

### What Changed
- **App renamed from "Family Tree App" to "The Vine"**
- Biblical reference to John 15:5: "I am the vine; you are the branches"
- Name chosen after trademark research (Grapevine had conflicts)
- Bundle ID updated to `com.eliherman.thevine`

### Features Added
- **Daily Bible Verse component**
  - 14 curated verses about family, love, unity, parenting, marriage, faith, gratitude
  - Rotates daily based on day of year
  - Deep forest green background (#1B4332)
  - Displayed at top of feed

- **Scalable tree nodes**
  - Three scale levels: normal (≤2), small (3-4), tiny (5+)
  - Nodes auto-shrink as family grows

- **Thin vine connectors**
  - Changed from 3px to 1.5px
  - Circuit-like aesthetic
  - Branch color (#D4C4B0)

### Design Updates
- Color palette shifted from orange to forest greens
- Primary: #2D6A4F (Forest), #1B4332 (Deep Forest)
- Backgrounds: #FEFDFB (Warm White), #F9F7F4 (Cream)
- Splash screen background updated to Deep Forest

### Files Updated
- app.json, package.json (name, bundle ID)
- CLAUDE.md, PRD.md, app-overview.md
- All component color references

---

## 2026-02-01 (Afternoon) - MVP Implementation

### What Changed
- Implemented three core screens: Feed, Tree, Profile
- Set up Expo Router file-based navigation
- Created design system (colors, typography, spacing)
- Built reusable components (Avatar, Button, Card)

### Technical Decisions
- **Expo Router** for navigation (file-based, type-safe)
- **Zustand** for state management (simple, minimal boilerplate)
- **Firebase JS SDK** (Expo-compatible, no native modules needed)
- **react-native-svg** for tab bar icons

### Learnings
- react-native-worklets required for react-native-reanimated
- Expo Router needs `app/` at root level, not inside `src/`
- Color palette in constants should use flat structure for easy access

---

## 2026-02-01 (Morning) - Project Setup

### What Changed
- Created project structure
- Set up Claude context files in `.claude/`
- Defined initial documentation framework

### Decisions Made
- Using `.claude/` folder for context files
- CLAUDE.md as main entry point for Claude Code
- PRD.md as authoritative product spec

---

<!-- New entries will be added above this line -->
