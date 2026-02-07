---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(tabs)/tree.tsx
  - src/components/tree/FamilyUnitNode.tsx
autonomous: false

must_haves:
  truths:
    - "Tree no longer hits maximum update depth in Expo Go"
    - "Nested connectors align to the couple center of child family units"
  artifacts:
    - path: "app/(tabs)/tree.tsx"
      provides: "Stable child couple center propagation"
      contains: "handleChildCoupleCenter"
    - path: "src/components/tree/FamilyUnitNode.tsx"
      provides: "Couple center measured from layout and reported once"
      contains: "handleCoupleLayout"
---

<objective>
Fix the maximum update depth loop and ensure nested connector targets use the actual couple center of child family units.

Output: Stable tree rendering without render loops; connectors align to family unit couple centers.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(tabs)/tree.tsx
@src/components/tree/FamilyUnitNode.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Stabilize couple center propagation</name>
  <files>
    app/(tabs)/tree.tsx
    src/components/tree/FamilyUnitNode.tsx
  </files>
  <action>
    - Measure couple center via couple row layout
    - Report couple center via callback only when it changes
    - Guard parent state updates against identical values
  </action>
  <verify>
    Reload in Expo Go; ensure no maximum update depth error and connectors render fully.
  </verify>
  <done>
    - No render loop
    - Nested connectors align to child couple centers
  </done>
</task>

</tasks>

<verification>
- Tree screen loads without maximum update depth errors
</verification>

<success_criteria>
1. Expo Go no longer throws maximum update depth exceeded
2. Child family units connect at the couple center
</success_criteria>

<output>
After completion, create `.codex/quick/003-fix-nested-connector-loop/003-SUMMARY.md`
</output>
