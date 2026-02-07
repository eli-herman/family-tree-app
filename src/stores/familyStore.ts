import { create } from 'zustand';
import { FamilyMember, FamilyUnit, FamilyTreeData } from '../types';
import { mockFamilyMembers } from '../utils/mockData';
import { calculateRelationship as calculateRelationshipUtil } from '../utils/relationships';

interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;

  // Selectors
  getMemberById: (id: string) => FamilyMember | undefined;
  calculateRelationship: (targetId: string, currentUserId: string) => string;
  getMembersByGeneration: (generation: number) => FamilyMember[];
  getSpouseOf: (memberId: string) => FamilyMember | undefined;
  getChildrenOf: (memberId: string) => FamilyMember[];
  getParentsOf: (memberId: string) => FamilyMember[];
  buildFamilyTree: () => FamilyTreeData | null;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate async delay (mimics Firebase)
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ members: mockFamilyMembers, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load family data',
        isLoading: false,
      });
    }
  },

  getMemberById: (id: string) => {
    const { members } = get();
    return members.find((m) => m.id === id);
  },

  calculateRelationship: (targetId: string, currentUserId: string) => {
    if (!currentUserId) {
      return 'Unknown';
    }
    const { members } = get();
    return calculateRelationshipUtil(currentUserId, targetId, members);
  },

  getMembersByGeneration: (generation: number) => {
    const { members, getMemberById } = get();

    return members.filter((member) => {
      const hasParents = member.relationships.some((r) => r.type === 'parent');
      const hasChildren = member.relationships.some((r) => r.type === 'child');

      // Check if spouse has children (for in-laws like Preston)
      const spouseRel = member.relationships.find((r) => r.type === 'spouse');
      const spouse = spouseRel ? getMemberById(spouseRel.memberId) : undefined;
      const spouseHasChildren = spouse?.relationships.some((r) => r.type === 'child') ?? false;

      switch (generation) {
        case 0:
          // Generation 0: No parents (grandparents)
          return !hasParents;
        case 1:
          // Generation 1: Has parents AND (has children OR spouse has children)
          return hasParents && (hasChildren || spouseHasChildren);
        case 2:
          // Generation 2: Has parents but no children (and spouse doesn't have children)
          return hasParents && !hasChildren && !spouseHasChildren;
        default:
          return false;
      }
    });
  },

  getSpouseOf: (memberId: string) => {
    const { getMemberById } = get();
    const member = getMemberById(memberId);
    if (!member) return undefined;

    const spouseRel = member.relationships.find((r) => r.type === 'spouse');
    if (!spouseRel) return undefined;

    return getMemberById(spouseRel.memberId);
  },

  getChildrenOf: (memberId: string) => {
    const { getMemberById } = get();
    const member = getMemberById(memberId);
    if (!member) return [];

    return member.relationships
      .filter((r) => r.type === 'child')
      .map((r) => getMemberById(r.memberId))
      .filter((m): m is FamilyMember => m !== undefined);
  },

  getParentsOf: (memberId: string) => {
    const { getMemberById } = get();
    const member = getMemberById(memberId);
    if (!member) return [];

    return member.relationships
      .filter((r) => r.type === 'parent')
      .map((r) => getMemberById(r.memberId))
      .filter((m): m is FamilyMember => m !== undefined);
  },

  buildFamilyTree: () => {
    const { members, getSpouseOf, getChildrenOf, getParentsOf } = get();
    if (members.length === 0) return null;

    const buildUnit = (
      member1: FamilyMember,
      member2: FamilyMember,
      depth: number,
    ): FamilyUnit => {
      const childrenA = getChildrenOf(member1.id);
      const childrenB = getChildrenOf(member2.id);
      const seen = new Set<string>();
      const allChildren: FamilyMember[] = [];
      for (const child of [...childrenA, ...childrenB]) {
        if (!seen.has(child.id)) {
          seen.add(child.id);
          allChildren.push(child);
        }
      }
      allChildren.sort((a, b) => {
        if (!a.birthDate && !b.birthDate) return 0;
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return a.birthDate.getTime() - b.birthDate.getTime();
      });

      const children: Array<FamilyUnit | FamilyMember> = allChildren.map((child) => {
        const childSpouse = getSpouseOf(child.id);
        if (childSpouse) {
          return buildUnit(child, childSpouse, depth + 1);
        }
        return child;
      });

      return { couple: [member1, member2], children, depth };
    };

    const findParentCouple = (
      member: FamilyMember,
    ): [FamilyMember, FamilyMember] | null => {
      const parents = getParentsOf(member.id);
      if (parents.length < 2) return null;
      return [parents[0], parents[1]];
    };

    // Find the focus couple: a married pair where at least one has parents AND children
    const focusMember = members.find(
      (m) =>
        m.relationships.some((r) => r.type === 'parent') &&
        m.relationships.some((r) => r.type === 'child') &&
        m.relationships.some((r) => r.type === 'spouse'),
    );
    if (!focusMember) return null;

    const focusSpouse = getSpouseOf(focusMember.id);
    if (!focusSpouse) return null;

    const centerUnit = buildUnit(focusMember, focusSpouse, 1);
    const spouse1Parents = findParentCouple(focusMember);
    const spouse2Parents = findParentCouple(focusSpouse);

    return { spouse1Parents, spouse2Parents, centerUnit };
  },
}));
