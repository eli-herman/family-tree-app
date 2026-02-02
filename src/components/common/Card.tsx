import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'filled',
  padding = 'md',
  style,
}: CardProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`${padding}Padding`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  outlined: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filled: {
    backgroundColor: colors.background.secondary,
  },
  nonePadding: {
    padding: 0,
  },
  smPadding: {
    padding: spacing.sm,
  },
  mdPadding: {
    padding: spacing.md,
  },
  lgPadding: {
    padding: spacing.lg,
  },
});
