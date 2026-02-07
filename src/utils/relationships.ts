import { FamilyMember, RelationshipType } from '../types/user';
import type { ParentRelationshipType } from '../types/user';

/**
 * Calculate the relationship label from the current user's perspective.
 *
 * Algorithm:
 * 1. If currentUserId === targetId, return 'You'
 * 2. Check direct relationships (parent, child, spouse)
 * 3. Derive siblings from shared parents
 * 4. One-hop for in-laws (sibling's spouse)
 * 5. Two-hop for grandparents (parent's parent)
 * 6. Default to 'Family' for unrecognized relationships
 *
 * @param currentUserId - The ID of the current user viewing the relationship
 * @param targetId - The ID of the family member being viewed
 * @param members - Array of all family members
 * @returns A string label like "Your Mom", "Your Brother-in-law", etc.
 */
export function calculateRelationship(
  currentUserId: string,
  targetId: string,
  members: FamilyMember[],
): string {
  // Same person
  if (currentUserId === targetId) {
    return 'You';
  }

  const currentUser = members.find((m) => m.id === currentUserId);
  const target = members.find((m) => m.id === targetId);

  if (!currentUser || !target) {
    return 'Family';
  }

  // Check direct relationships from current user to target
  const directRel = currentUser.relationships.find((r) => r.memberId === targetId);
  if (directRel) {
    return formatDirectRelationship(directRel.type, target, directRel.kind);
  }

  // Check if target is a sibling (share at least one parent)
  const currentUserParents = currentUser.relationships
    .filter((r) => r.type === 'parent')
    .map((r) => r.memberId);

  const targetParents = target.relationships
    .filter((r) => r.type === 'parent')
    .map((r) => r.memberId);

  const sharedParents = currentUserParents.filter((p) => targetParents.includes(p));
  if (sharedParents.length > 0) {
    // They are siblings
    return target.gender === 'male' ? 'Your Brother' : 'Your Sister';
  }

  // Check for in-laws: is target the spouse of a sibling?
  // First, find all siblings (members who share parents with current user)
  const siblings = members.filter((m) => {
    if (m.id === currentUserId) return false;
    const theirParents = m.relationships.filter((r) => r.type === 'parent').map((r) => r.memberId);
    return currentUserParents.some((p) => theirParents.includes(p));
  });

  for (const sibling of siblings) {
    // Check if target is sibling's spouse
    const siblingSpouseRel = sibling.relationships.find(
      (r) => r.type === 'spouse' && r.memberId === targetId,
    );
    if (siblingSpouseRel) {
      return target.gender === 'male' ? 'Your Brother-in-law' : 'Your Sister-in-law';
    }
  }

  // Check for grandparents: is target the parent of a parent?
  for (const parentId of currentUserParents) {
    const parent = members.find((m) => m.id === parentId);
    if (parent) {
      const isGrandparent = parent.relationships.find(
        (r) => r.type === 'parent' && r.memberId === targetId,
      );
      if (isGrandparent) {
        return target.gender === 'male' ? 'Your Grandpa' : 'Your Grandma';
      }
    }
  }

  // Check for grandchildren: is target the child of a child?
  const currentUserChildren = currentUser.relationships
    .filter((r) => r.type === 'child')
    .map((r) => r.memberId);

  for (const childId of currentUserChildren) {
    const child = members.find((m) => m.id === childId);
    if (child) {
      const isGrandchild = child.relationships.find(
        (r) => r.type === 'child' && r.memberId === targetId,
      );
      if (isGrandchild) {
        return target.gender === 'male' ? 'Your Grandson' : 'Your Granddaughter';
      }
    }
  }

  // Check for parent-in-law: is target the parent of spouse?
  const spouseRel = currentUser.relationships.find((r) => r.type === 'spouse');
  if (spouseRel) {
    const spouse = members.find((m) => m.id === spouseRel.memberId);
    if (spouse) {
      const isParentInLaw = spouse.relationships.find(
        (r) => r.type === 'parent' && r.memberId === targetId,
      );
      if (isParentInLaw) {
        return target.gender === 'male' ? 'Your Father-in-law' : 'Your Mother-in-law';
      }
    }
  }

  // Default fallback
  return 'Family';
}

/**
 * Format a direct relationship type into a human-readable label.
 *
 * @param type - The relationship type (parent, child, spouse)
 * @param target - The target family member (used for gender)
 * @returns A formatted string like "Your Mom", "Your Son", etc.
 */
function formatDirectRelationship(
  type: RelationshipType,
  target: FamilyMember,
  kind?: ParentRelationshipType,
): string {
  const parentLabel = (fallback: string) => {
    if (kind === 'step') return target.gender === 'male' ? 'Your Stepdad' : 'Your Stepmom';
    if (kind === 'adopted')
      return target.gender === 'male' ? 'Your Adoptive Dad' : 'Your Adoptive Mom';
    if (kind === 'guardian') return 'Your Guardian';
    return fallback;
  };

  const childLabel = (fallback: string) => {
    if (kind === 'step') return target.gender === 'male' ? 'Your Stepson' : 'Your Stepdaughter';
    if (kind === 'adopted')
      return target.gender === 'male' ? 'Your Adopted Son' : 'Your Adopted Daughter';
    if (kind === 'guardian') return target.gender === 'male' ? 'Your Ward' : 'Your Ward';
    return fallback;
  };

  switch (type) {
    case 'parent':
      return parentLabel(target.gender === 'male' ? 'Your Dad' : 'Your Mom');
    case 'child':
      return childLabel(target.gender === 'male' ? 'Your Son' : 'Your Daughter');
    case 'spouse':
      return 'Your Spouse';
    case 'sibling':
      // This shouldn't be stored, but handle it gracefully
      return target.gender === 'male' ? 'Your Brother' : 'Your Sister';
    case 'grandparent':
      // This shouldn't be stored, but handle it gracefully
      return target.gender === 'male' ? 'Your Grandpa' : 'Your Grandma';
    case 'grandchild':
      // This shouldn't be stored, but handle it gracefully
      return target.gender === 'male' ? 'Your Grandson' : 'Your Granddaughter';
    default:
      return 'Family';
  }
}

/**
 * Get all siblings of a family member (members who share at least one parent).
 *
 * @param memberId - The ID of the family member
 * @param members - Array of all family members
 * @returns Array of sibling FamilyMember objects
 */
export function getSiblings(memberId: string, members: FamilyMember[]): FamilyMember[] {
  const member = members.find((m) => m.id === memberId);
  if (!member) return [];

  const parentIds = member.relationships.filter((r) => r.type === 'parent').map((r) => r.memberId);

  if (parentIds.length === 0) return [];

  return members.filter((m) => {
    if (m.id === memberId) return false;
    const theirParents = m.relationships.filter((r) => r.type === 'parent').map((r) => r.memberId);
    return parentIds.some((p) => theirParents.includes(p));
  });
}
