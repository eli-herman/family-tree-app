# Product Requirements Document

> This is the authoritative product specification for **The Vine**

## Role

Senior product engineer and UX designer building a production-ready MVP of a private, faith-centered family connection app. Goal: functional, clean, professional mobile app that prioritizes emotional warmth, Christian values, simplicity, and long-term family memory preservation.

---

## Product Overview

**The Vine** is a private Christian family app that helps families stay connected in a low-pressure, almost mindless way, while strengthening faith bonds and serving as a long-term archive of family history and life stories.

**Biblical Foundation:** "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit." — John 15:5

**This is NOT social media.**
- No likes, follower counts, public feeds, or performance pressure

### Four Core Surfaces

1. **Updates Feed** (primary daily surface) - with Daily Bible Verse
2. **Scrollable 2D Family Tree** (exploratory surface) - vine-like connections
3. **Individual Profile Pages** (sentimental/archival surface)
4. **Daily Verse** (faith component) - Bible verses about family, love, and unity

### Emotional Goals

The app must feel:
- Warm and faith-affirming
- Playful but respectful
- Easy to open for 10 seconds
- Meaningful over years
- Spiritually grounding

**Visual inspiration:** Natural vine/branch aesthetic with forest greens and warm earth tones

**Emotional tone:** "This feels like home and faith combined."

---

## Faith Component

### Daily Bible Verse

A curated selection of verses displayed prominently on the feed, rotating daily. Themes include:
- **Family** - "Children's children are a crown to the aged" (Prov 17:6)
- **Love** - "Love is patient, love is kind" (1 Cor 13:4)
- **Unity** - "How good when God's people live together in unity" (Ps 133:1)
- **Parenting** - "Start children off on the way they should go" (Prov 22:6)
- **Faith** - "I am the vine; you are the branches" (John 15:5)
- **Marriage** - "Two are better than one" (Ecc 4:9)
- **Gratitude** - "Give thanks in all circumstances" (1 Thess 5:18)

The verse component:
- Appears at the top of the feed
- Has a subtle, reverent design (deep forest green background)
- Changes daily based on day of year
- Is non-intrusive but always present

---

## Core UX Principles (DO NOT VIOLATE)

1. No mandatory posting or forced interaction
2. No guilt-based prompts or "complete your profile" pressure
3. Users should be able to browse and feel value without contributing
4. Contribution is always optional, lightweight, and sentiment-driven
5. The app must still feel alive if only 1–2 family members actively add content
6. Faith elements are integrated naturally, never preachy

---

## App Structure (MVP)

### 1. Updates Feed (Primary Screen)

**Purpose:** Mindless, low-effort connection with daily spiritual encouragement

A clean feed showing:
- **Daily Bible Verse** (top of feed)
- Recent family activity:
  - "Mom added a photo"
  - "Grandpa recorded a memory"
  - "Aunt Sarah updated her profile"

Features:
- Each item is tappable → opens the content
- Users can react with a simple heart (optional)
- No commenting required
- No infinite noisy scrolling — keep it calm and intentional
- Story prompts at bottom for gentle engagement

**This screen is the default landing page after login.**

### 2. Family Tree Screen

**Purpose:** Visual relationship awareness with vine metaphor

A scrollable, zoomable 2D family tree where:
- Connections are thin, circuit-like "vines" (1.5px lines)
- Nodes scale smaller as more family members are added
- Three scale levels: normal (2 members), small (3-4), tiny (5+)
- Each node represents a family member
- Nodes include: Initial avatar, Name, Relationship label
- Visual styling with natural colors (greens, browns)
- Deceased family members are supported and clearly labeled
- Tapping a node opens that person's profile

**Design:** Connections should feel organic like branches, while being clean and simple like circuitry.

Tree layout can be simple and manual for MVP.

### 3. Profile Page

**Purpose:** Depth, memory, and legacy

Each family member has a profile that may include:
- Basic info (name, relation, short bio)
- Photos
- Life stories or memories
- Optional audio recordings (voice memories)

Profiles grow gradually over time.

#### Prompts

Use pre-structured, gentle prompts to help populate profiles:
- Prompts are optional and ignorable
- Examples:
  - "A place that mattered to you"
  - "Something you wish you knew at 25"
  - "A memory you want your family to remember"
  - "A way God has worked in your life"
- Prompts should appear subtly and never block usage

#### Deceased Profiles

- Are read-only by default
- Allow additive memories ("Add a memory about Grandpa")
- Do not allow overwriting or argumentative edits

---

## Onboarding

Onboarding must be short and non-intimidating.

**Required:**
- Name
- Relation (e.g., Dad, Sister, Grandpa)

**Optional:**
- Photo

**Immediately after onboarding, users should be able to:**
- View the updates feed with daily verse
- View the family tree

No required life stories or profile completion during onboarding.

---

## Visual Design Direction

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Forest Green | #2D6A4F | Primary buttons, actions |
| Deep Forest | #1B4332 | Headers, verse background |
| Light Green | #40916C | Accents, hover states |
| Brown | #8B7355 | Avatar variants |
| Branch | #D4C4B0 | Vine connectors |
| Heart/Coral | #E07A5F | Reactions, alerts |
| Warm White | #FEFDFB | Primary background |
| Cream | #F9F7F4 | Cards, secondary surfaces |

### Aesthetic
- Natural, vine-inspired visuals
- Rounded cards and soft edges
- Thin (1.5px) vine/branch connectors
- Subtle animations for delight (taps, transitions)

### Typography
- Clean, modern sans-serif (system font)

### Icons
- Simple SVG outlines (home, tree, profile)
- Friendly but professional

### Avoid
- Social media aesthetics
- Aggressive gamification
- Metrics, scores, or performance pressure
- Heavy religious imagery (keep it subtle and warm)

---

## Technical Stack

### Platform
- Cross-platform mobile app (iOS + Android)
- React Native (Expo)

### Backend (Firebase)
- Authentication
- Firestore database
- Storage for photos/audio

### Data Model Requirements
- Multiple families
- Deceased members
- Profiles independent from user accounts
- A feed derived from user actions (posts/memories)
- Daily verse rotation

### Optimization Priorities
- Low Firebase read/write costs
- Paginated feeds
- Media compression

---

## Monetization

Subscription-based family plan.

### Free Tier
- Family tree
- Profiles
- Daily Bible verse
- Limited media storage

### Paid Tier
- Unlimited photos and memories
- Audio recordings
- Deceased family member archives
- Long-term storage and preservation

**Pricing is per family, not per user.**

---

## MVP Scope Constraints

### Focus On
- Correctness, clarity, and emotional tone
- Natural faith integration
- Scalable tree visualization

### DO NOT Add
- Likes beyond a simple heart
- Comments
- AI features
- Complex notification logic
- Advanced genealogy logic

**Goal:** A shippable, emotionally resonant, faith-affirming MVP, not a fully scaled product.

---

## Output Expectation

### Generate
- App structure and navigation
- Core screens and components
- Data model scaffolding
- Reasonable defaults for UX and UI

### Prioritize
- Simplicity
- Warmth
- Faith integration
- Long-term usability

**This app should feel like something a Christian family would still be glad exists 10 years from now.**

---

*Version: 2.0*
*Updated: 2026-02-01*
*Name changed from "Family Tree App" to "The Vine"*
*Added Christian faith component with daily Bible verses*
