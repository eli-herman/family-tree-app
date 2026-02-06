import React, { useState, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { TreeNode } from './TreeNode';
import { SpouseConnector, FamilyConnector } from './VineConnector';
import { FamilyUnit, FamilyMember, isFamilyUnit } from '../../types';
import { spacing } from '../../constants';

const GAP = spacing.md;
const SPOUSE_GAP = spacing.md; // 16px between spouses

interface FamilyUnitNodeProps {
  unit: FamilyUnit;
  selectedMemberId: string | null;
  onMemberPress: (member: FamilyMember) => void;
}

const depthVariant = (depth: number): 'brown' | 'green' | 'branch' => {
  if (depth === 0) return 'brown';
  if (depth === 1) return 'green';
  return 'branch';
};

export function FamilyUnitNode({
  unit,
  selectedMemberId,
  onMemberPress,
}: FamilyUnitNodeProps) {
  const [childPositions, setChildPositions] = useState<number[]>([]);
  const [childrenRowWidth, setChildrenRowWidth] = useState(0);
  const [coupleWidth, setCoupleWidth] = useState(0);

  const variant = depthVariant(unit.depth);

  const handleChildLayout = useCallback(
    (index: number) => (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      const center = x + width / 2;
      setChildPositions((prev) => {
        const next = [...prev];
        next[index] = center;
        return next;
      });
    },
    [],
  );

  const handleChildrenRowLayout = useCallback((event: LayoutChangeEvent) => {
    setChildrenRowWidth(event.nativeEvent.layout.width);
  }, []);

  const handleCoupleLayout = useCallback((event: LayoutChangeEvent) => {
    setCoupleWidth(event.nativeEvent.layout.width);
  }, []);

  const [a, b] = unit.couple;
  const coupleCenter = coupleWidth / 2;

  const allMeasured =
    unit.children.length > 0 &&
    childPositions.length === unit.children.length &&
    childPositions.every((p) => p !== undefined);

  const connectorWidth = Math.max(coupleWidth, childrenRowWidth);

  const childrenOffset =
    childrenRowWidth < connectorWidth
      ? (connectorWidth - childrenRowWidth) / 2
      : 0;
  const coupleOffset =
    coupleWidth < connectorWidth ? (connectorWidth - coupleWidth) / 2 : 0;

  const adjustedPositions = allMeasured
    ? childPositions.map((p) => p + childrenOffset)
    : [];
  const adjustedCoupleCenter = coupleCenter + coupleOffset;

  return (
    <View style={styles.container}>
      <View style={styles.coupleRow} onLayout={handleCoupleLayout}>
        <TreeNode
          member={a}
          onPress={onMemberPress}
          isSelected={selectedMemberId === a.id}
          variant={variant}
        />
        <SpouseConnector width={SPOUSE_GAP} />
        <TreeNode
          member={b}
          onPress={onMemberPress}
          isSelected={selectedMemberId === b.id}
          variant={variant}
        />
      </View>

      {unit.children.length > 0 && (
        <FamilyConnector
          childPositions={adjustedPositions}
          width={connectorWidth}
          coupleCenter={adjustedCoupleCenter}
          height={48}
        />
      )}

      {unit.children.length > 0 && (
        <View style={styles.childrenRow} onLayout={handleChildrenRowLayout}>
          {unit.children.map((child, i) => (
            <View key={isFamilyUnit(child) ? child.couple[0].id : child.id} onLayout={handleChildLayout(i)}>
              {isFamilyUnit(child) ? (
                <FamilyUnitNode
                  unit={child}
                  selectedMemberId={selectedMemberId}
                  onMemberPress={onMemberPress}
                />
              ) : (
                <TreeNode
                  member={child}
                  onPress={onMemberPress}
                  isSelected={selectedMemberId === child.id}
                  variant={depthVariant(unit.depth + 1)}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  coupleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childrenRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GAP,
  },
});
