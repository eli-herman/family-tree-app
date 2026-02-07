import { FamilyMember, ParentRelationshipType } from './user';

export interface FamilyUnit {
  partners: FamilyMember[];
  children: (FamilyUnit | FamilyMember)[];
  depth: number;
}

export interface FamilyUnitChildLink {
  childId: string;
  relationType?: ParentRelationshipType;
  parentLinks?: { parentId: string; relationType: ParentRelationshipType }[];
}

export interface FamilyUnitRecord {
  id: string;
  partnerIds: string[];
  childLinks: FamilyUnitChildLink[];
  status?: 'current' | 'former' | 'widowed';
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyTreeData {
  /** Parents of spouse 1 (e.g. maternal grandparents) */
  spouse1Parents: FamilyMember[] | null;
  /** Parents of spouse 2 (e.g. paternal grandparents) */
  spouse2Parents: FamilyMember[] | null;
  /** The central couple and their descendants */
  centerUnit: FamilyUnit;
}

export function isFamilyUnit(node: FamilyUnit | FamilyMember): node is FamilyUnit {
  return 'partners' in node && 'children' in node;
}
