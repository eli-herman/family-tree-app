/**
 * Family Tree Data Structures
 *
 * This file defines the hierarchical data structures used to render the visual family tree.
 * The tree is built from FamilyMember records (defined in user.ts) and organized into
 * "FamilyUnit" nodes -- each representing a couple (or single parent) and their children.
 * Children can themselves be FamilyUnits (if they have partners/kids) or plain FamilyMembers.
 *
 * The tree layout has three sections:
 * - leftAncestors: the maternal grandparents' side of the focus couple
 * - rightAncestors: the paternal grandparents' side of the focus couple
 * - centerUnit: the focus couple and all their descendants
 *
 * FamilyUnitRecord is the Firestore-persisted version of a family unit,
 * storing only IDs instead of full member objects.
 */

import { FamilyMember, ParentRelationshipType } from './user';

/**
 * FamilyUnit - A recursive tree node representing a couple and their children.
 * This is the in-memory structure used for rendering the visual family tree.
 * Each node contains the partners (1 or 2 people), their children (which may
 * themselves be nested FamilyUnits), and the depth level in the tree.
 */
export interface FamilyUnit {
  partners: FamilyMember[]; // The couple (or single parent) at this level -- 1 or 2 members
  children: (FamilyUnit | FamilyMember)[]; // Children of this couple; each child is either a plain member or another FamilyUnit if they have their own family
  depth: number; // How deep this unit is in the tree (0 = root/grandparents, 1 = parents, 2 = children, etc.)
}

/**
 * FamilyUnitChildLink - Describes a child's connection to a FamilyUnit in Firestore.
 * Stores the child's ID along with optional details about their relationship
 * to each parent in the unit (e.g., biological child of one parent, step-child of another).
 */
export interface FamilyUnitChildLink {
  childId: string; // The ID of the child family member
  relationType?: ParentRelationshipType; // The default relationship type for this child (biological, adopted, step, guardian)
  parentLinks?: { parentId: string; relationType: ParentRelationshipType }[]; // Per-parent relationship details (allows different relationship types per parent)
}

/**
 * FamilyUnitRecord - The Firestore-persisted version of a family unit.
 * Unlike FamilyUnit (which holds full FamilyMember objects), this record
 * stores only member IDs for efficient database storage.
 * The app hydrates these records into FamilyUnit objects at runtime.
 */
export interface FamilyUnitRecord {
  id: string; // Unique identifier for this family unit record in Firestore
  partnerIds: string[]; // Array of 1-2 FamilyMember IDs representing the couple
  childLinks: FamilyUnitChildLink[]; // Array of links to children, including relationship type details
  status?: 'current' | 'former' | 'widowed'; // The current state of the partnership (current = married/together, former = divorced/separated, widowed = one partner deceased)
  createdAt: Date; // Timestamp when this family unit was first created
  updatedAt: Date; // Timestamp when this family unit was last modified
}

/**
 * FamilyTreeData - The top-level structure that holds the entire rendered family tree.
 * The tree is split into three columns for layout:
 * - leftAncestors: one spouse's parents/extended family (displayed on the left)
 * - rightAncestors: the other spouse's parents/extended family (displayed on the right)
 * - centerUnit: the focus couple and all their descendants (displayed in the center)
 * Members with no relationships at all are collected into the "orphans" array.
 */
export interface FamilyTreeData {
  /** Full subtree from spouse1's parents (includes aunts/uncles/cousins) */
  leftAncestors: FamilyUnit | null; // The maternal grandparents' side, or null if not available
  /** Full subtree from spouse2's parents (includes aunts/uncles/cousins) */
  rightAncestors: FamilyUnit | null; // The paternal grandparents' side, or null if not available
  /** The focus couple and all their descendants */
  centerUnit: FamilyUnit; // The main couple at the center of the tree with their children
  /** Members with no connections */
  orphans: FamilyMember[]; // Family members that have zero relationships (not yet placed in the tree)
  /** Auto-center target */
  focusMemberId?: string; // The ID of the member the tree should auto-scroll to when rendered
}

/**
 * isFamilyUnit - A TypeScript type guard that checks whether a tree node
 * is a FamilyUnit (a couple with children) or a plain FamilyMember.
 * This is needed because children in a FamilyUnit can be either type,
 * and the rendering logic needs to know which one it's dealing with.
 *
 * @param node - A tree node that could be either a FamilyUnit or a FamilyMember
 * @returns true if the node is a FamilyUnit, false if it's a plain FamilyMember
 */
export function isFamilyUnit(node: FamilyUnit | FamilyMember): node is FamilyUnit {
  // A FamilyUnit has 'partners' and 'children' properties; a FamilyMember does not
  return 'partners' in node && 'children' in node;
}
