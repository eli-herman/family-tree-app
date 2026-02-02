import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../../constants';
import { BibleVerse } from '../../types/verse';

interface DailyVerseProps {
  verse: BibleVerse;
}

function CrossIcon({ color = colors.text.inverse, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {/* Vertical beam */}
      <Path d="M12 2v20" />
      {/* Horizontal beam */}
      <Path d="M5 8h14" />
    </Svg>
  );
}

export function DailyVerse({ verse }: DailyVerseProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CrossIcon />
      </View>
      <Text style={styles.verseText}>"{verse.text}"</Text>
      <Text style={styles.reference}>— {verse.reference}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.primary.dark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  verseText: {
    fontSize: 14,
    color: colors.text.inverse,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    opacity: 0.95,
  },
  reference: {
    fontSize: 12,
    color: colors.text.inverse,
    marginTop: spacing.sm,
    opacity: 0.7,
    fontWeight: '500',
  },
});
