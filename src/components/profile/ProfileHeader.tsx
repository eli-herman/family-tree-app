/**
 * ProfileHeader.tsx - Profile Header Component with Avatar, Name, Bio, and Edit Button
 *
 * This file defines a React Native component that displays a family member's profile
 * header in The Vine family app. It appears at the top of the profile screen and the
 * member detail modal.
 *
 * The header displays (from top to bottom):
 *   1. A large circular avatar showing the member's initial (or photo in the future)
 *   2. The member's display name (nickname if they have one, otherwise full name)
 *   3. Their full name shown below the nickname (only if they have a nickname)
 *   4. A short biography/description text
 *   5. An "Edit Profile" button (only shown if the viewer is looking at their own profile)
 *
 * The component adapts its display based on the data available:
 *   - If the member has a nickname (like "Grandma"), that's shown as the primary name,
 *     with the full name ("Peggy Deleenheer") shown smaller below it.
 *   - If no nickname exists, just the full name is shown.
 *   - The bio and edit button are conditionally rendered (only shown when applicable).
 */

// React is required for JSX syntax. The JSX transpiler converts <View> into
// React.createElement(View, ...), so React must be in scope.
import React from 'react';

// View = a container/layout element (like <div> in web development)
// Text = a component for rendering text strings (like <p> or <span> in web)
// StyleSheet = a utility that creates optimized, validated style objects
import { View, Text, StyleSheet } from 'react-native';

// Import reusable UI components from the common components directory:
// - Avatar: A circular component that displays a user's initial letter or photo.
//   Accepts props like name (to derive the initial), size ('sm', 'md', 'lg', 'xl'),
//   and variant (color theme like 'green' or 'brown').
// - Button: A styled button component that supports different variants ('solid', 'outline')
//   and sizes ('sm', 'md', 'lg'). Wraps React Native's TouchableOpacity.
import { Avatar, Button } from '../common';

// Import design system constants:
// - colors: The app's color palette (greens, creams, browns, etc.)
// - spacing: Predefined spacing values (xs, sm, md, lg, xl) for consistent margins/padding
import { colors, spacing } from '../../constants';

// Import the FamilyMember TypeScript interface that defines the shape of a family member object.
// This includes fields like firstName, lastName, nickname, bio, photoURL, relationships, etc.
import { FamilyMember } from '../../types';

/**
 * ProfileHeaderProps - TypeScript interface defining the props (inputs) for the ProfileHeader component.
 *
 * @property {FamilyMember} member - The family member whose profile is being displayed.
 *   Contains all the data needed to render the header: name, nickname, bio, etc.
 *
 * @property {function} [onEdit] - Optional callback function triggered when the "Edit Profile"
 *   button is pressed. If not provided (or if isCurrentUser is false), the edit button won't show.
 *   The '?' makes this prop optional.
 *
 * @property {boolean} [isCurrentUser] - Optional flag indicating whether the profile being viewed
 *   belongs to the currently logged-in user. When true (and onEdit is provided), the "Edit Profile"
 *   button is displayed. When false or undefined, the edit button is hidden.
 */
interface ProfileHeaderProps {
  member: FamilyMember; // The family member data to display in the header
  onEdit?: () => void; // Optional callback when "Edit Profile" is pressed
  isCurrentUser?: boolean; // Optional flag: true if this is the current user's own profile
}

/**
 * ProfileHeader - Displays a family member's profile information in a centered layout.
 *
 * This component renders a vertically stacked header with the member's avatar,
 * name(s), bio, and an optional edit button. It handles several conditional
 * rendering scenarios:
 *
 *   - Nickname display: If the member has a nickname, it's shown as the large primary name,
 *     and the full name appears smaller below it. If no nickname, just the full name shows.
 *   - Bio display: The bio text only renders if the member has one (prevents empty space).
 *   - Edit button: Only appears when BOTH isCurrentUser is true AND onEdit is provided.
 *     This prevents showing an edit button on other people's profiles.
 *
 * Usage examples:
 *   // Viewing someone else's profile (no edit button)
 *   <ProfileHeader member={grandmaPeggy} />
 *
 *   // Viewing your own profile (with edit button)
 *   <ProfileHeader member={currentUser} isCurrentUser={true} onEdit={() => openEditor()} />
 *
 * @param {ProfileHeaderProps} props - The component props
 */
export function ProfileHeader({ member, onEdit, isCurrentUser }: ProfileHeaderProps) {
  // Build the full name by combining firstName and lastName with a space.
  // Template literal syntax: `${expression}` embeds values inside a string.
  // For example: "Peggy" + " " + "Deleenheer" = "Peggy Deleenheer"
  const fullName = `${member.firstName} ${member.lastName}`;

  // Determine the primary display name:
  // If the member has a nickname (e.g., "Grandma"), use that as the main name.
  // If no nickname exists (undefined/null/empty string), fall back to the full name.
  // The || (logical OR) operator returns the right side if the left side is falsy.
  const displayName = member.nickname || fullName;

  return (
    // Outer container: A vertically stacked, horizontally centered layout.
    // Everything inside is centered on the screen with padding and a white background.
    <View style={styles.container}>
      {/* Avatar: A large circular component showing the member's initial letter.
          - name={member.firstName}: The Avatar component extracts the first letter
            of this string to display inside the circle (e.g., "P" for "Peggy").
          - size="xl": Extra-large size for the profile header (bigger than in-feed avatars).
          - variant="green": Uses the green color variant from the app's design system.
          - style={styles.avatar}: Adds bottom margin to space it from the name below. */}
      <Avatar name={member.firstName} size="xl" variant="green" style={styles.avatar} />

      {/* Display name: Shows either the nickname (e.g., "Grandma") or full name (e.g., "Peggy Deleenheer").
          This is the largest, most prominent text in the header. */}
      <Text style={styles.name}>{displayName}</Text>

      {/* Full name (conditional): Only renders if the member has a nickname.
          When a nickname is displayed as the primary name, the full legal name is shown
          below it in smaller, muted text so users can see both.
          The && operator is a JSX pattern: if the left side is truthy, render the right side.
          If member.nickname is undefined/null/empty, this entire line renders nothing. */}
      {member.nickname && <Text style={styles.fullName}>{fullName}</Text>}

      {/* Bio (conditional): Only renders if the member has a bio string.
          Shows a short description of the person, centered and in muted text.
          The && operator ensures nothing renders if bio is undefined/null/empty. */}
      {member.bio && <Text style={styles.bio}>{member.bio}</Text>}

      {/* Edit Profile button (conditional): Only renders when BOTH conditions are true:
          1. isCurrentUser is true (this is the logged-in user's own profile)
          2. onEdit is provided (the parent gave us a callback function)
          The && operator chains both checks: if either is false, nothing renders.

          Button props:
          - title="Edit Profile": The text displayed on the button
          - onPress={onEdit}: Calls the parent's callback when tapped
          - variant="outline": Renders as an outlined button (border only, no fill)
            to make it less visually dominant than a primary action button
          - size="sm": Small size since it's a secondary action
          - style={styles.editButton}: Adds top margin to space it from the bio */}
      {isCurrentUser && onEdit && (
        <Button
          title="Edit Profile"
          onPress={onEdit}
          variant="outline"
          size="sm"
          style={styles.editButton}
        />
      )}
    </View>
  );
}

/**
 * styles - StyleSheet for the ProfileHeader component.
 *
 * StyleSheet.create() creates an optimized style object with validation.
 * React Native assigns internal IDs to each style for efficient rendering,
 * making this more performant than using inline style objects.
 *
 * The layout is vertically stacked and horizontally centered, creating a
 * classic profile header appearance (avatar on top, name below, bio below that).
 */
const styles = StyleSheet.create({
  // container: The outer wrapper for the entire profile header section.
  container: {
    alignItems: 'center', // Center all children (avatar, name, bio, button) horizontally
    paddingVertical: spacing.xl, // Extra-large padding on top and bottom for breathing room
    paddingHorizontal: spacing.md, // Medium padding on left and right sides
    backgroundColor: colors.background.primary, // Warm white (#FEFDFB) background, matching the app's primary background
  },
  // avatar: Additional styling for the Avatar component (adds spacing below it).
  avatar: {
    marginBottom: spacing.md, // Medium space below the avatar before the name text starts
  },
  // name: Style for the primary display name (nickname or full name).
  name: {
    fontSize: 24, // Large font size (24 points) since this is the most important text in the header
    fontWeight: '600', // Semibold weight for emphasis (between normal 400 and bold 700)
    color: colors.text.primary, // Primary text color (dark, high contrast) for maximum readability
    textAlign: 'center', // Center the name text horizontally
  },
  // fullName: Style for the secondary full name line (shown below the nickname).
  fullName: {
    fontSize: 16, // Smaller than the primary name (16 vs 24) to create visual hierarchy
    color: colors.text.secondary, // Muted/secondary text color to de-emphasize compared to the nickname
    marginTop: spacing.xs, // Extra-small space above to separate from the nickname
  },
  // bio: Style for the biography/description text.
  bio: {
    fontSize: 14, // Standard readable font size, smaller than both name styles
    color: colors.text.secondary, // Muted text color since the bio is supplementary information
    textAlign: 'center', // Center the bio text horizontally
    marginTop: spacing.sm, // Small space above to separate from the name
    maxWidth: 280, // Limit the bio text width to 280 pixels so long bios don't stretch edge-to-edge
    // This keeps long text readable by creating natural line breaks
  },
  // editButton: Additional styling for the "Edit Profile" button.
  editButton: {
    marginTop: spacing.md, // Medium space above the button to separate it from the bio text
  },
});
