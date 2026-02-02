import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../src/components/common';
import { colors, typography, spacing, borderRadius } from '../../src/constants';
import { mockFamilyMembers } from '../../src/utils/mockData';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const member = mockFamilyMembers.find((m) => m.id === id);

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Member not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const relationships = member.relationships.map((rel) => {
    const relatedMember = mockFamilyMembers.find((m) => m.id === rel.memberId);
    return {
      ...rel,
      name: relatedMember
        ? `${relatedMember.firstName} ${relatedMember.lastName}`
        : 'Unknown',
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={member.firstName} size="xl" variant="green" />
          <Text style={styles.name}>
            {member.nickname || `${member.firstName} ${member.lastName}`}
          </Text>
          {member.bio && <Text style={styles.bio}>{member.bio}</Text>}
        </View>

        {relationships.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relationships</Text>
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
                    {rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}
                  </Text>
                  <Text style={styles.relationshipName}>{rel.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {member.birthDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
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
});
