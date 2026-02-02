# Agent Coordination Protocol

> Rules for how multiple agents work together on this project

## Core Principle

**Single Source of Truth:** All design decisions come from `design-spec.md`. No agent deviates without updating the spec first.

---

## Before Starting Work

Every agent MUST:

1. **Read these files:**
   - `CLAUDE.md` (project overview)
   - `.claude/agents/design-spec.md` (design system)
   - `.claude/agents/status-board.md` (what others are working on)
   - `.claude/agents/updates-log.md` (recent changes)

2. **Check for conflicts:**
   - Is another agent working on the same component?
   - Are there pending changes that affect your work?

3. **Announce your task:**
   - Add your task to `status-board.md` before starting

---

## While Working

### Component Ownership
- One agent owns one component at a time
- If you need to modify another agent's component, coordinate first
- Shared components (nav, footer) require updating the log

### Naming Conventions
```
Components: PascalCase (FamilyCard, TreeView)
Files: kebab-case (family-card.tsx, tree-view.tsx)
CSS classes: kebab-case (family-card-header)
Variables: camelCase (familyMembers, treeData)
```

### File Organization
```
src/
├── components/
│   ├── common/      # Shared UI components
│   ├── family/      # Family-related components
│   ├── tree/        # Tree visualization
│   └── profile/     # User profile components
├── pages/           # Route pages
├── hooks/           # Custom React hooks
├── utils/           # Helper functions
├── types/           # TypeScript types
└── styles/          # Global styles
```

---

## After Completing Work

Every agent MUST:

1. **Update status-board.md:**
   - Mark task as complete
   - Note any blockers for other agents

2. **Log changes in updates-log.md:**
   - What you built/changed
   - Any decisions made
   - Dependencies created

3. **Update design-spec.md if:**
   - You introduced a new pattern
   - You discovered the spec was unclear
   - You made a design decision not in the spec

---

## Communication Format

### Status Board Entry
```markdown
## [Agent Name/Task]
- **Status:** In Progress / Complete / Blocked
- **Working On:** [Component/Feature]
- **Files Touched:** [List files]
- **Blockers:** [Any issues]
- **ETA:** [If applicable]
```

### Update Log Entry
```markdown
## [Date] - [Agent/Task Name]
### Changes
- [What changed]

### Decisions Made
- [Any decisions with rationale]

### For Other Agents
- [Anything others need to know]
```

---

## Conflict Resolution

If two agents have conflicting approaches:

1. **Check design-spec.md** - Does it answer the question?
2. **Check updates-log.md** - Was a decision already made?
3. **If still unclear:**
   - Pause work
   - Document the conflict in status-board.md
   - Wait for human decision

---

## Shared Resources

### Component Library
Agents should check `src/components/common/` before creating new base components.

Already built? Use it. Not built? Build it there for others.

### Shared Types
All TypeScript interfaces go in `src/types/`. Check before defining new types.

### Utilities
Shared helpers go in `src/utils/`. Don't duplicate logic.

---

*This protocol ensures all agents produce cohesive, consistent work.*
