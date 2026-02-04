import React from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedItem, PromptCard, DailyVerse } from '../../src/components/feed';
import { colors, spacing } from '../../src/constants';
import { mockPrompts } from '../../src/utils/mockData';
import { getDailyVerse } from '../../src/utils/dailyVerses';
import { Prompt } from '../../src/types';
import { useFeedStore, useUserStore } from '../../src/stores';

export default function FeedScreen() {
  const items = useFeedStore((state) => state.items);
  const toggleHeart = useFeedStore((state) => state.toggleHeart);
  const isLoading = useFeedStore((state) => state.isLoading);
  const currentMemberId = useUserStore((state) => state.currentMemberId);
  const dailyVerse = getDailyVerse();

  const handleHeart = (itemId: string) => {
    if (currentMemberId) {
      toggleHeart(itemId, currentMemberId);
    }
  };

  const handlePromptRespond = (prompt: Prompt) => {
    console.log('Respond to prompt:', prompt.text);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>The Vine</Text>
        <Text style={styles.subtitle}>Family Updates</Text>
      </View>
      <DailyVerse verse={dailyVerse} />
    </View>
  );

  const renderFooter = () => (
    <PromptCard prompt={mockPrompts[0]} onRespond={handlePromptRespond} />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedItem
            item={item}
            onHeart={handleHeart}
            currentUserId={currentMemberId || ''}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.dark,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});
