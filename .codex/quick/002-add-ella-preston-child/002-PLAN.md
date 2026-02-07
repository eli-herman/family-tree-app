---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/mockData.ts
autonomous: false

must_haves:
  truths:
    - "Ella and Preston have a child in mock data with correct parent/child relationships"
    - "Tree renders a nested family unit under Ella and Preston for connector validation"
  artifacts:
    - path: "src/utils/mockData.ts"
      provides: "Child record linked to Ella and Preston"
      contains: "mila"
---

<objective>
Add a child under Ella and Preston in mock data so the tree shows a nested family unit for connector validation.

Output: Mock data updated with a new child and parent/child relationships wired correctly.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/utils/mockData.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add child for Ella and Preston in mock data</name>
  <files>
    src/utils/mockData.ts
  </files>
  <action>
    - Create a new FamilyMember child record (id: mila)
    - Add child relationship entries to Ella and Preston
    - Add parent relationships to the new child
  </action>
  <verify>
    Reload the tree screen and confirm a child appears under Ella + Preston.
  </verify>
  <done>
    - Child appears under Ella and Preston in the tree
    - Relationships are bidirectional (parents point to child, child points to parents)
  </done>
</task>

</tasks>

<verification>
- Tree screen renders with a nested unit for Ella + Preston and their child
</verification>

<success_criteria>
1. Mock data includes a child for Ella + Preston
2. Child has parent relationships to both Ella and Preston
3. Ella and Preston each list the child relationship
</success_criteria>

<output>
After completion, create `.planning/quick/002-add-ella-preston-child/002-SUMMARY.md`
</output>
