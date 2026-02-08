import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, Href } from 'expo-router';
import { useSubscriptionStore } from '../../stores';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

type FeatureType =
  | 'addMember'
  | 'uploadPhoto'
  | 'recordAudio'
  | 'recordVideo'
  | 'archiveDeceased'
  | 'export';

interface FeatureGateProps {
  feature: FeatureType;
  currentCount?: number; // For countable features like members or photos
  children: React.ReactNode;
  renderLocked?: () => React.ReactNode;
}

/**
 * Wraps content that requires a subscription feature.
 * If the feature is available, renders children.
 * If locked, shows upgrade prompt or custom locked content.
 */
export function FeatureGate({
  feature,
  currentCount = 0,
  children,
  renderLocked,
}: FeatureGateProps) {
  const store = useSubscriptionStore();

  const isUnlocked = (): boolean => {
    switch (feature) {
      case 'addMember':
        return store.canAddMember(currentCount);
      case 'uploadPhoto':
        return store.canUploadPhoto(currentCount);
      case 'recordAudio':
        return store.canRecordAudio();
      case 'recordVideo':
        return store.canRecordVideo();
      case 'archiveDeceased':
        return store.canArchiveDeceased();
      case 'export':
        return store.canExport();
      default:
        return true;
    }
  };

  if (isUnlocked()) {
    return <>{children}</>;
  }

  if (renderLocked) {
    return <>{renderLocked()}</>;
  }

  return <DefaultLockedView feature={feature} />;
}

interface DefaultLockedViewProps {
  feature: FeatureType;
}

function DefaultLockedView({ feature }: DefaultLockedViewProps) {
  const getFeatureMessage = (): { title: string; description: string } => {
    switch (feature) {
      case 'addMember':
        return {
          title: 'Family limit reached',
          description: 'Upgrade to add unlimited family members',
        };
      case 'uploadPhoto':
        return {
          title: 'Photo limit reached',
          description: 'Upgrade for unlimited photo storage',
        };
      case 'recordAudio':
        return {
          title: 'Audio memories',
          description: 'Upgrade to record voice messages and stories',
        };
      case 'recordVideo':
        return {
          title: 'Video memories',
          description: 'Upgrade to Legacy for video recordings',
        };
      case 'archiveDeceased':
        return {
          title: 'Memorial archives',
          description: 'Upgrade to preserve memories of loved ones passed',
        };
      case 'export':
        return {
          title: 'Export & backup',
          description: 'Upgrade to Legacy to export your family data',
        };
      default:
        return {
          title: 'Premium feature',
          description: 'Upgrade to unlock this feature',
        };
    }
  };

  const { title, description } = getFeatureMessage();

  return (
    <View style={styles.container}>
      <Text style={styles.lockIcon}>🔒</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => router.push('/paywall' as Href)}
        accessibilityRole="button"
        accessibilityLabel="View plans"
        accessibilityHint="Opens subscription plans"
      >
        <Text style={styles.upgradeButtonText}>View Plans</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Hook to check if a feature is available
 */
export function useFeatureAccess() {
  const store = useSubscriptionStore();

  return {
    canAddMember: store.canAddMember,
    canUploadPhoto: store.canUploadPhoto,
    canRecordAudio: store.canRecordAudio,
    canRecordVideo: store.canRecordVideo,
    canArchiveDeceased: store.canArchiveDeceased,
    canExport: store.canExport,
    tier: store.tier,
    memberLimit: store.getMemberLimit(),
    photoLimit: store.getPhotoLimit(),
  };
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  upgradeButtonText: {
    ...typography.textStyles.buttonSmall,
    color: colors.text.inverse,
  },
});
