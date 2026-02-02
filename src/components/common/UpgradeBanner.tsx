import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, Href } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

interface UpgradeBannerProps {
  title: string;
  description: string;
  variant?: 'warning' | 'info';
  onDismiss?: () => void;
}

/**
 * A soft paywall banner to encourage upgrades without blocking
 * Use at 80% of limits (e.g., 4/5 members, 40/50 photos)
 */
export function UpgradeBanner({
  title,
  description,
  variant = 'info',
  onDismiss,
}: UpgradeBannerProps) {
  const isWarning = variant === 'warning';

  return (
    <View style={[styles.container, isWarning && styles.containerWarning]}>
      <View style={styles.content}>
        <Text style={[styles.title, isWarning && styles.titleWarning]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push('/paywall' as Href)}
        >
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Later</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Helper to check if user should see an upgrade prompt
 */
export function shouldShowUpgradeBanner(
  currentCount: number,
  limit: number
): 'none' | 'info' | 'warning' {
  if (limit === Infinity) return 'none';
  const percentage = currentCount / limit;
  if (percentage >= 1) return 'warning';
  if (percentage >= 0.8) return 'info';
  return 'none';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.light + '15', // 15% opacity
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
    marginBottom: spacing.md,
  },
  containerWarning: {
    backgroundColor: colors.warning + '20', // 20% opacity
    borderLeftColor: colors.heart,
  },
  content: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    color: colors.primary.dark,
    marginBottom: spacing.xs,
  },
  titleWarning: {
    color: colors.heart,
  },
  description: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  upgradeButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  upgradeButtonText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  dismissButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dismissButtonText: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
});
