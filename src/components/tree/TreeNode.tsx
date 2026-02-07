import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Avatar } from '../common';
import { colors, spacing, borderRadius } from '../../constants';
import { FamilyMember } from '../../types';

interface TreeNodeProps {
  member: FamilyMember;
  onPress: (member: FamilyMember) => void;
  isSelected?: boolean;
  variant?: 'green' | 'brown' | 'branch';
  scale?: 'normal' | 'small' | 'tiny';
  style?: ViewStyle;
}

const NODE_ASPECT = 1.28;
const getNodeHeight = (node: number) => Math.round(node * NODE_ASPECT);

const scaleConfig = {
  normal: {
    node: 100,
    height: getNodeHeight(100),
    avatar: 'lg' as const,
    fontSize: 14,
    padding: spacing.md,
  },
  small: {
    node: 80,
    height: getNodeHeight(80),
    avatar: 'md' as const,
    fontSize: 12,
    padding: spacing.sm,
  },
  tiny: {
    node: 64,
    height: getNodeHeight(64),
    avatar: 'sm' as const,
    fontSize: 10,
    padding: spacing.xs,
  },
};

export const TREE_NODE_WIDTH = scaleConfig.normal.node;
export const TREE_NODE_HEIGHT = scaleConfig.normal.height;

export function TreeNode({
  member,
  onPress,
  isSelected,
  variant = 'green',
  scale = 'normal',
  style,
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
        { width: config.node, height: config.height, padding: config.padding },
        style,
      ]}
      onPress={() => onPress(member)}
      activeOpacity={0.8}
    >
      {isSelected && <View pointerEvents="none" style={styles.selectedRing} />}
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
    position: 'relative',
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary.main,
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
