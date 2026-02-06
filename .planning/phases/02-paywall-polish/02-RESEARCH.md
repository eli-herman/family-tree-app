# Phase 02: Paywall Polish - Research

> **Goal:** Fix spacing and layout issues on paywall screen so it displays correctly on all devices.

---

## 1. Current Codebase Inventory

### Files Involved

| File | Purpose | Lines |
|------|---------|-------|
| `app/paywall.tsx` | Main paywall screen (route + UI + styles) | 472 |
| `app/_layout.tsx` | Root layout (Stack navigator) | 35 |
| `src/types/subscription.ts` | Tier types, limits, PRODUCTS array | 87 |
| `src/stores/subscriptionStore.ts` | Zustand store for subscription state | 104 |
| `src/components/common/FeatureGate.tsx` | Feature gating wrapper + locked view | 184 |
| `src/components/common/UpgradeBanner.tsx` | Soft paywall banner component | 118 |
| `src/constants/colors.ts` | Color palette | 47 |
| `src/constants/typography.ts` | Font sizes, weights, text styles | 95 |
| `src/constants/spacing.ts` | Spacing scale + border radii | 21 |

### Navigation to Paywall

The paywall screen is navigated to from three locations:
1. **Profile tab** - `router.push('/paywall')` (line 63 of `app/(tabs)/profile.tsx`)
2. **FeatureGate** - "View Plans" button pushes `/paywall`
3. **UpgradeBanner** - "Upgrade" button pushes `/paywall`

**Critical finding:** The paywall route is NOT registered as a modal in `_layout.tsx`. Only `member/[id]` has `presentation: 'modal'`. The paywall pushes as a regular full-screen stack entry. This means:
- It uses the default full-screen presentation (not a sheet/modal)
- SafeAreaView behavior is standard (not modal-specific)
- No special animation or presentation configuration

---

## 2. Current Paywall Architecture

### Component Structure (app/paywall.tsx)

```
SafeAreaView (flex: 1)
  ScrollView (paddingBottom: 32)
    Header (close button, title, subtitle)
    Bible Verse container
    Period Toggle (monthly/yearly)
    Tiers Container
      TierCard (Family - recommended)
      TierCard (Legacy)
    Free Tier Note
  Footer (fixed, not in ScrollView)
    Subscribe Button
    Restore Button
    Legal Text
```

### TierCard Component (inline, not extracted)

The `TierCard` is defined as a function component within `paywall.tsx` itself. It is not a shared component. Structure:

```
TouchableOpacity (the card)
  Recommended Badge (absolute, top: -12)
  Savings Badge (absolute, top/right)
  Tier Name
  Price Row (price + period)
  Features Container (list of checkmarks)
  Select Indicator (absolute, top-right radio button)
```

### Design System Tokens Used

| Token | Value | Used For |
|-------|-------|----------|
| `spacing.xs` | 4 | Minor gaps, badge padding |
| `spacing.sm` | 8 | Feature row gaps, button margin |
| `spacing.md` | 16 | Card padding, verse padding, footer padding |
| `spacing.lg` | 24 | Horizontal margins, card padding, header padding |
| `spacing.xl` | 32 | Scroll bottom padding, title top margin |
| `borderRadius.sm` | 4 | Badge corners |
| `borderRadius.md` | 8 | Period button corners |
| `borderRadius.lg` | 12 | Verse, toggle, subscribe button corners |
| `borderRadius.xl` | 16 | Tier card corners |
| `borderRadius.full` | 9999 | Close button, radio indicator |

---

## 3. Identified Layout Issues

### ISSUE-01: Close Button Too Small (Touch Target Violation)

**Location:** `styles.closeButton` (line 243-252)
**Problem:** Width/height = 32x32 points. Apple HIG requires 44x44pt minimum touch targets.
**Impact:** Users may struggle to tap the close button, especially on smaller devices.
**Fix:** Increase to 44x44pt, or keep 32pt visual size but add `hitSlop` or a larger transparent wrapper for the touch target.

### ISSUE-02: Recommended Badge Clipping Risk

**Location:** `styles.recommendedBadge` (line 338-346)
**Problem:** The badge is positioned `top: -12` (absolute). The `tiersContainer` has no top padding or margin to accommodate this overflow. The badge could be clipped by the parent's boundaries or overlap with the period toggle above.
**Impact:** On screens where spacing is tight, the "Recommended" badge text could be cut off or collide with elements above.
**Fix:** Add `marginTop` to the `tiersContainer` (at least 12-16pt) or switch to `overflow: 'visible'` and add explicit top spacing.

### ISSUE-03: Savings Badge Overlaps Select Indicator

**Location:** `styles.savingsBadge` (line 352-360) vs `styles.selectIndicator` (line 401-412)
**Problem:** Both are absolutely positioned in the top-right area of the tier card. The savings badge is at `top: spacing.md (16), right: spacing.md (16)`. The select indicator is at `top: spacing.lg (24), right: spacing.lg (24)`. On narrow screens or with longer savings text, these could overlap or be confusingly close.
**Impact:** Visual collision or confusion between the "Save 33%" badge and the radio selection indicator.
**Fix:** Reposition the savings badge (e.g., move it into the flow near the price row instead of absolute positioning) or adjust the select indicator position to avoid collision.

### ISSUE-04: Restore Button Undersized Touch Target

**Location:** `styles.restoreButton` (line 459-462)
**Problem:** `paddingVertical: spacing.sm (8)`. The text is `bodySmall` (14px font, 21px line height). Total tappable height = ~37pt (8 + 21 + 8), which is under the 44pt minimum.
**Impact:** "Restore Purchases" is hard to tap, frustrating users who need it.
**Fix:** Increase `paddingVertical` to at least `spacing.md (16)` or use `minHeight: 44`.

### ISSUE-05: Subscribe Button Height Potentially Short

**Location:** `styles.subscribeButton` (line 447-452)
**Problem:** `paddingVertical: spacing.md (16)` with `button` text style (fontSize 16, lineHeight 20). Total = 16 + 20 + 16 = 52pt. This is fine at 52pt -- above the 44pt minimum. However, there is no `minHeight` set to guarantee this across font scaling.
**Impact:** Low risk, but dynamic type / accessibility font scaling could compress it.
**Fix:** Add `minHeight: 44` as a safety net.

### ISSUE-06: Period Toggle Buttons Below Minimum Touch Target

**Location:** `styles.periodButton` (line 299-303)
**Problem:** `paddingVertical: spacing.sm (8)` with `button` text style (fontSize 16, lineHeight 20). Total height = ~36pt. Below 44pt minimum.
**Impact:** Monthly/Yearly toggle is difficult to tap on smaller screens.
**Fix:** Increase `paddingVertical` to 12pt, or set `minHeight: 44`.

### ISSUE-07: Footer Lacks Bottom Safe Area Padding

**Location:** `styles.footer` (line 440-446)
**Problem:** `paddingVertical: spacing.md (16)`. The footer sits outside the ScrollView, but below the SafeAreaView's content area. On devices with home indicators (iPhone X and later), the legal text may sit too close to or behind the home indicator bar.
**Impact:** Legal text may be obscured on notched/home-indicator devices.
**Fix:** Use `useSafeAreaInsets()` hook to add `paddingBottom: insets.bottom` to the footer, or switch to `SafeAreaView` wrapping just the footer.

### ISSUE-08: SafeAreaView vs useSafeAreaInsets

**Location:** Root of PaywallScreen (line 118)
**Problem:** Uses React Native's built-in `SafeAreaView` imported from `react-native`. The app already has `react-native-safe-area-context` installed (used in `_layout.tsx` via `SafeAreaProvider`). The built-in `SafeAreaView` has known inconsistencies, particularly on Android and in modal presentations.
**Impact:** Inconsistent safe area behavior across platforms. Android may not respect safe areas at all with the built-in component.
**Fix:** Replace `SafeAreaView` from `react-native` with either `SafeAreaView` from `react-native-safe-area-context` or use the `useSafeAreaInsets()` hook for manual padding.

### ISSUE-09: ScrollView contentContainerStyle Missing Top Padding

**Location:** `styles.scrollContent` (line 233-235)
**Problem:** Only `paddingBottom: spacing.xl` is set. No `paddingTop`. The header has `paddingTop: spacing.md (16)`, but this must accommodate the close button positioned absolutely at `top: spacing.md`. The content starts immediately with no breathing room.
**Impact:** On different device sizes, the top content may feel cramped against the status bar area.
**Fix:** Consider adding a small `paddingTop` to `scrollContent` or reviewing the header spacing.

### ISSUE-10: No Paywall-Specific Stack.Screen Config

**Location:** `app/_layout.tsx` (line 21-24)
**Problem:** The paywall route has no explicit `Stack.Screen` entry. It relies on the default config from `screenOptions={{ headerShown: false }}`. This means:
- No modal presentation option
- No custom animation
- Default push navigation behavior
**Impact:** If the paywall should appear as a modal (which is typical for paywall screens), it would need explicit configuration. Currently it pushes like a regular screen.
**Fix:** Add `<Stack.Screen name="paywall" options={{ presentation: 'modal' }} />` if modal behavior is desired, or leave as-is if full-screen push is intentional.

---

## 4. Design System Analysis

### Spacing Scale

The project uses a consistent spacing scale:
```
xs: 4, sm: 8, md: 16, lg: 24, xl: 32, 2xl: 48, 3xl: 64
```

The paywall screen uses tokens correctly from this scale. No magic numbers except:
- `marginTop: 2` in `periodSavings` (line 318) - should use `spacing.xs / 2` or just accept 2px
- Badge `top: -12` is not a standard token (closest would be `-spacing.lg / 2` or a custom value)

### Typography

All text styles use the pre-composed `typography.textStyles` correctly. No raw font sizes.

### Colors

All colors come from `colors` constant. No inline hex values.

### Compliance Summary

The paywall screen is well-aligned with the design system tokens. The issues are structural (positioning, sizing) rather than token misuse.

---

## 5. Standard Patterns and Best Practices

### ScrollView is Correct for This Layout

With only 2 tier cards plus a free note, this is a small fixed-content layout. ScrollView is the right choice over FlatList. FlatList virtualization adds unnecessary overhead for fewer than 20 items.

### Recommended Paywall Layout Pattern

Based on industry standards and Apple's HIG:

```
SafeAreaView (or useSafeAreaInsets)
  ScrollView (flex: 1, bounces)
    Top spacing / branding
    Value proposition headline
    Social proof / trust element
    Plan toggle (monthly / yearly)
    Plan cards (with clear selection state)
    Feature comparison (optional)
    Free tier callout
    [Extra bottom padding for footer clearance]
  Sticky Footer (outside scroll)
    CTA Button (prominent, >= 44pt tall)
    Secondary action (Restore)
    Legal text
    [Bottom safe area padding]
```

The current paywall follows this pattern closely. The issues are in the details of spacing and sizing, not the overall structure.

### Touch Target Requirements

| Platform | Minimum | Source |
|----------|---------|--------|
| iOS (Apple HIG) | 44x44 pt | Apple Human Interface Guidelines |
| Android (Material) | 48x48 dp | Material Design Guidelines |
| WCAG 2.5.8 | 44x44 CSS px | Web Content Accessibility Guidelines |

**React Native approach:** Use `minHeight: 44` on all interactive elements, or apply `hitSlop` to extend the tappable area beyond the visual bounds.

### SafeAreaView Best Practice

The recommended approach for Expo Router apps using `react-native-safe-area-context`:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In component:
const insets = useSafeAreaInsets();
// Apply insets.top to header, insets.bottom to footer
```

This is more reliable than the `SafeAreaView` component, especially:
- In modal presentations
- On Android
- When animating screens

---

## 6. Pitfalls and Risks

### Pitfall 1: Absolute Positioning Fragility

The current code uses `position: 'absolute'` for three elements within TierCard:
1. Recommended badge (top: -12, left)
2. Savings badge (top/right)
3. Select indicator (top/right)

Absolute positioning is fragile across different screen sizes and font scaling. If a user has large accessibility fonts, these positioned elements will not reflow with the content.

**Mitigation:** Move badges into the flow layout where possible. Keep the select indicator absolute but ensure it does not collide with the savings badge.

### Pitfall 2: Android Safe Area Gaps

React Native's built-in `SafeAreaView` does nothing on Android. If the paywall is tested only on iOS, Android users may see content behind the status bar.

**Mitigation:** Switch to `react-native-safe-area-context`'s `SafeAreaView` or use `useSafeAreaInsets()`.

### Pitfall 3: Dynamic Type / Font Scaling

None of the touch targets use `minHeight`. If a user has increased their system font size, the text within buttons will be larger but the padding-based heights will not adjust proportionally. Buttons could technically still be tappable, but the layout may break in unexpected ways.

**Mitigation:** Use `minHeight: 44` on all tappable elements as a floor.

### Pitfall 4: Footer Obscured by Home Indicator

On devices without a physical home button (iPhone X+), the footer's `paddingVertical: 16` may not clear the home indicator area. The legal text at the bottom could be partially hidden.

**Mitigation:** Add `insets.bottom` padding to the footer container.

### Pitfall 5: Scroll Content Not Clearing Footer

The `scrollContent` has `paddingBottom: spacing.xl (32)`. The footer is positioned outside the ScrollView. On shorter devices, the last items in the scroll (the "Free Forever" note) could be hidden behind the footer if there is not enough bottom padding.

**Mitigation:** Increase `paddingBottom` on `scrollContent` to account for the footer height (~120-140pt based on content), or measure the footer dynamically with `onLayout`.

---

## 7. Requirements Mapping

### PAY-01: Paywall screen has correct spacing and layout

| What to Fix | Priority | Effort |
|-------------|----------|--------|
| Switch from RN SafeAreaView to react-native-safe-area-context | High | Small |
| Add footer bottom safe area padding via insets | High | Small |
| Add top margin to tiersContainer for badge overflow | Medium | Small |
| Resolve savings badge / select indicator overlap | Medium | Small |
| Increase scrollContent paddingBottom for footer clearance | Medium | Small |
| Consider adding paywall as modal in _layout.tsx | Low | Small |

### PAY-02: All tier cards display properly without overlap

| What to Fix | Priority | Effort |
|-------------|----------|--------|
| Move recommended badge into card flow or add overflow margin | High | Small |
| Reposition savings badge to avoid select indicator collision | High | Small |
| Test with both "Save 33%" text lengths | Medium | Small |
| Test with accessibility font sizes enabled | Medium | Small |

### PAY-03: Buttons are properly spaced and tappable

| What to Fix | Priority | Effort |
|-------------|----------|--------|
| Close button: increase to 44pt or add hitSlop | High | Small |
| Restore button: increase paddingVertical to meet 44pt | High | Small |
| Period toggle buttons: increase height to 44pt minimum | High | Small |
| Subscribe button: add minHeight: 44 safety net | Low | Small |
| UpgradeBanner "Upgrade" button: verify 44pt (currently paddingVertical: xs=4, very small) | High | Small |

---

## 8. Estimated Scope

**Total estimated changes:** ~50-80 lines of style modifications in `app/paywall.tsx`, plus minor updates to `app/_layout.tsx` and possibly `src/components/common/UpgradeBanner.tsx`.

**No new files needed.** All changes are style/layout modifications to existing code.

**No new dependencies needed.** `react-native-safe-area-context` is already installed.

**Testing approach:** Visual verification on multiple device sizes (iPhone SE, iPhone 15, iPhone 15 Pro Max, and an Android device if available). Verify with accessibility font scaling at 1.0x, 1.5x, and 2.0x.

---

## 9. Open Questions

1. **Should the paywall be a modal or full-screen push?** Currently it is a full-screen push. Modal presentation (card-style) is more common for paywalls and allows swipe-to-dismiss. This is a UX decision for the designer/developer.

2. **Should the TierCard be extracted to a shared component?** Currently it is inline in `paywall.tsx`. If tier cards will be reused elsewhere (e.g., a settings/subscription management screen), extracting to `src/components/common/TierCard.tsx` would be prudent. Otherwise, keeping it inline is fine.

3. **Is the UpgradeBanner's "Upgrade" button also in scope?** The button at `paddingVertical: spacing.xs (4)` is well below the 44pt touch target minimum. If we are fixing touch targets across the paywall flow, this should be included.

---

*Researched: 2026-02-05*
*Status: Ready for planning*
