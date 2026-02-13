/**
 * SignupScreen - Handles new user account creation with form validation.
 *
 * This screen allows new users to create an account by providing:
 * - Display name (how they will appear to family members)
 * - Email address (used for authentication)
 * - Password (minimum 6 characters, as required by Firebase)
 * - Password confirmation (must match the password)
 *
 * The screen performs client-side validation before calling Firebase, catching
 * common mistakes (empty fields, short passwords, mismatched passwords) and
 * showing user-friendly error messages. If Firebase returns an error (e.g.,
 * email already in use), that error is also displayed.
 *
 * On successful signup, the auth store updates the authentication state and
 * the AuthGate in the root layout automatically redirects to the main app.
 */

// React core and useState hook for managing form state
import React, { useState } from 'react';
// React Native UI components for building the signup form
import {
  View, // Basic container component (like a <div> in web)
  Text, // Component for displaying text
  TextInput, // Text field component for user input
  StyleSheet, // Utility for creating optimized style objects
  KeyboardAvoidingView, // Adjusts layout when the keyboard opens
  Platform, // Detects iOS vs Android for platform-specific behavior
  ScrollView, // Scrollable container for the form
  TouchableOpacity, // Makes children respond to touch/press events
} from 'react-native';
// SafeAreaView ensures content doesn't overlap with device notch or status bar
import { SafeAreaView } from 'react-native-safe-area-context';
// router provides programmatic navigation (e.g., going back to the login screen)
import { router } from 'expo-router';
// Custom reusable Button component with loading and disabled states
import { Button } from '../../src/components/common';
// Design system constants for consistent styling
import { colors, typography, spacing, borderRadius } from '../../src/constants';
// Zustand auth store that manages signup state and Firebase auth calls
import { useAuthStore } from '../../src/stores';

/**
 * SignupScreen - Displays a multi-field form for creating a new user account.
 * Includes client-side validation, Firebase error handling, and navigation back to login.
 */
export default function SignupScreen() {
  // State variables for each form field, initialized as empty strings
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Local error state for client-side validation messages (separate from Firebase errors)
  const [localError, setLocalError] = useState<string | null>(null);
  // Pull signup function, loading state, Firebase error, and error clearing from auth store
  const { signup, isLoading, error, clearError } = useAuthStore();

  // Show whichever error exists: local validation error takes priority over Firebase error
  const displayError = localError || error;

  /**
   * handleSignup - Called when the user taps the "Create Account" button.
   * Performs client-side validation in order of importance, then calls the
   * auth store's signup function if all checks pass.
   */
  const handleSignup = async () => {
    // Clear any previous local error before re-validating
    setLocalError(null);
    // Validate that display name is not empty
    if (!displayName.trim()) {
      setLocalError('Please enter your name.');
      return;
    }
    // Validate that email is not empty
    if (!email.trim()) {
      setLocalError('Please enter your email.');
      return;
    }
    // Validate password meets Firebase's minimum length requirement (6 characters)
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    // Validate that the confirmation password matches the original password
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    // All validation passed - call Firebase signup with trimmed email and display name
    await signup(email.trim(), password, displayName.trim());
  };

  /**
   * clearErrors - Clears both local validation errors and Firebase errors.
   * Called whenever the user types in any input field, so stale error messages
   * don't persist after the user starts correcting their input.
   */
  const clearErrors = () => {
    // Clear the local (client-side) validation error
    setLocalError(null);
    // Clear the Firebase error if one exists
    if (error) clearError();
  };

  return (
    // SafeAreaView prevents content from going behind the status bar or notch
    <SafeAreaView style={styles.container}>
      {/* KeyboardAvoidingView shifts content up when the keyboard appears.
          Uses "padding" behavior on iOS and "height" on Android for best results. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* ScrollView makes the form scrollable, important because this form has
            4 input fields and may not fit on smaller screens. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding section with app name and subtitle */}
          <View style={styles.brandingSection}>
            {/* App name in large dark green text */}
            <Text style={styles.appName}>The Vine</Text>
            {/* Subtitle encouraging family connection */}
            <Text style={styles.subtitle}>Join your family</Text>
          </View>

          {/* Form card container with cream background */}
          <View style={styles.formCard}>
            {/* Form heading marked as a header for accessibility/screen readers */}
            <Text style={styles.formTitle} accessibilityRole="header">
              Create Account
            </Text>

            {/* Error banner: shows when there is either a local validation error
                or a Firebase error (e.g., "email already in use"). Uses the same
                red-tinted banner design as the login screen for consistency. */}
            {displayError && (
              <View style={styles.errorBanner}>
                {/* Thin red accent bar on the left side */}
                <View style={styles.errorAccent} />
                {/* The error message text */}
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Display Name input - how the user will appear to family members */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(text) => {
                  // Update the display name as the user types
                  setDisplayName(text);
                  // Clear any errors when the user starts editing
                  clearErrors();
                }}
                placeholder="Your name"
                placeholderTextColor={colors.text.tertiary}
                // Capitalize the first letter of each word (for proper names)
                autoCapitalize="words"
                // Enable autofill suggestions for name fields
                autoComplete="name"
                // Disable spell check since names aren't dictionary words
                spellCheck={false}
                autoCorrect={false}
              />
            </View>

            {/* Email input field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  // Update the email as the user types
                  setEmail(text);
                  // Clear any errors when the user starts editing
                  clearErrors();
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.tertiary}
                // Show email-optimized keyboard with @ and . keys
                keyboardType="email-address"
                // Don't auto-capitalize email addresses
                autoCapitalize="none"
                // Enable autofill for email
                autoComplete="email"
                // Disable spell check and autocorrect for emails
                spellCheck={false}
                autoCorrect={false}
              />
            </View>

            {/* Password input field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  // Update the password as the user types
                  setPassword(text);
                  // Clear any errors when the user starts editing
                  clearErrors();
                }}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.text.tertiary}
                // Hide password characters with dots for security
                secureTextEntry
                // Prevent iOS from auto-suggesting saved passwords
                textContentType="none"
                // Disable spell check and autocorrect for passwords
                spellCheck={false}
                autoCorrect={false}
              />
            </View>

            {/* Confirm Password input - must match the password field above */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  // Update the confirm password as the user types
                  setConfirmPassword(text);
                  // Clear any errors when the user starts editing
                  clearErrors();
                }}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.text.tertiary}
                // Hide password characters with dots for security
                secureTextEntry
                // Disable spell check and autocorrect for passwords
                spellCheck={false}
                autoCorrect={false}
                // Hint to the system this is a new password (not a current one)
                autoComplete="new-password"
              />
            </View>

            {/* Submit button: triggers signup flow with loading spinner while in progress.
                Disabled when any required field is empty to prevent premature submission. */}
            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              // Disable if any of the four required fields are empty
              disabled={!displayName.trim() || !email.trim() || !password || !confirmPassword}
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* Footer with link back to the login screen for existing users */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            {/* Tapping this goes back to the login screen using router.back() */}
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Log in"
              accessibilityHint="Returns to the login screen"
            >
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Styles for the SignupScreen.
 * Uses the app's design system constants for visual consistency with other screens.
 */
const styles = StyleSheet.create({
  // Main container: fills the screen with warm white background
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // KeyboardAvoidingView needs flex: 1 to fill available space
  keyboardView: {
    flex: 1,
  },
  // Scroll content: grows to fill screen; centers content vertically on large screens
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  // Branding section: centered text with bottom margin
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  // App name: large bold text in deep forest green
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary.dark,
    letterSpacing: -0.5,
  },
  // Subtitle text below the app name
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  // Form card: cream-colored container with rounded corners
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  // Form title: heading style with bottom margin
  formTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  // Error banner: horizontal row with translucent red background
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  // Error accent: thin red bar on the left side of the error banner
  errorAccent: {
    width: 4,
    backgroundColor: colors.error,
  },
  // Error text: small red text with padding inside the error banner
  errorText: {
    ...typography.textStyles.bodySmall,
    color: colors.error,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    flex: 1,
  },
  // Input group: wrapper for each label + input pair
  inputGroup: {
    marginBottom: spacing.md,
  },
  // Input label: small bold text above each text input
  label: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  // Text input: white background with light gray border and rounded corners
  input: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  // Submit button: slight top margin and rounded corners
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  // Footer: centered horizontal row at the bottom
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  // Footer text: secondary color for "Already have an account?"
  footerText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  // Footer link: green bold text for the "Log In" link
  footerLink: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
