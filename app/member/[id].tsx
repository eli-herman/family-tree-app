import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button } from '../../src/components/common';
import { colors, spacing, borderRadius } from '../../src/constants';
import { useFamilyStore } from '../../src/stores';
import {
  NewMemberInput,
  ParentRelationshipType,
  ExtendedRelativeType,
  FamilyMember,
} from '../../src/types';
import { getSiblings } from '../../src/utils/relationships';

type AddMode = 'spouse' | 'child' | 'sibling' | 'parent';
type RelativeStep = 'relation' | 'anchor' | 'details';
const RELATION_OPTIONS: { id: ParentRelationshipType; label: string }[] = [
  { id: 'biological', label: 'Biological' },
  { id: 'adopted', label: 'Adopted' },
  { id: 'step', label: 'Step' },
  { id: 'guardian', label: 'Guardian' },
];
const RELATIVE_OPTIONS: { id: ExtendedRelativeType; label: string; description: string }[] = [
  { id: 'grandparent', label: 'Grandparent', description: 'Parent of a parent' },
  { id: 'aunt-uncle', label: 'Aunt / Uncle', description: 'Sibling of a parent' },
  { id: 'cousin', label: 'Cousin', description: 'Child of an aunt or uncle' },
];

export default function MemberDetailScreen() {
  const { id, manage } = useLocalSearchParams<{ id: string; manage?: string }>();
  const router = useRouter();
  const memberId = Array.isArray(id) ? id[0] : id;

  const getMemberById = useFamilyStore((state) => state.getMemberById);
  const members = useFamilyStore((state) => state.members);
  const addSpouse = useFamilyStore((state) => state.addSpouse);
  const addChild = useFamilyStore((state) => state.addChild);
  const addSibling = useFamilyStore((state) => state.addSibling);
  const addParent = useFamilyStore((state) => state.addParent);
  const addRelative = useFamilyStore((state) => state.addRelative);
  const updateMember = useFamilyStore((state) => state.updateMember);
  const getParentsOf = useFamilyStore((state) => state.getParentsOf);
  const member = memberId ? getMemberById(memberId) : undefined;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('child');
  const [form, setForm] = useState<NewMemberInput>({
    firstName: '',
    lastName: member?.lastName || '',
    gender: undefined,
    relationshipType: 'biological',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRelativeOpen, setIsRelativeOpen] = useState(false);
  const [relativeStep, setRelativeStep] = useState<RelativeStep>('relation');
  const [relativeType, setRelativeType] = useState<ExtendedRelativeType | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedAuntUncleId, setSelectedAuntUncleId] = useState<string | null>(null);
  const [relativeForm, setRelativeForm] = useState<NewMemberInput>({
    firstName: '',
    lastName: member?.lastName || '',
    gender: undefined,
    relationshipType: 'biological',
  });
  const [relativeError, setRelativeError] = useState<string | null>(null);
  const [isRelativeSaving, setIsRelativeSaving] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<NewMemberInput>({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    nickname: member?.nickname,
    photoURL: member?.photoURL,
    birthDate: member?.birthDate,
    deathDate: member?.deathDate,
    bio: member?.bio,
    gender: member?.gender,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const relationships = useMemo(() => {
    if (!member) return [];
    return member.relationships.map((rel) => {
      const relatedMember = members.find((m) => m.id === rel.memberId);
      return {
        ...rel,
        name: relatedMember ? `${relatedMember.firstName} ${relatedMember.lastName}` : 'Unknown',
      };
    });
  }, [member, members]);

  const hasSpouse = member?.relationships.some((rel) => rel.type === 'spouse') ?? false;
  const parentCount = member?.relationships.filter((rel) => rel.type === 'parent').length ?? 0;
  const canAddParent = parentCount < 2;
  const canAddSibling = parentCount >= 1;
  const parents = useMemo(() => (member ? getParentsOf(member.id) : []), [member, getParentsOf]);
  const auntsUncles = useMemo(() => {
    if (!member) return [];
    const unique = new Map<string, FamilyMember>();
    parents.forEach((parent) => {
      getSiblings(parent.id, members).forEach((sibling) => {
        if (sibling.id !== parent.id) {
          unique.set(sibling.id, sibling);
        }
      });
    });
    return Array.from(unique.values());
  }, [member, parents, members]);

  useEffect(() => {
    if (manage && member) {
      setIsManageOpen(true);
    }
  }, [manage, member]);

  const openAddModal = (mode: AddMode) => {
    if (!member) return;
    setAddMode(mode);
    setForm({
      firstName: '',
      lastName: member.lastName,
      gender: undefined,
      relationshipType: 'biological',
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const closeAddModal = () => {
    setIsAddOpen(false);
    setFormError(null);
  };

  const openRelativeModal = () => {
    if (!member) return;
    setRelativeType(null);
    setRelativeStep('relation');
    setSelectedParentId(null);
    setSelectedAuntUncleId(null);
    setRelativeForm({
      firstName: '',
      lastName: member.lastName,
      gender: undefined,
      relationshipType: 'biological',
    });
    setRelativeError(null);
    setIsRelativeOpen(true);
  };

  const closeRelativeModal = () => {
    setIsRelativeOpen(false);
    setRelativeError(null);
  };

  const closeManageModal = () => {
    setIsManageOpen(false);
  };

  const openEditModal = () => {
    if (!member) return;
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
    setEditError(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!member) return;
    if (!editForm.firstName?.trim() || !editForm.lastName?.trim()) {
      setEditError('First and last name are required.');
      return;
    }

    setIsEditSaving(true);
    setEditError(null);
    try {
      await updateMember(member.id, editForm);
      setIsEditOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update member.');
    } finally {
      setIsEditSaving(false);
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
    if (!relativeForm.firstName.trim() || !relativeForm.lastName.trim()) {
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
        input: relativeForm,
      });
      closeRelativeModal();
    } catch (error) {
      setRelativeError(error instanceof Error ? error.message : 'Failed to add relative.');
    } finally {
      setIsRelativeSaving(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('First and last name are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (addMode === 'spouse') {
        await addSpouse(member.id, form);
      } else if (addMode === 'child') {
        await addChild(member.id, form);
      } else if (addMode === 'sibling') {
        await addSibling(member.id, form);
      } else {
        await addParent(member.id, form);
      }
      closeAddModal();
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
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.text.tertiary}
              value={form.lastName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, lastName: value }))}
              autoCapitalize="words"
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
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.lastName}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, lastName: value }))}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Nickname (optional)"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.nickname}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, nickname: value }))}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio (optional)"
              placeholderTextColor={colors.text.tertiary}
              value={editForm.bio}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, bio: value }))}
              multiline
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
});
