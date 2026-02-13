/**
 * FeedScreen (index.tsx) — The Vine Family Updates Feed
 *
 * This is the main/home tab of the app. It displays a scrollable feed of
 * family updates (photos, memories, milestones) along with a daily Bible
 * verse at the top and a story prompt card at the bottom. Users can "heart"
 * (like) individual feed items.
 *
 * Layout (top to bottom):
 *   1. Header with app name "The Vine" and subtitle "Family Updates"
 *   2. DailyVerse component showing the Bible verse for today
 *   3. List of FeedItem cards (photos, text updates from family members)
 *   4. PromptCard at the bottom encouraging memory sharing
 */

import React from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Handles notch/status bar insets
import { FeedItem, PromptCard, DailyVerse } from '../../src/components/feed'; // Feed UI components
import { colors, spacing } from '../../src/constants'; // Design system tokens
import { mockPrompts } from '../../src/utils/mockData'; // Placeholder story prompts
import { getDailyVerse } from '../../src/utils/dailyVerses'; // Returns a Bible verse based on the current date
import { Prompt } from '../../src/types'; // TypeScript type for story prompts
import { useFeedStore, useUserStore } from '../../src/stores'; // Zustand stores for feed data and user identity

/**
 * FeedScreen — the default tab (home screen) that renders the family updates feed.
 * Uses a FlatList for efficient scrolling through potentially many feed items.
 */
export default function FeedScreen() {
  // Pull feed items array from the Zustand feed store (reactive — re-renders when items change)
  const items = useFeedStore((state) => state.items);

  // Pull the toggleHeart action from the feed store (used to like/unlike a feed item)
  const toggleHeart = useFeedStore((state) => state.toggleHeart);

  // Boolean flag indicating whether the feed data is still being fetched
  const isLoading = useFeedStore((state) => state.isLoading);

  // The ID of the currently logged-in family member (needed to track who hearted what)
  const currentMemberId = useUserStore((state) => state.currentMemberId);

  // Get today's Bible verse — this is deterministic based on the calendar date
  const dailyVerse = getDailyVerse();

  /**
   * handleHeart — called when a user taps the heart icon on a feed item.
   * Only fires the toggle if we have a valid current member ID (user is logged in).
   * @param itemId - The unique ID of the feed item being hearted
   */
  const handleHeart = (itemId: string) => {
    if (currentMemberId) {
      toggleHeart(itemId, currentMemberId); // Toggle heart on/off for this user + item
    }
  };

  /**
   * handlePromptRespond — called when a user taps the "respond" button on a story prompt.
   * Currently a placeholder that logs to the console.
   * @param prompt - The Prompt object the user wants to respond to
   */
  const handlePromptRespond = (prompt: Prompt) => {
    console.log('Respond to prompt:', prompt.text); // TODO: Navigate to a compose screen
  };

  /**
   * renderHeader — renders the content that appears above the feed list.
   * FlatList uses this as ListHeaderComponent so it scrolls with the list.
   * Contains the app title banner and the daily Bible verse card.
   */
  const renderHeader = () => (
    <View>
      {/* App title section with name and subtitle, centered */}
      <View style={styles.header}>
        <Text style={styles.title}>The Vine</Text>
        <Text style={styles.subtitle}>Family Updates</Text>
      </View>
      {/* Daily Bible verse card — displays a verse about family, love, or faith */}
      <DailyVerse verse={dailyVerse} />
    </View>
  );

  /**
   * renderFooter — renders the content that appears below the last feed item.
   * Shows a story prompt card that encourages family members to share memories.
   */
  const renderFooter = () => <PromptCard prompt={mockPrompts[0]} onRespond={handlePromptRespond} />;

  // While feed data is loading, show a centered spinner instead of the feed
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.loader} />
      </SafeAreaView>
    );
  }

  // Main render: the scrollable feed with header, items, and footer
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items} // Array of feed items from the store
        keyExtractor={(item) => item.id} // Use each item's unique ID as the React key
        renderItem={({ item }) => (
          // Render each feed item as a FeedItem card with heart functionality
          <FeedItem
            item={item}
            onHeart={handleHeart} // Pass the heart toggle handler
            currentUserId={currentMemberId || ''} // Pass current user so FeedItem can show filled/unfilled heart
          />
        )}
        ListHeaderComponent={renderHeader} // Title + daily verse at the top
        ListFooterComponent={renderFooter} // Story prompt card at the bottom
        contentContainerStyle={styles.list} // Adds bottom padding so content isn't clipped by tab bar
        showsVerticalScrollIndicator={false} // Hide the scrollbar for a cleaner look
      />
    </SafeAreaView>
  );
}

/** Stylesheet for the FeedScreen component */
const styles = StyleSheet.create({
  // Full-screen container with the app's warm white background
  container: {
    flex: 1, // Take up all available vertical space
    backgroundColor: colors.background.primary, // Warm white (#FEFDFB)
  },
  // Header banner containing the app title and subtitle
  header: {
    paddingHorizontal: spacing.md, // Horizontal padding on left and right
    paddingVertical: spacing.md, // Vertical padding on top and bottom
    borderBottomWidth: 1, // Thin separator line below the header
    borderBottomColor: colors.background.tertiary, // Light gray border color
    alignItems: 'center', // Center the title text horizontally
  },
  // "The Vine" title text — bold, deep forest green
  title: {
    fontSize: 24,
    fontWeight: '700', // Bold weight
    color: colors.primary.dark, // Deep forest green (#1B4332)
  },
  // "Family Updates" subtitle below the title
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary, // Muted gray text
    marginTop: 2, // Small gap between title and subtitle
  },
  // Applied to FlatList's content container — adds breathing room at the bottom
  list: {
    paddingBottom: spacing.xl, // Extra padding so the last item isn't hidden by the tab bar
  },
  // Loading spinner style — centered vertically in the screen
  loader: {
    flex: 1, // Fill available space so the spinner centers vertically
    justifyContent: 'center', // Center the spinner within the flex container
  },
});
