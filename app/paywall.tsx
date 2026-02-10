import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { typography } from '../src/constants/typography';
import { spacing, borderRadius } from '../src/constants/spacing';
import { PRODUCTS } from '../src/types/subscription';

type PlanPeriod = 'monthly' | 'yearly';

interface TierCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  isRecommended?: boolean;
  isSelected: boolean;
  savings?: string;
  onSelect: () => void;
}

function TierCard({
  name,
  price,
  period,
  features,
  isRecommended,
  isSelected,
  savings,
  onSelect,
}: TierCardProps) {
  return (
    <TouchableOpacity
      style={[styles.tierCard, isSelected && styles.tierCardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${name} plan, ${price} per ${period}`}
      accessibilityHint="Selects this plan"
      accessibilityState={{ selected: isSelected }}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}
      <Text style={styles.tierName}>{name}</Text>
      <View style={styles.priceRow}>
        <View style={styles.priceRowLeft}>
          <Text style={styles.tierPrice}>{price}</Text>
          <Text style={styles.tierPeriod}>/{period}</Text>
        </View>
        {savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{savings}</Text>
          </View>
        )}
      </View>
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
        {isSelected && <View style={styles.selectDot} />}
      </View>
    </TouchableOpacity>
  );
}

export default function PaywallScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod>('yearly');
  const [selectedTier, setSelectedTier] = useState<'family' | 'legacy'>('family');
  const [footerHeight, setFooterHeight] = useState(0);
  const insets = useSafeAreaInsets();

  const familyProduct = PRODUCTS.find((p) => p.tier === 'family' && p.period === selectedPeriod);
  const legacyProduct = PRODUCTS.find((p) => p.tier === 'legacy' && p.period === selectedPeriod);

  const familyFeatures = [
    'Unlimited family members',
    'Unlimited photos',
    'Audio memories',
    'Deceased member archives',
    'Priority support',
  ];

  const legacyFeatures = [
    'Everything in Family',
    'Video memories',
    'Annual printed memory book',
    'Export & backup',
    'Early access to features',
  ];

  const handleSubscribe = () => {
    const product = selectedTier === 'family' ? familyProduct : legacyProduct;
    // TODO: Integrate with RevenueCat to purchase
    console.log('Subscribe to:', product?.id);
  };

  const handleRestore = () => {
    // TODO: Integrate with RevenueCat to restore purchases
    console.log('Restore purchases');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + footerHeight }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
            accessibilityHint="Returns to the previous screen"
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title} accessibilityRole="header">
            Grow Your Family Tree
          </Text>
          <Text style={styles.subtitle}>
            Unlock unlimited memories and connections for your whole family
          </Text>
        </View>

        {/* Bible verse about stewardship */}
        <View style={styles.verseContainer}>
          <Text style={styles.verseText}>
            "A good man leaves an inheritance to his children's children"
          </Text>
          <Text style={styles.verseReference}>— Proverbs 13:22</Text>
        </View>

        {/* Period toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'monthly' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('monthly')}
            accessibilityRole="button"
            accessibilityLabel="Monthly billing"
            accessibilityHint="Switches to monthly pricing"
            accessibilityState={{ selected: selectedPeriod === 'monthly' }}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'monthly' && styles.periodButtonTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'yearly' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('yearly')}
            accessibilityRole="button"
            accessibilityLabel="Yearly billing"
            accessibilityHint="Switches to yearly pricing"
            accessibilityState={{ selected: selectedPeriod === 'yearly' }}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'yearly' && styles.periodButtonTextActive,
              ]}
            >
              Yearly
            </Text>
            {selectedPeriod === 'yearly' && <Text style={styles.periodSavings}>Save 33%</Text>}
          </TouchableOpacity>
        </View>

        {/* Tier cards */}
        <View style={styles.tiersContainer}>
          <TierCard
            name="Family"
            price={familyProduct?.price || '$4.99'}
            period={selectedPeriod === 'yearly' ? 'year' : 'month'}
            features={familyFeatures}
            isRecommended
            isSelected={selectedTier === 'family'}
            savings={selectedPeriod === 'yearly' ? familyProduct?.savings : undefined}
            onSelect={() => setSelectedTier('family')}
          />
          <TierCard
            name="Legacy"
            price={legacyProduct?.price || '$9.99'}
            period={selectedPeriod === 'yearly' ? 'year' : 'month'}
            features={legacyFeatures}
            isSelected={selectedTier === 'legacy'}
            savings={selectedPeriod === 'yearly' ? legacyProduct?.savings : undefined}
            onSelect={() => setSelectedTier('legacy')}
          />
        </View>

        {/* Free tier note */}
        <View style={styles.freeNote}>
          <Text style={styles.freeNoteTitle}>Free Forever</Text>
          <Text style={styles.freeNoteText}>
            Up to 5 family members and 50 photos. Daily Bible verses and heart reactions included.
          </Text>
        </View>
      </ScrollView>

      {/* Subscribe button */}
      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          if (height !== footerHeight) {
            setFooterHeight(height);
          }
        }}
      >
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${selectedTier === 'family' ? 'Family' : 'Legacy'} plan`}
          accessibilityHint="Starts the subscription purchase flow"
        >
          <Text style={styles.subscribeButtonText}>
            Continue with {selectedTier === 'family' ? 'Family' : 'Legacy'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
          accessibilityHint="Restores an existing subscription"
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
        <Text style={styles.legalText}>
          Cancel anytime. By subscribing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  closeText: {
    fontSize: 24,
    color: colors.text.secondary,
    lineHeight: 28,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.primary.dark,
    textAlign: 'center',
    marginTop: 0,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  verseContainer: {
    backgroundColor: colors.primary.dark,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  verseText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.inverse,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  verseReference: {
    ...typography.textStyles.caption,
    color: colors.text.inverse,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    minHeight: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.background.primary,
  },
  periodButtonText: {
    ...typography.textStyles.button,
    color: colors.text.secondary,
  },
  periodButtonTextActive: {
    color: colors.primary.main,
  },
  periodSavings: {
    ...typography.textStyles.caption,
    color: colors.primary.main,
    marginTop: spacing.xs,
  },
  tiersContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  tierCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: colors.primary.main,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: spacing.lg,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    ...typography.textStyles.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  savingsText: {
    ...typography.textStyles.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  tierName: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  tierPrice: {
    ...typography.textStyles.h2,
    color: colors.primary.dark,
  },
  tierPeriod: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  featuresContainer: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkmark: {
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  featureText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  selectIndicator: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectIndicatorActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main,
  },
  selectDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.text.inverse,
  },
  freeNote: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
  },
  freeNoteTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  freeNoteText: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.background.primary,
  },
  subscribeButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    minHeight: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    ...typography.textStyles.button,
    color: colors.text.inverse,
  },
  restoreButton: {
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignItems: 'center',
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  restoreButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary.main,
  },
  legalText: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
