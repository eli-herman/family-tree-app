/**
 * RootLayout - The top-level layout file for the entire app.
 *
 * This is the entry point that Expo Router renders first. It is responsible for:
 * 1. Initializing Firebase auth and listening for auth state changes
 * 2. Loading app data (family, user, feed) once the user is authenticated
 * 3. Showing a branded loading/splash screen while Firebase initializes
 * 4. Gating navigation so unauthenticated users are redirected to login,
 *    and authenticated users are redirected away from auth screens
 * 5. Wrapping the entire app in required providers (gesture handler, safe area,
 *    error boundary)
 */

// React core and the useEffect hook for running side effects
import React, { useEffect } from 'react';
// Expo Router navigation primitives: Stack for screen stacking, Redirect for
// programmatic navigation, useSegments to inspect the current route
import { Stack, Redirect, useSegments } from 'expo-router';
// Required wrapper for all gesture-based interactions (swipe, pan, etc.)
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Provides safe area inset values (notch, status bar) to child components
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Core React Native UI components for building the loading screen
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
// Zustand stores that manage global state for auth, family, user, and feed data
import { useAuthStore, useFamilyStore, useUserStore, useFeedStore } from '../src/stores';
// Design system color constants used for consistent styling across the app
import { colors } from '../src/constants';
// Error boundary component that catches JavaScript errors in child components
// and displays a fallback UI instead of crashing the app
import { ErrorBoundary } from '../src/components/common';

/**
 * LoadingScreen - A branded splash/loading screen shown while Firebase is initializing.
 *
 * Displays the app name "The Vine" centered on a dark green background with a
 * spinning activity indicator below it. This gives users visual feedback that
 * the app is loading rather than showing a blank screen.
 */
function LoadingScreen() {
  return (
    // Full-screen dark green container that centers its children
    <View style={styles.loadingContainer}>
      {/* App name displayed in large white text */}
      <Text style={styles.loadingTitle}>The Vine</Text>
      {/* Spinning loading indicator shown below the app name */}
      <ActivityIndicator size="large" color={colors.text.inverse} style={styles.spinner} />
    </View>
  );
}

/**
 * AuthGate - A wrapper component that controls navigation based on authentication state.
 *
 * This component acts as a "gate" between the auth screens (login, signup) and the
 * main app screens (tabs). It checks whether the user is logged in and which route
 * group they are currently viewing, then redirects them to the correct place:
 * - Not logged in + viewing main app -> redirect to login
 * - Logged in + viewing auth screens -> redirect to main app tabs
 * - Otherwise -> render children normally
 *
 * @param children - The child components (navigation stack) to render when no redirect is needed
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  // Get authentication status and whether Firebase has finished initializing
  const { isAuthenticated, isInitialized } = useAuthStore();
  // Get the current URL segments to determine which route group the user is in
  // For example, if on "/(auth)/login", segments would be ["(auth)", "login"]
  const segments = useSegments();

  // If Firebase auth hasn't finished initializing yet, show the loading screen
  // instead of potentially redirecting to the wrong place
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Check if the user is currently viewing a screen inside the (auth) route group
  const inAuthGroup = segments[0] === '(auth)';

  // If the user is NOT logged in and is NOT already on an auth screen,
  // redirect them to the login page so they can authenticate
  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // If the user IS logged in but is still on an auth screen (e.g., login or signup),
  // redirect them to the main app tabs since they don't need to authenticate again
  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  // If neither redirect condition is met, render the children (navigation stack) normally
  return <>{children}</>;
}

/**
 * RootLayout - The root component exported as the default layout for the entire app.
 *
 * This component handles two critical responsibilities:
 * 1. App initialization: Sets up Firebase auth listener on mount and loads app data
 *    (family tree, user profile, feed) once the user is authenticated
 * 2. Navigation structure: Defines the top-level Stack navigator with three screen groups:
 *    - (tabs): The main tab navigation (Feed, Tree, Profile)
 *    - (auth): Authentication screens (Login, Signup, Forgot Password)
 *    - member/[id]: A modal screen for viewing individual family member details
 *
 * The component also wraps everything in required providers for gestures, safe areas,
 * and error handling.
 */
export default function RootLayout() {
  // Destructure auth state and the initialize function from the auth store
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  // Select the loadData function from each store using Zustand's selector pattern
  // This loads family tree data from Firebase/mock data
  const loadFamily = useFamilyStore((state) => state.loadData);
  // This loads the current user's profile data
  const loadUser = useUserStore((state) => state.loadData);
  // This loads the feed posts and updates
  const loadFeed = useFeedStore((state) => state.loadData);

  // Initialize Firebase auth listener when the component mounts.
  // The initialize() function sets up an onAuthStateChanged listener that updates
  // the auth store whenever the user logs in or out. It returns an unsubscribe
  // function that we return from useEffect to clean up when the component unmounts.
  useEffect(() => {
    const unsubscribe = initialize();
    // Return the unsubscribe function so the listener is cleaned up on unmount
    return unsubscribe;
  }, [initialize]);

  // Load app data whenever the user becomes authenticated.
  // Family data must load first (it contains member IDs needed by other stores),
  // then user and feed data can load in parallel after family data is ready.
  useEffect(() => {
    if (isAuthenticated) {
      // Load family data first, then load user and feed data in parallel
      loadFamily().then(() => {
        loadUser();
        loadFeed();
      });
    }
  }, [isAuthenticated, loadFamily, loadUser, loadFeed]);

  // While Firebase auth is still initializing, show a full-screen loading screen
  // wrapped in the gesture handler (needed for the root view on all platforms)
  if (!isInitialized) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <LoadingScreen />
      </GestureHandlerRootView>
    );
  }

  // Once initialization is complete, render the full app layout with all providers
  return (
    // GestureHandlerRootView must wrap the entire app for gestures to work on Android
    <GestureHandlerRootView style={styles.container}>
      {/* SafeAreaProvider gives all children access to device safe area insets */}
      <SafeAreaProvider>
        {/* ErrorBoundary catches any unhandled JS errors and shows a fallback UI */}
        <ErrorBoundary>
          {/* AuthGate handles redirecting users based on their auth state */}
          <AuthGate>
            {/* Stack navigator with headers hidden (each screen manages its own header) */}
            <Stack screenOptions={{ headerShown: false }}>
              {/* The main tab navigation group (Feed, Tree, Profile screens) */}
              <Stack.Screen name="(tabs)" />
              {/* The authentication screens group (Login, Signup, Forgot Password) */}
              <Stack.Screen name="(auth)" />
              {/* Dynamic route for viewing a family member's details, shown as a modal */}
              <Stack.Screen name="member/[id]" options={{ presentation: 'modal' }} />
            </Stack>
          </AuthGate>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Styles for the root layout and loading screen.
 * Uses React Native's StyleSheet.create for optimized style objects.
 */
const styles = StyleSheet.create({
  // Root container that fills the entire screen
  container: {
    flex: 1,
  },
  // Loading screen container: full-screen dark green background with centered content
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // App name text on the loading screen: large, bold, white
  loadingTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  // Adds spacing above the loading spinner so it doesn't overlap with the title
  spinner: {
    marginTop: 24,
  },
});
