/**
 * LoginScreen - Handles user authentication via email and password.
 *
 * This is the first screen users see when they are not logged in. It displays:
 * - App branding (name and Bible verse tagline)
 * - A login form with email and password fields
 * - Error messages for failed login attempts (wrong password, user not found, etc.)
 * - A "Forgot password?" link that navigates to the password reset screen
 * - A "Sign Up" link for new users who need to create an account
 *
 * The screen uses Firebase Authentication (via the auth store) to handle login.
 * On successful login, the AuthGate in the root layout automatically redirects
 * the user to the main app tabs.
 */

// React core and useState hook for managing form input values
import React, { useState } from 'react';
// React Native UI components used to build the login form layout
import {
  View, // Basic container component (like a <div> in web)
  Text, // Component for displaying text
  TextInput, // Text field component for user input
  StyleSheet, // Utility for creating optimized style objects
  KeyboardAvoidingView, // Automatically adjusts layout when the keyboard opens
  Platform, // Provides info about which platform the app is running on (iOS/Android)
  ScrollView, // Scrollable container so the form is accessible on small screens
  TouchableOpacity, // A wrapper that makes its children respond to touch/press events
} from 'react-native';
// SafeAreaView ensures content doesn't overlap with the device notch or status bar
import { SafeAreaView } from 'react-native-safe-area-context';
// router provides programmatic navigation; Href is a TypeScript type for route paths
import { router, Href } from 'expo-router';
// Custom reusable Button component with loading state and disabled styling
import { Button } from '../../src/components/common';
// Design system constants for consistent styling across all screens
import { colors, typography, spacing, borderRadius } from '../../src/constants';
// Zustand auth store that manages login state, errors, and Firebase auth calls
import { useAuthStore } from '../../src/stores';

/**
 * LoginScreen - Displays a branded form with email and password fields,
 * error handling, and navigation to signup/forgot password.
 */
export default function LoginScreen() {
  // Create state variables to track the email and password input values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Pull login function, loading state, error message, and error clearing from the auth store
  const { login, isLoading, error, clearError } = useAuthStore();

  /**
   * handleLogin - Called when the user taps the "Log In" button.
   * Validates that both fields have values, then calls the auth store's login function
   * with the trimmed email and password. If login fails, the auth store sets an error
   * message that is displayed in the error banner.
   */
  const handleLogin = async () => {
    // Don't attempt login if either field is empty (after trimming whitespace)
    if (!email.trim() || !password.trim()) return;
    // Call the auth store's login function; trim email to remove accidental spaces
    await login(email.trim(), password);
  };

  return (
    // SafeAreaView prevents content from going behind the status bar or notch
    <SafeAreaView style={styles.container}>
      {/* KeyboardAvoidingView shifts the content up when the keyboard opens so
          input fields remain visible. Uses "padding" on iOS and "height" on Android
          because each platform handles keyboard avoidance differently. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* ScrollView makes the form scrollable on small screens or when the keyboard
            takes up space. keyboardShouldPersistTaps="handled" ensures taps on buttons
            work even when the keyboard is open. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding section at the top with the app name and Bible verse */}
          <View style={styles.brandingSection}>
            {/* App name displayed in large dark green text */}
            <Text style={styles.appName}>The Vine</Text>
            {/* Bible verse tagline displayed in smaller italic text below the name */}
            <Text style={styles.verse}>"I am the vine; you are the branches" — John 15:5</Text>
          </View>

          {/* Form card container with a cream background and rounded corners */}
          <View style={styles.formCard}>
            {/* Form heading, marked with accessibilityRole="header" for screen readers */}
            <Text style={styles.formTitle} accessibilityRole="header">
              Welcome Back
            </Text>

            {/* Error banner: only renders when there is an error message from a failed login.
                Shows a red-tinted background with a red accent bar on the left side. */}
            {error && (
              <View style={styles.errorBanner}>
                {/* Thin red bar on the left side of the error banner for visual emphasis */}
                <View style={styles.errorAccent} />
                {/* The actual error message text (e.g., "Invalid email or password") */}
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email input field group with label */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  // Update the email state as the user types
                  setEmail(text);
                  // Clear any existing error when the user starts typing again,
                  // so stale error messages don't linger
                  if (error) clearError();
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.tertiary}
                // Show the email-optimized keyboard layout (with @ and . keys)
                keyboardType="email-address"
                // Don't auto-capitalize email addresses
                autoCapitalize="none"
                // Enable autofill suggestions for email fields
                autoComplete="email"
                // Disable spell check and autocorrect since emails aren't real words
                spellCheck={false}
                autoCorrect={false}
              />
            </View>

            {/* Password input field group with label */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  // Update the password state as the user types
                  setPassword(text);
                  // Clear any existing error when the user starts typing again
                  if (error) clearError();
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.tertiary}
                // secureTextEntry hides the password characters with dots
                secureTextEntry
                // textContentType="none" prevents iOS from suggesting saved passwords
                // in a way that conflicts with the form
                textContentType="none"
                // Disable spell check and autocorrect for password fields
                spellCheck={false}
                autoCorrect={false}
              />
            </View>

            {/* "Forgot password?" link aligned to the right, navigates to the reset screen */}
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => router.push('/(auth)/forgot-password' as Href)}
              // Accessibility attributes for screen readers
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              accessibilityHint="Opens password reset screen"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit button that triggers the login flow. Shows a loading spinner
                while the login request is in progress, and is disabled when fields
                are empty to prevent invalid submissions. */}
            <Button
              title="Log In"
              onPress={handleLogin}
              loading={isLoading}
              // Disable the button if either email or password is empty
              disabled={!email.trim() || !password.trim()}
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* Footer with link to the signup screen for new users */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            {/* Tapping this navigates to the signup screen */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              accessibilityHint="Opens the create account screen"
            >
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Styles for the LoginScreen.
 * Uses the app's design system constants (colors, typography, spacing, borderRadius)
 * to ensure visual consistency with other screens.
 */
const styles = StyleSheet.create({
  // Main container: fills the screen with the primary warm white background
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // KeyboardAvoidingView needs flex: 1 to fill available space
  keyboardView: {
    flex: 1,
  },
  // Scroll content: flexGrow ensures it fills the screen even with little content;
  // justifyContent centers the form vertically on larger screens
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  // Branding section: centered alignment with bottom margin to separate from the form
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  // App name: large bold text in the deep forest green color
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary.dark,
    letterSpacing: -0.5,
  },
  // Bible verse: smaller italic text with a max width to prevent overly long lines
  verse: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  // Form card: cream background with extra-large rounded corners, acts as the form container
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  // Form title: heading text style with bottom margin to separate from form fields
  formTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  // Error banner: horizontal layout with a translucent red background
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
  // Error text: small red text inside the error banner with padding
  errorText: {
    ...typography.textStyles.bodySmall,
    color: colors.error,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    flex: 1,
  },
  // Input group: wrapper for each label + input pair with bottom margin
  inputGroup: {
    marginBottom: spacing.md,
  },
  // Input label: small bold text above each text field
  label: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  // Text input field: white background with a light gray border and rounded corners
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
  // Forgot password link: aligned to the right side of the form
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  // Forgot password text: green link text with medium weight
  forgotText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary.main,
    fontWeight: '500',
  },
  // Submit button: rounded corners to match the form card design
  submitButton: {
    borderRadius: borderRadius.md,
  },
  // Footer: horizontal row centered at the bottom of the screen
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  // Footer text: secondary colored body text for "Don't have an account?"
  footerText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  // Footer link: green bold text for the "Sign Up" link
  footerLink: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
