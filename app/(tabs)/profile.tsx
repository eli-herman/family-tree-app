import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { Avatar, Button } from '../../src/components/common';
import { colors, spacing, borderRadius } from '../../src/constants';
import { mockFamilyMembers } from '../../src/utils/mockData';
import { useAuthStore } from '../../src/stores';

export default function ProfileScreen() {
  const currentMember = mockFamilyMembers[0];
  const { user, logout } = useAuthStore();

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Profile
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={user?.displayName || currentMember.firstName} size="xl" variant="green" />
          <Text style={styles.name}>
            {user?.displayName ||
              currentMember.nickname ||
              `${currentMember.firstName} ${currentMember.lastName}`}
          </Text>
          {currentMember.bio && <Text style={styles.bio}>{currentMember.bio}</Text>}
          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline"
            size="sm"
            style={styles.editButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Family Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>28</Text>
              <Text style={styles.statLabel}>Memories Shared</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingsItem label="Subscription" onPress={() => router.push('/paywall' as Href)} />
            <SettingsItem label="Notifications" />
            <SettingsItem label="Privacy" />
            <SettingsItem label="Help & Support" />
            <SettingsItem label="About" isLast />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Signs you out of the app"
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({
  label,
  isLast = false,
  onPress,
}: {
  label: string;
  isLast?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
    >
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
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
  editButton: {
    marginTop: spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary.main,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  settingsCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  settingsLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  settingsChevron: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  logoutSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: colors.heart,
    fontWeight: '500',
  },
});
