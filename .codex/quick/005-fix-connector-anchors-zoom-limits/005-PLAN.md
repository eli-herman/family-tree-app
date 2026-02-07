---
phase: quick
plan: 005
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(tabs)/tree.tsx
  - src/components/tree/FamilyUnitNode.tsx
  - .claude/agents/status-board.md

autonomous: false

must_haves:
  truths:
    - "Connector stems and drops meet spouse lines and child anchors without gaps"
    - "Center couple spacing matches other spouse pairs (consistent gap)"
    - "Zoom range is bounded using tree node extents + padded square boundary"
  artifacts:
    - path: "app/(tabs)/tree.tsx"
      provides: "Connector overlay + gesture scaling + layout structure"
      contains: "connectorLayer"
    - path: "src/components/tree/FamilyUnitNode.tsx"
      provides: "Consistent couple layout for spouses"
      contains: "FamilyUnitNode"
---

<objective>
Fix connector anchor alignment, ensure consistent spouse spacing, and add dynamic zoom bounds based on the furthest node plus padding.

Output: Lines meet node edges cleanly, spouses sit at a consistent gap, and zoom limits are computed from node bounds.
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
  <name>Task 1: Align connector anchors + normalize center couple spacing</name>
  <files>
    app/(tabs)/tree.tsx
    src/components/tree/FamilyUnitNode.tsx
  </files>
  <action>
    Connector anchor alignment:
    - Use the spouse line midpoint (line.y) as the parent origin for stems.
    - For child family units, anchor drops to the child couple's spouse line midpoint (line.midX, line.y), not the top edge.
    - Compute railY between parent midline and child anchors with a clamp: railY = max(line.y + spacing.sm, minAnchorY - spacing.sm).

    Spouse spacing consistency:
    - Render the center couple as a FamilyUnitNode (centerUnit) rather than separate spouse nodes under each grandparent branch.
    - Keep grandparent branches side-by-side (SPOUSE_GAP) but place a single center couple row below them so spouse gap is always the couple gap.
    - Remove the custom children row in tree.tsx; centerUnit's children render inside FamilyUnitNode.
  </action>
  <verify>
    Reload the tree screen in Expo Go and confirm:
    - Spouse lines connect to stems with no vertical gaps.
    - Parent-child drops meet child anchors cleanly.
    - Center couple (parents) spacing matches other couples.
  </verify>
  <done>
    - Stems originate at spouse line midpoints.
    - Child family-unit anchors align to their spouse line midpoints.
    - Parents are not spaced by the grandparent branch gap.
  </done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>Define the zoom boundary semantics for the new padded square rule.</decision>
  <context>
    "Max zoom limit" can mean either:
    A) Maximum zoom-out (minScale) fits a padded square around the furthest node
    B) Maximum zoom-in (maxScale) is capped by the padded square size
  </context>
  <options>
    <option id="max-zoom-out">
      <name>Max zoom-out boundary (minScale)</name>
      <pros>Matches "furthest node" language; ensures the full tree fits inside a padded square at minimum zoom.</pros>
      <cons>Does not change maximum zoom-in behavior.</cons>
    </option>
    <option id="max-zoom-in">
      <name>Max zoom-in boundary (maxScale)</name>
      <pros>Explicitly caps how far users can zoom in.</pros>
      <cons>Ambiguous mapping between boundary size and desired max scale.</cons>
    </option>
  </options>
  <resume-signal>Reply with "A" or "B" and any padding amount you want (px).</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Implement zoom bounds from node extents + padded square</name>
  <files>
    app/(tabs)/tree.tsx
  </files>
  <action>
    - Compute node bounds from nodeFrames (minX/minY/maxX/maxY).
    - Build a padded square: side = max(width, height) + 2 * padding.
    - Apply the selected boundary to scale limits (per decision above).
    - Clamp existing scale values when limits update.
  </action>
  <verify>
    Pinch zoom: confirm you can zoom in/out freely, but the chosen boundary stops you at the correct limit.
  </verify>
  <done>
    - Zoom limits are derived from node extents + padding.
    - Scale clamps to new limits when bounds change.
  </done>
</task>

</tasks>

<verification>
- Tree screen shows clean connector attachments with consistent spouse spacing
- Zoom boundary behavior matches the selected option
</verification>

<success_criteria>
1. Connector stems and drops touch spouse lines and child anchors without gaps
2. All spouse pairs share consistent spacing (parents not over-separated)
3. Zoom limit derived from furthest node + padding is enforced
</success_criteria>

<output>
After completion, create `.codex/quick/005-fix-connector-anchors-zoom-limits/005-SUMMARY.md`
</output>
