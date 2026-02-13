/**
 * FamilyUnitNode.tsx
 *
 * Renders a single "family unit" in the family tree, which consists of:
 *   1. A couple row: one or two partners displayed side by side as TreeNode cards
 *   2. A children row: their children rendered below, each of which may itself
 *      be a FamilyUnit (enabling recursive nesting for multi-generational trees)
 *
 * This component is recursive -- if a child entry is itself a FamilyUnit
 * (i.e., a child who has their own partner and children), it renders another
 * FamilyUnitNode inside itself. This allows the tree to grow to arbitrary depth.
 *
 * Color variants are assigned based on generation depth:
 *   - Depth 0 (grandparents): brown
 *   - Depth 1 (parents): green
 *   - Depth 2+ (children, grandchildren): branch
 *
 * This visual hierarchy helps users quickly identify generational layers.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
// TreeNode renders an individual family member as a tappable card
import { TreeNode } from './TreeNode';
// Type imports: FamilyUnit (couple + children), FamilyMember (individual), and type guard
import { FamilyUnit, FamilyMember, isFamilyUnit } from '../../types';
// Spacing tokens from the design system
import { spacing } from '../../constants';

/** Gap between sibling children in the children row (medium spacing, ~16px) */
const GAP = spacing.md;

/** Horizontal gap between spouse/partner TreeNodes in the couple row (16px) */
const SPOUSE_GAP = spacing.md; // 16px between spouses

/** Vertical gap between the couple row and the children row (48px) for connector space */
const CONNECTOR_GAP = 48;

/**
 * Props for the FamilyUnitNode component.
 */
interface FamilyUnitNodeProps {
  unit: FamilyUnit; // The family unit data (partners array + children array + depth)
  selectedMemberId: string | null; // ID of the currently selected member (or null if none)
  onMemberPress: (member: FamilyMember) => void; // Callback when any tree node is tapped
}

/**
 * Extracts a unique React key from a child entry, which could be either
 * a FamilyUnit (use the first partner's ID) or a standalone FamilyMember
 * (use the member's own ID).
 *
 * @param child - Either a FamilyUnit or a FamilyMember
 * @returns A string ID suitable for use as a React list key
 */
const getChildKey = (child: FamilyUnit | FamilyMember) =>
  isFamilyUnit(child) ? child.partners[0].id : child.id;

/**
 * Maps a generation depth number to a color variant name for TreeNode avatars.
 * This creates a visual hierarchy in the tree:
 *   - Depth 0 (root/grandparents): earthy brown tones
 *   - Depth 1 (parents): forest green tones
 *   - Depth 2+ (children and beyond): lighter branch tones
 *
 * @param depth - The generation depth (0 = root, 1 = first generation, 2+ = deeper)
 * @returns A color variant string: 'brown', 'green', or 'branch'
 */
const depthVariant = (depth: number): 'brown' | 'green' | 'branch' => {
  if (depth === 0) return 'brown'; // Root generation: earthy brown
  if (depth === 1) return 'green'; // First generation: forest green
  return 'branch'; // Deeper generations: lighter branch tones
};

/**
 * FamilyUnitNode component - renders a family unit (couple + children) recursively.
 *
 * @param unit - The FamilyUnit data containing partners, children, and depth
 * @param selectedMemberId - The ID of the currently selected member (for highlighting)
 * @param onMemberPress - Callback invoked when any member's TreeNode is tapped
 */
export function FamilyUnitNode({ unit, selectedMemberId, onMemberPress }: FamilyUnitNodeProps) {
  // Determine the color variant for this generation based on the unit's depth
  const variant = depthVariant(unit.depth);

  // Destructure the two partners from the unit (second partner may be undefined for single parents)
  const [a, b] = unit.partners;

  return (
    // Outer container that vertically stacks the couple row and children row
    <View style={styles.container}>
      {/* Couple row: displays the partner(s) side by side */}
      <View style={styles.coupleRow}>
        {/* First partner (always present) */}
        <TreeNode
          member={a} // The first partner's FamilyMember data
          onPress={onMemberPress} // Pass through the press handler
          isSelected={selectedMemberId === a.id} // Highlight if this member is selected
          variant={variant} // Color variant based on generation depth
        />
        {/* Second partner (only rendered if the unit has two partners) */}
        {b && (
          <>
            {/* Horizontal spacer between the two spouse nodes */}
            <View style={{ width: SPOUSE_GAP }} />
            <TreeNode
              member={b} // The second partner's FamilyMember data
              onPress={onMemberPress} // Pass through the press handler
              isSelected={selectedMemberId === b.id} // Highlight if this member is selected
              variant={variant} // Same color variant as the first partner
            />
          </>
        )}
      </View>

      {/* Vertical spacer between couple row and children row (only if there are children) */}
      {unit.children.length > 0 && <View style={{ height: CONNECTOR_GAP }} />}

      {/* Children row: displays all children horizontally, each may be a unit or individual */}
      {unit.children.length > 0 && (
        <View style={styles.childrenRow}>
          {unit.children.map((child) => {
            // Get a unique key for this child (works for both FamilyUnit and FamilyMember)
            const childKey = getChildKey(child);
            return (
              <View key={childKey}>
                {isFamilyUnit(child) ? (
                  // If this child has their own family (partner + children),
                  // recursively render another FamilyUnitNode
                  <FamilyUnitNode
                    unit={child} // The nested FamilyUnit data
                    selectedMemberId={selectedMemberId} // Pass through selection state
                    onMemberPress={onMemberPress} // Pass through the press handler
                  />
                ) : (
                  // If this child is an individual without their own family,
                  // render a single TreeNode
                  <TreeNode
                    member={child} // The child's FamilyMember data
                    onPress={onMemberPress} // Pass through the press handler
                    isSelected={selectedMemberId === child.id} // Highlight if selected
                    variant={depthVariant(unit.depth + 1)} // Children are one depth level deeper
                  />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

/**
 * StyleSheet for the FamilyUnitNode component.
 * Defines layouts for the outer container, the couple row, and the children row.
 */
const styles = StyleSheet.create({
  // Outer container: vertically stacks the couple and children rows, centered
  container: {
    alignItems: 'center', // Center the couple row and children row horizontally
  },
  // Couple row: lays out the two partner TreeNodes side by side
  coupleRow: {
    flexDirection: 'row', // Horizontal layout for partners
    alignItems: 'center', // Vertically center the partner nodes
  },
  // Children row: lays out child nodes/units horizontally with even spacing
  childrenRow: {
    flexDirection: 'row', // Horizontal layout for children
    alignItems: 'flex-start', // Align children to the top (they may have different heights)
    gap: GAP, // Space between each child node/unit (medium spacing, ~16px)
  },
});
