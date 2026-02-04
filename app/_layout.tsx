import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useFamilyStore, useUserStore, useFeedStore } from '../src/stores';

export default function RootLayout() {
  const loadFamily = useFamilyStore((state) => state.loadData);
  const loadUser = useUserStore((state) => state.loadData);
  const loadFeed = useFeedStore((state) => state.loadData);

  useEffect(() => {
    // Initialize all stores on app mount
    Promise.all([loadFamily(), loadUser(), loadFeed()]);
  }, [loadFamily, loadUser, loadFeed]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="member/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
