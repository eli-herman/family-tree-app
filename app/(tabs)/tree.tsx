/**
 * TreeScreen (tree.tsx) — Interactive Family Tree Visualization
 *
 * This is the family tree tab. It renders an interactive, zoomable, pannable
 * family tree using a custom layout engine, SVG vine connectors, and gesture
 * handling. This is the most complex screen in the app.
 *
 * High-level architecture:
 *   1. LAYOUT ENGINE — Two functions (`layoutUnit` and `buildTreeLayout`) compute
 *      the absolute (x, y) position and size of every family member node on a
 *      virtual canvas. The tree is laid out in rows:
 *        - Top row: grandparents (ancestor nodes)
 *        - Center row: aunts/uncles + the focus couple + their siblings
 *        - Below center: children, grandchildren (recursive)
 *        - Bottom row: orphan members not connected to any family unit
 *
 *   2. CONNECTOR ENGINE — A `useMemo` block computes four types of SVG line
 *      segments (spouseLines, stemLines, railLines, dropLines) that visually
 *      connect parents to children with thin, vine-like connectors.
 *
 *   3. GESTURE HANDLING — Pan and pinch gestures (via react-native-gesture-handler
 *      and react-native-reanimated) allow the user to drag and zoom the tree.
 *
 *   4. AUTO-CENTER — An effect automatically pans/animates the viewport to center
 *      on the "focus member" after a new member is added to the tree.
 *
 *   5. MANAGE FAMILY MODAL — A bottom-sheet modal listing all family members
 *      alphabetically, letting the user tap one to add relatives or edit details.
 *
 * Connector terminology:
 *   - spouseLine: horizontal line between two partners (husband and wife)
 *   - stemLine:   vertical line dropping down from the midpoint of a couple
 *   - railLine:   horizontal line spanning across all children at a shared Y level
 *   - dropLine:   vertical line from the rail down to each individual child node
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  LayoutChangeEvent, // Type for the onLayout callback event
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler'; // Gesture recognition library
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'; // Animation library for smooth gestures
import { SafeAreaView } from 'react-native-safe-area-context'; // Handles notch/status bar insets
import Svg, { Line } from 'react-native-svg'; // SVG rendering for vine connector lines
import { useRouter } from 'expo-router'; // Navigation hook for programmatic routing
import { TreeNode, TREE_NODE_HEIGHT, TREE_NODE_WIDTH } from '../../src/components/tree'; // Tree node UI component and its fixed dimensions
import { Avatar } from '../../src/components/common'; // Shared avatar component for the manage modal
import { borderRadius, colors, spacing } from '../../src/constants'; // Design system tokens
import { FamilyMember, FamilyUnit, FamilyTreeData, isFamilyUnit } from '../../src/types'; // TypeScript types and type guard for the tree data model
import { useFamilyStore } from '../../src/stores'; // Zustand store holding family members, units, and tree builder

// =============================================================================
// LAYOUT CONSTANTS
// These control the spacing between nodes, connectors, and the overall canvas.
// =============================================================================

const SPOUSE_GAP = spacing['2xl']; // 48px — horizontal gap between separate family branches (e.g., between aunt/uncle subtrees)
const COUPLE_GAP = spacing.md; // 16px — horizontal gap between two partner nodes within a couple
const CHILD_GAP = spacing.md; // 16px — horizontal gap between sibling nodes in the children row
const CONNECTOR_GAP = 48; // 48px — vertical space between a parent row and the child row below (room for connector lines)
const LAYOUT_PADDING = 48; // 48px — padding around the entire tree canvas so nodes aren't flush with the edge
const ZOOM_IN_MULTIPLIER = 3; // Maximum zoom = minScale * 3 (so user can zoom in 3x beyond fit-to-screen)
const CONNECTOR_STROKE = 2.5; // Stroke width (thickness) of the SVG vine connector lines in points
const CONNECTOR_COLOR = colors.brown.branch; // Earthy brown color (#D4C4B0) used for all vine connector lines

// =============================================================================
// TYPE DEFINITIONS
// These types describe the geometry of the tree layout and the connector lines.
// =============================================================================

/**
 * LineSeg — a single straight line segment defined by two endpoints.
 * Used for all four connector types (spouse, stem, rail, drop).
 */
type LineSeg = { x1: number; y1: number; x2: number; y2: number };

/**
 * NodeFrame — the absolute position and size of a single tree node on the canvas.
 * x and y are the top-left corner; width and height are the node dimensions.
 */
type NodeFrame = { x: number; y: number; width: number; height: number };

/**
 * Variant — the color theme applied to a tree node, determined by its depth in the tree.
 *   'brown'  = grandparent generation (depth 0) — earthy brown
 *   'green'  = parent generation (depth 1) — forest green
 *   'branch' = children and beyond (depth 2+) — light branch color
 */
type Variant = 'brown' | 'green' | 'branch';

/**
 * PartnerLine — geometry describing the horizontal line between two partners
 * (or the midpoint of a single partner). Used by the connector engine to
 * figure out where to draw the stem line down to the children rail.
 *
 * x1, x2   — left and right endpoints of the spouse line
 * y        — the vertical center of the spouse line
 * midX     — horizontal midpoint between the two partners (where the stem drops)
 * bottomY  — the bottom edge of the taller partner's node
 * topY     — the top edge of the shorter partner's node
 * partnerCount — 1 if single parent, 2 if a couple
 */
type PartnerLine = {
  x1: number;
  x2: number;
  y: number;
  midX: number;
  bottomY: number;
  topY: number;
  partnerCount: 1 | 2;
};

/**
 * LayoutResult — the output of the layoutUnit function for a single family unit.
 * Contains the total bounding box (width, height) and the positioned frames
 * and color variants for every member within that unit.
 */
type LayoutResult = {
  width: number; // Total width of this unit's bounding box
  height: number; // Total height of this unit's bounding box
  frames: Record<string, NodeFrame>; // Map of member ID -> absolute position within the unit
  variants: Record<string, Variant>; // Map of member ID -> color variant
};

/**
 * TreeLayout — extends LayoutResult with the final square canvas size.
 * This is the output of buildTreeLayout and is used by the render layer.
 */
type TreeLayout = LayoutResult & { treeSize: { width: number; height: number } };

/**
 * EMPTY_LAYOUT — a fallback layout used when there is no tree data.
 * Has 1x1 dimensions to avoid division-by-zero errors in scale calculations.
 */
const EMPTY_LAYOUT: TreeLayout = {
  width: 1,
  height: 1,
  frames: {}, // No nodes to position
  variants: {}, // No variants to assign
  treeSize: { width: 1, height: 1 }, // Minimal canvas to avoid NaN in zoom math
};

/**
 * depthVariant — maps a tree depth level to a color variant for the node.
 *   depth 0 = grandparents → 'brown' (earthy, oldest generation)
 *   depth 1 = parents → 'green' (forest green, middle generation)
 *   depth 2+ = children/grandchildren → 'branch' (light, youngest generation)
 *
 * @param depth - The generation depth (0 = oldest ancestors)
 * @returns The Variant string used to style the TreeNode component
 */
const depthVariant = (depth: number): Variant => {
  if (depth === 0) return 'brown'; // Grandparent generation
  if (depth === 1) return 'green'; // Parent generation
  return 'branch'; // Children and all deeper generations
};

// =============================================================================
// LAYOUT ENGINE
// =============================================================================

/**
 * layoutUnit — RECURSIVE function that calculates the position of every node
 * within a single FamilyUnit (a couple and their descendants).
 *
 * How it works:
 *   1. Calculate the width of the partner row (one node or two nodes + gap)
 *   2. Recursively lay out each child (which may itself be a FamilyUnit with
 *      its own partners and children, creating nested subtrees)
 *   3. Calculate the total width of the children row (sum of child widths + gaps)
 *   4. The unit's total width is the wider of the partner row or children row
 *   5. Center the partner row horizontally within the unit width
 *   6. Center the children row horizontally below the partner row
 *   7. Return all node frames with positions relative to this unit's top-left (0,0)
 *
 * Visual layout for a couple with 3 children:
 *
 *     [Partner A]  --gap--  [Partner B]     <- partner row (top)
 *              |                            <- connector gap (empty space for lines)
 *     [Child 1]  [Child 2]  [Child 3]      <- children row (bottom)
 *
 * @param unit - A FamilyUnit containing partners (1 or 2) and children (0 or more)
 * @returns LayoutResult with the bounding box dimensions and positioned frames for all members
 */
const layoutUnit = (unit: FamilyUnit): LayoutResult => {
  // Count how many partners this unit has (1 = single parent, 2 = couple)
  const partnerCount = unit.partners.length;

  // Calculate the total width needed for the partner row
  // If 2 partners: two node widths plus the gap between them
  // If 1 partner: just one node width
  const partnerWidth = partnerCount === 2 ? TREE_NODE_WIDTH * 2 + COUPLE_GAP : TREE_NODE_WIDTH;

  // Partner row height is always one node height (partners are side by side, not stacked)
  const partnerHeight = TREE_NODE_HEIGHT;

  // Recursively lay out each child. If a child is itself a FamilyUnit (meaning they
  // have a partner and/or children of their own), recurse into layoutUnit.
  // If the child is a plain FamilyMember (leaf node), create a simple single-node layout.
  const childLayouts = unit.children.map((child) => {
    if (isFamilyUnit(child)) {
      // This child has their own family — recursively compute their subtree layout
      return layoutUnit(child);
    }
    // This child is a leaf member — just a single node at position (0, 0)
    return {
      width: TREE_NODE_WIDTH,
      height: TREE_NODE_HEIGHT,
      frames: {
        [child.id]: { x: 0, y: 0, width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT },
      },
      variants: {
        [child.id]: depthVariant(unit.depth + 1), // Children are one generation deeper than their parents
      },
    } satisfies LayoutResult;
  });

  // Calculate the total width of the children row:
  // Sum of all child layout widths + gaps between adjacent children
  const childrenRowWidth =
    childLayouts.reduce((sum, layout) => sum + layout.width, 0) +
    Math.max(childLayouts.length - 1, 0) * CHILD_GAP; // (n-1) gaps between n children, minimum 0

  // The children row height is the tallest child subtree (some children may have
  // deeper descendant trees than others). Zero if there are no children.
  const childrenRowHeight = childLayouts.length
    ? Math.max(...childLayouts.map((layout) => layout.height))
    : 0;

  // The unit's total width is the wider of the partner row or children row.
  // This ensures the bounding box can contain both rows.
  const unitWidth = Math.max(partnerWidth, childrenRowWidth);

  // The unit's total height is the partner row height plus (if there are children)
  // the connector gap and the children row height.
  const unitHeight =
    partnerHeight + (childLayouts.length > 0 ? CONNECTOR_GAP + childrenRowHeight : 0);

  // Center the partner row horizontally within the unit's total width
  const partnerRowX = (unitWidth - partnerWidth) / 2;

  // Partner row is always at the top of the unit (y = 0)
  const partnerRowY = 0;

  // Build the frames map, placing partner nodes at their calculated positions.
  // If there's at least one partner, place them at the start of the partner row.
  const frames: Record<string, NodeFrame> = {
    ...(partnerCount >= 1
      ? {
          [unit.partners[0].id]: {
            x: partnerRowX, // First partner starts at the left edge of the centered partner row
            y: partnerRowY, // Top of the unit
            width: TREE_NODE_WIDTH,
            height: TREE_NODE_HEIGHT,
          },
        }
      : {}),
    // If there's a second partner, place them to the right of the first with a couple gap
    ...(partnerCount === 2
      ? {
          [unit.partners[1].id]: {
            x: partnerRowX + TREE_NODE_WIDTH + COUPLE_GAP, // Right of first partner + gap
            y: partnerRowY,
            width: TREE_NODE_WIDTH,
            height: TREE_NODE_HEIGHT,
          },
        }
      : {}),
  };

  // Assign color variants to the partner nodes based on their generation depth
  const variants: Record<string, Variant> = {
    ...(partnerCount >= 1 ? { [unit.partners[0].id]: depthVariant(unit.depth) } : {}),
    ...(partnerCount === 2 ? { [unit.partners[1].id]: depthVariant(unit.depth) } : {}),
  };

  // If there are children, position each child's layout in the children row
  if (childLayouts.length > 0) {
    // Start the cursor at the left edge of the centered children row
    let cursorX = (unitWidth - childrenRowWidth) / 2;

    // Children row starts below the partner row, separated by the connector gap
    const childRowY = partnerHeight + CONNECTOR_GAP;

    // Iterate through each child's layout and offset its frames into the unit's coordinate space
    for (const layout of childLayouts) {
      // Offset every frame within this child's layout by the cursor position and row Y
      Object.entries(layout.frames).forEach(([memberId, frame]) => {
        frames[memberId] = {
          x: frame.x + cursorX, // Shift right by the cursor position
          y: frame.y + childRowY, // Shift down by the children row's Y offset
          width: frame.width,
          height: frame.height,
        };
      });
      // Merge this child's variant assignments into the unit's variants map
      Object.assign(variants, layout.variants);
      // Advance the cursor to the right for the next child
      cursorX += layout.width + CHILD_GAP;
    }
  }

  // Return the complete layout for this unit: bounding box + all member positions + variants
  return { width: unitWidth, height: unitHeight, frames, variants };
};

const buildTreeLayout = (treeData: FamilyTreeData): TreeLayout => {
  const centerLayout = layoutUnit(treeData.centerUnit);

  // Lay out each ancestor child (aunt/uncle) as a standalone subtree
  // so they appear on the SAME row as the center couple (same generation).
  const layoutBranch = (child: FamilyUnit | FamilyMember): LayoutResult => {
    if (isFamilyUnit(child)) return layoutUnit(child);
    return {
      width: TREE_NODE_WIDTH,
      height: TREE_NODE_HEIGHT,
      frames: {
        [child.id]: { x: 0, y: 0, width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT },
      },
      variants: { [child.id]: depthVariant(1) },
    };
  };

  const leftBranches = treeData.leftAncestors?.children.map(layoutBranch) ?? [];
  const rightBranches = treeData.rightAncestors?.children.map(layoutBranch) ?? [];

  const hasLeft = !!treeData.leftAncestors;
  const hasRight = !!treeData.rightAncestors;
  const hasAncestors = hasLeft || hasRight;

  // Grandparent partner widths (nodes only — children are in the center row)
  const leftGPWidth = hasLeft
    ? treeData.leftAncestors!.partners.length === 2
      ? TREE_NODE_WIDTH * 2 + COUPLE_GAP
      : TREE_NODE_WIDTH
    : 0;
  const rightGPWidth = hasRight
    ? treeData.rightAncestors!.partners.length === 2
      ? TREE_NODE_WIDTH * 2 + COUPLE_GAP
      : TREE_NODE_WIDTH
    : 0;
  const gpRowWidth =
    hasLeft && hasRight ? leftGPWidth + SPOUSE_GAP + rightGPWidth : leftGPWidth + rightGPWidth;

  // Center row: leftBranches + centerUnit + rightBranches (same generation)
  const centerParts = [...leftBranches, centerLayout, ...rightBranches];
  const centerRowWidth =
    centerParts.reduce((sum, l) => sum + l.width, 0) +
    Math.max(centerParts.length - 1, 0) * SPOUSE_GAP;
  const centerRowHeight =
    centerParts.length > 0 ? Math.max(...centerParts.map((l) => l.height)) : 0;

  // Orphan row below center
  const orphanRowWidth =
    treeData.orphans.length * TREE_NODE_WIDTH +
    Math.max(treeData.orphans.length - 1, 0) * CHILD_GAP;
  const orphanRowHeight = treeData.orphans.length > 0 ? TREE_NODE_HEIGHT : 0;
  const orphanGap = orphanRowHeight > 0 ? CONNECTOR_GAP : 0;

  const baseWidth = Math.max(gpRowWidth, centerRowWidth, orphanRowWidth);
  const baseHeight =
    (hasAncestors ? TREE_NODE_HEIGHT + CONNECTOR_GAP : 0) +
    centerRowHeight +
    orphanGap +
    orphanRowHeight;

  const centerRowY = hasAncestors ? TREE_NODE_HEIGHT + CONNECTOR_GAP : 0;

  const frames: Record<string, NodeFrame> = {};
  const variants: Record<string, Variant> = {};

  // --- Place center row (sibling branches + focus couple + descendants) ---
  let cursorX = (baseWidth - centerRowWidth) / 2;
  for (const part of centerParts) {
    Object.entries(part.frames).forEach(([id, frame]) => {
      frames[id] = {
        x: frame.x + cursorX,
        y: frame.y + centerRowY,
        width: frame.width,
        height: frame.height,
      };
    });
    Object.assign(variants, part.variants);
    cursorX += part.width + SPOUSE_GAP;
  }

  // --- Place grandparent nodes at top row ---
  if (hasAncestors) {
    const gpRowX = (baseWidth - gpRowWidth) / 2;

    if (hasLeft) {
      const gp = treeData.leftAncestors!.partners;
      frames[gp[0].id] = { x: gpRowX, y: 0, width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT };
      variants[gp[0].id] = depthVariant(0);
      if (gp.length === 2) {
        frames[gp[1].id] = {
          x: gpRowX + TREE_NODE_WIDTH + COUPLE_GAP,
          y: 0,
          width: TREE_NODE_WIDTH,
          height: TREE_NODE_HEIGHT,
        };
        variants[gp[1].id] = depthVariant(0);
      }
    }

    if (hasRight) {
      const rightX = hasLeft ? gpRowX + leftGPWidth + SPOUSE_GAP : gpRowX;
      const gp = treeData.rightAncestors!.partners;
      frames[gp[0].id] = { x: rightX, y: 0, width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT };
      variants[gp[0].id] = depthVariant(0);
      if (gp.length === 2) {
        frames[gp[1].id] = {
          x: rightX + TREE_NODE_WIDTH + COUPLE_GAP,
          y: 0,
          width: TREE_NODE_WIDTH,
          height: TREE_NODE_HEIGHT,
        };
        variants[gp[1].id] = depthVariant(0);
      }
    }
  }

  // --- Orphans below center row ---
  if (treeData.orphans.length > 0) {
    let orphanX = (baseWidth - orphanRowWidth) / 2;
    const orphanY = centerRowY + centerRowHeight + orphanGap;
    for (const orphan of treeData.orphans) {
      frames[orphan.id] = {
        x: orphanX,
        y: orphanY,
        width: TREE_NODE_WIDTH,
        height: TREE_NODE_HEIGHT,
      };
      variants[orphan.id] = 'branch';
      orphanX += TREE_NODE_WIDTH + CHILD_GAP;
    }
  }

  // --- Square canvas with padding ---
  const squareSide = Math.max(baseWidth, baseHeight) + LAYOUT_PADDING * 2;
  const squareOffsetX = (squareSide - baseWidth) / 2;
  const squareOffsetY = (squareSide - baseHeight) / 2;

  Object.entries(frames).forEach(([id, frame]) => {
    frames[id] = {
      x: frame.x + squareOffsetX,
      y: frame.y + squareOffsetY,
      width: frame.width,
      height: frame.height,
    };
  });

  return {
    width: baseWidth,
    height: baseHeight,
    frames,
    variants,
    treeSize: { width: squareSide, height: squareSide },
  };
};

export default function TreeScreen() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isManageListOpen, setIsManageListOpen] = useState(false);
  const router = useRouter();
  const isLoading = useFamilyStore((state) => state.isLoading);
  const buildFamilyTree = useFamilyStore((state) => state.buildFamilyTree);
  const members = useFamilyStore((state) => state.members);
  const units = useFamilyStore((state) => state.units);
  const clearLastAdded = useFamilyStore((state) => state.clearLastAdded);

  // Gesture shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Layout measurement for dynamic min-scale
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });

  const handleViewportLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewportSize({ width, height });
  }, []);

  const tree = useMemo(() => buildFamilyTree(), [members, units, buildFamilyTree]);

  const layout = useMemo(() => {
    if (!tree) return EMPTY_LAYOUT;
    return buildTreeLayout(tree);
  }, [tree]);

  const minScale = useMemo(() => {
    const fit = Math.min(
      viewportSize.width / layout.treeSize.width,
      viewportSize.height / layout.treeSize.height,
      1,
    );
    return Number.isFinite(fit) ? fit : 0.3;
  }, [layout.treeSize.height, layout.treeSize.width, viewportSize.height, viewportSize.width]);
  const maxScale = Math.max(minScale * ZOOM_IN_MULTIPLIER, 1);

  useEffect(() => {
    const clamped = Math.min(Math.max(savedScale.value, minScale), maxScale);
    scale.value = clamped;
    savedScale.value = clamped;
  }, [maxScale, minScale, savedScale, scale]);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, minScale), maxScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleMemberPress = (member: FamilyMember) => {
    setSelectedMember(member);
    router.push(`/member/${member.id}`);
  };

  const handleManageFamily = () => {
    if (!members.length) return;
    setIsManageListOpen(true);
  };

  const closeManageList = () => {
    setIsManageListOpen(false);
  };

  const handleManageSelect = (member: FamilyMember) => {
    setIsManageListOpen(false);
    setSelectedMember(member);
    router.push({ pathname: '/member/[id]', params: { id: member.id, manage: '1' } });
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName);
      if (last !== 0) return last;
      return a.firstName.localeCompare(b.firstName);
    });
  }, [members]);

  // Auto-center on focus member after add
  useEffect(() => {
    if (!tree?.focusMemberId || !layout.frames[tree.focusMemberId]) return;
    const frame = layout.frames[tree.focusMemberId];
    if (!frame || viewportSize.width <= 1) return;

    const centerX = -(frame.x + frame.width / 2 - viewportSize.width / 2);
    const centerY = -(frame.y + frame.height / 2 - viewportSize.height / 2);

    translateX.value = withTiming(centerX, { duration: 400 });
    translateY.value = withTiming(centerY, { duration: 400 });
    savedTranslateX.value = centerX;
    savedTranslateY.value = centerY;
    clearLastAdded();
  }, [tree?.focusMemberId, layout.frames, viewportSize]);

  const connectors = useMemo(() => {
    if (!tree) {
      return { spouseLines: [], stemLines: [], railLines: [], dropLines: [] };
    }
    const spouseLines: LineSeg[] = [];
    const stemLines: LineSeg[] = [];
    const railLines: LineSeg[] = [];
    const dropLines: LineSeg[] = [];

    const getFrame = (memberId: string) => layout.frames[memberId];

    const getPartnerLine = (partnerIds: string[]): PartnerLine | null => {
      if (partnerIds.length === 0) return null;
      if (partnerIds.length === 1) {
        const frame = getFrame(partnerIds[0]);
        if (!frame) return null;
        const midX = frame.x + frame.width / 2;
        const y = frame.y + frame.height / 2;
        return {
          x1: midX,
          x2: midX,
          y,
          midX,
          bottomY: frame.y + frame.height,
          topY: frame.y,
          partnerCount: 1 as const,
        };
      }

      const aFrame = getFrame(partnerIds[0]);
      const bFrame = getFrame(partnerIds[1]);
      if (!aFrame || !bFrame) return null;

      const isALeft = aFrame.x <= bFrame.x;
      const left = isALeft ? aFrame : bFrame;
      const right = isALeft ? bFrame : aFrame;
      const leftMidY = left.y + left.height / 2;
      const rightMidY = right.y + right.height / 2;
      const y = (leftMidY + rightMidY) / 2;
      const x1 = left.x + left.width;
      const x2 = right.x;
      const midX = (x1 + x2) / 2;
      const bottomY = Math.max(left.y + left.height, right.y + right.height);
      const topY = Math.min(left.y, right.y);
      return { x1, x2, y, midX, bottomY, topY, partnerCount: 2 as const };
    };

    const getChildAnchor = (child: FamilyUnit | FamilyMember) => {
      if (isFamilyUnit(child)) {
        const line = getPartnerLine(child.partners.map((partner) => partner.id));
        if (!line) return null;
        return { x: line.midX, y: line.y };
      }
      const frame = getFrame(child.id);
      if (!frame) return null;
      return { x: frame.x + frame.width / 2, y: frame.y };
    };

    const addUnit = (unit: FamilyUnit) => {
      const line = getPartnerLine(unit.partners.map((partner) => partner.id));
      if (!line) return;

      if (line.partnerCount === 2) {
        spouseLines.push({ x1: line.x1, y1: line.y, x2: line.x2, y2: line.y });
      }

      const anchors = unit.children
        .map(getChildAnchor)
        .filter((anchor): anchor is { x: number; y: number } => anchor !== null);

      if (anchors.length === 0) return;

      const anchorXs = anchors.map((a) => a.x);
      const leftmostX = Math.min(line.midX, ...anchorXs);
      const rightmostX = Math.max(line.midX, ...anchorXs);
      const topY = Math.min(...anchors.map((a) => a.y));
      const railCandidate = Math.max(line.y + spacing.sm, topY - spacing.sm);
      const railY = Math.min(railCandidate, topY);

      stemLines.push({ x1: line.midX, y1: line.y, x2: line.midX, y2: railY });
      railLines.push({ x1: leftmostX, y1: railY, x2: rightmostX, y2: railY });
      for (const anchor of anchors) {
        dropLines.push({ x1: anchor.x, y1: railY, x2: anchor.x, y2: anchor.y });
      }
    };

    const traverse = (unit: FamilyUnit) => {
      addUnit(unit);
      unit.children.filter(isFamilyUnit).forEach(traverse);
    };

    // Center unit connectors (focus couple → descendants)
    traverse(tree.centerUnit);

    // Ancestor-to-children connectors: grandparents → all children on same row
    // (aunts/uncles + focus partner share one rail — they're siblings)
    const spouse1 = tree.centerUnit.partners[0];
    const spouse2 = tree.centerUnit.partners[1];

    if (tree.leftAncestors) {
      const allChildren: (FamilyUnit | FamilyMember)[] = [
        ...tree.leftAncestors.children,
        ...(spouse1 ? [spouse1] : []),
      ];
      addUnit({ partners: tree.leftAncestors.partners, children: allChildren, depth: 0 });

      // Internal connectors for aunt/uncle subtrees that have their own children
      for (const child of tree.leftAncestors.children) {
        if (isFamilyUnit(child)) traverse(child);
      }
    }

    if (tree.rightAncestors) {
      const allChildren: (FamilyUnit | FamilyMember)[] = [
        ...tree.rightAncestors.children,
        ...(spouse2 ? [spouse2] : []),
      ];
      addUnit({ partners: tree.rightAncestors.partners, children: allChildren, depth: 0 });

      for (const child of tree.rightAncestors.children) {
        if (isFamilyUnit(child)) traverse(child);
      }
    }

    return { spouseLines, stemLines, railLines, dropLines };
  }, [tree, layout.frames]);

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!tree) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Family Tree
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image source={require('../../assets/app_logo_icon.png')} style={styles.logo} />
        <Text style={styles.title} accessibilityRole="header">
          Family Tree
        </Text>
      </View>
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.manageButton, !members.length && styles.manageButtonDisabled]}
          onPress={handleManageFamily}
          disabled={!members.length}
          accessibilityRole="button"
          accessibilityLabel="Manage family"
          accessibilityHint="Opens the add or edit family member flow"
        >
          <Text style={styles.manageButtonText}>Manage Family</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isManageListOpen}
        onRequestClose={closeManageList}
      >
        <View style={styles.manageOverlay}>
          <View style={styles.manageCard}>
            <View style={styles.manageHeaderRow}>
              <Text style={styles.manageTitle} accessibilityRole="header">
                Manage Family
              </Text>
              <TouchableOpacity
                onPress={closeManageList}
                accessibilityRole="button"
                accessibilityLabel="Close manage family list"
              >
                <Text style={styles.manageCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.manageSubtitle}>
              Choose a family member to add relatives or edit details.
            </Text>

            <ScrollView contentContainerStyle={styles.manageList}>
              {sortedMembers.map((member) => {
                const displayName = member.nickname || `${member.firstName} ${member.lastName}`;
                const secondaryName = member.nickname && `${member.firstName} ${member.lastName}`;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.manageRow}
                    onPress={() => handleManageSelect(member)}
                    accessibilityRole="button"
                    accessibilityLabel={`Manage ${displayName}`}
                  >
                    <Avatar name={member.firstName} size="sm" variant="green" />
                    <View style={styles.manageRowInfo}>
                      <Text style={styles.manageRowName}>{displayName}</Text>
                      {secondaryName ? (
                        <Text style={styles.manageRowMeta}>{secondaryName}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <GestureDetector gesture={composed}>
        <View style={styles.panArea} onLayout={handleViewportLayout}>
          <Animated.View style={animatedStyle}>
            <View
              style={[
                styles.treeContainer,
                { width: layout.treeSize.width, height: layout.treeSize.height },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.connectorLayer,
                  { width: layout.treeSize.width, height: layout.treeSize.height },
                ]}
              >
                <Svg width={layout.treeSize.width} height={layout.treeSize.height}>
                  {connectors.spouseLines.map((line, index) => (
                    <Line
                      key={`spouse-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                  {connectors.stemLines.map((line, index) => (
                    <Line
                      key={`stem-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                  {connectors.railLines.map((line, index) => (
                    <Line
                      key={`rail-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                  {connectors.dropLines.map((line, index) => (
                    <Line
                      key={`drop-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                </Svg>
              </View>

              {Array.from(memberMap.entries()).map(([memberId, member]) => {
                const frame = layout.frames[memberId];
                if (!frame) return null;
                return (
                  <TreeNode
                    key={memberId}
                    member={member}
                    onPress={handleMemberPress}
                    isSelected={selectedMember?.id === memberId}
                    variant={layout.variants[memberId] ?? 'green'}
                    style={{
                      position: 'absolute',
                      left: frame.x,
                      top: frame.y,
                      width: frame.width,
                      height: frame.height,
                    }}
                  />
                );
              })}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  manageButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  manageButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  manageButtonDisabled: {
    backgroundColor: colors.background.tertiary,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  panArea: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeContainer: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  connectorLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  manageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  manageCard: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  manageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  manageCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  manageSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  manageList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  manageRowInfo: {
    marginLeft: spacing.sm,
  },
  manageRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  manageRowMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
