import React, { useEffect } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore, useFamilyStore, useUserStore, useFeedStore } from '../src/stores';
import { colors } from '../src/constants';
import { ErrorBoundary } from '../src/components/common';

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingTitle}>The Vine</Text>
      <ActivityIndicator size="large" color={colors.text.inverse} style={styles.spinner} />
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const segments = useSegments();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const loadFamily = useFamilyStore((state) => state.loadData);
  const loadUser = useUserStore((state) => state.loadData);
  const loadFeed = useFeedStore((state) => state.loadData);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([loadFamily(), loadUser(), loadFeed()]);
    }
  }, [isAuthenticated, loadFamily, loadUser, loadFeed]);

  if (!isInitialized) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <LoadingScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="member/[id]" options={{ presentation: 'modal' }} />
            </Stack>
          </AuthGate>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  spinner: {
    marginTop: 24,
  },
});
