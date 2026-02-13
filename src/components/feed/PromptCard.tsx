/**
 * PromptCard.tsx - Story Prompt Card Component
 *
 * This file defines a React Native component that displays a "story prompt" card
 * in The Vine family app's feed. Story prompts are thoughtful questions designed
 * to encourage family members to share memories and stories with each other.
 *
 * The card shows:
 *   1. A leaf emoji icon at the top (matching the app's natural/vine theme)
 *   2. The prompt question text in italic (e.g., "What was your favorite childhood memory?")
 *   3. A tappable "Share a memory" button that triggers the response flow
 *
 * The card has a distinctive dashed border to visually distinguish it from regular
 * feed posts, signaling that it's an interactive prompt rather than content.
 *
 * When a user taps "Share a memory", the onRespond callback is called with the
 * prompt data, and the parent screen handles opening the response flow (e.g.,
 * a text input where the user can write their memory).
 */

// React is required for JSX syntax. The JSX compiler transforms tags like <View>
// into React.createElement(View, ...) calls, so React must be imported.
import React from 'react';

// View = a container element for layout (equivalent to <div> in web development)
// Text = a component for rendering text (equivalent to <p> or <span> in web)
// StyleSheet = a utility for creating optimized, validated style objects
// TouchableOpacity = a pressable wrapper that dims its children when tapped,
//   providing visual feedback to the user that their tap was registered
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Import design system constants for consistent styling:
// - colors: The app's color palette (greens, creams, browns, etc.)
// - spacing: Predefined spacing values (xs, sm, md, lg, xl) for margins and padding
// - borderRadius: Predefined corner radius values for rounded edges
import { colors, spacing, borderRadius } from '../../constants';

// Import the Prompt TypeScript interface that defines the shape of a prompt object.
// A Prompt has: id (string), text (string), category (PromptCategory), isActive (boolean).
import { Prompt } from '../../types';

/**
 * PromptCardProps - TypeScript interface defining the props (inputs) for the PromptCard component.
 *
 * @property {Prompt} prompt - The story prompt object to display. Contains:
 *   - prompt.text: The question to show the user (e.g., "What's your favorite family tradition?")
 *   - prompt.id: Unique identifier for this prompt
 *   - prompt.category: The topic category (e.g., 'childhood', 'life_lessons')
 *   - prompt.isActive: Whether the prompt is currently active
 *
 * @property {function} onRespond - A callback function that the parent component provides.
 *   Called when the user taps the "Share a memory" button. Receives the full Prompt object
 *   so the parent knows which prompt the user wants to respond to.
 */
interface PromptCardProps {
  prompt: Prompt; // The prompt data to display
  onRespond: (prompt: Prompt) => void; // Callback triggered when the user taps "Share a memory"
}

/**
 * PromptCard - A card component that displays a story prompt and invites the user to respond.
 *
 * This component renders a styled card with a dashed border containing a prompt question
 * and a call-to-action button. It is displayed in the feed alongside regular posts to
 * encourage family members to share their stories.
 *
 * The component uses React's "destructuring" syntax to extract `prompt` and `onRespond`
 * directly from the props object, which is equivalent to writing:
 *   const prompt = props.prompt;
 *   const onRespond = props.onRespond;
 *
 * Usage example in a parent component:
 *   <PromptCard
 *     prompt={{ id: 'prompt1', text: 'What was your favorite memory?', category: 'childhood', isActive: true }}
 *     onRespond={(prompt) => openResponseFlow(prompt)}
 *   />
 *
 * @param {PromptCardProps} props - The component props
 * @param {Prompt} props.prompt - The prompt data object
 * @param {function} props.onRespond - Callback when user taps "Share a memory"
 */
export function PromptCard({ prompt, onRespond }: PromptCardProps) {
  return (
    // Outer container: A card with a dashed border, cream background, and rounded corners.
    // The dashed border visually distinguishes prompt cards from regular feed item cards.
    <View style={styles.container}>
      {/* Leaf emoji: A decorative icon at the top of the card.
          The leaf emoji matches The Vine app's natural/botanical theme.
          It's rendered as a Text component because React Native handles emojis as text. */}
      <Text style={styles.icon}>🌿</Text>
      {/* Prompt text: The story prompt question wrapped in quotation marks.
          The quotes give it a "question" or "quote" visual treatment.
          For example: "What was the best advice your parents gave you?" */}
      <Text style={styles.promptText}>"{prompt.text}"</Text>
      {/* Share a memory button: A tappable area that triggers the response flow.
          TouchableOpacity provides visual feedback by reducing opacity when pressed.
          The accessibility props make this button usable by screen readers:
          - accessibilityRole="button" tells the screen reader this is a button
          - accessibilityLabel provides the text the screen reader announces
          - accessibilityHint explains what happens when the button is tapped */}
      <TouchableOpacity
        onPress={() => onRespond(prompt)} // When tapped, call onRespond with the prompt object
        accessibilityRole="button" // Tells screen readers this element behaves as a button
        accessibilityLabel="Share a memory" // The label announced by the screen reader
        accessibilityHint="Opens the response flow for this prompt" // Additional context for screen reader users
      >
        {/* Button label: "Share a memory" with a right arrow to suggest navigation.
            Styled in the app's primary green color with semibold weight. */}
        <Text style={styles.button}>Share a memory →</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * styles - StyleSheet for the PromptCard component.
 *
 * StyleSheet.create() creates an optimized style object. React Native validates
 * all properties at creation time and assigns internal IDs for better performance
 * compared to passing plain JavaScript objects as styles.
 *
 * The prompt card uses a cream background with a dashed border to visually
 * distinguish it from regular feed posts (which use solid borders or no border).
 */
const styles = StyleSheet.create({
  // container: The outer card wrapper with the distinctive dashed border.
  container: {
    marginHorizontal: spacing.md, // Left and right margin to inset the card from screen edges
    marginVertical: spacing.sm, // Top and bottom margin for spacing between feed items
    backgroundColor: colors.background.secondary, // Cream/off-white background (secondary bg color)
    borderRadius: borderRadius.lg, // Large rounded corners matching other cards in the app
    borderWidth: 1, // A 1-pixel border line around the card
    borderColor: colors.brown.branch, // Branch/tan color (#D4C4B0) for the border, matching the vine connector color
    borderStyle: 'dashed', // Dashed line style instead of solid - signals this is an interactive prompt, not a regular post
    padding: spacing.md, // Inner padding on all sides
    alignItems: 'center', // Center all child elements (emoji, text, button) horizontally
  },
  // icon: Style for the leaf emoji at the top of the card.
  icon: {
    fontSize: 24, // Large emoji size (24 points) to make it visually prominent
    marginBottom: spacing.sm, // Space below the emoji before the prompt text
  },
  // promptText: Style for the story prompt question text.
  promptText: {
    fontSize: 14, // Standard readable font size
    color: colors.text.secondary, // Muted/secondary text color (not as bold as primary text)
    fontStyle: 'italic', // Italic to distinguish the prompt question from regular text
    textAlign: 'center', // Center the text horizontally within the card
    marginBottom: spacing.sm, // Space below the prompt text before the button
  },
  // button: Style for the "Share a memory" call-to-action text.
  button: {
    fontSize: 13, // Slightly smaller than the prompt text (13 vs 14)
    color: colors.primary.main, // Forest green color (#2D6A4F) - the app's primary action color
    fontWeight: '600', // Semibold weight to make the button text stand out as tappable
  },
});
