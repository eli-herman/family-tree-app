/**
 * Member Detail Screen — `/member/[id]`
 *
 * This is a dynamic route screen in Expo Router. The `[id]` segment means the
 * URL will contain a family member's unique ID (e.g. `/member/abc123`).
 *
 * The screen serves multiple purposes all related to a single family member:
 *   1. **Profile View** — Displays the member's avatar, full name (or nickname),
 *      bio, list of relationships, and birthday.
 *   2. **Manage Family Modal** — A bottom-sheet style modal that lets the user
 *      choose an action: edit details, add spouse/parent/child/sibling/relative,
 *      or remove the member entirely.
 *   3. **Add Member Form Modal** — A form to create a new immediate family member
 *      (spouse, child, sibling, or parent) with fields for first name, last name,
 *      gender, birth date, and relationship type (biological, adopted, step, guardian).
 *   4. **Add Relative Wizard** — A 3-step wizard for adding extended relatives
 *      (grandparent, aunt/uncle, cousin). Step 1 picks the relation type, Step 2
 *      picks the "anchor" parent or aunt/uncle, and Step 3 collects the new
 *      relative's details.
 *   5. **Edit Member Modal** — A form to update an existing member's details
 *      (name, nickname, bio, birth/death dates, gender).
 *   6. **Remove Member Confirmation** — A centered dialog that asks the user to
 *      confirm permanent deletion of a member and all their connections.
 *
 * State is managed locally with `useState` hooks and persisted through the
 * `useFamilyStore` Zustand store, which handles the actual data mutations.
 */

import React, { useMemo, useState, useEffect } from 'react';
// React Native core UI components used throughout this screen
import {
  View, // Generic container for layout (like a <div> in web)
  ScrollView, // Scrollable container so long content doesn't get cut off
  StyleSheet, // Creates optimized style objects for React Native
  Text, // Renders text on screen (React Native requires this wrapper)
  TouchableOpacity, // A button-like wrapper that dims opacity when pressed
  TextInput, // A text field the user can type into
  Modal, // A full-screen overlay that slides or fades in
  KeyboardAvoidingView, // Pushes content up when the keyboard opens
  Platform, // Detects if running on iOS or Android
} from 'react-native';
// SafeAreaView ensures content doesn't overlap with the notch or home indicator
import { SafeAreaView } from 'react-native-safe-area-context';
// Expo Router hooks: useLocalSearchParams reads URL params, useRouter navigates
import { useLocalSearchParams, useRouter } from 'expo-router';
// Reusable UI components from the app's component library
import { Avatar, Button } from '../../src/components/common';
// Design system tokens for consistent colors, spacing, and border radii
import { colors, spacing, borderRadius } from '../../src/constants';
// Zustand store hook that provides access to family member data and actions
import { useFamilyStore } from '../../src/stores';
// TypeScript type definitions for type safety
import {
  NewMemberInput, // Shape of data needed to create a new family member
  ParentRelationshipType, // Union type: 'biological' | 'adopted' | 'step' | 'guardian'
  ExtendedRelativeType, // Union type: 'grandparent' | 'aunt-uncle' | 'cousin'
  FamilyMember, // Full family member object shape
} from '../../src/types';
// Utility function that finds all siblings of a given member
import { getSiblings } from '../../src/utils/relationships';
// date-fns helpers: parse converts a date string to a Date object, isValid checks it
import { parse, isValid } from 'date-fns';

/**
 * AddMode — Determines which type of immediate family member is being added.
 * This controls the title of the add-member modal and which store action
 * is called on save (addSpouse, addChild, addSibling, or addParent).
 */
type AddMode = 'spouse' | 'child' | 'sibling' | 'parent';

/**
 * RelativeStep — Tracks which step the user is on in the 3-step "Add Relative"
 * wizard. 'relation' = choose type, 'anchor' = pick parent/aunt-uncle,
 * 'details' = enter name/gender/etc.
 */
type RelativeStep = 'relation' | 'anchor' | 'details';

/**
 * RELATION_OPTIONS — The four types of parent-child relationships available
 * when adding a child, sibling, or parent. Each option is rendered as a
 * selectable chip in the add-member form. Not shown for spouses since
 * spousal relationships don't have a "kind" qualifier.
 */
const RELATION_OPTIONS: { id: ParentRelationshipType; label: string }[] = [
  { id: 'biological', label: 'Biological' },
  { id: 'adopted', label: 'Adopted' },
  { id: 'step', label: 'Step' },
  { id: 'guardian', label: 'Guardian' },
];

/**
 * RELATIVE_OPTIONS — The three types of extended relatives the wizard supports.
 * Each includes a user-friendly description shown below the label to help
 * the user understand the family relationship.
 */
const RELATIVE_OPTIONS: { id: ExtendedRelativeType; label: string; description: string }[] = [
  { id: 'grandparent', label: 'Grandparent', description: 'Parent of a parent' },
  { id: 'aunt-uncle', label: 'Aunt / Uncle', description: 'Sibling of a parent' },
  { id: 'cousin', label: 'Cousin', description: 'Child of an aunt or uncle' },
];

/**
 * parseDateText — Converts a user-typed date string into a Date object.
 *
 * @param text - The raw text from the date input field (e.g. "03/15/1990")
 * @returns A valid Date object if the string matches MM/DD/YYYY format, or
 *          null if the string is empty or doesn't match the expected format.
 *
 * Uses date-fns `parse` to interpret the string according to a specific format,
 * then `isValid` to confirm the result is a real date (e.g. rejects "13/45/2000").
 */
const parseDateText = (text: string): Date | null => {
  // Return null for empty or whitespace-only input
  if (!text.trim()) return null;
  // Attempt to parse the trimmed text as MM/dd/yyyy, using today as the reference date
  const parsed = parse(text.trim(), 'MM/dd/yyyy', new Date());
  // Only return the Date if it represents a valid calendar date
  return isValid(parsed) ? parsed : null;
};

/**
 * formatDateForInput — Converts a Date object back into a MM/DD/YYYY string
 * suitable for pre-filling a text input field.
 *
 * @param date - Optional Date object to format
 * @returns A formatted string like "03/15/1990", or an empty string if no date
 *
 * `getMonth()` returns 0-11, so we add 1. `padStart(2, '0')` ensures single-digit
 * months and days get a leading zero (e.g. "3" becomes "03").
 */
const formatDateForInput = (date?: Date): string => {
  // If no date is provided, return empty string for the input field
  if (!date) return '';
  // Build MM/DD/YYYY string with zero-padded month and day
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
};

/**
 * MemberDetailScreen — The main component for this route.
 *
 * This is the default export, which Expo Router automatically uses as the
 * screen for the `/member/[id]` route. It reads the member ID from the URL,
 * fetches the member data from the Zustand store, and renders the profile
 * view along with all the modal overlays for managing the member.
 */
export default function MemberDetailScreen() {
  // Extract URL parameters: `id` is the member's unique ID, `manage` is an
  // optional flag that, when present, auto-opens the manage family modal
  const { id, manage } = useLocalSearchParams<{ id: string; manage?: string }>();
  // Router instance for programmatic navigation (e.g. going back)
  const router = useRouter();
  // Expo Router can return params as string or string[]; normalize to a single string
  const memberId = Array.isArray(id) ? id[0] : id;

  // --- Zustand Store Selectors ---
  // Each selector extracts a single function or value from the store.
  // Using individual selectors (instead of destructuring the whole store)
  // prevents unnecessary re-renders when unrelated store values change.
  const getMemberById = useFamilyStore((state) => state.getMemberById); // Looks up a member by ID
  const members = useFamilyStore((state) => state.members); // The full array of all family members
  const addSpouse = useFamilyStore((state) => state.addSpouse); // Action: adds a spouse to a member
  const addChild = useFamilyStore((state) => state.addChild); // Action: adds a child to a member
  const addSibling = useFamilyStore((state) => state.addSibling); // Action: adds a sibling to a member
  const addParent = useFamilyStore((state) => state.addParent); // Action: adds a parent to a member
  const addRelative = useFamilyStore((state) => state.addRelative); // Action: adds an extended relative
  const updateMember = useFamilyStore((state) => state.updateMember); // Action: updates a member's details
  const removeMember = useFamilyStore((state) => state.removeMember); // Action: permanently deletes a member
  const getParentsOf = useFamilyStore((state) => state.getParentsOf); // Getter: returns parents of a member
  // Look up the member for this screen; undefined if ID is missing or not found
  const member = memberId ? getMemberById(memberId) : undefined;

  // --- Add Member Modal State ---
  const [isAddOpen, setIsAddOpen] = useState(false); // Whether the add-member modal is visible
  const [addMode, setAddMode] = useState<AddMode>('child'); // Which type of member we're adding
  const [form, setForm] = useState<NewMemberInput>({
    // Form data for the new member
    firstName: '',
    lastName: member?.lastName || '', // Default last name to the current member's last name
    gender: undefined,
    relationshipType: 'biological', // Default relationship type
  });
  const [birthDateText, setBirthDateText] = useState(''); // Raw text for birth date input
  const [formError, setFormError] = useState<string | null>(null); // Validation error message
  const [isSaving, setIsSaving] = useState(false); // Loading state during save

  // --- Add Relative Wizard State ---
  const [isRelativeOpen, setIsRelativeOpen] = useState(false); // Whether the relative wizard modal is visible
  const [relativeStep, setRelativeStep] = useState<RelativeStep>('relation'); // Current step in the 3-step wizard
  const [relativeType, setRelativeType] = useState<ExtendedRelativeType | null>(null); // Chosen type: grandparent, aunt-uncle, or cousin
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null); // Which parent was selected as anchor (for grandparent/aunt-uncle)
  const [selectedAuntUncleId, setSelectedAuntUncleId] = useState<string | null>(null); // Which aunt/uncle was selected as anchor (for cousin)
  const [relativeForm, setRelativeForm] = useState<NewMemberInput>({
    // Form data for the new relative
    firstName: '',
    lastName: member?.lastName || '', // Default last name to the current member's last name
    gender: undefined,
    relationshipType: 'biological',
  });
  const [relativeError, setRelativeError] = useState<string | null>(null); // Validation error for the relative wizard
  const [isRelativeSaving, setIsRelativeSaving] = useState(false); // Loading state during relative save

  // --- Manage Family Modal State ---
  const [isManageOpen, setIsManageOpen] = useState(false); // Whether the manage family modal is visible

  // --- Remove Member Confirmation State ---
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false); // Whether the removal confirmation dialog is visible
  const [isRemoving, setIsRemoving] = useState(false); // Loading state during member removal

  // --- Edit Member Modal State ---
  const [isEditOpen, setIsEditOpen] = useState(false); // Whether the edit modal is visible
  const [editForm, setEditForm] = useState<NewMemberInput>({
    // Form data pre-filled with the member's current info
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    nickname: member?.nickname,
    photoURL: member?.photoURL,
    birthDate: member?.birthDate,
    deathDate: member?.deathDate,
    bio: member?.bio,
    gender: member?.gender,
  });
  // Pre-format birth date as MM/DD/YYYY string for the text input, or empty if none exists
  const [editBirthDateText, setEditBirthDateText] = useState(
    member?.birthDate
      ? `${String(member.birthDate.getMonth() + 1).padStart(2, '0')}/${String(member.birthDate.getDate()).padStart(2, '0')}/${member.birthDate.getFullYear()}`
      : '',
  );
  // Pre-format death date as MM/DD/YYYY string for the text input, or empty if none exists
  const [editDeathDateText, setEditDeathDateText] = useState(
    member?.deathDate
      ? `${String(member.deathDate.getMonth() + 1).padStart(2, '0')}/${String(member.deathDate.getDate()).padStart(2, '0')}/${member.deathDate.getFullYear()}`
      : '',
  );
  const [editError, setEditError] = useState<string | null>(null); // Validation error for the edit form
  const [isEditSaving, setIsEditSaving] = useState(false); // Loading state during edit save

  /**
   * relationships — A memoized list of this member's relationships, enriched
   * with the related member's full name. The raw relationship data only stores
   * a `memberId` reference; this maps each one to include a human-readable name.
   *
   * `useMemo` ensures this mapping only re-runs when `member` or `members` changes,
   * avoiding unnecessary recalculations on every render.
   */
  const relationships = useMemo(() => {
    // If the member hasn't loaded yet, return an empty array
    if (!member) return [];
    // Map each relationship to include the related member's display name
    return member.relationships.map((rel) => {
      // Look up the related member by their ID in the full members array
      const relatedMember = members.find((m) => m.id === rel.memberId);
      return {
        ...rel, // Spread the original relationship data (type, kind, memberId)
        // Build a display name, falling back to 'Unknown' if the member isn't found
        name: relatedMember ? `${relatedMember.firstName} ${relatedMember.lastName}` : 'Unknown',
      };
    });
  }, [member, members]);

  // --- Derived Values (computed from the member's relationships) ---

  // Check if this member already has a spouse (used to disable the "Add Spouse" button)
  const hasSpouse = member?.relationships.some((rel) => rel.type === 'spouse') ?? false;
  // Count how many parents are on record (max 2 allowed in the data model)
  const parentCount = member?.relationships.filter((rel) => rel.type === 'parent').length ?? 0;
  // A member can only have up to 2 parents
  const canAddParent = parentCount < 2;
  // Siblings require at least one parent on record (so the sibling can be linked through the parent)
  const canAddSibling = parentCount >= 1;

  /**
   * parents — Memoized list of this member's parent FamilyMember objects.
   * Used as anchor options in the "Add Relative" wizard for grandparents and aunts/uncles.
   */
  const parents = useMemo(() => (member ? getParentsOf(member.id) : []), [member, getParentsOf]);

  /**
   * auntsUncles — Memoized list of this member's aunts and uncles.
   * These are found by getting the siblings of each parent. A Map is used
   * to deduplicate (if both parents share a sibling, they should only appear once).
   * Used as anchor options when adding a cousin in the "Add Relative" wizard.
   */
  const auntsUncles = useMemo(() => {
    if (!member) return [];
    // Use a Map to ensure each aunt/uncle appears only once (keyed by their ID)
    const unique = new Map<string, FamilyMember>();
    // For each of this member's parents...
    parents.forEach((parent) => {
      // ...find all siblings of that parent
      getSiblings(parent.id, members).forEach((sibling) => {
        // Exclude the parent themselves from the sibling list
        if (sibling.id !== parent.id) {
          unique.set(sibling.id, sibling);
        }
      });
    });
    // Convert the Map values back into a plain array
    return Array.from(unique.values());
  }, [member, parents, members]);

  /**
   * Auto-open the manage modal when the `manage` query parameter is present.
   * This allows other screens (like the tree view) to navigate here with
   * `?manage=true` to immediately show the manage family options.
   */
  useEffect(() => {
    if (manage && member) {
      setIsManageOpen(true);
    }
  }, [manage, member]);

  /**
   * openAddModal — Resets and opens the "Add Member" form modal.
   * Pre-fills the last name with the current member's last name (common for
   * family members) and defaults to biological relationship type.
   *
   * @param mode - Which type of member to add: 'spouse', 'child', 'sibling', or 'parent'
   */
  const openAddModal = (mode: AddMode) => {
    if (!member) return;
    setAddMode(mode); // Set which type of member we're adding
    setForm({
      // Reset the form with sensible defaults
      firstName: '',
      lastName: member.lastName, // Pre-fill last name from current member
      gender: undefined,
      relationshipType: 'biological',
    });
    setBirthDateText(''); // Clear any previously entered birth date
    setFormError(null); // Clear any previous validation error
    setIsAddOpen(true); // Show the modal
  };

  /**
   * closeAddModal — Hides the "Add Member" form modal and clears any error.
   */
  const closeAddModal = () => {
    setIsAddOpen(false);
    setFormError(null);
  };

  /**
   * openRelativeModal — Resets all wizard state and opens the 3-step
   * "Add Relative" wizard modal. Starts at step 1 ("relation").
   */
  const openRelativeModal = () => {
    if (!member) return;
    setRelativeType(null); // Clear any previously selected relation type
    setRelativeStep('relation'); // Start at step 1
    setSelectedParentId(null); // Clear parent anchor selection
    setSelectedAuntUncleId(null); // Clear aunt/uncle anchor selection
    setRelativeForm({
      // Reset the details form
      firstName: '',
      lastName: member.lastName, // Pre-fill last name from current member
      gender: undefined,
      relationshipType: 'biological',
    });
    setRelativeError(null); // Clear any previous error
    setIsRelativeOpen(true); // Show the wizard modal
  };

  /**
   * closeRelativeModal — Hides the "Add Relative" wizard and clears any error.
   */
  const closeRelativeModal = () => {
    setIsRelativeOpen(false);
    setRelativeError(null);
  };

  /**
   * closeManageModal — Hides the "Manage Family" action menu modal.
   */
  const closeManageModal = () => {
    setIsManageOpen(false);
  };

  /**
   * handleRemoveMember — Permanently deletes this family member from the store.
   * Called when the user confirms removal in the confirmation dialog.
   * On success, closes the dialog and navigates back to the previous screen.
   * On failure, just stops the loading indicator (the error is silently caught).
   */
  const handleRemoveMember = async () => {
    if (!member) return;
    setIsRemoving(true); // Show loading indicator on the "Remove" button
    try {
      await removeMember(member.id); // Delete the member from the Zustand store
      setIsConfirmRemoveOpen(false); // Close the confirmation dialog
      router.back(); // Navigate back to the tree screen
    } catch (error) {
      setIsRemoving(false); // Stop loading on error
    }
  };

  /**
   * openEditModal — Pre-fills the edit form with the member's current data
   * and opens the "Edit Member" modal. Date fields are formatted as
   * MM/DD/YYYY strings for the text inputs.
   */
  const openEditModal = () => {
    if (!member) return;
    // Pre-fill every field with the member's current values
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      nickname: member.nickname,
      photoURL: member.photoURL,
      birthDate: member.birthDate,
      deathDate: member.deathDate,
      bio: member.bio,
      gender: member.gender,
    });
    // Convert Date objects to display strings for the text input fields
    setEditBirthDateText(formatDateForInput(member.birthDate));
    setEditDeathDateText(formatDateForInput(member.deathDate));
    setEditError(null); // Clear any previous error
    setIsEditOpen(true); // Show the modal
  };

  /**
   * closeEditModal — Hides the "Edit Member" modal and clears any error.
   */
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditError(null);
  };

  /**
   * handleEditSave — Validates the edit form and saves changes to the store.
   *
   * Validation steps:
   *   1. Parse birth date text (if provided) and show error if format is invalid
   *   2. Parse death date text (if provided) and show error if format is invalid
   *   3. Trim whitespace from all string fields
   *   4. Require first and last name to be non-empty
   *
   * On success, closes the edit modal. On failure, displays an error message.
   */
  const handleEditSave = async () => {
    if (!member) return;

    // Validate and parse the birth date text field
    if (editBirthDateText.trim()) {
      const parsed = parseDateText(editBirthDateText);
      if (!parsed) {
        setEditError('Invalid birth date. Use MM/DD/YYYY format.');
        return; // Stop here — don't save with invalid data
      }
      editForm.birthDate = parsed; // Store the parsed Date object
    } else {
      editForm.birthDate = undefined; // Clear birth date if the field was emptied
    }

    // Validate and parse the death date text field
    if (editDeathDateText.trim()) {
      const parsed = parseDateText(editDeathDateText);
      if (!parsed) {
        setEditError('Invalid death date. Use MM/DD/YYYY format.');
        return; // Stop here — don't save with invalid data
      }
      editForm.deathDate = parsed; // Store the parsed Date object
    } else {
      editForm.deathDate = undefined; // Clear death date if the field was emptied
    }

    // Trim whitespace from all text fields; convert empty optional fields to undefined
    const trimmedForm = {
      ...editForm,
      firstName: editForm.firstName?.trim(),
      lastName: editForm.lastName?.trim(),
      nickname: editForm.nickname?.trim() || undefined, // Empty string becomes undefined
      bio: editForm.bio?.trim() || undefined, // Empty string becomes undefined
    };
    // First and last name are required fields
    if (!trimmedForm.firstName || !trimmedForm.lastName) {
      setEditError('First and last name are required.');
      return;
    }

    setIsEditSaving(true); // Show loading state on the Save button
    setEditError(null); // Clear any previous error
    try {
      await updateMember(member.id, trimmedForm); // Persist changes to the Zustand store
      setIsEditOpen(false); // Close the modal on success
    } catch (error) {
      // Display the error message to the user
      setEditError(error instanceof Error ? error.message : 'Failed to update member.');
    } finally {
      setIsEditSaving(false); // Always stop the loading indicator
    }
  };

  const handleRelativeBack = () => {
    setRelativeError(null);
    if (relativeStep === 'relation') {
      closeRelativeModal();
    } else if (relativeStep === 'anchor') {
      setRelativeStep('relation');
    } else {
      setRelativeStep('anchor');
    }
  };

  const handleRelativeNext = () => {
    setRelativeError(null);
    if (relativeStep === 'relation') {
      if (!relativeType) {
        setRelativeError('Choose a relationship type to continue.');
        return;
      }
      setRelativeStep('anchor');
      return;
    }

    if (relativeStep === 'anchor') {
      if (relativeType === 'cousin') {
        if (!selectedAuntUncleId) {
          setRelativeError('Select an aunt or uncle to continue.');
          return;
        }
      } else if (!selectedParentId) {
        setRelativeError('Select a parent to continue.');
        return;
      }
      setRelativeStep('details');
    }
  };

  const handleRelativeSave = async () => {
    if (!member || !relativeType) return;
    const trimmedForm = {
      ...relativeForm,
      firstName: relativeForm.firstName.trim(),
      lastName: relativeForm.lastName.trim(),
      nickname: relativeForm.nickname?.trim() || undefined,
      bio: relativeForm.bio?.trim() || undefined,
    };
    if (!trimmedForm.firstName || !trimmedForm.lastName) {
      setRelativeError('First and last name are required.');
      return;
    }

    setIsRelativeSaving(true);
    setRelativeError(null);
    try {
      await addRelative({
        relation: relativeType,
        parentId: relativeType === 'cousin' ? undefined : (selectedParentId ?? undefined),
        auntUncleId: relativeType === 'cousin' ? (selectedAuntUncleId ?? undefined) : undefined,
        input: trimmedForm,
      });
      closeRelativeModal();
      router.back();
    } catch (error) {
      setRelativeError(error instanceof Error ? error.message : 'Failed to add relative.');
    } finally {
      setIsRelativeSaving(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    if (birthDateText.trim()) {
      const parsed = parseDateText(birthDateText);
      if (!parsed) {
        setFormError('Invalid birth date. Use MM/DD/YYYY format.');
        return;
      }
      form.birthDate = parsed;
    }

    const trimmedForm = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      nickname: form.nickname?.trim() || undefined,
      bio: form.bio?.trim() || undefined,
    };
    if (!trimmedForm.firstName || !trimmedForm.lastName) {
      setFormError('First and last name are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (addMode === 'spouse') {
        await addSpouse(member.id, trimmedForm);
      } else if (addMode === 'child') {
        await addChild(member.id, trimmedForm);
      } else if (addMode === 'sibling') {
        await addSibling(member.id, trimmedForm);
      } else {
        await addParent(member.id, trimmedForm);
      }
      closeAddModal();
      router.back();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to add member.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Member not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close member profile"
          accessibilityHint="Returns to the family tree"
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={member.firstName} size="xl" variant="green" />
          <Text style={styles.name} accessibilityRole="header">
            {member.nickname || `${member.firstName} ${member.lastName}`}
          </Text>
          {member.bio && <Text style={styles.bio}>{member.bio}</Text>}
        </View>

        {relationships.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Relationships
            </Text>
            <View style={styles.card}>
              {relationships.map((rel, index) => (
                <View
                  key={`${rel.memberId}-${rel.type}`}
                  style={[
                    styles.relationshipItem,
                    index < relationships.length - 1 && styles.relationshipBorder,
                  ]}
                >
                  <Text style={styles.relationshipType}>
                    {`${rel.type}${rel.kind ? ` (${rel.kind})` : ''}`.replace(/^./, (c) =>
                      c.toUpperCase(),
                    )}
                  </Text>
                  <Text style={styles.relationshipName}>{rel.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {member.birthDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Details
            </Text>
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Birthday</Text>
                <Text style={styles.detailValue}>
                  {member.birthDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isManageOpen}
        onRequestClose={closeManageModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Manage Family
              </Text>
              <TouchableOpacity
                onPress={closeManageModal}
                accessibilityRole="button"
                accessibilityLabel="Close manage family"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.manageHeader}>
              <Avatar name={member.firstName} size="md" variant="green" />
              <View style={styles.manageInfo}>
                <Text style={styles.manageName}>
                  {member.firstName} {member.lastName}
                </Text>
                <Text style={styles.manageSubtitle}>Choose an action for this member.</Text>
              </View>
            </View>

            <View style={styles.manageActions}>
              <Button
                title="Edit Details"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  openEditModal();
                }}
              />
              <Button
                title="Add Spouse"
                variant="outline"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  openAddModal('spouse');
                }}
                disabled={hasSpouse}
              />
              <Button
                title="Add Parent"
                variant="outline"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  openAddModal('parent');
                }}
                disabled={!canAddParent}
              />
              <Button
                title="Add Child"
                variant="outline"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  openAddModal('child');
                }}
              />
              <Button
                title="Add Sibling"
                variant="outline"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  openAddModal('sibling');
                }}
                disabled={!canAddSibling}
              />
              <Button
                title="Add Relative"
                variant="outline"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  openRelativeModal();
                }}
              />
              <Button
                title="Remove Member"
                variant="ghost"
                size="sm"
                onPress={() => {
                  closeManageModal();
                  setIsConfirmRemoveOpen(true);
                }}
                style={styles.removeButton}
                textStyle={styles.removeButtonText}
              />
            </View>

            {!hasSpouse && (
              <Text style={styles.manageHint}>
                If no spouse is listed, children will be added under a single parent.
              </Text>
            )}
            {!canAddParent && (
              <Text style={styles.manageHint}>This member already has two parents listed.</Text>
            )}
            {!canAddSibling && (
              <Text style={styles.manageHint}>Siblings require at least one parent on record.</Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent visible={isAddOpen} onRequestClose={closeAddModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, styles.modalTitleSpacing]} accessibilityRole="header">
              {addMode === 'spouse'
                ? 'Add Spouse'
                : addMode === 'child'
                  ? 'Add Child'
                  : addMode === 'sibling'
                    ? 'Add Sibling'
                    : 'Add Parent'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={colors.text.tertiary}
              value={form.firstName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, firstName: value }))}
              autoCapitalize="words"
              maxLength={50}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.text.tertiary}
              value={form.lastName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, lastName: value }))}
              autoCapitalize="words"
              maxLength={50}
            />

            <View style={styles.genderRow}>
              {(['female', 'male'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.genderChip, form.gender === option && styles.genderChipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, gender: option }))}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option === 'female' ? 'female' : 'male'} gender`}
                  accessibilityState={{ selected: form.gender === option }}
                >
                  <Text
                    style={[styles.genderLabel, form.gender === option && styles.genderLabelActive]}
                  >
                    {option === 'female' ? 'Female' : 'Male'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Birth date (MM/DD/YYYY)"
              placeholderTextColor={colors.text.tertiary}
              value={birthDateText}
              onChangeText={setBirthDateText}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {addMode !== 'spouse' && (
              <View style={styles.relationshipRow}>
                {RELATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.relationshipChip,
                      form.relationshipType === option.id && styles.relationshipChipActive,
                    ]}
                    onPress={() => setForm((prev) => ({ ...prev, relationshipType: option.id }))}
                    accessibilityRole="button"
                    accessibilityLabel={`Set relationship type to ${option.label}`}
                    accessibilityState={{ selected: form.relationshipType === option.id }}
                  >
                    <Text
                      style={[
                        styles.relationshipLabel,
                        form.relationshipType === option.id && styles.relationshipLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {formError && <Text style={styles.formError}>{formError}</Text>}

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" size="sm" onPress={closeAddModal} />
              <Button
                title={isSaving ? 'Saving...' : 'Save'}
                size="sm"
                onPress={handleSave}
                loading={isSaving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isRelativeOpen}
        onRequestClose={closeRelativeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Add Relative
              </Text>
              <Text style={styles.stepLabel}>
                Step {relativeStep === 'relation' ? 1 : relativeStep === 'anchor' ? 2 : 3} of 3
              </Text>
            </View>

            {relativeStep === 'relation' && (
              <View>
                <Text style={styles.helperText}>Who are you adding for {member.firstName}?</Text>
                <View style={styles.relativeOptions}>
                  {RELATIVE_OPTIONS.map((option) => {
                    const isSelected = relativeType === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.relativeOption, isSelected && styles.relativeOptionSelected]}
                        onPress={() => {
                          setRelativeType(option.id);
                          setRelativeError(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={option.label}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.relativeOptionLabel,
                            isSelected && styles.relativeOptionLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text style={styles.relativeOptionDescription}>{option.description}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {relativeStep === 'anchor' && (
              <View>
                <Text style={styles.helperText}>
                  {relativeType === 'cousin'
                    ? 'Choose an aunt or uncle to connect this cousin.'
                    : 'Choose which parent this relative connects to.'}
                </Text>

                {relativeType === 'cousin' ? (
                  <>
                    {auntsUncles.length === 0 ? (
                      <Text style={styles.emptyStateText}>
                        Add an aunt or uncle first before adding a cousin.
                      </Text>
                    ) : (
                      <View style={styles.anchorList}>
                        {auntsUncles.map((relative) => {
                          const isSelected = selectedAuntUncleId === relative.id;
                          return (
                            <TouchableOpacity
                              key={relative.id}
                              style={[styles.anchorRow, isSelected && styles.anchorRowSelected]}
                              onPress={() => {
                                setSelectedAuntUncleId(relative.id);
                                setRelativeError(null);
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={`Select ${relative.firstName} ${relative.lastName}`}
                              accessibilityState={{ selected: isSelected }}
                            >
                              <Avatar name={relative.firstName} size="sm" variant="green" />
                              <View style={styles.anchorInfo}>
                                <Text style={styles.anchorName}>
                                  {relative.firstName} {relative.lastName}
                                </Text>
                                <Text style={styles.anchorMeta}>Aunt/Uncle</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {parents.length === 0 ? (
                      <Text style={styles.emptyStateText}>
                        Add a parent first to connect grandparents or aunts/uncles.
                      </Text>
                    ) : (
                      <View style={styles.anchorList}>
                        {parents.map((parent) => {
                          const isSelected = selectedParentId === parent.id;
                          return (
                            <TouchableOpacity
                              key={parent.id}
                              style={[styles.anchorRow, isSelected && styles.anchorRowSelected]}
                              onPress={() => {
                                setSelectedParentId(parent.id);
                                setRelativeError(null);
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={`Select ${parent.firstName} ${parent.lastName}`}
                              accessibilityState={{ selected: isSelected }}
                            >
                              <Avatar name={parent.firstName} size="sm" variant="green" />
                              <View style={styles.anchorInfo}>
                                <Text style={styles.anchorName}>
                                  {parent.firstName} {parent.lastName}
                                </Text>
                                <Text style={styles.anchorMeta}>Parent</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {relativeStep === 'details' && (
              <View>
                <Text style={styles.helperText}>Add their basic details.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={colors.text.tertiary}
                  value={relativeForm.firstName}
                  onChangeText={(value) =>
                    setRelativeForm((prev) => ({ ...prev, firstName: value }))
                  }
                  autoCapitalize="words"
                  maxLength={50}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={colors.text.tertiary}
                  value={relativeForm.lastName}
                  onChangeText={(value) =>
                    setRelativeForm((prev) => ({ ...prev, lastName: value }))
                  }
                  autoCapitalize="words"
                  maxLength={50}
                />

                <View style={styles.genderRow}>
                  {(['female', 'male'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.genderChip,
                        relativeForm.gender === option && styles.genderChipActive,
                      ]}
                      onPress={() => setRelativeForm((prev) => ({ ...prev, gender: option }))}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${option === 'female' ? 'female' : 'male'} gender`}
                      accessibilityState={{ selected: relativeForm.gender === option }}
                    >
                      <Text
                        style={[
                          styles.genderLabel,
                          relativeForm.gender === option && styles.genderLabelActive,
                        ]}
                      >
                        {option === 'female' ? 'Female' : 'Male'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.relationshipRow}>
                  {RELATION_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.relationshipChip,
                        relativeForm.relationshipType === option.id &&
                          styles.relationshipChipActive,
                      ]}
                      onPress={() =>
                        setRelativeForm((prev) => ({ ...prev, relationshipType: option.id }))
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Set relationship type to ${option.label}`}
                      accessibilityState={{ selected: relativeForm.relationshipType === option.id }}
                    >
                      <Text
                        style={[
                          styles.relationshipLabel,
                          relativeForm.relationshipType === option.id &&
                            styles.relationshipLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {relativeError && <Text style={styles.formError}>{relativeError}</Text>}

            <View style={styles.modalActions}>
              <Button
                title={relativeStep === 'relation' ? 'Cancel' : 'Back'}
                variant="ghost"
                size="sm"
                onPress={handleRelativeBack}
              />
              <Button
                title={
                  relativeStep === 'details' ? (isRelativeSaving ? 'Saving...' : 'Save') : 'Next'
                }
                size="sm"
                onPress={relativeStep === 'details' ? handleRelativeSave : handleRelativeNext}
                loading={relativeStep === 'details' ? isRelativeSaving : false}
                disabled={
                  relativeStep === 'anchor' &&
                  ((relativeType === 'cousin' && auntsUncles.length === 0) ||
                    (relativeType !== 'cousin' && parents.length === 0))
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent visible={isEditOpen} onRequestClose={closeEditModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, styles.modalTitleSpacing]} accessibilityRole="header">
              Edit Member
            </Text>

            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.firstName}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, firstName: value }))}
              autoCapitalize="words"
              maxLength={50}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.lastName}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, lastName: value }))}
              autoCapitalize="words"
              maxLength={50}
            />
            <TextInput
              style={styles.input}
              placeholder="Nickname (optional)"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.nickname}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, nickname: value }))}
              autoCapitalize="words"
              maxLength={50}
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio (optional)"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.bio}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, bio: value }))}
              multiline
              maxLength={500}
            />

            <TextInput
              style={styles.input}
              placeholder="Birth date (MM/DD/YYYY)"
              placeholderTextColor={colors.text.tertiary}
              value={editBirthDateText}
              onChangeText={setEditBirthDateText}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <TextInput
              style={styles.input}
              placeholder="Death date (MM/DD/YYYY)"
              placeholderTextColor={colors.text.tertiary}
              value={editDeathDateText}
              onChangeText={setEditDeathDateText}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            <View style={styles.genderRow}>
              {(['female', 'male'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.genderChip, editForm.gender === option && styles.genderChipActive]}
                  onPress={() => setEditForm((prev) => ({ ...prev, gender: option }))}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option === 'female' ? 'female' : 'male'} gender`}
                  accessibilityState={{ selected: editForm.gender === option }}
                >
                  <Text
                    style={[
                      styles.genderLabel,
                      editForm.gender === option && styles.genderLabelActive,
                    ]}
                  >
                    {option === 'female' ? 'Female' : 'Male'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {editError && <Text style={styles.formError}>{editError}</Text>}

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" size="sm" onPress={closeEditModal} />
              <Button
                title={isEditSaving ? 'Saving...' : 'Save'}
                size="sm"
                onPress={handleEditSave}
                loading={isEditSaving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isConfirmRemoveOpen}
        onRequestClose={() => setIsConfirmRemoveOpen(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Remove {member.firstName}?</Text>
            <Text style={styles.confirmMessage}>
              This will permanently delete this member and all their connections. This cannot be
              undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setIsConfirmRemoveOpen(false)}
                disabled={isRemoving}
              />
              <Button
                title={isRemoving ? 'Removing...' : 'Remove'}
                size="sm"
                onPress={handleRemoveMember}
                loading={isRemoving}
                style={styles.removeConfirmButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: 16,
    color: colors.primary.main,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  backLink: {
    fontSize: 16,
    color: colors.primary.main,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  bio: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  relationshipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  relationshipBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  relationshipType: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  relationshipName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalTitleSpacing: {
    marginBottom: spacing.md,
  },
  modalCloseText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  manageInfo: {
    marginLeft: spacing.sm,
  },
  manageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  manageSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  manageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  manageHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  stepLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  helperText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  relativeOptions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  relativeOption: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    backgroundColor: colors.background.secondary,
  },
  relativeOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '20',
  },
  relativeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  relativeOptionLabelSelected: {
    color: colors.primary.main,
  },
  relativeOptionDescription: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  anchorList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    backgroundColor: colors.background.secondary,
  },
  anchorRowSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '15',
  },
  anchorInfo: {
    marginLeft: spacing.sm,
  },
  anchorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  anchorMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  emptyStateText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genderChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    backgroundColor: colors.background.secondary,
  },
  genderChipActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main,
  },
  genderLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  genderLabelActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  relationshipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  relationshipChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    backgroundColor: colors.background.secondary,
  },
  relationshipChipActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main,
  },
  relationshipLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  relationshipLabelActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  formError: {
    color: colors.heart,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: colors.heart,
  },
  removeButtonText: {
    color: colors.heart,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCard: {
    backgroundColor: colors.background.primary,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  removeConfirmButton: {
    backgroundColor: colors.heart,
  },
});
