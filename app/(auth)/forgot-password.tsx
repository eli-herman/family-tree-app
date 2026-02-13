/**
 * ForgotPasswordScreen - Allows users to request a password reset email.
 *
 * This screen has two states:
 * 1. Input state (default): Shows an email input field and a "Send Reset Link" button.
 *    The user enters the email address associated with their account.
 * 2. Success state: After the reset email is sent successfully, the form is replaced
 *    with a success message telling the user to check their inbox.
 *
 * The screen uses Firebase's sendPasswordResetEmail method (via the auth store) to
 * send the reset link. If the email is not found or another error occurs, an error
 * banner is displayed. The user can navigate back to the login screen at any time.
 */

// React core and useState hook for managing form and success state
import React, { useState } from 'react';
// React Native UI components used to build the form layout
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
// SafeAreaView prevents content from overlapping with device notch or status bar
import { SafeAreaView } from 'react-native-safe-area-context';
// router.back() is used to navigate back to the login screen
import { router } from 'expo-router';
// Custom reusable Button component with loading and disabled states
import { Button } from '../../src/components/common';
// Design system constants for consistent styling
import { colors, typography, spacing, borderRadius } from '../../src/constants';
// Zustand auth store that provides the resetPassword function and state
import { useAuthStore } from '../../src/stores';

/**
 * ForgotPasswordScreen - Displays an email input for requesting a password reset link.
 * Switches to a success message once the email is sent successfully.
 */
export default function ForgotPasswordScreen() {
  // State for the email input field value
  const [email, setEmail] = useState('');
  // Boolean state to track whether the reset email was sent successfully.
  // When true, the form is replaced with a success confirmation message.
  const [sent, setSent] = useState(false);
  // Pull resetPassword function, loading state, error, and clearError from the auth store
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  /**
   * handleReset - Called when the user taps the "Send Reset Link" button.
   * Sends a password reset email via Firebase. If successful (no error in the store),
   * switches the UI to the success state. If there's an error (e.g., email not found),
   * the error is displayed in the error banner.
   */
  const handleReset = async () => {
    // Don't proceed if the email field is empty
    if (!email.trim()) return;
    // Call Firebase's password reset function with the trimmed email
    await resetPassword(email.trim());
    // Check the auth store directly for errors (not the local `error` variable,
    // because React state may not have updated yet within this same function call).
    // If no error exists, the reset email was sent successfully.
    if (!useAuthStore.getState().error) {
      setSent(true);
    }
  };

  return (
    // SafeAreaView prevents content from going behind the status bar or notch
    <SafeAreaView style={styles.container}>
      {/* KeyboardAvoidingView shifts content up when the keyboard appears */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* ScrollView makes the content scrollable and keeps buttons tappable
            when the keyboard is open */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding section with just the app name (no verse on this screen) */}
          <View style={styles.brandingSection}>
            <Text style={styles.appName}>The Vine</Text>
          </View>

          {/* Form card container with cream background */}
          <View style={styles.formCard}>
            {/* Screen title marked as a header for accessibility */}
            <Text style={styles.formTitle} accessibilityRole="header">
              Reset Password
            </Text>

            {/* Conditional rendering: show either the success message or the input form.
                Once the reset email is sent successfully, `sent` becomes true and the
                form is replaced with a confirmation banner. */}
            {sent ? (
              // Success state: green-tinted banner confirming the email was sent
              <View style={styles.successBanner}>
                <Text style={styles.successText}>
                  Check your email! We sent a password reset link to{' '}
                  {/* Bold the email address so the user can verify it's correct */}
                  <Text style={styles.successEmail}>{email}</Text>.
                </Text>
              </View>
            ) : (
              // Input state: show the description, email field, and submit button
              <>
                {/* Instructional text explaining what this screen does */}
                <Text style={styles.description}>
                  Enter the email address associated with your account and we'll send you a link to
                  reset your password.
                </Text>

                {/* Error banner: only shows when there is an error from Firebase
                    (e.g., "No user found with this email address") */}
                {error && (
                  <View style={styles.errorBanner}>
                    {/* Thin red accent bar on the left side */}
                    <View style={styles.errorAccent} />
                    {/* The error message text */}
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Email input field group */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      // Update the email state as the user types
                      setEmail(text);
                      // Clear any existing error when the user starts editing
                      if (error) clearError();
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.text.tertiary}
                    // Show email-optimized keyboard with @ and . keys
                    keyboardType="email-address"
                    // Don't auto-capitalize email addresses
                    autoCapitalize="none"
                    // Enable autofill for email fields
                    autoComplete="email"
                    // Disable spell check and autocorrect for email input
                    spellCheck={false}
                    autoCorrect={false}
                  />
                </View>

                {/* Submit button: sends the password reset email.
                    Shows a loading spinner while the request is in progress.
                    Disabled when the email field is empty. */}
                <Button
                  title="Send Reset Link"
                  onPress={handleReset}
                  loading={isLoading}
                  disabled={!email.trim()}
                  size="lg"
                  style={styles.submitButton}
                />
              </>
            )}
          </View>

          {/* Footer with a link back to the login screen */}
          <View style={styles.footer}>
            {/* Tapping this navigates back to the login screen */}
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to log in"
              accessibilityHint="Returns to the login screen"
            >
              <Text style={styles.footerLink}>Back to Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Styles for the ForgotPasswordScreen.
 * Uses the app's design system constants for visual consistency with other auth screens.
 */
const styles = StyleSheet.create({
  // Main container: fills the screen with warm white background
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // KeyboardAvoidingView fills available space
  keyboardView: {
    flex: 1,
  },
  // Scroll content: grows to fill the screen; centers content vertically
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  // Branding section: centered with extra bottom margin
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  // App name: large bold text in deep forest green
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary.dark,
    letterSpacing: -0.5,
  },
  // Form card: cream background container with rounded corners
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  // Form title: heading style with medium bottom margin
  formTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  // Description text: explains what the user should do on this screen
  description: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
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
  // Error text: small red text inside the error banner
  errorText: {
    ...typography.textStyles.bodySmall,
    color: colors.error,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    flex: 1,
  },
  // Success banner: green-tinted background shown after the reset email is sent
  successBanner: {
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  // Success text: green text confirming the email was sent
  successText: {
    ...typography.textStyles.body,
    color: colors.primary.main,
  },
  // Success email: bold weight to highlight the email address in the success message
  successEmail: {
    fontWeight: '600',
  },
  // Input group: wrapper for the label + input pair with larger bottom margin
  inputGroup: {
    marginBottom: spacing.lg,
  },
  // Input label: small bold text above the email field
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
  // Submit button: rounded corners to match the form card
  submitButton: {
    borderRadius: borderRadius.md,
  },
  // Footer: centered alignment for the "Back to Log In" link
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  // Footer link: green bold text for the navigation link
  footerLink: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
