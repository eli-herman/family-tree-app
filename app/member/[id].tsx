import React, { useMemo, useState } from 'react';
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
import { useFamilyStore, useUserStore } from '../../src/stores';
import { NewMemberInput, ParentRelationshipType } from '../../src/types';

type AddMode = 'spouse' | 'child' | 'sibling' | 'parent';
const RELATION_OPTIONS: { id: ParentRelationshipType; label: string }[] = [
  { id: 'biological', label: 'Biological' },
  { id: 'adopted', label: 'Adopted' },
  { id: 'step', label: 'Step' },
  { id: 'guardian', label: 'Guardian' },
];

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const memberId = Array.isArray(id) ? id[0] : id;

  const getMemberById = useFamilyStore((state) => state.getMemberById);
  const members = useFamilyStore((state) => state.members);
  const addSpouse = useFamilyStore((state) => state.addSpouse);
  const addChild = useFamilyStore((state) => state.addChild);
  const addSibling = useFamilyStore((state) => state.addSibling);
  const addParent = useFamilyStore((state) => state.addParent);
  const getParentsOf = useFamilyStore((state) => state.getParentsOf);
  const setCurrentMemberId = useUserStore((state) => state.setCurrentMemberId);

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

  const handleSave = async () => {
    if (!member) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('First and last name are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      let anchorId = member.id;
      if (addMode === 'spouse') {
        await addSpouse(member.id, form);
      } else if (addMode === 'child') {
        await addChild(member.id, form);
      } else if (addMode === 'sibling') {
        await addSibling(member.id, form);
        const parents = getParentsOf(member.id);
        if (parents.length > 0) {
          anchorId = parents[0].id;
        }
      } else {
        await addParent(member.id, form);
      }
      setCurrentMemberId(anchorId);
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Add Family
          </Text>
          <View style={styles.addRow}>
            <Button
              title="Add Spouse"
              variant="outline"
              size="sm"
              onPress={() => openAddModal('spouse')}
              disabled={hasSpouse}
              accessibilityHint="Adds a spouse connected to this member"
            />
            <Button
              title="Add Parent"
              variant="outline"
              size="sm"
              onPress={() => openAddModal('parent')}
              disabled={!canAddParent}
              accessibilityHint="Adds a parent connected to this member"
            />
            <Button
              title="Add Child"
              variant="outline"
              size="sm"
              onPress={() => openAddModal('child')}
              disabled={false}
              accessibilityHint="Adds a child connected to this member"
            />
            <Button
              title="Add Sibling"
              variant="outline"
              size="sm"
              onPress={() => openAddModal('sibling')}
              disabled={!canAddSibling}
              accessibilityHint="Adds a sibling connected to this member"
            />
          </View>
          {!hasSpouse && (
            <Text style={styles.addHint}>
              If no spouse is listed, children will be added under a single parent.
            </Text>
          )}
          {!canAddParent && (
            <Text style={styles.addHint}>This member already has two parents listed.</Text>
          )}
          {!canAddSibling && (
            <Text style={styles.addHint}>Siblings require at least one parent on record.</Text>
          )}
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

      <Modal animationType="slide" transparent visible={isAddOpen} onRequestClose={closeAddModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle} accessibilityRole="header">
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
  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  addHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.text.tertiary,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
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
