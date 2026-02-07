import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  FamilyMember,
  FamilyUnit,
  FamilyTreeData,
  FamilyUnitRecord,
  FamilyUnitChildLink,
  NewMemberInput,
  ParentRelationshipType,
} from '../types';
import { mockFamilyMembers } from '../utils/mockData';
import { calculateRelationship as calculateRelationshipUtil } from '../utils/relationships';
import { db } from '../services/firebase';
import { useUserStore } from './userStore';

const DEFAULT_FAMILY_ID = 'demo-family';
const DEFAULT_RELATION_TYPE: ParentRelationshipType = 'biological';
const DEFAULT_STEP_RELATION: ParentRelationshipType = 'step';
type DerivedRelationshipType = 'parent' | 'child' | 'spouse';

const normalizePartnerIds = (ids: string[]) => Array.from(new Set(ids)).sort();

const dateFromFirestore = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

const toTimestamp = (value?: Date) => (value ? Timestamp.fromDate(value) : null);

const ensureFamilyDoc = async (familyId: string) => {
  await setDoc(
    doc(db, 'families', familyId),
    { updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true },
  );
};

const resolveRelationType = (
  link: FamilyUnitChildLink,
  parentId: string,
): ParentRelationshipType => {
  if (link.parentLinks) {
    const match = link.parentLinks.find((entry) => entry.parentId === parentId);
    if (match) return match.relationType;
  }
  if (link.relationType) return link.relationType;
  return DEFAULT_RELATION_TYPE;
};

const buildChildLink = (
  childId: string,
  parentIds: string[],
  relationType: ParentRelationshipType,
): FamilyUnitChildLink => ({
  childId,
  parentLinks: parentIds.map((parentId) => ({ parentId, relationType })),
});

const appendParentToChildLinks = (
  childLinks: FamilyUnitChildLink[],
  existingParentIds: string[],
  newParentId: string,
  defaultType: ParentRelationshipType,
  overrideChildId?: string,
  overrideType?: ParentRelationshipType,
) =>
  childLinks.map((link) => {
    const existingLinks = existingParentIds.map((parentId) => ({
      parentId,
      relationType: resolveRelationType(link, parentId),
    }));
    const relationType =
      overrideChildId && link.childId === overrideChildId
        ? (overrideType ?? defaultType)
        : defaultType;
    return {
      childId: link.childId,
      parentLinks: [...existingLinks, { parentId: newParentId, relationType }],
    };
  });

const getPrimaryRelationType = (link: FamilyUnitChildLink): ParentRelationshipType => {
  if (link.parentLinks && link.parentLinks.length > 0) {
    const biological = link.parentLinks.find((entry) => entry.relationType === 'biological');
    return biological?.relationType ?? link.parentLinks[0].relationType;
  }
  return link.relationType ?? DEFAULT_RELATION_TYPE;
};

const applyUnitsToMembers = (
  members: FamilyMember[],
  units: FamilyUnitRecord[],
): FamilyMember[] => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const relMap = new Map<
    string,
    Map<string, { memberId: string; type: DerivedRelationshipType; kind?: ParentRelationshipType }>
  >();

  const ensureMap = (memberId: string) => {
    if (!relMap.has(memberId)) {
      relMap.set(memberId, new Map());
    }
    return relMap.get(memberId)!;
  };

  const addRel = (
    fromId: string,
    type: DerivedRelationshipType,
    toId: string,
    kind?: ParentRelationshipType,
  ) => {
    if (!membersById.has(fromId) || !membersById.has(toId)) return;
    const key = `${type}:${toId}:${kind ?? 'none'}`;
    const map = ensureMap(fromId);
    if (!map.has(key)) {
      map.set(key, { memberId: toId, type, kind });
    }
  };

  members.forEach((member) => ensureMap(member.id));

  units.forEach((unit) => {
    const partnerIds = unit.partnerIds ?? [];
    if (partnerIds.length === 2) {
      addRel(partnerIds[0], 'spouse', partnerIds[1]);
      addRel(partnerIds[1], 'spouse', partnerIds[0]);
    }

    unit.childLinks.forEach((link) => {
      partnerIds.forEach((parentId) => {
        const relationType = resolveRelationType(link, parentId);
        addRel(parentId, 'child', link.childId, relationType);
        addRel(link.childId, 'parent', parentId, relationType);
      });
    });
  });

  return members.map((member) => ({
    ...member,
    relationships: Array.from(relMap.get(member.id)?.values() ?? []),
  }));
};

const deriveUnitsFromMembers = (members: FamilyMember[]): FamilyUnitRecord[] => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const units: FamilyUnitRecord[] = [];
  const seen = new Set<string>();

  members.forEach((member) => {
    const spouseRel = member.relationships.find((rel) => rel.type === 'spouse');
    if (!spouseRel) return;
    const spouse = membersById.get(spouseRel.memberId);
    if (!spouse) return;

    const partnerIds = normalizePartnerIds([member.id, spouse.id]);
    const key = partnerIds.join('-');
    if (seen.has(key)) return;
    seen.add(key);

    const childIds = new Set<string>();
    member.relationships
      .filter((rel) => rel.type === 'child')
      .forEach((rel) => childIds.add(rel.memberId));
    spouse.relationships
      .filter((rel) => rel.type === 'child')
      .forEach((rel) => childIds.add(rel.memberId));

    const sortedChildIds = Array.from(childIds).sort((leftId, rightId) => {
      const left = membersById.get(leftId);
      const right = membersById.get(rightId);
      if (!left?.birthDate && !right?.birthDate) return 0;
      if (!left?.birthDate) return 1;
      if (!right?.birthDate) return -1;
      return left.birthDate.getTime() - right.birthDate.getTime();
    });

    units.push({
      id: `unit-${key}`,
      partnerIds,
      childLinks: sortedChildIds.map((childId) =>
        buildChildLink(childId, partnerIds, DEFAULT_RELATION_TYPE),
      ),
      status: 'current',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  members.forEach((member) => {
    const hasSpouse = member.relationships.some((rel) => rel.type === 'spouse');
    if (hasSpouse) return;
    const childIds = member.relationships
      .filter((rel) => rel.type === 'child')
      .map((rel) => rel.memberId);
    if (childIds.length === 0) return;

    const partnerIds = normalizePartnerIds([member.id]);
    const key = partnerIds.join('-');
    if (seen.has(key)) return;
    seen.add(key);

    units.push({
      id: `unit-${key}`,
      partnerIds,
      childLinks: childIds.map((childId) =>
        buildChildLink(childId, partnerIds, DEFAULT_RELATION_TYPE),
      ),
      status: 'current',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  return units;
};

const toMemberDoc = (member: FamilyMember) => ({
  firstName: member.firstName,
  lastName: member.lastName,
  nickname: member.nickname ?? null,
  photoURL: member.photoURL ?? null,
  birthDate: toTimestamp(member.birthDate),
  deathDate: toTimestamp(member.deathDate),
  bio: member.bio ?? null,
  gender: member.gender ?? null,
  userId: member.userId ?? null,
  createdBy: member.createdBy,
  createdAt: toTimestamp(member.createdAt) ?? serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const toUnitDoc = (unit: FamilyUnitRecord) => ({
  partnerIds: unit.partnerIds,
  childLinks: unit.childLinks,
  status: unit.status ?? 'current',
  createdAt: toTimestamp(unit.createdAt) ?? serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const fromMemberDoc = (memberId: string, data: Record<string, any>): FamilyMember => ({
  id: memberId,
  firstName: data.firstName ?? '',
  lastName: data.lastName ?? '',
  nickname: data.nickname ?? undefined,
  photoURL: data.photoURL ?? undefined,
  birthDate: dateFromFirestore(data.birthDate),
  deathDate: dateFromFirestore(data.deathDate),
  bio: data.bio ?? undefined,
  gender: data.gender ?? undefined,
  userId: data.userId ?? undefined,
  relationships: [],
  createdBy: data.createdBy ?? 'system',
  createdAt: dateFromFirestore(data.createdAt) ?? new Date(),
  updatedAt: dateFromFirestore(data.updatedAt) ?? new Date(),
});

const fromUnitDoc = (unitId: string, data: Record<string, any>): FamilyUnitRecord => {
  const rawPartnerIds = Array.isArray(data.partnerIds)
    ? data.partnerIds
    : Array.isArray(data.spouseIds)
      ? data.spouseIds
      : [];

  const rawChildLinks = Array.isArray(data.childLinks)
    ? data.childLinks
    : Array.isArray(data.childIds)
      ? data.childIds.map((childId: string) => ({
          childId,
          relationType: DEFAULT_RELATION_TYPE,
        }))
      : [];

  return {
    id: unitId,
    partnerIds: rawPartnerIds,
    childLinks: rawChildLinks,
    status: data.status ?? 'current',
    createdAt: dateFromFirestore(data.createdAt) ?? new Date(),
    updatedAt: dateFromFirestore(data.updatedAt) ?? new Date(),
  };
};

const hasActivePartner = (units: FamilyUnitRecord[], memberId: string) =>
  units.some((unit) => unit.partnerIds.includes(memberId) && unit.partnerIds.length >= 2);

const findUnitForPartner = (units: FamilyUnitRecord[], memberId: string) =>
  units.find((unit) => unit.partnerIds.includes(memberId));

const findUnitsForChild = (units: FamilyUnitRecord[], childId: string) =>
  units.filter((unit) => unit.childLinks.some((link) => link.childId === childId));

interface FamilyState {
  members: FamilyMember[];
  units: FamilyUnitRecord[];
  familyId: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;
  addSpouse: (memberId: string, input: NewMemberInput) => Promise<string>;
  addChild: (parentId: string, input: NewMemberInput) => Promise<string>;
  addSibling: (memberId: string, input: NewMemberInput) => Promise<string>;
  addParent: (memberId: string, input: NewMemberInput) => Promise<string>;

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
  units: [],
  familyId: DEFAULT_FAMILY_ID,
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const familyId = get().familyId;
      const [membersSnap, unitsSnap] = await Promise.all([
        getDocs(collection(db, 'families', familyId, 'members')),
        getDocs(collection(db, 'families', familyId, 'units')),
      ]);

      let members = membersSnap.docs.map((docSnap) => fromMemberDoc(docSnap.id, docSnap.data()));
      let units = unitsSnap.docs.map((docSnap) => fromUnitDoc(docSnap.id, docSnap.data()));

      if (members.length === 0) {
        const seedUnits = deriveUnitsFromMembers(mockFamilyMembers);
        const seedMembers = mockFamilyMembers.map((member) => ({
          ...member,
          relationships: [],
        }));

        if (__DEV__) {
          await ensureFamilyDoc(familyId);
          const batch = writeBatch(db);
          seedMembers.forEach((member) => {
            batch.set(
              doc(collection(db, 'families', familyId, 'members'), member.id),
              toMemberDoc(member),
            );
          });
          seedUnits.forEach((unit) => {
            batch.set(doc(collection(db, 'families', familyId, 'units'), unit.id), toUnitDoc(unit));
          });
          await batch.commit();
        }

        members = seedMembers;
        units = seedUnits;
      }

      const normalizedMembers = applyUnitsToMembers(members, units);
      set({ members: normalizedMembers, units, isLoading: false });
    } catch (error) {
      const fallbackUnits = deriveUnitsFromMembers(mockFamilyMembers);
      set({
        members: applyUnitsToMembers(mockFamilyMembers, fallbackUnits),
        units: fallbackUnits,
        error: error instanceof Error ? error.message : 'Failed to load family data',
        isLoading: false,
      });
    }
  },

  addSpouse: async (memberId, input) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    if (hasActivePartner(units, memberId)) {
      throw new Error('This member already has a spouse.');
    }

    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    if (hasActivePartner(units, memberRef.id)) {
      throw new Error('This spouse already has a partner.');
    }

    const newMember: FamilyMember = {
      id: memberRef.id,
      firstName: input.firstName,
      lastName: input.lastName,
      nickname: input.nickname,
      photoURL: input.photoURL,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      bio: input.bio,
      gender: input.gender,
      relationships: [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const existingUnit = findUnitForPartner(units, memberId);
    const batch = writeBatch(db);
    await ensureFamilyDoc(familyId);
    batch.set(memberRef, toMemberDoc(newMember));

    let nextUnits = units;
    if (existingUnit) {
      if (existingUnit.partnerIds.length >= 2) {
        throw new Error('This member already has a spouse.');
      }
      const updatedUnit: FamilyUnitRecord = {
        ...existingUnit,
        partnerIds: normalizePartnerIds([...existingUnit.partnerIds, newMember.id]),
        childLinks: appendParentToChildLinks(
          existingUnit.childLinks,
          existingUnit.partnerIds,
          newMember.id,
          DEFAULT_STEP_RELATION,
        ),
        updatedAt: now,
      };
      batch.set(
        doc(collection(db, 'families', familyId, 'units'), existingUnit.id),
        toUnitDoc(updatedUnit),
        { merge: true },
      );
      nextUnits = units.map((unit) => (unit.id === existingUnit.id ? updatedUnit : unit));
    } else {
      const partnerIds = normalizePartnerIds([memberId, newMember.id]);
      const unitRef = doc(collection(db, 'families', familyId, 'units'));
      const newUnit: FamilyUnitRecord = {
        id: unitRef.id,
        partnerIds,
        childLinks: [],
        status: 'current',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(unitRef, toUnitDoc(newUnit));
      nextUnits = [...units, newUnit];
    }

    await batch.commit();
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits });

    return newMember.id;
  },

  addChild: async (parentId, input) => {
    const { members, units, familyId } = get();
    const parent = members.find((m) => m.id === parentId);
    if (!parent) {
      throw new Error('Parent not found.');
    }

    const relationType = input.relationshipType ?? DEFAULT_RELATION_TYPE;
    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    const newMember: FamilyMember = {
      id: memberRef.id,
      firstName: input.firstName,
      lastName: input.lastName,
      nickname: input.nickname,
      photoURL: input.photoURL,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      bio: input.bio,
      gender: input.gender,
      relationships: [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const existingUnit = findUnitForPartner(units, parentId);
    let nextUnits = units;
    const batch = writeBatch(db);
    await ensureFamilyDoc(familyId);
    batch.set(memberRef, toMemberDoc(newMember));

    if (existingUnit) {
      const parentIds = existingUnit.partnerIds;
      const newChildLink = buildChildLink(newMember.id, parentIds, relationType);
      const updatedUnit: FamilyUnitRecord = {
        ...existingUnit,
        childLinks: [...existingUnit.childLinks, newChildLink],
        updatedAt: now,
      };
      batch.set(
        doc(collection(db, 'families', familyId, 'units'), existingUnit.id),
        toUnitDoc(updatedUnit),
        { merge: true },
      );
      nextUnits = units.map((unit) => (unit.id === existingUnit.id ? updatedUnit : unit));
    } else {
      const unitRef = doc(collection(db, 'families', familyId, 'units'));
      const partnerIds = normalizePartnerIds([parentId]);
      const newUnit: FamilyUnitRecord = {
        id: unitRef.id,
        partnerIds,
        childLinks: [buildChildLink(newMember.id, partnerIds, relationType)],
        status: 'current',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(unitRef, toUnitDoc(newUnit));
      nextUnits = [...units, newUnit];
    }

    await batch.commit();
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits });

    return newMember.id;
  },

  addSibling: async (memberId, input) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    const relatedUnits = findUnitsForChild(units, memberId);
    if (relatedUnits.length === 0) {
      throw new Error('Sibling requires at least one parent on record.');
    }

    const preferredUnit =
      relatedUnits.find((unit) => {
        const link = unit.childLinks.find((childLink) => childLink.childId === memberId);
        return link && getPrimaryRelationType(link) === 'biological';
      }) ?? relatedUnits[0];

    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    const newMember: FamilyMember = {
      id: memberRef.id,
      firstName: input.firstName,
      lastName: input.lastName,
      nickname: input.nickname,
      photoURL: input.photoURL,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      bio: input.bio,
      gender: input.gender,
      relationships: [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const baseType =
      input.relationshipType ??
      getPrimaryRelationType(preferredUnit.childLinks.find((link) => link.childId === memberId)!);
    const newChildLink = buildChildLink(newMember.id, preferredUnit.partnerIds, baseType);

    const updatedUnit: FamilyUnitRecord = {
      ...preferredUnit,
      childLinks: [...preferredUnit.childLinks, newChildLink],
      updatedAt: now,
    };

    await ensureFamilyDoc(familyId);
    const batch = writeBatch(db);
    batch.set(memberRef, toMemberDoc(newMember));
    batch.set(
      doc(collection(db, 'families', familyId, 'units'), preferredUnit.id),
      toUnitDoc(updatedUnit),
      { merge: true },
    );
    await batch.commit();

    const nextUnits = units.map((unit) => (unit.id === preferredUnit.id ? updatedUnit : unit));
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits });

    return newMember.id;
  },

  addParent: async (memberId, input) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    if (hasActivePartner(units, memberId) && input.relationshipType === 'step') {
      throw new Error('Step parent requires a single-parent household.');
    }

    const relationType = input.relationshipType ?? DEFAULT_RELATION_TYPE;
    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    if (hasActivePartner(units, memberRef.id)) {
      throw new Error('This parent already has a spouse.');
    }

    const newMember: FamilyMember = {
      id: memberRef.id,
      firstName: input.firstName,
      lastName: input.lastName,
      nickname: input.nickname,
      photoURL: input.photoURL,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      bio: input.bio,
      gender: input.gender,
      relationships: [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const existingUnits = findUnitsForChild(units, memberId);
    const targetUnit = existingUnits[0];
    const batch = writeBatch(db);
    await ensureFamilyDoc(familyId);
    batch.set(memberRef, toMemberDoc(newMember));

    let nextUnits = units;
    if (targetUnit) {
      if (targetUnit.partnerIds.length >= 2) {
        throw new Error('This member already has two parents recorded.');
      }
      const updatedUnit: FamilyUnitRecord = {
        ...targetUnit,
        partnerIds: normalizePartnerIds([...targetUnit.partnerIds, newMember.id]),
        childLinks: appendParentToChildLinks(
          targetUnit.childLinks,
          targetUnit.partnerIds,
          newMember.id,
          DEFAULT_STEP_RELATION,
          memberId,
          relationType,
        ),
        updatedAt: now,
      };
      batch.set(
        doc(collection(db, 'families', familyId, 'units'), targetUnit.id),
        toUnitDoc(updatedUnit),
        { merge: true },
      );
      nextUnits = units.map((unit) => (unit.id === targetUnit.id ? updatedUnit : unit));
    } else {
      const unitRef = doc(collection(db, 'families', familyId, 'units'));
      const partnerIds = normalizePartnerIds([newMember.id]);
      const newUnit: FamilyUnitRecord = {
        id: unitRef.id,
        partnerIds,
        childLinks: [buildChildLink(memberId, partnerIds, relationType)],
        status: 'current',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(unitRef, toUnitDoc(newUnit));
      nextUnits = [...units, newUnit];
    }

    await batch.commit();
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits });

    return newMember.id;
  },

  getMemberById: (id) => {
    const { members } = get();
    return members.find((m) => m.id === id);
  },

  calculateRelationship: (targetId, currentUserId) => {
    if (!currentUserId) {
      return 'Unknown';
    }
    const { members } = get();
    return calculateRelationshipUtil(currentUserId, targetId, members);
  },

  getMembersByGeneration: (generation) => {
    const { members, getMemberById } = get();

    return members.filter((member) => {
      const hasParents = member.relationships.some((r) => r.type === 'parent');
      const hasChildren = member.relationships.some((r) => r.type === 'child');

      const spouseRel = member.relationships.find((r) => r.type === 'spouse');
      const spouse = spouseRel ? getMemberById(spouseRel.memberId) : undefined;
      const spouseHasChildren = spouse?.relationships.some((r) => r.type === 'child') ?? false;

      switch (generation) {
        case 0:
          return !hasParents;
        case 1:
          return hasParents && (hasChildren || spouseHasChildren);
        case 2:
          return hasParents && !hasChildren && !spouseHasChildren;
        default:
          return false;
      }
    });
  },

  getSpouseOf: (memberId) => {
    const { units, getMemberById } = get();
    const unit = units.find(
      (unitItem) => unitItem.partnerIds.includes(memberId) && unitItem.partnerIds.length === 2,
    );
    if (!unit) return undefined;
    const partnerId = unit.partnerIds.find((id) => id !== memberId);
    return partnerId ? getMemberById(partnerId) : undefined;
  },

  getChildrenOf: (memberId) => {
    const { getMemberById } = get();
    const member = getMemberById(memberId);
    if (!member) return [];

    return member.relationships
      .filter((r) => r.type === 'child')
      .map((r) => getMemberById(r.memberId))
      .filter((m): m is FamilyMember => m !== undefined);
  },

  getParentsOf: (memberId) => {
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

    const buildUnit = (partners: FamilyMember[], depth: number): FamilyUnit => {
      const seen = new Set<string>();
      const allChildren: FamilyMember[] = [];
      partners.forEach((partner) => {
        getChildrenOf(partner.id).forEach((child) => {
          if (!seen.has(child.id)) {
            seen.add(child.id);
            allChildren.push(child);
          }
        });
      });

      allChildren.sort((a, b) => {
        if (!a.birthDate && !b.birthDate) return 0;
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return a.birthDate.getTime() - b.birthDate.getTime();
      });

      const children: (FamilyUnit | FamilyMember)[] = allChildren.map((child) => {
        const childSpouse = getSpouseOf(child.id);
        const childHasChildren = getChildrenOf(child.id).length > 0;
        if (childSpouse) {
          return buildUnit([child, childSpouse], depth + 1);
        }
        if (childHasChildren) {
          return buildUnit([child], depth + 1);
        }
        return child;
      });

      return { partners, children, depth };
    };

    const findParents = (member: FamilyMember): FamilyMember[] | null => {
      const parents = getParentsOf(member.id);
      if (parents.length === 0) return null;
      return parents.slice(0, 2);
    };

    const pickFocusPartners = (): FamilyMember[] | null => {
      const currentMemberId = useUserStore.getState().currentMemberId;
      if (currentMemberId) {
        const currentMember = members.find((m) => m.id === currentMemberId);
        if (currentMember) {
          const spouse = getSpouseOf(currentMember.id);
          if (spouse) return [currentMember, spouse];
          if (getChildrenOf(currentMember.id).length > 0) return [currentMember];
          const parents = findParents(currentMember);
          if (parents) return parents;
        }
      }

      const fallbackMember = members.find(
        (m) =>
          m.relationships.some((r) => r.type === 'parent') &&
          m.relationships.some((r) => r.type === 'child'),
      );
      if (!fallbackMember) return null;
      const spouse = getSpouseOf(fallbackMember.id);
      if (spouse) return [fallbackMember, spouse];
      return [fallbackMember];
    };

    const focusPartners = pickFocusPartners();
    if (!focusPartners) return null;

    const centerUnit = buildUnit(focusPartners, 1);
    const spouse1Parents = focusPartners[0] ? findParents(focusPartners[0]) : null;
    const spouse2Parents =
      focusPartners.length > 1 && focusPartners[1] ? findParents(focusPartners[1]) : null;

    return { spouse1Parents, spouse2Parents, centerUnit };
  },
}));
