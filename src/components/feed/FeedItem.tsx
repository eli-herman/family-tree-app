import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Avatar, Card } from '../common';
import { colors, typography, spacing, borderRadius } from '../../constants';
import { FeedItem as FeedItemType } from '../../types';

interface FeedItemProps {
  item: FeedItemType;
  onHeart: (itemId: string) => void;
  currentUserId: string;
}

export function FeedItem({ item, onHeart, currentUserId }: FeedItemProps) {
  const isHearted = item.hearts.includes(currentUserId);
  const heartCount = item.hearts.length;

  // Alternate avatar colors
  const avatarVariant =
    item.authorId.includes('1') || item.authorId.includes('3') ? 'green' : 'brown';

  return (
    <Card style={styles.container} variant="filled">
      <View style={styles.header}>
        <Avatar name={item.authorName} size="md" variant={avatarVariant} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.action}>
            {item.type === 'photo'
              ? 'added a photo'
              : item.type === 'memory'
                ? 'shared a memory'
                : item.type === 'milestone'
                  ? 'shared a milestone'
                  : 'responded to a prompt'}
          </Text>
        </View>
        <Text style={styles.timestamp}>{format(item.createdAt, 'h')}h</Text>
      </View>

      {item.content.mediaURLs && item.content.mediaURLs.length > 0 && (
        <View style={styles.mediaContainer}>
          <View style={styles.mediaPlaceholder}>
            <Text style={styles.mediaIcon}>
              {item.type === 'photo' ? '📷' : item.type === 'memory' ? '🎙️' : '📸'}
            </Text>
            <Text style={styles.mediaText}>
              {item.type === 'photo' ? 'Photo preview' : 'Media preview'}
            </Text>
          </View>
        </View>
      )}

      {item.content.text && !item.content.mediaURLs?.length && (
        <Text style={styles.contentText}>{item.content.text}</Text>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.heartButton} onPress={() => onHeart(item.id)}>
          <Text style={[styles.heartIcon, isHearted && styles.heartIconActive]}>
            {isHearted ? '♥' : '♡'}
          </Text>
          {heartCount > 0 && (
            <Text style={[styles.heartCount, isHearted && styles.heartCountActive]}>
              {heartCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  action: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  mediaContainer: {
    marginBottom: spacing.sm,
  },
  mediaPlaceholder: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  mediaText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  contentText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  heartIcon: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  heartIconActive: {
    color: colors.heart,
  },
  heartCount: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 6,
  },
  heartCountActive: {
    color: colors.heart,
  },
});
