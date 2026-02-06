---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(tabs)/tree.tsx
  - src/components/tree/VineConnector.tsx
  - src/components/tree/FamilyUnitNode.tsx
autonomous: false

must_haves:
  truths:
    - "Vine connector lines visibly connect parent couple to each child node below"
    - "Grandparent branches have comfortable spacing (not crammed together)"
    - "Horizontal spouse connector line is visible between the two parent nodes at node-center height"
    - "Tree can be panned and pinch-zoomed with smooth animation"
    - "Pinch zoom has dynamic min-scale (full tree fits viewport) and max 2x"
  artifacts:
    - path: "app/(tabs)/tree.tsx"
      provides: "Gesture-based pan+pinch tree screen"
      contains: "Gesture.Simultaneous"
    - path: "src/components/tree/VineConnector.tsx"
      provides: "Fixed FamilyConnector SVG paths + height-aware SpouseConnector"
      contains: "FamilyConnector"
  key_links:
    - from: "app/(tabs)/tree.tsx"
      to: "react-native-gesture-handler"
      via: "Gesture.Pan + Gesture.Pinch composed"
      pattern: "Gesture\\.(Pan|Pinch|Simultaneous)"
    - from: "app/(tabs)/tree.tsx"
      to: "react-native-reanimated"
      via: "useSharedValue + useAnimatedStyle"
      pattern: "useSharedValue|useAnimatedStyle"
---

<objective>
Fix three visual bugs in the family tree screen and add pinch-to-zoom interaction.

Purpose: The tree screen currently has broken connector SVG paths, invisible spouse connector between parents, and cramped grandparent spacing -- making the tree unusable. Adding pinch-to-zoom enables navigating larger family trees.

Output: A fully functional tree screen with correct vine connectors, proper spacing, and gesture-based pan + pinch-to-zoom.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/(tabs)/tree.tsx
@src/components/tree/VineConnector.tsx
@src/components/tree/FamilyUnitNode.tsx
@src/components/tree/TreeNode.tsx
@src/constants/spacing.ts
@app/_layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix connector bugs (FamilyConnector SVG, SpouseConnector visibility, grandparent spacing)</name>
  <files>
    src/components/tree/VineConnector.tsx
    app/(tabs)/tree.tsx
    src/components/tree/FamilyUnitNode.tsx
  </files>
  <action>
    THREE fixes in this task:

    **Fix A - FamilyConnector SVG paths (VineConnector.tsx):**
    Rewrite the multi-child branch of `FamilyConnector` to be robust. The current logic has issues:
    1. When children are clustered near `coupleCenter`, the `leftmost < coupleCenter - CORNER_RADIUS` check skips drawing branches entirely, so no line reaches the leftmost child.
    2. No vertical drop is drawn for children that happen to be directly under the center.

    New approach for multi-child case:
    - Draw vertical stem: `M coupleCenter 0 L coupleCenter midY`
    - Draw horizontal rail from leftmost to rightmost at midY: `M leftmost midY L rightmost midY`
    - Draw vertical drop for EVERY child: for each pos in childPositions, `M pos midY L pos height`
    - Apply corner rounding using Q curves only where there is enough distance (>= 2*CORNER_RADIUS between points). When distance is tight, use straight lines instead of trying to curve.
    - This is simpler and more reliable than the current left-branch/right-branch approach.

    **Fix B - SpouseConnector between parents invisible (VineConnector.tsx + tree.tsx):**
    The `SpouseConnector` component currently renders an SVG with `height={STROKE_WIDTH}` (2.5px). In `tree.tsx`, it sits between two `ancestorBranch` divs in a row with `alignItems: 'flex-end'`. The connector appears at the very bottom of the row, far below the parent nodes.

    Fix approach: Make `SpouseConnector` accept an optional `height` prop. In `tree.tsx`, the SpouseConnector between the two ancestor branches needs to be vertically centered on the parent TreeNode. Since each `ancestorBranch` has the parent TreeNode at its very bottom (after grandparents + VineVertical), and the ancestor row uses `alignItems: 'flex-end'`, the SpouseConnector should stretch to the height of a TreeNode (roughly 100px for normal scale) and draw its horizontal line at the vertical center. Change `SpouseConnector` to:
    - Accept optional `height` prop (default: `STROKE_WIDTH` for backward compat with inline spouse connectors)
    - When height is provided, draw the line at `height / 2` vertically
    - In `tree.tsx`, pass `height={100}` to the SpouseConnector between ancestor branches (this roughly matches TreeNode normal height: padding*2 + avatar(48) + name + relation text). Use `alignSelf: 'flex-end'` on the SpouseConnector wrapper so it aligns with the bottom of the ancestor branches where the parent nodes are.

    **Fix C - Grandparent spacing (tree.tsx):**
    Change `SPOUSE_GAP` from `spacing.sm` (8px) to `spacing['2xl']` (48px). This applies to the gap between the two ancestor branches. Also increase the spouse gap within each grandparent couple row from 8px to `spacing.md` (16px) -- pass a wider width to the `SpouseConnector` in each `coupleRow`. Same for `FamilyUnitNode.tsx`: change its `SPOUSE_GAP` from `spacing.sm` to `spacing.md` (16px).
  </action>
  <verify>
    Run `npx tsc --noEmit` to verify no TypeScript errors. Visually inspect the tree screen on iOS simulator (`npm run ios`) -- vine lines should connect from parent couple down to each child, the horizontal connector between Shelby and Timothy should be visible as a horizontal line at their vertical center, and grandparent branches should have comfortable spacing.
  </verify>
  <done>
    - FamilyConnector draws a visible vine from couple center down to every child position
    - SpouseConnector between ancestor branches shows a horizontal line at parent-node height
    - Grandparent branches have 48px gap between them; spouse connectors within couples are 16px wide
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace PanResponder with gesture-handler pan + pinch-to-zoom</name>
  <files>
    app/(tabs)/tree.tsx
  </files>
  <action>
    Replace the existing `PanResponder` + RN `Animated` pan system with `react-native-gesture-handler` + `react-native-reanimated`.

    **Imports to add:**
    ```
    import { Gesture, GestureDetector } from 'react-native-gesture-handler';
    import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
    ```
    Remove old imports: `PanResponder` from react-native, the old `Animated` from react-native (keep only reanimated's `Animated`).

    **Shared values:**
    ```
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    ```

    **Dynamic min scale:**
    Add state for `treeSize` (measured via onLayout on the treeContainer). Add state for `viewportSize` (measured via onLayout on the panArea). Compute `minScale` as:
    ```
    const minScale = Math.min(
      viewportSize.width / treeSize.width,
      viewportSize.height / treeSize.height,
      1 // don't zoom in as minimum
    );
    ```
    Use `0.3` as fallback if tree hasn't been measured yet. Max scale = 2.

    **Gestures:**
    Pan gesture:
    ```
    const panGesture = Gesture.Pan()
      .onUpdate((e) => {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });
    ```

    Pinch gesture:
    ```
    const pinchGesture = Gesture.Pinch()
      .onUpdate((e) => {
        const newScale = savedScale.value * e.scale;
        scale.value = Math.min(Math.max(newScale, minScale), 2);
      })
      .onEnd(() => {
        savedScale.value = scale.value;
      });
    ```

    Compose: `const composed = Gesture.Simultaneous(panGesture, pinchGesture);`

    **Animated style:**
    ```
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));
    ```

    **JSX changes:**
    - Replace the `panArea` View + `panResponder.panHandlers` with `<GestureDetector gesture={composed}><View style={styles.panArea}>...</View></GestureDetector>`
    - Replace the old `Animated.View` (from RN Animated) with reanimated's `Animated.View` using `animatedStyle`
    - Remove the old `pan` ref and `panResponder` ref entirely

    **Layout measurement:**
    Add `onLayout` to panArea View to capture viewport dimensions:
    ```
    const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
    const handleViewportLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setViewportSize({ width, height });
    };
    ```
    Add `onLayout` to treeContainer to capture tree dimensions:
    ```
    const [treeSize, setTreeSize] = useState({ width: 1, height: 1 });
    const handleTreeLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setTreeSize({ width, height });
    };
    ```
  </action>
  <verify>
    Run `npx tsc --noEmit` to verify no TypeScript errors. Test on iOS simulator: two-finger pinch should zoom in/out (min zoom fits full tree, max zoom 2x), single-finger drag should pan the tree. Verify that tree node presses still work (tap on a node should select it, not trigger pan).
  </verify>
  <done>
    - PanResponder fully removed, replaced with gesture-handler Gesture.Pan + Gesture.Pinch
    - Pinch zoom works with dynamic min-scale based on tree/viewport measurement, max 2x
    - Pan works with single finger drag
    - Node tap selection still works (not intercepted by pan gesture)
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fixed all three tree connector bugs and added pinch-to-zoom:
    1. FamilyConnector SVG paths now draw stem + rail + drops for every child
    2. SpouseConnector between parent nodes is visible at node-center height
    3. Grandparent branches have 48px spacing (was 8px)
    4. Pinch-to-zoom with dynamic min scale + pan gesture replaces old PanResponder
  </what-built>
  <how-to-verify>
    1. Run `npm run ios` to open the app on iOS simulator
    2. Navigate to the Family Tree tab
    3. Verify grandparent branches are well-spaced (not crammed)
    4. Verify the horizontal vine between Shelby and Timothy is visible
    5. Verify vine lines connect from the parent couple downward to each child
    6. Pinch to zoom out -- tree should shrink to fit the viewport
    7. Pinch to zoom in -- should zoom up to 2x
    8. Drag with one finger to pan around
    9. Tap a tree node -- it should highlight with a green border (selection still works)
  </how-to-verify>
  <resume-signal>Type "approved" or describe any visual issues to fix</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- Tree renders with visible connectors between all generations
- Pinch-to-zoom and pan gestures work smoothly
- No regressions on node selection tap behavior
</verification>

<success_criteria>
1. All vine connector lines are visible between parent couple and children
2. Spouse connector between Shelby/Timothy is a visible horizontal line at their vertical center
3. Grandparent branches have 48px gap (not 8px)
4. Pinch-to-zoom works with min-scale fitting full tree, max 2x
5. Pan works via single-finger drag
6. TypeScript compiles with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/001-fix-tree-connector-bugs-grandparent-spac/001-SUMMARY.md`
</output>
