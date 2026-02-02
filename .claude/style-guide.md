# Style Guide

## Code Style

### General Principles
- Keep it simple - avoid over-engineering
- Write self-documenting code
- Only add comments where logic isn't obvious

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `familyTree` |
| Functions | camelCase | `getUserData()`, `buildTree()` |
| Constants | UPPER_SNAKE | `MAX_FAMILY_SIZE`, `API_URL` |
| Components | PascalCase | `FamilyCard`, `TreeView` |
| Files | kebab-case | `family-tree.js`, `user-profile.tsx` |

### Formatting
- Indentation: 2 spaces
- Max line length: 100 characters
- Use single quotes for strings (unless language convention differs)

## Git Conventions

### Commit Messages
Format: `type: short description`

Types:
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation
- `style:` - formatting, no code change
- `refactor:` - code restructuring
- `test:` - adding tests

Example: `feat: add family member search`

### Branch Naming
- `feature/description` - new features
- `fix/description` - bug fixes
- `refactor/description` - code improvements

## Design Philosophy

### iOS-Inspired Design
- **Simple & Clean:** Minimalist interface, no clutter
- **Easy Navigation:** Clear hierarchy, intuitive flow
- **User-Friendly:** Accessible to all ages (grandparents to kids)
- **Consistent:** Uniform patterns throughout the app

### UI Principles
- Generous white space
- Clear typography hierarchy
- Subtle shadows and depth
- Smooth animations/transitions
- Touch-friendly tap targets (44pt minimum)
- System fonts when possible (SF Pro style)

### Color Approach
- Soft, warm colors for family feel
- High contrast for readability
- Consistent accent color for actions

## Preferences

### Things I Like
- iOS Human Interface Guidelines approach
- Simple over complex
- Clean, readable layouts
- Intuitive without instructions needed

### Things to Avoid
- Cluttered screens
- Tiny touch targets
- Confusing navigation
- Feature overload

---
*Last updated: 2026-02-01*
