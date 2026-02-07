---
phase: quick
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(tabs)/tree.tsx
  - src/components/tree/FamilyUnitNode.tsx
  - src/components/tree/TreeNode.tsx

autonomous: false

must_haves:
  truths:
    - "Connectors attach to node edges (spouse lines to left/right edges, parent-child to top edges)"
    - "Connectors draw in a single overlay and no longer float between rows"
    - "Branch feel preserved with subtle rounded line ends"
  artifacts:
    - path: "app/(tabs)/tree.tsx"
      provides: "SVG connector overlay anchored to measured node frames"
      contains: "connectorLayer"
    - path: "src/components/tree/TreeNode.tsx"
      provides: "Measured node frames for connectors"
      contains: "measureRelativeTo"
---

<objective>
Rework family tree connectors to anchor to node edges using a single SVG overlay, giving a clean branch feel with subtle rounded ends.

Output: Connector lines attach directly to nodes instead of floating between rows.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(tabs)/tree.tsx
@src/components/tree/FamilyUnitNode.tsx
@src/components/tree/TreeNode.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add measured node frames + SVG connector overlay</name>
  <files>
    app/(tabs)/tree.tsx
    src/components/tree/FamilyUnitNode.tsx
    src/components/tree/TreeNode.tsx
  </files>
  <action>
    - Measure node frames relative to the tree container
    - Draw all connectors in a single SVG overlay
    - Keep spacing between rows using spacer views
  </action>
  <verify>
    Reload Expo Go and confirm connectors touch node edges and no longer appear floating.
  </verify>
  <done>
    - Spouse lines connect to node edges
    - Parent-child stems originate at spouse line midpoint and drop to child anchors
  </done>
</task>

</tasks>

<verification>
- Tree screen renders with connectors anchored to node edges
</verification>

<success_criteria>
1. Connectors no longer float between nodes
2. Branch feel maintained with rounded line ends
</success_criteria>

<output>
After completion, create `.codex/quick/004-branch-style-connectors/004-SUMMARY.md`
</output>
