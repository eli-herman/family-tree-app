import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Avatar } from '../common';
import { colors, typography, spacing, borderRadius } from '../../constants';
import { FamilyMember } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

interface TreeNodeProps {
  member: FamilyMember;
  onPress: (member: FamilyMember) => void;
  isSelected?: boolean;
  variant?: 'green' | 'brown' | 'branch';
  scale?: 'normal' | 'small' | 'tiny';
}

const scaleConfig = {
  normal: { node: 100, avatar: 'lg' as const, fontSize: 14, padding: spacing.md },
  small: { node: 80, avatar: 'md' as const, fontSize: 12, padding: spacing.sm },
  tiny: { node: 64, avatar: 'sm' as const, fontSize: 10, padding: spacing.xs },
};

export function TreeNode({
  member,
  onPress,
  isSelected,
  variant = 'green',
  scale = 'normal'
}: TreeNodeProps) {
  const displayName = member.nickname || member.firstName;
  const config = scaleConfig[scale];

  const getRelationLabel = () => {
    if (member.relationships.some(r => r.type === 'child' && !member.relationships.some(r2 => r2.type === 'parent'))) {
      return 'Grandparent';
    }
    if (member.relationships.some(r => r.type === 'parent') && member.relationships.some(r => r.type === 'child')) {
      return 'Parent';
    }
    if (member.relationships.some(r => r.type === 'sibling')) {
      return 'Sibling';
    }
    return '';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        { minWidth: config.node, padding: config.padding }
      ]}
      onPress={() => onPress(member)}
      activeOpacity={0.8}
    >
      <Avatar name={displayName} size={config.avatar} variant={variant} />
      <Text style={[styles.name, { fontSize: config.fontSize }]} numberOfLines={1}>
        {displayName}
      </Text>
      {scale === 'normal' && (
        <Text style={styles.relation}>{getRelationLabel()}</Text>
      )}
    </TouchableOpacity>
  );
}

// Thin vine connector components - circuit-like aesthetic
export function VineVertical({ height = 24 }: { height?: number }) {
  return <View style={[styles.vineVertical, { height }]} />;
}

export function VineHorizontal({ width = 80 }: { width?: number }) {
  return <View style={[styles.vineHorizontal, { width }]} />;
}

export function VineCorner({ direction = 'left' }: { direction?: 'left' | 'right' }) {
  return (
    <View style={styles.vineCornerContainer}>
      <View style={[styles.vineVertical, { height: 12 }]} />
      <View style={[
        styles.vineHorizontal,
        { width: 20 },
        direction === 'left' ? { marginRight: 'auto' } : { marginLeft: 'auto' }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: colors.background.tertiary,
  },
  selected: {
    borderColor: colors.primary.main,
    borderWidth: 2,
  },
  name: {
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  relation: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  // Circuit-like vines
  vineVertical: {
    width: 2,
    backgroundColor: colors.brown.branch,
  },
  vineHorizontal: {
    height: 2,
    backgroundColor: colors.brown.branch,
  },
  vineCornerContainer: {
    alignItems: 'center',
  },
});
