# The Vine - Design Specification

> SINGLE SOURCE OF TRUTH for all UI decisions
> ALL AGENTS MUST READ THIS FILE BEFORE MAKING ANY UI DECISIONS

## App Identity

- **Name:** The Vine
- **Tagline:** "I am the vine; you are the branches" — John 15:5
- **Purpose:** Christian family connection and memory preservation

## Design Philosophy

### Inspiration
- **Natural vine/branch aesthetic** with forest greens and earth tones
- **Emotional tone:** "This feels like home and faith combined."

### Core Principles
1. **Warm and faith-affirming** - Colors and shapes that feel inviting
2. **Playful but respectful** - Light touches of delight without being childish
3. **Simple** - Easy to use for 10 seconds or 10 minutes
4. **Meaningful** - Built to matter 10 years from now

### What We Avoid
- Social media aesthetics
- Aggressive gamification
- Metrics, scores, or performance pressure
- Heavy religious imagery (keep it subtle)
- Guilt-based prompts

---

## Color Palette

### Primary Colors (Forest Greens)
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Forest | `#2D6A4F` | `--primary` | Primary buttons, active states |
| Deep Forest | `#1B4332` | `--primary-dark` | Headers, verse backgrounds |
| Light Green | `#40916C` | `--primary-light` | Secondary accents, links |

### Accent Colors (Earth Tones)
| Name | Hex | Usage |
|------|-----|-------|
| Brown | `#8B7355` | Avatar variant, accents |
| Brown Light | `#A69076` | Avatar gradients |
| Branch | `#D4C4B0` | **Vine connectors**, borders |
| Heart | `#E07A5F` | Reactions, logout, alerts |

### Backgrounds (Warm Neutrals)
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Warm White | `#FEFDFB` | `--bg-primary` | Primary background |
| Cream | `#F9F7F4` | `--bg-secondary` | Cards, feed items |
| Tertiary | `#F0EDE8` | `--bg-tertiary` | Dividers, placeholders |

### Text
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#1C1917` | Main text |
| Secondary | `#57534E` | Descriptions, labels |
| Tertiary | `#A8A29E` | Timestamps, hints |
| Inverse | `#FFFFFF` | Text on dark backgrounds |

---

## Typography

### Font Family
- System font (San Francisco on iOS, Roboto on Android)

### Type Scale
| Style | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 | 36px | 700 | 43px |
| H2 | 30px | 700 | 36px |
| H3 | 24px | 600 | 29px |
| H4 | 20px | 600 | 24px |
| Body | 16px | 400 | 24px |
| Body Small | 14px | 400 | 21px |
| Caption | 12px | 400 | 18px |
| Button | 16px | 600 | 20px |

---

## Spacing System

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Small elements |
| md | 8px | Inputs |
| lg | 12px | Cards, buttons |
| xl | 16px | Large cards |
| 2xl | 24px | Modals |
| full | 9999px | Avatars, pills |

---

## Component Standards

### Avatar
- **Sizes:** sm (32px), md (44px), lg (56px), xl (80px)
- **Variants:** green, brown, branch
- Shows initial letter when no image
- Solid background color

### Button
- **Variants:** primary (forest), secondary (tertiary bg), outline, ghost
- **Sizes:** sm (36px), md (48px), lg (56px)
- Border radius: lg (12px)

### Card
- **Variants:** elevated (shadow), outlined (border), filled (cream)
- Default padding: md (16px)
- Border radius: lg (12px)

### Tree Node
- **Scales:** normal (100px min), small (80px), tiny (64px)
- Border: 1.5px tertiary, 2px forest when selected
- Contains: Avatar + Name + Relation label

### Vine Connectors ⭐ KEY ELEMENT
- **Width:** 1.5px (thin, circuit-like)
- **Color:** Branch (#D4C4B0)
- Clean, minimal lines connecting nodes
- Feels organic but precise

### Daily Verse Card
- Background: Deep Forest (#1B4332)
- Text: Inverse white
- Cross icon (✝) in subtle circle
- Italic verse text, dimmed reference

### Feed Item
- Background: Cream (#F9F7F4)
- Avatar with initial + name + action
- Timestamp on right
- Heart reaction button

### Prompt Card
- Cream background, dashed Branch border
- 🌿 leaf icon
- Italic prompt in quotes
- "Share a memory →" link

---

## Tab Bar

- Background: Warm White
- Active: Forest (#2D6A4F)
- Inactive: Tertiary (#A8A29E)
- Height: 84px
- Icons: 24px SVG outlines
- Labels: 10px medium

---

## Shadows

### Elevated
```
shadowColor: #000
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.08
shadowRadius: 12
```

### Subtle
```
shadowColor: #000
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.06
shadowRadius: 8
```

---

## Animation Guidelines

- Transitions: 200ms ease
- Button press: opacity 0.8
- Keep subtle and purposeful
- No aggressive attention-grabbing

---

## Agent Checklist

Before implementing ANY UI component, verify:

- [ ] Colors match the forest green palette
- [ ] Using system font
- [ ] Spacing uses the defined scale
- [ ] Border radius matches standards
- [ ] Touch targets minimum 44x44
- [ ] Vine connectors are 1.5px Branch color
- [ ] No social media patterns
- [ ] Faith elements are subtle, not preachy

---

*Last updated: 2026-02-01*
*Version: 3.0 - Updated for "The Vine" rebrand*
