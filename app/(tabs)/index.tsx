import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedItem, PromptCard, DailyVerse } from '../../src/components/feed';
import { colors, spacing } from '../../src/constants';
import { mockFeedItems, mockPrompts } from '../../src/utils/mockData';
import { getDailyVerse } from '../../src/utils/dailyVerses';
import { FeedItem as FeedItemType, Prompt } from '../../src/types';

export default function FeedScreen() {
  const [feedItems, setFeedItems] = useState<FeedItemType[]>(mockFeedItems);
  const currentUserId = 'user1';
  const dailyVerse = getDailyVerse();

  const handleHeart = (itemId: string) => {
    setFeedItems((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const hearts = item.hearts.includes(currentUserId)
          ? item.hearts.filter((id) => id !== currentUserId)
          : [...item.hearts, currentUserId];
        return { ...item, hearts };
      })
    );
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeedItem
            item={item}
            onHeart={handleHeart}
            currentUserId={currentUserId}
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
});
