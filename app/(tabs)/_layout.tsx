/**
 * TabLayout - The main tab navigation layout for the authenticated app experience.
 *
 * This file defines the bottom tab bar that users see after logging in. It configures
 * three tabs:
 * 1. Feed (Home icon) - The family updates feed with posts, photos, and daily Bible verse
 * 2. Tree (Tree icon) - The visual family tree with vine-style connections
 * 3. Profile (Person icon) - The user's profile settings and account management
 *
 * Each tab has a custom SVG icon that changes color based on whether the tab is active
 * (forest green) or inactive (gray). The tab bar itself has a warm white background
 * to match the app's natural design aesthetic.
 *
 * This layout is nested inside the root layout's Stack navigator and is only accessible
 * to authenticated users (the AuthGate redirects unauthenticated users to login).
 */

// React is imported for JSX support
import React from 'react';
// Tabs is Expo Router's tab navigator component, similar to React Navigation's createBottomTabNavigator
import { Tabs } from 'expo-router';
// Svg and Path are used to render custom vector icons for each tab
import Svg, { Path } from 'react-native-svg';
// Design system color constants for consistent theming
import { colors } from '../../src/constants';

/**
 * TabLayout - Renders a bottom tab navigator with three screens: Feed, Tree, and Profile.
 * Configures the tab bar's appearance (colors, height, fonts) and assigns custom SVG
 * icons to each tab.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Hide the default header bar on all tab screens (each screen manages its own)
        headerShown: false,
        // Active tab icon and label color: forest green to indicate the selected tab
        tabBarActiveTintColor: colors.primary.main,
        // Inactive tab icon and label color: light gray for unselected tabs
        tabBarInactiveTintColor: colors.text.tertiary,
        // Tab bar container styles
        tabBarStyle: {
          // Warm white background matching the app's design aesthetic
          backgroundColor: colors.background.primary,
          // Subtle top border to visually separate the tab bar from screen content
          borderTopColor: colors.background.tertiary,
          // Top padding pushes icons down slightly from the border
          paddingTop: 8,
          // Total height of the tab bar (includes space for icons, labels, and safe area)
          height: 84,
        },
        // Tab bar label text styles
        tabBarLabelStyle: {
          // Small font size for the tab labels ("Feed", "Tree", "Profile")
          fontSize: 10,
          // Medium weight for readability at small size
          fontWeight: '500',
          // Small gap between the icon and the label text
          marginTop: 4,
        },
      }}
    >
      {/* Feed tab: The home/landing screen showing family updates, posts, and daily Bible verse.
          The "index" name makes this the default tab that opens first. */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          // Render the home/house SVG icon; `color` is automatically provided by the
          // tab navigator based on whether this tab is active or inactive
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      {/* Tree tab: The family tree visualization with nodes and vine connections */}
      <Tabs.Screen
        name="tree"
        options={{
          title: 'Tree',
          // Render the tree/hierarchy SVG icon
          tabBarIcon: ({ color }) => <TreeIcon color={color} />,
        }}
      />
      {/* Profile tab: User's profile, settings, and account management */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Render the person/avatar SVG icon
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

/**
 * HomeIcon - SVG icon for the Feed tab, depicting a house/home shape.
 *
 * The SVG path draws a house outline with a roof, walls, door, and windows.
 * The stroke color changes based on whether the tab is active or inactive.
 *
 * @param color - The color to use for the icon stroke, provided by the tab navigator
 */
function HomeIcon({ color }: { color: string }) {
  return (
    // Svg container: 24x24 pixel icon with no fill (outline only)
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      {/* SVG path data that draws a house outline: roof, walls, and a central door */}
      <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </Svg>
  );
}

/**
 * TreeIcon - SVG icon for the Tree tab, depicting a hierarchical/org-chart layout.
 *
 * The SVG path draws one wide rectangle at the top (representing a parent) and two
 * smaller rectangles below (representing children), visually suggesting a family tree.
 *
 * @param color - The color to use for the icon stroke, provided by the tab navigator
 */
function TreeIcon({ color }: { color: string }) {
  return (
    // Svg container: 24x24 pixel icon with no fill (outline only)
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      {/* SVG path data: one wide box at top (parent node), two smaller boxes at bottom
          (child nodes), resembling a simple organizational/tree chart */}
      <Path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </Svg>
  );
}

/**
 * ProfileIcon - SVG icon for the Profile tab, depicting a person/avatar silhouette.
 *
 * The SVG path draws a circle (head) and a curved arc (shoulders/body), which is a
 * standard representation of a user profile icon.
 *
 * @param color - The color to use for the icon stroke, provided by the tab navigator
 */
function ProfileIcon({ color }: { color: string }) {
  return (
    // Svg container: 24x24 pixel icon with no fill (outline only)
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      {/* SVG path data: a circle at the top (head) and a curved arc below (shoulders),
          forming a classic person/avatar silhouette */}
      <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </Svg>
  );
}
