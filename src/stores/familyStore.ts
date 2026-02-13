/**
 * familyStore.ts — Core data layer for The Vine's family tree.
 *
 * This Zustand store manages the full lifecycle of family members and family
 * units (couples + their children) backed by Firestore. It is the single
 * source of truth for all family data in the app.
 *
 * Key concepts:
 * - **FamilyMember**: An individual person in the tree (name, dates, gender, etc.).
 * - **FamilyUnitRecord**: A Firestore-persisted record linking 1-2 partners with
 *   their children. Each child link can carry per-parent relationship types
 *   (biological, step, adopted, guardian).
 * - **FamilyUnit**: An in-memory recursive tree node used for rendering. Built at
 *   runtime from members + unit records via `buildFamilyTree()`.
 *
 * Data flow:
 *   Firestore → loadData() → members[] + units[]
 *                                ↓
 *                       applyUnitsToMembers()
 *                   (stamps relationship arrays onto each member)
 *                                ↓
 *                       buildFamilyTree()
 *                   (converts flat data into a nested FamilyTreeData structure
 *                    with leftAncestors, centerUnit, rightAncestors, orphans)
 *
 * Mutation actions (addSpouse, addChild, addSibling, addParent, addRelative,
 * updateMember, removeMember) write to Firestore in a batch, then optimistically
 * update local state so the UI reflects changes immediately.
 */

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
  ExtendedRelativeType,
  ParentRelationshipType,
} from '../types';
import { mockFamilyMembers } from '../utils/mockData';
import { calculateRelationship as calculateRelationshipUtil } from '../utils/relationships';
import { db } from '../services/firebase';
import { useUserStore } from './userStore';

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

/** Default Firestore family document ID used before multi-family support is added. */
const DEFAULT_FAMILY_ID = 'demo-family';

/** When no explicit relationship type is provided, assume biological. */
const DEFAULT_RELATION_TYPE: ParentRelationshipType = 'biological';

/** When a new spouse joins an existing unit, existing children are marked as step-children of the new spouse. */
const DEFAULT_STEP_RELATION: ParentRelationshipType = 'step';

/** The three high-level relationship directions derived from FamilyUnitRecords. */
type DerivedRelationshipType = 'parent' | 'child' | 'spouse';

// ---------------------------------------------------------------------------
// Pure helper functions (no side effects, no store access)
// ---------------------------------------------------------------------------

/**
 * Deduplicate and alphabetically sort an array of partner IDs.
 * Sorting ensures that the same pair of partners always produces the same
 * key regardless of insertion order, which prevents duplicate units.
 */
const normalizePartnerIds = (ids: string[]) => Array.from(new Set(ids)).sort();

/**
 * Safely convert a Firestore timestamp (or plain Date) into a JS Date.
 * Firestore returns Timestamp objects with a `.toDate()` method; this helper
 * handles both Timestamp and native Date values, returning undefined for nulls.
 */
const dateFromFirestore = (value: unknown): Date | undefined => {
  if (!value) return undefined; // null / undefined → skip
  if (value instanceof Date) return value; // Already a Date (e.g. from mock data)
  // Firestore Timestamp has a `.toDate()` method — check and call it
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined; // Unrecognised format — treat as absent
};

/**
 * Convert an optional JS Date into a Firestore Timestamp, or null if absent.
 * Used when serializing member/unit data for Firestore writes.
 */
const toTimestamp = (value?: Date) => (value ? Timestamp.fromDate(value) : null);

/**
 * Ensure the top-level Firestore document for a family exists.
 * Uses `merge: true` so it creates the doc on first call and only
 * updates timestamps on subsequent calls without overwriting other fields.
 * Must be called before writing to subcollections (members, units).
 */
const ensureFamilyDoc = async (familyId: string) => {
  await setDoc(
    doc(db, 'families', familyId), // Path: /families/{familyId}
    { updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
    { merge: true }, // Create if missing, merge if existing
  );
};

/**
 * Determine the relationship type between a specific parent and a child link.
 * A child link may have per-parent overrides in `parentLinks` (e.g. biological
 * for one parent, step for the other). This function checks those first, then
 * falls back to the link-level `relationType`, and finally to the global default.
 *
 * @param link - The child link record from a FamilyUnitRecord
 * @param parentId - The specific parent whose relationship type we want
 * @returns The resolved ParentRelationshipType (biological, step, adopted, guardian)
 */
const resolveRelationType = (
  link: FamilyUnitChildLink,
  parentId: string,
): ParentRelationshipType => {
  // First priority: per-parent link overrides
  if (link.parentLinks) {
    const match = link.parentLinks.find((entry) => entry.parentId === parentId);
    if (match) return match.relationType;
  }
  // Second priority: link-level default
  if (link.relationType) return link.relationType;
  // Last resort: global default (biological)
  return DEFAULT_RELATION_TYPE;
};

/**
 * Create a new FamilyUnitChildLink with the same relationship type for every parent.
 * Used when adding a child where all parents share the same relationship type
 * (e.g. both parents are biological parents of this child).
 *
 * @param childId - ID of the child member
 * @param parentIds - IDs of the parent(s) in this unit
 * @param relationType - The relationship type to assign for every parent
 * @returns A FamilyUnitChildLink with per-parent entries
 */
const buildChildLink = (
  childId: string,
  parentIds: string[],
  relationType: ParentRelationshipType,
): FamilyUnitChildLink => ({
  childId,
  parentLinks: parentIds.map((parentId) => ({ parentId, relationType })),
});

/**
 * Add a new parent to every child link in a unit, preserving existing parent
 * relationship types. This is called when a new spouse/parent joins an existing
 * unit — all children gain a new parentLink entry for the incoming parent.
 *
 * By default the new parent is given `defaultType` (usually 'step') for all
 * children. If `overrideChildId` is specified, that one child gets `overrideType`
 * instead (e.g. the child who is biologically related to the new parent).
 *
 * @param childLinks - Existing child links in the unit
 * @param existingParentIds - IDs of parents already in the unit
 * @param newParentId - ID of the parent being added
 * @param defaultType - Default relationship type for the new parent (e.g. 'step')
 * @param overrideChildId - Optional: one child who should get a different type
 * @param overrideType - Optional: the type to use for the override child
 * @returns New array of child links with the new parent appended to each
 */
const appendParentToChildLinks = (
  childLinks: FamilyUnitChildLink[],
  existingParentIds: string[],
  newParentId: string,
  defaultType: ParentRelationshipType,
  overrideChildId?: string,
  overrideType?: ParentRelationshipType,
) =>
  childLinks.map((link) => {
    // Rebuild existing parent links, preserving their resolved relationship types
    const existingLinks = existingParentIds.map((parentId) => ({
      parentId,
      relationType: resolveRelationType(link, parentId),
    }));
    // Determine relationship type for the new parent with this specific child
    const relationType =
      overrideChildId && link.childId === overrideChildId
        ? (overrideType ?? defaultType) // Override child gets a specific type
        : defaultType; // All other children get the default type
    return {
      childId: link.childId,
      parentLinks: [...existingLinks, { parentId: newParentId, relationType }],
    };
  });

/**
 * Get the "primary" relationship type for a child link. When a child has
 * multiple parent links, biological takes priority. If no biological link
 * exists, the first parent link's type is used. Falls back to the link-level
 * relationType and then the global default.
 *
 * Used when adding a sibling — the new sibling inherits the same relationship
 * type as the existing child in the preferred family unit.
 *
 * @param link - A FamilyUnitChildLink to inspect
 * @returns The most representative ParentRelationshipType for this child
 */
const getPrimaryRelationType = (link: FamilyUnitChildLink): ParentRelationshipType => {
  if (link.parentLinks && link.parentLinks.length > 0) {
    // Prefer biological if it exists among the parent links
    const biological = link.parentLinks.find((entry) => entry.relationType === 'biological');
    return biological?.relationType ?? link.parentLinks[0].relationType;
  }
  // Fall back to the link-level type, then the global default
  return link.relationType ?? DEFAULT_RELATION_TYPE;
};

/**
 * Derive each member's `relationships` array from the flat list of FamilyUnitRecords.
 *
 * FamilyUnitRecords store structural data (who is partnered with whom, who are
 * the children). This function walks every unit and stamps bidirectional
 * relationship entries (spouse, parent, child) onto each member. The result is
 * a new array of FamilyMembers with fully populated `.relationships`.
 *
 * This is the "join" step that converts Firestore's normalised storage into
 * the denormalised shape the UI and selectors expect.
 *
 * @param members - Flat array of FamilyMembers (relationships may be empty)
 * @param units - Flat array of FamilyUnitRecords from Firestore
 * @returns New member array with `.relationships` populated from unit data
 */
const applyUnitsToMembers = (
  members: FamilyMember[],
  units: FamilyUnitRecord[],
): FamilyMember[] => {
  // Index members by ID for O(1) lookups
  const membersById = new Map(members.map((member) => [member.id, member]));

  // relMap: memberId → Map<uniqueKey, relationship>
  // The inner Map is keyed by "type:targetId:kind" to prevent duplicate entries
  const relMap = new Map<
    string,
    Map<string, { memberId: string; type: DerivedRelationshipType; kind?: ParentRelationshipType }>
  >();

  /** Lazily initialise the relationship map for a member. */
  const ensureMap = (memberId: string) => {
    if (!relMap.has(memberId)) {
      relMap.set(memberId, new Map());
    }
    return relMap.get(memberId)!;
  };

  /** Add a one-directional relationship entry, skipping if either member is missing. */
  const addRel = (
    fromId: string,
    type: DerivedRelationshipType,
    toId: string,
    kind?: ParentRelationshipType,
  ) => {
    if (!membersById.has(fromId) || !membersById.has(toId)) return; // Guard against orphaned IDs
    const key = `${type}:${toId}:${kind ?? 'none'}`; // Unique key prevents duplicate entries
    const map = ensureMap(fromId);
    if (!map.has(key)) {
      map.set(key, { memberId: toId, type, kind });
    }
  };

  // Initialise an empty relationship map for every member
  members.forEach((member) => ensureMap(member.id));

  // Walk every family unit and derive relationships
  units.forEach((unit) => {
    const partnerIds = unit.partnerIds ?? [];

    // If the unit has two partners, they are spouses of each other
    if (partnerIds.length === 2) {
      addRel(partnerIds[0], 'spouse', partnerIds[1]);
      addRel(partnerIds[1], 'spouse', partnerIds[0]);
    }

    // For each child link, create bidirectional parent-child relationships
    unit.childLinks.forEach((link) => {
      partnerIds.forEach((parentId) => {
        const relationType = resolveRelationType(link, parentId); // Per-parent type (bio/step/etc.)
        addRel(parentId, 'child', link.childId, relationType); // Parent → Child
        addRel(link.childId, 'parent', parentId, relationType); // Child → Parent
      });
    });
  });

  // Produce new member objects with their computed relationships
  return members.map((member) => ({
    ...member,
    relationships: Array.from(relMap.get(member.id)?.values() ?? []),
  }));
};

/**
 * Reverse-engineer FamilyUnitRecords from members that already have
 * `.relationships` populated (e.g. mock data or legacy data).
 *
 * This is used during the seed / fallback path: mock members come with
 * pre-built relationship arrays, and we need to create matching unit
 * records so they can be persisted to Firestore.
 *
 * Two passes:
 * 1. First pass: find all couples (members with a spouse) and their shared children.
 * 2. Second pass: find single parents (members with children but no spouse).
 *
 * Children are sorted by birth date (oldest first) within each unit.
 *
 * @param members - Members with pre-populated `.relationships`
 * @returns Array of FamilyUnitRecords derived from the relationship data
 */
const deriveUnitsFromMembers = (members: FamilyMember[]): FamilyUnitRecord[] => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const units: FamilyUnitRecord[] = [];
  const seen = new Set<string>(); // Track processed partner-pair keys to avoid duplicates

  // --- Pass 1: Coupled parents (members who have a spouse) ---
  members.forEach((member) => {
    const spouseRel = member.relationships.find((rel) => rel.type === 'spouse');
    if (!spouseRel) return; // Skip members without a spouse (handled in pass 2)
    const spouse = membersById.get(spouseRel.memberId);
    if (!spouse) return; // Spouse ID references a member not in the array — skip

    // Normalise so (A, B) and (B, A) produce the same key
    const partnerIds = normalizePartnerIds([member.id, spouse.id]);
    const key = partnerIds.join('-');
    if (seen.has(key)) return; // Already created a unit for this couple
    seen.add(key);

    // Collect children from both partners (union of both child lists)
    const childIds = new Set<string>();
    member.relationships
      .filter((rel) => rel.type === 'child')
      .forEach((rel) => childIds.add(rel.memberId));
    spouse.relationships
      .filter((rel) => rel.type === 'child')
      .forEach((rel) => childIds.add(rel.memberId));

    // Sort children by birth date (oldest first; members without dates go last)
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

  // --- Pass 2: Single parents (members with children but no spouse) ---
  members.forEach((member) => {
    const hasSpouse = member.relationships.some((rel) => rel.type === 'spouse');
    if (hasSpouse) return; // Already handled in pass 1
    const childIds = member.relationships
      .filter((rel) => rel.type === 'child')
      .map((rel) => rel.memberId);
    if (childIds.length === 0) return; // No children — not a parent unit

    const partnerIds = normalizePartnerIds([member.id]);
    const key = partnerIds.join('-');
    if (seen.has(key)) return; // Dedup guard
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

// ---------------------------------------------------------------------------
// Firestore serialization / deserialization helpers
// ---------------------------------------------------------------------------

/**
 * Serialize a FamilyMember into the shape stored in Firestore.
 * Converts Dates to Timestamps, converts undefined to null (Firestore
 * does not accept undefined), and sets updatedAt to the server timestamp.
 * Note: `.relationships` is NOT stored — it is derived at runtime.
 */
const toMemberDoc = (member: FamilyMember) => ({
  firstName: member.firstName,
  lastName: member.lastName,
  nickname: member.nickname ?? null, // Firestore requires null, not undefined
  photoURL: member.photoURL ?? null,
  birthDate: toTimestamp(member.birthDate),
  deathDate: toTimestamp(member.deathDate),
  bio: member.bio ?? null,
  gender: member.gender ?? null,
  userId: member.userId ?? null,
  createdBy: member.createdBy,
  createdAt: toTimestamp(member.createdAt) ?? serverTimestamp(), // Use server time if no local date
  updatedAt: serverTimestamp(), // Always server time on writes
});

/**
 * Serialize a FamilyUnitRecord into the shape stored in Firestore.
 * Partner IDs and child links are stored as-is (they are already ID-based).
 */
const toUnitDoc = (unit: FamilyUnitRecord) => ({
  partnerIds: unit.partnerIds,
  childLinks: unit.childLinks,
  status: unit.status ?? 'current',
  createdAt: toTimestamp(unit.createdAt) ?? serverTimestamp(),
  updatedAt: serverTimestamp(),
});

/**
 * Deserialize a Firestore document snapshot into a FamilyMember.
 * Converts Timestamps back to Dates, null back to undefined, and
 * initialises `.relationships` as an empty array (will be filled by
 * `applyUnitsToMembers` later).
 *
 * @param memberId - The Firestore document ID
 * @param data - The raw document data from Firestore
 * @returns A hydrated FamilyMember object
 */
const fromMemberDoc = (memberId: string, data: Record<string, any>): FamilyMember => ({
  id: memberId,
  firstName: data.firstName ?? '',
  lastName: data.lastName ?? '',
  nickname: data.nickname ?? undefined, // Convert Firestore null → undefined
  photoURL: data.photoURL ?? undefined,
  birthDate: dateFromFirestore(data.birthDate), // Timestamp → Date
  deathDate: dateFromFirestore(data.deathDate),
  bio: data.bio ?? undefined,
  gender: data.gender ?? undefined,
  userId: data.userId ?? undefined,
  relationships: [], // Populated later by applyUnitsToMembers()
  createdBy: data.createdBy ?? 'system',
  createdAt: dateFromFirestore(data.createdAt) ?? new Date(),
  updatedAt: dateFromFirestore(data.updatedAt) ?? new Date(),
});

/**
 * Deserialize a Firestore document snapshot into a FamilyUnitRecord.
 * Handles legacy field names for backwards compatibility:
 * - `spouseIds` → `partnerIds` (renamed during schema evolution)
 * - `childIds` → `childLinks` (upgraded from simple ID list to link objects)
 *
 * @param unitId - The Firestore document ID
 * @param data - The raw document data from Firestore
 * @returns A hydrated FamilyUnitRecord object
 */
const fromUnitDoc = (unitId: string, data: Record<string, any>): FamilyUnitRecord => {
  // Support legacy field name: `spouseIds` was renamed to `partnerIds`
  const rawPartnerIds = Array.isArray(data.partnerIds)
    ? data.partnerIds
    : Array.isArray(data.spouseIds)
      ? data.spouseIds
      : [];

  // Support legacy format: `childIds` (string[]) was upgraded to `childLinks` (object[])
  const rawChildLinks = Array.isArray(data.childLinks)
    ? data.childLinks
    : Array.isArray(data.childIds)
      ? data.childIds.map((childId: string) => ({
          childId,
          relationType: DEFAULT_RELATION_TYPE, // Legacy entries default to biological
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

// ---------------------------------------------------------------------------
// Unit query helpers — small predicates used by store actions
// ---------------------------------------------------------------------------

/**
 * Check whether a member already has a partner (i.e. is in a unit with 2 partner IDs).
 * Used to guard against adding a second spouse to someone who is already coupled.
 */
const hasActivePartner = (units: FamilyUnitRecord[], memberId: string) =>
  units.some((unit) => unit.partnerIds.includes(memberId) && unit.partnerIds.length >= 2);

/**
 * Find the first family unit where a member is listed as a partner.
 * Returns undefined if the member is not a partner in any unit.
 */
const findUnitForPartner = (units: FamilyUnitRecord[], memberId: string) =>
  units.find((unit) => unit.partnerIds.includes(memberId));

/**
 * Find all family units where a given member appears as a child.
 * A member can be a child in multiple units (e.g. biological parents + step-parent unit).
 */
const findUnitsForChild = (units: FamilyUnitRecord[], childId: string) =>
  units.filter((unit) => unit.childLinks.some((link) => link.childId === childId));

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

/**
 * FamilyState — the complete Zustand store shape for family data.
 *
 * Divided into three sections:
 * 1. **State fields** — the reactive data (members, units, loading/error flags).
 * 2. **Actions** — async functions that mutate Firestore and local state.
 * 3. **Selectors** — pure getters that derive data from current state.
 */
interface FamilyState {
  /** All family members with hydrated `.relationships` arrays. */
  members: FamilyMember[];
  /** All family unit records (couples + child links) from Firestore. */
  units: FamilyUnitRecord[];
  /** The current family's Firestore document ID. */
  familyId: string;
  /** True while loadData() is fetching from Firestore. */
  isLoading: boolean;
  /** Human-readable error message if the last operation failed. */
  error: string | null;
  /** ID of the most recently added member — used to auto-focus the tree. */
  lastAddedMemberId: string | null;

  // --- Actions: write to Firestore and optimistically update local state ---

  /** Fetch all members and units from Firestore (or seed with mock data in dev). */
  loadData: () => Promise<void>;
  /** Create a new member as the spouse of an existing member. Returns new member ID. */
  addSpouse: (memberId: string, input: NewMemberInput) => Promise<string>;
  /** Create a new member as a child of an existing parent. Returns new member ID. */
  addChild: (parentId: string, input: NewMemberInput) => Promise<string>;
  /** Create a new member as a sibling of an existing member. Returns new member ID. */
  addSibling: (memberId: string, input: NewMemberInput) => Promise<string>;
  /** Create a new member as a parent of an existing member. Returns new member ID. */
  addParent: (memberId: string, input: NewMemberInput) => Promise<string>;
  /** High-level dispatcher for extended relatives (grandparent, aunt/uncle, cousin). */
  addRelative: (params: {
    relation: ExtendedRelativeType;
    parentId?: string;
    auntUncleId?: string;
    input: NewMemberInput;
  }) => Promise<string>;
  /** Update an existing member's profile fields in Firestore. */
  updateMember: (memberId: string, updates: Partial<NewMemberInput>) => Promise<void>;
  /** Delete a member and clean up all unit references. */
  removeMember: (memberId: string) => Promise<void>;
  /** Reset the lastAddedMemberId flag (called after tree finishes focusing). */
  clearLastAdded: () => void;

  // --- Selectors: derive data from current state ---

  /** Look up a single member by ID. */
  getMemberById: (id: string) => FamilyMember | undefined;
  /** Compute a human-readable relationship label between two members (e.g. "Father", "Cousin"). */
  calculateRelationship: (targetId: string, currentUserId: string) => string;
  /** Filter members by generation tier (0 = grandparents, 1 = parents, 2 = children). */
  getMembersByGeneration: (generation: number) => FamilyMember[];
  /** Find the spouse of a given member via unit records. */
  getSpouseOf: (memberId: string) => FamilyMember | undefined;
  /** Get all children of a given member. */
  getChildrenOf: (memberId: string) => FamilyMember[];
  /** Get all parents of a given member. */
  getParentsOf: (memberId: string) => FamilyMember[];
  /** Build the nested FamilyTreeData structure for the visual tree renderer. */
  buildFamilyTree: () => FamilyTreeData | null;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useFamilyStore = create<FamilyState>((set, get) => ({
  // --- Initial state ---
  members: [], // Populated by loadData()
  units: [], // Populated by loadData()
  familyId: DEFAULT_FAMILY_ID, // Will be dynamic once multi-family support lands
  isLoading: false, // True while fetching from Firestore
  error: null, // Set on load/action failure
  lastAddedMemberId: null, // Set after any add* action for tree auto-focus

  // -----------------------------------------------------------------------
  // ACTION: loadData
  // Fetches all members and units from Firestore for the current family.
  // If Firestore is empty (first launch), seeds with mock data.
  // In dev mode, also writes the seed data back to Firestore.
  // On error in dev, falls back to mock data so the app is still usable.
  // -----------------------------------------------------------------------
  loadData: async () => {
    set({ isLoading: true, error: null }); // Signal loading to UI
    try {
      const familyId = get().familyId;

      // Fetch members and units subcollections in parallel
      const [membersSnap, unitsSnap] = await Promise.all([
        getDocs(collection(db, 'families', familyId, 'members')),
        getDocs(collection(db, 'families', familyId, 'units')),
      ]);

      // Deserialize Firestore snapshots into typed objects
      let members = membersSnap.docs.map((docSnap) => fromMemberDoc(docSnap.id, docSnap.data()));
      let units = unitsSnap.docs.map((docSnap) => fromUnitDoc(docSnap.id, docSnap.data()));

      // --- Seed path: if Firestore has no members, bootstrap with mock data ---
      if (members.length === 0) {
        // Derive unit records from mock members' pre-built relationships
        const seedUnits = deriveUnitsFromMembers(mockFamilyMembers);
        // Strip relationships so applyUnitsToMembers() can rebuild them cleanly
        const seedMembers = mockFamilyMembers.map((member) => ({
          ...member,
          relationships: [],
        }));

        // In development, persist the seed data to Firestore for consistency
        if (__DEV__) {
          await ensureFamilyDoc(familyId); // Ensure parent doc exists
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
          await batch.commit(); // Atomic write of all seed data
        }

        members = seedMembers;
        units = seedUnits;
      }

      // Derive relationship arrays from unit records and attach to each member
      const normalizedMembers = applyUnitsToMembers(members, units);
      set({ members: normalizedMembers, units, isLoading: false });
    } catch (error) {
      // --- Error handling ---
      if (__DEV__) {
        // In dev: fall back to mock data so the developer can still work
        const fallbackUnits = deriveUnitsFromMembers(mockFamilyMembers);
        set({
          members: applyUnitsToMembers(mockFamilyMembers, fallbackUnits),
          units: fallbackUnits,
          error: error instanceof Error ? error.message : 'Failed to load family data',
          isLoading: false,
        });
      } else {
        // In production: show empty state with error
        set({
          members: [],
          units: [],
          error: error instanceof Error ? error.message : 'Failed to load family data',
          isLoading: false,
        });
      }
    }
  },

  // -----------------------------------------------------------------------
  // ACTION: addSpouse
  // Creates a new family member and links them as the spouse of `memberId`.
  //
  // Two scenarios:
  // A) The member already has a single-parent unit (has children but no partner):
  //    → Add the new spouse to that existing unit and update child links so the
  //      new spouse is a step-parent to existing children.
  // B) The member has no unit yet:
  //    → Create a brand-new unit with both partners and no children.
  //
  // Guards against adding a second spouse if one already exists.
  // -----------------------------------------------------------------------
  addSpouse: async (memberId, input) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    // Guard: prevent adding a second spouse
    if (hasActivePartner(units, memberId)) {
      throw new Error('This member already has a spouse.');
    }

    // Generate a new Firestore document reference (auto-ID) for the new member
    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    // Guard: ensure the generated ID does not collide with an existing partnered member
    if (hasActivePartner(units, memberRef.id)) {
      throw new Error('This spouse already has a partner.');
    }

    // Build the new member object (relationships will be derived after batch commit)
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
      relationships: [], // Will be populated by applyUnitsToMembers()
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Check if the member already belongs to a unit (e.g. as a single parent)
    const existingUnit = findUnitForPartner(units, memberId);
    const batch = writeBatch(db);
    await ensureFamilyDoc(familyId); // Ensure /families/{familyId} doc exists
    batch.set(memberRef, toMemberDoc(newMember)); // Write the new member document

    let nextUnits = units;
    if (existingUnit) {
      // --- Scenario A: Member already has a unit (single-parent with children) ---
      if (existingUnit.partnerIds.length >= 2) {
        throw new Error('This member already has a spouse.');
      }
      const updatedUnit: FamilyUnitRecord = {
        ...existingUnit,
        // Add new spouse to the partner list
        partnerIds: normalizePartnerIds([...existingUnit.partnerIds, newMember.id]),
        // Existing children become step-children of the new spouse
        childLinks: appendParentToChildLinks(
          existingUnit.childLinks,
          existingUnit.partnerIds,
          newMember.id,
          DEFAULT_STEP_RELATION, // New spouse defaults to step-parent of existing kids
        ),
        updatedAt: now,
      };
      batch.set(
        doc(collection(db, 'families', familyId, 'units'), existingUnit.id),
        toUnitDoc(updatedUnit),
        { merge: true },
      );
      // Replace the old unit in the local array with the updated one
      nextUnits = units.map((unit) => (unit.id === existingUnit.id ? updatedUnit : unit));
    } else {
      // --- Scenario B: No existing unit — create a new couple unit ---
      const partnerIds = normalizePartnerIds([memberId, newMember.id]);
      const unitRef = doc(collection(db, 'families', familyId, 'units'));
      const newUnit: FamilyUnitRecord = {
        id: unitRef.id,
        partnerIds,
        childLinks: [], // No children yet
        status: 'current',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(unitRef, toUnitDoc(newUnit));
      nextUnits = [...units, newUnit]; // Append the new unit to the local array
    }

    await batch.commit(); // Atomic Firestore write
    // Recompute all relationships from the updated units
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits, lastAddedMemberId: newMember.id });

    return newMember.id;
  },

  // -----------------------------------------------------------------------
  // ACTION: addChild
  // Creates a new family member as a child of the given parent.
  //
  // Two scenarios:
  // A) The parent already belongs to a unit (with or without a spouse):
  //    → Append a new child link to that unit. The child is linked to ALL
  //      partners in the unit with the given relationship type.
  // B) The parent has no unit:
  //    → Create a new single-parent unit containing just this parent and child.
  //
  // The relationship type (biological, adopted, step, guardian) can be
  // specified via `input.relationshipType`; defaults to biological.
  // -----------------------------------------------------------------------
  addChild: async (parentId, input) => {
    const { members, units, familyId } = get();
    const parent = members.find((m) => m.id === parentId);
    if (!parent) {
      throw new Error('Parent not found.');
    }

    // Determine relationship type (biological by default)
    const relationType = input.relationshipType ?? DEFAULT_RELATION_TYPE;
    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    // Build the new child member object
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
      relationships: [], // Will be populated by applyUnitsToMembers()
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Look for an existing unit where this parent is a partner
    const existingUnit = findUnitForPartner(units, parentId);
    let nextUnits = units;
    const batch = writeBatch(db);
    await ensureFamilyDoc(familyId);
    batch.set(memberRef, toMemberDoc(newMember)); // Write the new member document

    if (existingUnit) {
      // --- Scenario A: Add child to the parent's existing unit ---
      const parentIds = existingUnit.partnerIds; // Includes spouse if present
      // Create child link with per-parent relationship entries
      const newChildLink = buildChildLink(newMember.id, parentIds, relationType);
      const updatedUnit: FamilyUnitRecord = {
        ...existingUnit,
        childLinks: [...existingUnit.childLinks, newChildLink], // Append new child
        updatedAt: now,
      };
      batch.set(
        doc(collection(db, 'families', familyId, 'units'), existingUnit.id),
        toUnitDoc(updatedUnit),
        { merge: true },
      );
      nextUnits = units.map((unit) => (unit.id === existingUnit.id ? updatedUnit : unit));
    } else {
      // --- Scenario B: Create a new single-parent unit ---
      const unitRef = doc(collection(db, 'families', familyId, 'units'));
      const partnerIds = normalizePartnerIds([parentId]); // Single-parent unit
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

    await batch.commit(); // Atomic Firestore write
    // Recompute all relationships from updated units
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits, lastAddedMemberId: newMember.id });

    return newMember.id;
  },

  // -----------------------------------------------------------------------
  // ACTION: addSibling
  // Creates a new family member as a sibling of `memberId`.
  //
  // Siblings share the same parent unit. This action finds the unit(s) where
  // `memberId` is a child, picks the "preferred" unit (the one where the
  // existing member is biologically linked, if any), and appends a new child
  // link to that unit.
  //
  // Requires at least one parent on record — you cannot add a sibling if
  // the member has no parent units.
  // -----------------------------------------------------------------------
  addSibling: async (memberId, input) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    // Find all units where this member is listed as a child
    const relatedUnits = findUnitsForChild(units, memberId);
    if (relatedUnits.length === 0) {
      throw new Error('Sibling requires at least one parent on record.');
    }

    // Prefer the unit where the existing member has a biological relationship.
    // If none is biological (e.g. adopted), fall back to the first unit found.
    const preferredUnit =
      relatedUnits.find((unit) => {
        const link = unit.childLinks.find((childLink) => childLink.childId === memberId);
        return link && getPrimaryRelationType(link) === 'biological';
      }) ?? relatedUnits[0];

    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    // Build the new sibling member object
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
      relationships: [], // Will be populated by applyUnitsToMembers()
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Inherit the relationship type from the existing sibling's link, unless overridden
    const baseType =
      input.relationshipType ??
      getPrimaryRelationType(preferredUnit.childLinks.find((link) => link.childId === memberId)!);
    // Create the new child link with the same parents as the sibling
    const newChildLink = buildChildLink(newMember.id, preferredUnit.partnerIds, baseType);

    // Append the new sibling to the preferred unit's child list
    const updatedUnit: FamilyUnitRecord = {
      ...preferredUnit,
      childLinks: [...preferredUnit.childLinks, newChildLink],
      updatedAt: now,
    };

    await ensureFamilyDoc(familyId);
    const batch = writeBatch(db);
    batch.set(memberRef, toMemberDoc(newMember)); // Write new member
    batch.set(
      doc(collection(db, 'families', familyId, 'units'), preferredUnit.id),
      toUnitDoc(updatedUnit),
      { merge: true }, // Merge to preserve other fields
    );
    await batch.commit(); // Atomic Firestore write

    // Optimistic local state update
    const nextUnits = units.map((unit) => (unit.id === preferredUnit.id ? updatedUnit : unit));
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits, lastAddedMemberId: newMember.id });

    return newMember.id;
  },

  // -----------------------------------------------------------------------
  // ACTION: addParent
  // Creates a new family member as a parent of `memberId`.
  //
  // Two scenarios:
  // A) The member already has a parent unit with one parent:
  //    → Add the new parent as the second partner in that unit. The new parent
  //      becomes a step-parent to all OTHER children in the unit by default,
  //      but gets the specified `relationType` for the target child (`memberId`).
  // B) The member has no parent unit:
  //    → Create a new unit with the new parent as the sole partner and
  //      `memberId` as the only child.
  //
  // Guards:
  // - Cannot add a step-parent if the child already has two parents.
  // - Cannot add more than two parents to a single unit.
  // -----------------------------------------------------------------------
  addParent: async (memberId, input) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    // Guard: step-parent can only be added when there is exactly one existing parent
    if (hasActivePartner(units, memberId) && input.relationshipType === 'step') {
      throw new Error('Step parent requires a single-parent household.');
    }

    const relationType = input.relationshipType ?? DEFAULT_RELATION_TYPE;
    const memberRef = doc(collection(db, 'families', familyId, 'members'));
    const createdBy = useUserStore.getState().currentMemberId ?? 'system';
    const now = new Date();

    // Guard: ensure the auto-generated ID does not collide with a partnered member
    if (hasActivePartner(units, memberRef.id)) {
      throw new Error('This parent already has a spouse.');
    }

    // Build the new parent member object
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
      relationships: [], // Will be populated by applyUnitsToMembers()
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Find units where this member is a child (to find the existing parent unit)
    const existingUnits = findUnitsForChild(units, memberId);
    const targetUnit = existingUnits[0]; // Use the first matching unit
    const batch = writeBatch(db);
    await ensureFamilyDoc(familyId);
    batch.set(memberRef, toMemberDoc(newMember)); // Write the new parent document

    let nextUnits = units;
    if (targetUnit) {
      // --- Scenario A: Add as second parent to existing unit ---
      if (targetUnit.partnerIds.length >= 2) {
        throw new Error('This member already has two parents recorded.');
      }
      const updatedUnit: FamilyUnitRecord = {
        ...targetUnit,
        // Add new parent to partner list
        partnerIds: normalizePartnerIds([...targetUnit.partnerIds, newMember.id]),
        // Update child links: new parent is step-parent to all children by default,
        // EXCEPT the target child who gets the specified relationType
        childLinks: appendParentToChildLinks(
          targetUnit.childLinks,
          targetUnit.partnerIds,
          newMember.id,
          DEFAULT_STEP_RELATION, // Default for other children in the unit
          memberId, // Override child: the member we are adding a parent to
          relationType, // Override type: the specified relationship (bio/step/etc.)
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
      // --- Scenario B: No existing parent unit — create a new one ---
      const unitRef = doc(collection(db, 'families', familyId, 'units'));
      const partnerIds = normalizePartnerIds([newMember.id]); // Single parent initially
      const newUnit: FamilyUnitRecord = {
        id: unitRef.id,
        partnerIds,
        childLinks: [buildChildLink(memberId, partnerIds, relationType)], // memberId is the child
        status: 'current',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(unitRef, toUnitDoc(newUnit));
      nextUnits = [...units, newUnit];
    }

    await batch.commit(); // Atomic Firestore write
    // Recompute all relationships from updated units
    const nextMembers = applyUnitsToMembers([...members, newMember], nextUnits);
    set({ members: nextMembers, units: nextUnits, lastAddedMemberId: newMember.id });

    return newMember.id;
  },

  // -----------------------------------------------------------------------
  // ACTION: addRelative
  // High-level dispatcher for adding extended relatives (grandparent,
  // aunt/uncle, cousin). These are not direct relationships — they are
  // composed from the base actions (addParent, addSibling, addChild)
  // by targeting the correct intermediary member.
  //
  // - grandparent: calls addParent on the selected parent of the focus member
  // - aunt/uncle:  calls addSibling on the selected parent (sibling of a parent)
  // - cousin:      calls addChild on the selected aunt/uncle
  //
  // Requires the caller to resolve which parent or aunt/uncle to target,
  // passed via `parentId` or `auntUncleId`.
  // -----------------------------------------------------------------------
  addRelative: async ({ relation, parentId, auntUncleId, input }) => {
    const { addParent, addSibling, addChild } = get();

    if (relation === 'grandparent') {
      // Grandparent = parent of one of the focus member's parents
      if (!parentId) {
        throw new Error('Select a parent before adding a grandparent.');
      }
      return addParent(parentId, input);
    }

    if (relation === 'aunt-uncle') {
      // Aunt/Uncle = sibling of one of the focus member's parents
      if (!parentId) {
        throw new Error('Select a parent before adding an aunt or uncle.');
      }
      return addSibling(parentId, input);
    }

    if (relation === 'cousin') {
      // Cousin = child of an aunt or uncle
      if (!auntUncleId) {
        throw new Error('Select an aunt or uncle before adding a cousin.');
      }
      return addChild(auntUncleId, input);
    }

    throw new Error('Unsupported relative type.');
  },

  // -----------------------------------------------------------------------
  // ACTION: updateMember
  // Updates profile fields (name, dates, bio, photo, gender) for an
  // existing family member. Only fields present in `updates` are changed;
  // all other fields are preserved from the existing member.
  //
  // Uses the `'field' in updates` pattern to distinguish between "not
  // provided" (preserve existing) and "explicitly set to empty string"
  // (clear the field). This is important for optional fields like nickname
  // and bio where the user may want to remove a value.
  //
  // Does NOT modify relationships or units — only member profile data.
  // -----------------------------------------------------------------------
  updateMember: async (memberId, updates) => {
    const { members, units, familyId } = get();
    const member = members.find((existing) => existing.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    const now = new Date();
    // Merge updates into the existing member, preserving unmodified fields
    const nextMember: FamilyMember = {
      ...member,
      firstName: updates.firstName ?? member.firstName,
      lastName: updates.lastName ?? member.lastName,
      // For optional string fields: if the key is present in updates, use the new value
      // (converting empty string to undefined); otherwise keep the existing value
      nickname: 'nickname' in updates ? updates.nickname || undefined : member.nickname,
      photoURL: 'photoURL' in updates ? updates.photoURL || undefined : member.photoURL,
      birthDate: 'birthDate' in updates ? updates.birthDate : member.birthDate,
      deathDate: 'deathDate' in updates ? updates.deathDate : member.deathDate,
      bio: 'bio' in updates ? updates.bio || undefined : member.bio,
      gender: 'gender' in updates ? updates.gender : member.gender,
      updatedAt: now,
    };

    // Write updated member to Firestore
    await ensureFamilyDoc(familyId);
    await setDoc(
      doc(collection(db, 'families', familyId, 'members'), memberId),
      toMemberDoc(nextMember),
      { merge: true }, // Merge to preserve any fields not in toMemberDoc output
    );

    // Optimistic local update: replace the old member and recompute relationships
    const nextMembers = applyUnitsToMembers(
      members.map((existing) => (existing.id === memberId ? nextMember : existing)),
      units,
    );
    set({ members: nextMembers });
  },

  // -----------------------------------------------------------------------
  // ACTION: removeMember
  // Deletes a family member and cleans up all references in family units.
  //
  // For each unit the member appears in:
  // - If the member is a partner: remove from partnerIds and strip their
  //   parentLink entries from all child links in that unit.
  // - If the member is a child: remove the child link entirely.
  // - If the unit becomes empty (no partners AND no children): delete it.
  // - Otherwise: update the unit with the member removed.
  //
  // All changes are made in a single Firestore batch for atomicity.
  // -----------------------------------------------------------------------
  removeMember: async (memberId) => {
    const { members, units, familyId } = get();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Member not found.');
    }

    const batch = writeBatch(db);
    // Delete the member document itself
    batch.delete(doc(collection(db, 'families', familyId, 'members'), memberId));

    // Walk every unit and clean up references to the removed member
    const nextUnits: FamilyUnitRecord[] = [];
    for (const unit of units) {
      const isPartner = unit.partnerIds.includes(memberId); // Member is a partner in this unit
      const hasChildLink = unit.childLinks.some((link) => link.childId === memberId); // Member is a child in this unit

      // Unit is unaffected — keep as-is
      if (!isPartner && !hasChildLink) {
        nextUnits.push(unit);
        continue;
      }

      let updatedPartnerIds = unit.partnerIds;
      let updatedChildLinks = unit.childLinks;

      if (isPartner) {
        // Remove the member from the partner list
        updatedPartnerIds = unit.partnerIds.filter((id) => id !== memberId);
        // Remove this member from parentLinks in every child link
        updatedChildLinks = updatedChildLinks.map((link) => ({
          ...link,
          parentLinks: link.parentLinks?.filter((pl) => pl.parentId !== memberId),
        }));
      }

      if (hasChildLink) {
        // Remove the child link for this member entirely
        updatedChildLinks = updatedChildLinks.filter((link) => link.childId !== memberId);
      }

      // Check if the unit is now completely empty
      const isEmpty = updatedPartnerIds.length === 0 && updatedChildLinks.length === 0;
      const unitRef = doc(collection(db, 'families', familyId, 'units'), unit.id);

      if (isEmpty) {
        // Unit has no members left — delete it from Firestore
        batch.delete(unitRef);
      } else {
        // Unit still has members — update it with the member removed
        const updatedUnit: FamilyUnitRecord = {
          ...unit,
          partnerIds: updatedPartnerIds,
          childLinks: updatedChildLinks,
          updatedAt: new Date(),
        };
        batch.set(unitRef, toUnitDoc(updatedUnit), { merge: true });
        nextUnits.push(updatedUnit);
      }
    }

    await batch.commit(); // Atomic Firestore write
    // Remove the member from local state and recompute all relationships
    const nextMembers = applyUnitsToMembers(
      members.filter((m) => m.id !== memberId),
      nextUnits,
    );
    set({ members: nextMembers, units: nextUnits });
  },

  // -----------------------------------------------------------------------
  // SELECTOR: getMemberById
  // Simple lookup of a single FamilyMember by their ID.
  // Returns undefined if no member with that ID exists in the store.
  // -----------------------------------------------------------------------
  getMemberById: (id) => {
    const { members } = get();
    return members.find((m) => m.id === id);
  },

  // -----------------------------------------------------------------------
  // SELECTOR: calculateRelationship
  // Computes a human-readable relationship label between two members
  // (e.g. "Father", "Cousin", "Grandmother"). Delegates to the utility
  // function in utils/relationships.ts which performs a BFS/DFS traversal
  // of the relationship graph.
  //
  // @param targetId - The member whose relationship label we want
  // @param currentUserId - The "perspective" member (usually the logged-in user)
  // @returns A string like "Mother", "Uncle", "Cousin", or "Unknown"
  // -----------------------------------------------------------------------
  calculateRelationship: (targetId, currentUserId) => {
    if (!currentUserId) {
      return 'Unknown'; // No perspective user — cannot calculate
    }
    const { members } = get();
    return calculateRelationshipUtil(currentUserId, targetId, members);
  },

  // -----------------------------------------------------------------------
  // SELECTOR: getMembersByGeneration
  // Filters members into generation tiers based on their relationships.
  // This is a simplified 3-tier model (not a true generational depth):
  //   0 = Grandparents tier (no parents on record — they are the "top")
  //   1 = Parents tier (have parents AND have children, or spouse has children)
  //   2 = Children tier (have parents but no children)
  //
  // A member's tier is determined by whether they have parent and/or child
  // relationships, including checking their spouse's children (so a married
  // person without personal children but whose spouse has children is still
  // placed in the parents tier).
  // -----------------------------------------------------------------------
  getMembersByGeneration: (generation) => {
    const { members, getMemberById } = get();

    return members.filter((member) => {
      const hasParents = member.relationships.some((r) => r.type === 'parent');
      const hasChildren = member.relationships.some((r) => r.type === 'child');

      // Also check if the member's spouse has children (counts as "has children" for tier placement)
      const spouseRel = member.relationships.find((r) => r.type === 'spouse');
      const spouse = spouseRel ? getMemberById(spouseRel.memberId) : undefined;
      const spouseHasChildren = spouse?.relationships.some((r) => r.type === 'child') ?? false;

      switch (generation) {
        case 0: // Grandparents tier: no parents on record (top of the tree)
          return !hasParents;
        case 1: // Parents tier: has parents AND (has children or spouse has children)
          return hasParents && (hasChildren || spouseHasChildren);
        case 2: // Children tier: has parents but no children at all
          return hasParents && !hasChildren && !spouseHasChildren;
        default:
          return false;
      }
    });
  },

  // -----------------------------------------------------------------------
  // SELECTOR: getSpouseOf
  // Finds the spouse of a given member by looking through unit records.
  // A spouse exists when a unit has exactly 2 partner IDs and the given
  // member is one of them — the other partner is the spouse.
  // Returns undefined if the member is single or not found.
  // -----------------------------------------------------------------------
  getSpouseOf: (memberId) => {
    const { units, getMemberById } = get();
    // Find a unit where this member is a partner AND the unit has exactly 2 partners
    const unit = units.find(
      (unitItem) => unitItem.partnerIds.includes(memberId) && unitItem.partnerIds.length === 2,
    );
    if (!unit) return undefined; // No coupled unit found — member is single
    // The spouse is the other partner in the unit
    const partnerId = unit.partnerIds.find((id) => id !== memberId);
    return partnerId ? getMemberById(partnerId) : undefined;
  },

  // -----------------------------------------------------------------------
  // SELECTOR: getChildrenOf
  // Returns all children of a given member by filtering that member's
  // relationships for entries of type 'child' and resolving each to a
  // full FamilyMember object.
  // -----------------------------------------------------------------------
  getChildrenOf: (memberId) => {
    const { getMemberById } = get();
    const member = getMemberById(memberId);
    if (!member) return [];

    return member.relationships
      .filter((r) => r.type === 'child') // Only child relationships
      .map((r) => getMemberById(r.memberId)) // Resolve ID → FamilyMember
      .filter((m): m is FamilyMember => m !== undefined); // Remove any unresolved refs
  },

  // -----------------------------------------------------------------------
  // SELECTOR: getParentsOf
  // Returns all parents of a given member by filtering that member's
  // relationships for entries of type 'parent' and resolving each to a
  // full FamilyMember object. Typically returns 0-2 members.
  // -----------------------------------------------------------------------
  getParentsOf: (memberId) => {
    const { getMemberById } = get();
    const member = getMemberById(memberId);
    if (!member) return [];

    return member.relationships
      .filter((r) => r.type === 'parent') // Only parent relationships
      .map((r) => getMemberById(r.memberId)) // Resolve ID → FamilyMember
      .filter((m): m is FamilyMember => m !== undefined); // Remove any unresolved refs
  },

  /** Reset the lastAddedMemberId flag. Called after the tree UI finishes auto-scrolling to the new member. */
  clearLastAdded: () => set({ lastAddedMemberId: null }),

  // -----------------------------------------------------------------------
  // SELECTOR: buildFamilyTree
  // Transforms the flat members[] + units[] into a nested FamilyTreeData
  // structure suitable for the visual family tree renderer.
  //
  // Layout strategy (3-column):
  //   leftAncestors  ← spouse1's parents (grandparents side A)
  //   centerUnit     ← the "focus couple" and all their descendants
  //   rightAncestors ← spouse2's parents (grandparents side B)
  //
  // Algorithm:
  // 1. Pick the "focus couple" — the logged-in user + their spouse, or a
  //    fallback member who has both parents and children (a "middle" person).
  // 2. Recursively build the center unit downward (all descendants).
  // 3. Build ancestor subtrees upward from each focus partner's parents.
  //    Because the focus partners are already marked as visited, they won't
  //    appear as children of their own parents — preventing duplication.
  // 4. Collect any remaining unvisited members as "orphans".
  //
  // Returns null if no members exist or no suitable focus can be found.
  // -----------------------------------------------------------------------
  buildFamilyTree: () => {
    const { members, getSpouseOf, getChildrenOf, getParentsOf, lastAddedMemberId } = get();
    if (members.length === 0) return null; // No data — nothing to render

    // Track which members have been placed in the tree to avoid duplicates
    const globalVisited = new Set<string>();

    /**
     * Recursively build a FamilyUnit subtree starting from a set of partners.
     * Marks all visited members in `globalVisited` to prevent them from
     * appearing in other subtrees.
     *
     * @param partners - The 1-2 partners at the root of this subtree
     * @param depth - The depth level (0 = grandparents, 1 = parents, 2+ = descendants)
     * @returns A FamilyUnit node with recursively nested children
     */
    const buildUnit = (partners: FamilyMember[], depth: number): FamilyUnit => {
      // Mark all partners as visited
      partners.forEach((p) => globalVisited.add(p.id));

      // Collect all unique, unvisited children from all partners
      const seen = new Set<string>(); // Local dedup for children of this unit
      const allChildren: FamilyMember[] = [];
      partners.forEach((partner) => {
        getChildrenOf(partner.id).forEach((child) => {
          if (!seen.has(child.id) && !globalVisited.has(child.id)) {
            seen.add(child.id);
            allChildren.push(child);
          }
        });
      });

      // Sort children by birth date (oldest first, undated last)
      allChildren.sort((a, b) => {
        if (!a.birthDate && !b.birthDate) return 0;
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return a.birthDate.getTime() - b.birthDate.getTime();
      });

      // For each child: if they have a spouse or children of their own,
      // recursively build a nested FamilyUnit; otherwise return as a leaf member
      const children: (FamilyUnit | FamilyMember)[] = allChildren.map((child) => {
        if (globalVisited.has(child.id)) return child; // Already placed — return as leaf
        const childSpouse = getSpouseOf(child.id);
        const childHasChildren = getChildrenOf(child.id).length > 0;
        if (childSpouse && !globalVisited.has(childSpouse.id)) {
          // Child has an unvisited spouse — recurse into a coupled unit
          return buildUnit([child, childSpouse], depth + 1);
        }
        if (childHasChildren) {
          // Child has children but no spouse — recurse into a single-parent unit
          return buildUnit([child], depth + 1);
        }
        // Leaf child — no spouse, no children
        globalVisited.add(child.id);
        return child;
      });

      return { partners, children, depth };
    };

    /**
     * Look up the parents of a member (returns up to 2 parents, or null if none).
     */
    const findParents = (member: FamilyMember): FamilyMember[] | null => {
      const parents = getParentsOf(member.id);
      if (parents.length === 0) return null;
      return parents.slice(0, 2); // Cap at 2 parents per unit
    };

    /**
     * Determine the "focus couple" — the partners at the center of the tree.
     *
     * Priority:
     * 1. The logged-in user (currentMemberId from userStore) + their spouse
     * 2. The logged-in user alone (if they have children but no spouse)
     * 3. The logged-in user's parents (if the user is a leaf child)
     * 4. Fallback: any member who has both parents and children (a "bridge" member)
     *
     * Returns null if no suitable focus can be determined.
     */
    const pickFocusPartners = (): FamilyMember[] | null => {
      const currentMemberId = useUserStore.getState().currentMemberId;
      if (currentMemberId) {
        const currentMember = members.find((m) => m.id === currentMemberId);
        if (currentMember) {
          const spouse = getSpouseOf(currentMember.id);
          if (spouse) return [currentMember, spouse]; // User + spouse
          if (getChildrenOf(currentMember.id).length > 0) return [currentMember]; // Single parent
          const parents = findParents(currentMember); // User is a leaf — focus on their parents
          if (parents) return parents;
        }
      }

      // Fallback: find any member that sits in the "middle" of the tree
      // (has both parents above and children below)
      const fallbackMember = members.find(
        (m) =>
          m.relationships.some((r) => r.type === 'parent') &&
          m.relationships.some((r) => r.type === 'child'),
      );
      if (!fallbackMember) return null; // Cannot determine a focus — give up
      const spouse = getSpouseOf(fallbackMember.id);
      if (spouse) return [fallbackMember, spouse];
      return [fallbackMember];
    };

    // --- Assemble the three-column tree layout ---

    const focusPartners = pickFocusPartners();
    if (!focusPartners) return null; // No focus could be determined

    // Build center unit first — marks focus partners + all descendants as visited
    const centerUnit = buildUnit(focusPartners, 1);

    // Build ancestor subtrees — focus partner is already visited so excluded from children.
    // This naturally includes aunts/uncles/cousins that branch off the grandparents.
    const spouse1Parents = focusPartners[0] ? findParents(focusPartners[0]) : null;
    const leftAncestors = spouse1Parents ? buildUnit(spouse1Parents, 0) : null;

    const spouse2Parents =
      focusPartners.length > 1 && focusPartners[1] ? findParents(focusPartners[1]) : null;
    const rightAncestors = spouse2Parents ? buildUnit(spouse2Parents, 0) : null;

    // Collect orphans — members not placed in any unit (no relationships at all)
    const orphans = members.filter((m) => !globalVisited.has(m.id));

    // Determine which member the tree should auto-scroll to
    const currentMemberId = useUserStore.getState().currentMemberId;
    const focusMemberId = lastAddedMemberId ?? currentMemberId ?? undefined;

    return { leftAncestors, rightAncestors, centerUnit, orphans, focusMemberId };
  },
}));
