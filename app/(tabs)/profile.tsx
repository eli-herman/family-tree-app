/**
 * ProfileScreen (profile.tsx) — User Profile, Stats, and Settings
 *
 * This is the profile tab of the app. It shows the current user's avatar,
 * display name, and bio at the top, followed by quick stats (family member
 * count and memories shared), a settings menu, and a logout button.
 *
 * Layout (top to bottom):
 *   1. Header with "Profile" title
 *   2. Profile section: avatar, name, bio, "Edit Profile" button
 *   3. Quick Stats: two cards showing family member count and memories shared
 *   4. Settings: list of tappable menu items (Subscription, Notifications, etc.)
 *   5. Log Out button at the bottom
 *
 * Currently uses mock data for the family member profile and hardcoded stats.
 * The auth store provides the real user object and logout functionality.
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Handles notch/status bar insets
import { router, Href } from 'expo-router'; // Expo Router for navigation between screens
import { Avatar, Button } from '../../src/components/common'; // Shared UI components
import { colors, spacing, borderRadius } from '../../src/constants'; // Design system tokens
import { mockFamilyMembers } from '../../src/utils/mockData'; // Placeholder family member data
import { useAuthStore } from '../../src/stores'; // Zustand auth store for user state and logout

/**
 * ProfileScreen — displays the user's profile info, quick stats, settings menu,
 * and a logout button. Uses a ScrollView for the content since it can overflow
 * on smaller screens.
 */
export default function ProfileScreen() {
  // Use the first mock family member as a fallback profile until real data is connected
  const currentMember = mockFamilyMembers[0];

  // Destructure the authenticated user object and the logout action from the auth store
  const { user, logout } = useAuthStore();

  /**
   * handleEditProfile — called when the "Edit Profile" button is tapped.
   * Currently a placeholder that logs to the console.
   */
  const handleEditProfile = () => {
    console.log('Edit profile'); // TODO: Navigate to an edit profile screen
  };

  /**
   * handleLogout — called when the "Log Out" text is tapped.
   * Calls the auth store's logout action, which clears the user session
   * and redirects to the login screen.
   */
  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed header with "Profile" title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Profile
        </Text>
      </View>

      {/* Scrollable content area for profile, stats, settings, and logout */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- Profile Section: avatar, name, bio, and edit button --- */}
        <View style={styles.profileSection}>
          {/* Large avatar showing the user's initial letter */}
          <Avatar name={user?.displayName || currentMember.firstName} size="xl" variant="green" />
          {/* Display name: prefer Firebase user displayName, then nickname, then full name */}
          <Text style={styles.name}>
            {user?.displayName ||
              currentMember.nickname ||
              `${currentMember.firstName} ${currentMember.lastName}`}
          </Text>
          {/* Bio text — only rendered if the member has a bio */}
          {currentMember.bio && <Text style={styles.bio}>{currentMember.bio}</Text>}
          {/* Outlined "Edit Profile" button below the bio */}
          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline" // Outlined style (border, no fill)
            size="sm" // Compact size
            style={styles.editButton}
          />
        </View>

        {/* --- Quick Stats Section: two stat cards side by side --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            {/* Family Members count card */}
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Family Members</Text>
            </View>
            {/* Memories Shared count card */}
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>28</Text>
              <Text style={styles.statLabel}>Memories Shared</Text>
            </View>
          </View>
        </View>

        {/* --- Settings Section: list of tappable menu items --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            {/* Subscription navigates to the paywall screen */}
            <SettingsItem label="Subscription" onPress={() => router.push('/paywall' as Href)} />
            {/* These items don't have onPress handlers yet — they render as disabled */}
            <SettingsItem label="Notifications" />
            <SettingsItem label="Privacy" />
            <SettingsItem label="Help & Support" />
            {/* isLast=true removes the bottom border from the last item */}
            <SettingsItem label="About" isLast />
          </View>
        </View>

        {/* --- Logout Section: standalone "Log Out" text button --- */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Signs you out of the app"
          >
            {/* Red-tinted text to indicate a destructive action */}
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * SettingsItem — a single row in the settings menu.
 * Renders a label on the left and a chevron (>) on the right.
 * If no onPress handler is provided, the item is disabled (not tappable).
 *
 * @param label  - The text to display for this setting
 * @param isLast - If true, the bottom separator border is hidden (last item in list)
 * @param onPress - Optional tap handler; when absent, the item is visually and functionally disabled
 */
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
      // Combine base style with the border style unless this is the last item
      style={[styles.settingsItem, !isLast && styles.settingsItemBorder]}
      onPress={onPress}
      disabled={!onPress} // Disable touch if no handler is provided
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }} // Communicate disabled state to screen readers
    >
      {/* Setting label text */}
      <Text style={styles.settingsLabel}>{label}</Text>
      {/* Right-pointing chevron indicating this item is tappable/navigable */}
      <Text style={styles.settingsChevron}>›</Text>
    </TouchableOpacity>
  );
}

/** Stylesheet for the ProfileScreen and SettingsItem components */
const styles = StyleSheet.create({
  // Full-screen container with warm white background
  container: {
    flex: 1, // Fill all available vertical space
    backgroundColor: colors.background.primary, // Warm white (#FEFDFB)
  },
  // Fixed header bar at the top with a bottom separator
  header: {
    paddingHorizontal: spacing.md, // Left/right padding
    paddingVertical: spacing.md, // Top/bottom padding
    borderBottomWidth: 1, // Thin line separating header from content
    borderBottomColor: colors.background.tertiary, // Light gray separator
    alignItems: 'center', // Center the title horizontally
  },
  // "Profile" header title text
  headerTitle: {
    fontSize: 20,
    fontWeight: '600', // Semi-bold
    color: colors.text.primary, // Dark text for readability
  },
  // Profile section containing avatar, name, bio, and edit button — centered layout
  profileSection: {
    alignItems: 'center', // Center all children horizontally
    paddingVertical: spacing.xl, // Large vertical spacing for breathing room
    paddingHorizontal: spacing.md,
  },
  // User's display name — large and prominent
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md, // Space between the avatar and the name
  },
  // User's bio text — smaller, muted, centered, with a max width to prevent long lines
  bio: {
    fontSize: 14,
    color: colors.text.secondary, // Lighter gray for secondary information
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280, // Prevents the bio from stretching too wide on large screens
  },
  // "Edit Profile" button — adds top margin to separate from the bio
  editButton: {
    marginTop: spacing.md,
  },
  // Generic section wrapper used for "Quick Stats" and "Settings" sections
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  // Uppercase section heading (e.g., "QUICK STATS", "SETTINGS")
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary, // Muted color for section labels
    textTransform: 'uppercase', // All caps for visual hierarchy
    letterSpacing: 0.5, // Slight letter spacing for readability in uppercase
    marginBottom: spacing.md, // Space between title and content below
  },
  // Horizontal row containing the two stat cards side by side
  statsRow: {
    flexDirection: 'row', // Lay out children horizontally
    gap: spacing.md, // Gap between the two stat cards
  },
  // Individual stat card — cream background, rounded corners, centered content
  statCard: {
    flex: 1, // Each card takes equal width (50% minus gap)
    alignItems: 'center', // Center the number and label horizontally
    padding: spacing.md,
    backgroundColor: colors.background.secondary, // Cream background (#F9F7F4)
    borderRadius: borderRadius.lg, // Rounded corners
  },
  // Large number displayed in each stat card (e.g., "12", "28")
  statNumber: {
    fontSize: 28,
    fontWeight: '700', // Bold for emphasis
    color: colors.primary.main, // Forest green (#2D6A4F)
  },
  // Label below the stat number (e.g., "Family Members")
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs, // Small gap between number and label
  },
  // Card container for the settings menu items — rounded, cream background
  settingsCard: {
    backgroundColor: colors.background.secondary, // Cream background
    borderRadius: borderRadius.lg,
    overflow: 'hidden', // Clips children to the rounded corners
  },
  // Individual settings row — label on left, chevron on right
  settingsItem: {
    flexDirection: 'row', // Horizontal layout
    justifyContent: 'space-between', // Label left, chevron right
    alignItems: 'center', // Vertically center both elements
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  // Bottom border for settings items (applied to all except the last item)
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary, // Light gray separator
  },
  // Settings item label text
  settingsLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  // Right-pointing chevron character on each settings item
  settingsChevron: {
    fontSize: 20,
    color: colors.text.tertiary, // Muted to not compete with the label
  },
  // Container for the logout button — centered with generous padding
  logoutSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl, // Extra vertical padding to separate from settings
    alignItems: 'center', // Center the logout text horizontally
  },
  // "Log Out" text styled in the heart/red color to indicate a destructive action
  logoutText: {
    fontSize: 16,
    color: colors.heart, // Coral/red color (#E07A5F) — signals caution
    fontWeight: '500',
  },
});
