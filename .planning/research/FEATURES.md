# Feature Patterns

**Domain:** Family connection app MVP
**Researched:** 2026-02-02

## Member Profile Features

**What users expect when tapping a family member:**

### Essential Info (Table Stakes)

| Element | Priority | Notes |
|---------|----------|-------|
| Full name | Required | First + Last |
| Profile photo/avatar | Required | Fallback to initials |
| Relationship label | Required | "Your Mother", "Your Brother" |
| Birthday | Expected | Age calculation optional |
| Bio/about | Expected | Short description |

### Family Connections Section

| Element | Priority | Notes |
|---------|----------|-------|
| Parents | Required | Links to their profiles |
| Spouse | Required | If applicable |
| Children | Required | If applicable |
| Siblings | Expected | If applicable |

### Activity/Content Section

| Element | Priority | Notes |
|---------|----------|-------|
| Recent posts | Expected | Their feed contributions |
| Photos of them | Expected | Photos they're in |
| Shared memories | Nice-to-have | Stories involving them |

### Profile Actions

| Action | Priority | Behavior |
|--------|----------|----------|
| Close/dismiss | Required | Return to previous screen |
| View full tree position | Nice-to-have | Highlight in tree view |

## Feed Interaction Features

### Heart Reactions (Existing - Polish)

| Behavior | Status | Notes |
|----------|--------|-------|
| Tap to toggle | Working | Optimistic update |
| Show count | Working | Display heart count |
| Animation | Nice-to-have | Heart fill animation |

### Comments (Placeholder → Functional)

| Behavior | Priority | Notes |
|----------|----------|-------|
| View comments count | Required | "3 comments" |
| Tap to expand | Required | Show comment list |
| Add comment | Required | Text input + submit |
| Comment author | Required | Avatar + name |

### Sharing (Placeholder → Functional)

| Behavior | Priority | Notes |
|----------|----------|-------|
| Share button | Required | Opens share sheet |
| Share within family | Primary | Send to family members |
| External share | Deferred | Out of scope for MVP |

## Settings Screen Features

### Standard Settings Pattern

| Section | Items | Priority |
|---------|-------|----------|
| Account | Edit Profile, Subscription | Required |
| Preferences | Notifications | Required |
| Privacy | Privacy Settings | Required |
| Support | Help, About | Required |
| Session | Logout | Required |

### Settings Item Behaviors

| Item | Action |
|------|--------|
| Edit Profile | Navigate to edit form |
| Subscription | Navigate to paywall |
| Notifications | Toggle switches or navigate |
| Privacy | Navigate to privacy settings |
| Help | Navigate to help/FAQ |
| About | Show app version, credits |
| Logout | Confirm dialog → clear session |

## Tree Interaction Features

### Node Tap Behavior

| Action | Behavior |
|--------|----------|
| Single tap | Open member profile modal |
| Visual feedback | Highlight/scale on press |

### Navigation Expectations

| From | To | Method |
|------|----|----|
| Tree node | Member profile | Modal presentation |
| Member profile | Back to tree | Dismiss modal |
| Member profile | Related member | Push new modal or replace |

## MVP Completeness Checklist

For the app to feel "complete" with mock data:

- [ ] Every family member in tree is tappable
- [ ] Every tap opens profile with real data
- [ ] Every profile shows relationships
- [ ] Every button in profile does something
- [ ] Every feed item has working reactions
- [ ] Every settings item navigates somewhere
- [ ] Logout shows confirmation and "works"
- [ ] No placeholder text visible ("Coming soon", "TODO")
