import { FamilyMember } from './user';

export interface FamilyUnit {
  couple: [FamilyMember, FamilyMember];
  children: Array<FamilyUnit | FamilyMember>;
  depth: number;
}

export interface FamilyTreeData {
  /** Parents of spouse 1 (e.g. maternal grandparents) */
  spouse1Parents: [FamilyMember, FamilyMember] | null;
  /** Parents of spouse 2 (e.g. paternal grandparents) */
  spouse2Parents: [FamilyMember, FamilyMember] | null;
  /** The central couple and their descendants */
  centerUnit: FamilyUnit;
}

export function isFamilyUnit(node: FamilyUnit | FamilyMember): node is FamilyUnit {
  return 'couple' in node && 'children' in node;
}
