/**
 * DailyVerse.tsx - Daily Bible Verse Card Component
 *
 * This file defines a React Native component that displays the daily Bible verse
 * in The Vine family app. It appears at the top of the Family Updates Feed screen.
 *
 * The card has a dark green background (Deep Forest color) and shows:
 *   1. A small circular icon containing a cross (drawn with SVG)
 *   2. The verse text in italic white text, wrapped in quotation marks
 *   3. The Bible reference below the text (e.g., "-- John 15:5")
 *
 * The component receives a BibleVerse object as a prop (passed from the parent
 * feed screen, which gets it from getDailyVerse() in dailyVerses.ts).
 *
 * This file also contains a small helper component called CrossIcon that draws
 * a simple cross shape using SVG paths. This avoids needing an external icon
 * library just for this one icon.
 */

// React is needed for JSX syntax (the HTML-like code in the return statements).
// Even though we don't call React directly, the JSX compiler transforms
// <View> into React.createElement(View, ...), which requires React to be in scope.
import React from 'react';

// View = a container element (like a <div> in web development)
// Text = a component for displaying text (like a <p> or <span> in web)
// StyleSheet = a utility for creating optimized style objects (like CSS)
import { View, Text, StyleSheet } from 'react-native';

// Svg = the root SVG container component (like an <svg> tag in web)
// Path = a component for drawing shapes using SVG path commands (like a <path> tag in web)
// These come from the react-native-svg library, since React Native doesn't have
// built-in SVG support like web browsers do.
import Svg, { Path } from 'react-native-svg';

// Import design system constants from the shared constants file:
// - colors: The app's color palette (greens, creams, browns, etc.)
// - spacing: Predefined spacing values (xs, sm, md, lg, xl) for consistent margins/padding
// - borderRadius: Predefined border radius values for rounded corners
import { colors, spacing, borderRadius } from '../../constants';

// Import the BibleVerse TypeScript interface that defines the shape of a verse object.
// This ensures the component receives correctly structured data.
import { BibleVerse } from '../../types/verse';

/**
 * DailyVerseProps - TypeScript interface defining the props (inputs) for the DailyVerse component.
 *
 * Props are like function parameters for React components. The parent component passes
 * data to this component through props.
 *
 * @property {BibleVerse} verse - The Bible verse object to display. Contains:
 *   - verse.text: The full verse text
 *   - verse.reference: The Bible book, chapter, and verse reference
 *   - verse.id: Unique identifier
 *   - verse.theme: The thematic category
 */
interface DailyVerseProps {
  verse: BibleVerse; // The verse object to display, passed from the parent screen
}

/**
 * CrossIcon - A small SVG component that draws a simple Christian cross.
 *
 * This is a "helper" component used only inside DailyVerse. It's not exported,
 * so it can't be used by other files. Drawing the cross with SVG paths avoids
 * needing to install or import an icon library.
 *
 * The cross is made of two lines:
 *   - A vertical beam from top to bottom (y: 2 to 22)
 *   - A horizontal beam near the top (y: 8, x: 5 to 19)
 *
 * @param {string} color - The stroke (line) color of the cross. Defaults to white (inverse text color).
 * @param {number} size - The width and height in pixels. Defaults to 16.
 */
function CrossIcon({ color = colors.text.inverse, size = 16 }: { color?: string; size?: number }) {
  return (
    // Svg is the root container for the SVG drawing.
    // width/height set the rendered size on screen.
    // viewBox="0 0 24 24" defines the internal coordinate system: a 24x24 grid.
    //   This means all Path coordinates are in a 0-24 range, and the Svg component
    //   scales them to fit within the width/height specified.
    // fill="none" means shapes won't be filled with color (we only want outlines).
    // stroke={color} sets the line color for all child Path elements.
    // strokeWidth={2} sets the line thickness to 2 units.
    // strokeLinecap="round" makes the ends of lines rounded instead of flat.
    // strokeLinejoin="round" makes the corners where lines meet rounded.
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Vertical beam of the cross - a straight line from (12, 2) to (12, 22).
          The "d" attribute uses SVG path commands:
          M12 2 = "Move to" point (x=12, y=2) without drawing
          v20 = "draw a Vertical line" down 20 units (from y=2 to y=22)
          This creates the tall part of the cross. */}
      <Path d="M12 2v20" />
      {/* Horizontal beam of the cross - a straight line from (5, 8) to (19, 8).
          M5 8 = "Move to" point (x=5, y=8) without drawing
          h14 = "draw a Horizontal line" right 14 units (from x=5 to x=19)
          This creates the crossbar, positioned near the top (at y=8 out of 24). */}
      <Path d="M5 8h14" />
    </Svg>
  );
}

/**
 * DailyVerse - The main component that renders the daily Bible verse card.
 *
 * This component displays a styled card with a dark green background containing:
 *   1. A circular icon with a cross at the top
 *   2. The verse text in italic, centered, white text
 *   3. The Bible reference (e.g., "-- John 15:5") below the verse
 *
 * Usage example in a parent component:
 *   <DailyVerse verse={getDailyVerse()} />
 *
 * @param {DailyVerseProps} props - The component props
 * @param {BibleVerse} props.verse - The Bible verse object to display
 */
export function DailyVerse({ verse }: DailyVerseProps) {
  // The component uses destructuring to extract `verse` from the props object.
  // This is equivalent to: const verse = props.verse;
  return (
    // Outer container: A dark green rounded card that holds all the verse content.
    // styles.container applies the background color, padding, rounded corners, etc.
    <View style={styles.container}>
      {/* Icon container: A small semi-transparent white circle that holds the cross icon.
          This creates the subtle circular background behind the cross. */}
      <View style={styles.iconContainer}>
        {/* Render the cross SVG icon with default white color and 16px size */}
        <CrossIcon />
      </View>
      {/* Verse text: The actual Bible verse wrapped in quotation marks.
          The quotes are added visually here (not stored in the data) to give
          the text a "quoted" appearance. */}
      <Text style={styles.verseText}>"{verse.text}"</Text>
      {/* Reference: Shows the Bible book, chapter, and verse with an em dash prefix.
          For example: "-- John 15:5" */}
      <Text style={styles.reference}>— {verse.reference}</Text>
    </View>
  );
}

/**
 * styles - StyleSheet for the DailyVerse component.
 *
 * StyleSheet.create() is a React Native utility that creates an optimized style object.
 * It validates the styles at creation time and assigns them an internal ID for
 * better performance (compared to passing plain objects inline).
 *
 * These styles use the app's design system constants (colors, spacing, borderRadius)
 * to ensure visual consistency with the rest of the app.
 */
const styles = StyleSheet.create({
  // container: The outer card that wraps the entire verse display.
  container: {
    marginHorizontal: spacing.md, // Left and right margin to inset the card from screen edges
    marginVertical: spacing.sm, // Top and bottom margin to space it from neighboring elements
    backgroundColor: colors.primary.dark, // Deep Forest green (#1B4332) - a dark green background
    borderRadius: borderRadius.lg, // Large rounded corners for a card-like appearance
    padding: spacing.md, // Inner padding on all sides so content doesn't touch the card edges
    alignItems: 'center', // Center all child elements horizontally within the card
  },
  // iconContainer: The semi-transparent white circle behind the cross icon.
  iconContainer: {
    width: 32, // Fixed width of 32 pixels for the circle
    height: 32, // Fixed height of 32 pixels for the circle
    borderRadius: 16, // Half of width/height (32/2 = 16) to make it a perfect circle
    backgroundColor: 'rgba(255,255,255,0.15)', // Semi-transparent white (15% opacity) for a subtle glow effect
    alignItems: 'center', // Center the cross icon horizontally inside the circle
    justifyContent: 'center', // Center the cross icon vertically inside the circle
    marginBottom: spacing.sm, // Space below the icon before the verse text starts
  },
  // verseText: Style for the Bible verse text itself.
  verseText: {
    fontSize: 14, // Font size in points - readable but not too large
    color: colors.text.inverse, // White text color to contrast against the dark green background
    textAlign: 'center', // Center the text horizontally
    lineHeight: 22, // Space between lines of text (taller than fontSize for readability)
    fontStyle: 'italic', // Italic text to give the verse a distinguished, quote-like feel
    opacity: 0.95, // Slightly transparent (95% opaque) for a softer appearance
  },
  // reference: Style for the Bible reference line below the verse (e.g., "-- John 15:5").
  reference: {
    fontSize: 12, // Smaller font size than the verse text to create visual hierarchy
    color: colors.text.inverse, // White text to match the verse text
    marginTop: spacing.sm, // Space above the reference to separate it from the verse text
    opacity: 0.7, // More transparent (70% opaque) to de-emphasize compared to the verse text
    fontWeight: '500', // Medium font weight (between normal 400 and bold 700)
  },
});
