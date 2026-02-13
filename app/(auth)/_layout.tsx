/**
 * AuthLayout - Layout for the authentication route group (auth).
 *
 * This file defines the navigation structure for all authentication-related screens
 * (Login, Signup, Forgot Password). It uses Expo Router's Stack navigator to manage
 * transitions between these screens.
 *
 * In Expo Router, a _layout.tsx file inside a folder defines how screens in that
 * folder are arranged and how transitions between them work. This layout is nested
 * inside the root layout (app/_layout.tsx), which wraps it with the AuthGate
 * component to handle authentication-based redirects.
 *
 * Key decisions:
 * - Headers are hidden because each auth screen has its own branded header/title
 * - A "fade" animation is used for smooth transitions between auth screens
 *   (rather than the default slide animation used for normal navigation)
 */

// Stack is a navigator from Expo Router that arranges screens in a card stack,
// where new screens slide on top of previous ones
import { Stack } from 'expo-router';

/**
 * AuthLayout - Renders a headerless Stack navigator with fade transitions.
 *
 * This component is automatically used by Expo Router as the layout wrapper
 * for all screens defined in the app/(auth)/ directory. Any .tsx file placed
 * in this folder (login.tsx, signup.tsx, forgot-password.tsx) becomes a screen
 * within this Stack navigator.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        // Hide the default navigation header bar since auth screens have custom branding
        headerShown: false,
        // Use a fade animation instead of the default slide for a softer transition
        // between login, signup, and forgot password screens
        animation: 'fade',
      }}
    />
  );
}
