/**
 * ErrorBoundary.tsx
 *
 * A React class-based error boundary component that catches JavaScript errors
 * anywhere in its child component tree and displays a user-friendly fallback UI
 * instead of crashing the entire app.
 *
 * Must be a class component because React's error boundary lifecycle methods
 * (getDerivedStateFromError, componentDidCatch) are only available in class components.
 *
 * Features:
 *   - Catches render errors in any descendant component
 *   - Displays a styled error card with a "Try again" button
 *   - Shows the error message in development mode (__DEV__) for debugging
 *   - Supports an optional onReset callback for parent-level recovery logic
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// SafeAreaView ensures the fallback UI respects device notches and system bars
import { SafeAreaView } from 'react-native-safe-area-context';
// Import the app's color palette from the design system constants
import { colors } from '../../constants';

/**
 * Props for the ErrorBoundary component.
 */
type ErrorBoundaryProps = {
  children: React.ReactNode; // The child components that this boundary wraps and protects
  onReset?: () => void; // Optional callback invoked when the user taps "Try again"
};

/**
 * Internal state for the ErrorBoundary.
 * Tracks whether an error has occurred and stores the error object.
 */
type ErrorBoundaryState = {
  hasError: boolean; // Flag indicating whether an error was caught
  error: Error | null; // The caught error object (null when no error)
};

/**
 * ErrorBoundary class component - catches rendering errors in its children
 * and displays a fallback UI with recovery options.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Initialize the state with no error
  state: ErrorBoundaryState = {
    hasError: false, // No error on initial mount
    error: null, // No error object stored initially
  };

  /**
   * Static lifecycle method called by React when a descendant component throws an error.
   * Returns the new state that will trigger a re-render with the fallback UI.
   * This runs during the "render" phase so it must not cause side effects.
   *
   * @param error - The Error object thrown by a child component
   * @returns New state with hasError=true and the caught error stored
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }; // Update state so the next render shows the fallback UI
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant.
   * This runs during the "commit" phase so it can perform side effects like logging.
   *
   * @param error - The Error object thrown by a child component
   * @param info - Object containing the componentStack (which component threw)
   */
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the error details to the console for developer debugging
    console.error('ErrorBoundary caught an error', error, info);
  }

  /**
   * Handler for the "Try again" button.
   * Resets the error state so React will attempt to re-render the children,
   * and optionally calls the parent's onReset callback for additional cleanup.
   */
  private handleReset = () => {
    this.setState({ hasError: false, error: null }); // Clear the error state
    this.props.onReset?.(); // Call the optional reset callback if provided
  };

  /**
   * Render method - either shows the fallback error UI or the normal children.
   */
  render() {
    // If an error was caught, render the fallback error UI
    if (this.state.hasError) {
      return (
        // SafeAreaView prevents content from being hidden behind device notches
        <SafeAreaView style={styles.container}>
          {/* Card container for the error message */}
          <View style={styles.card}>
            {/* Error title heading */}
            <Text style={styles.title}>Something went wrong</Text>
            {/* Helpful subtitle with recovery instructions */}
            <Text style={styles.subtitle}>
              Please try again. If the problem persists, restart the app.
            </Text>
            {/* In development mode only, show the actual error message for debugging */}
            {__DEV__ && this.state.error ? (
              <Text style={styles.debugText}>{this.state.error.message}</Text>
            ) : null}
            {/* "Try again" button that resets the error state and attempts re-render */}
            <TouchableOpacity
              accessibilityRole="button" // Tell screen readers this is a button
              accessibilityLabel="Try again" // Screen reader label
              style={styles.button}
              onPress={this.handleReset} // Reset error state on press
            >
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // If no error, render the children normally
    return this.props.children;
  }
}

/**
 * StyleSheet for the ErrorBoundary fallback UI.
 * Designed to be a centered, clean error card that matches the app's design system.
 */
const styles = StyleSheet.create({
  // Full-screen container that centers the error card
  container: {
    flex: 1, // Take up all available vertical space
    backgroundColor: colors.background.primary, // Warm white background
    justifyContent: 'center', // Center the card vertically
    alignItems: 'center', // Center the card horizontally
    padding: 24, // Padding from screen edges
  },
  // Error card with shadow and rounded corners
  card: {
    width: '100%', // Full width (constrained by maxWidth)
    maxWidth: 420, // Cap the width on larger screens/tablets
    backgroundColor: colors.background.secondary, // Cream card background
    borderRadius: 20, // Large rounded corners
    padding: 24, // Inner padding for content
    alignItems: 'center', // Center all text and button horizontally
    shadowColor: colors.text.primary, // Dark shadow color
    shadowOpacity: 0.12, // Subtle shadow opacity
    shadowRadius: 16, // Soft shadow spread
    shadowOffset: { width: 0, height: 6 }, // Shadow drops below the card
  },
  // Error title text - bold and prominent
  title: {
    fontSize: 20, // Large readable font size
    fontWeight: '700', // Bold weight for emphasis
    color: colors.text.primary, // Dark text color
    marginBottom: 8, // Space between title and subtitle
  },
  // Subtitle with recovery instructions
  subtitle: {
    fontSize: 14, // Smaller supporting text
    color: colors.text.secondary, // Muted gray text color
    textAlign: 'center', // Center-align for readability
    marginBottom: 16, // Space before the debug text or button
  },
  // Debug text showing the actual error message (only visible in __DEV__ mode)
  debugText: {
    fontSize: 12, // Small font for technical details
    color: colors.text.tertiary, // Very muted gray color
    textAlign: 'center', // Center-align
    marginBottom: 16, // Space before the button
  },
  // "Try again" button styled with the primary forest green color
  button: {
    backgroundColor: colors.primary.main, // Forest green background
    paddingVertical: 10, // Vertical padding for tap target
    paddingHorizontal: 18, // Horizontal padding for text spacing
    borderRadius: 12, // Rounded corners on the button
  },
  // Button text styled as white for contrast against the green background
  buttonText: {
    color: colors.text.inverse, // White text
    fontWeight: '600', // Semi-bold weight
  },
});
