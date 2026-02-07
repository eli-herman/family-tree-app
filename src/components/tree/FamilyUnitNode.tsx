import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TreeNode } from './TreeNode';
import { FamilyUnit, FamilyMember, isFamilyUnit } from '../../types';
import { spacing } from '../../constants';

const GAP = spacing.md;
const SPOUSE_GAP = spacing.md; // 16px between spouses
const CONNECTOR_GAP = 48;

interface FamilyUnitNodeProps {
  unit: FamilyUnit;
  selectedMemberId: string | null;
  onMemberPress: (member: FamilyMember) => void;
}

const getChildKey = (child: FamilyUnit | FamilyMember) =>
  (isFamilyUnit(child) ? child.couple[0].id : child.id);

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
  const variant = depthVariant(unit.depth);

  const [a, b] = unit.couple;

  return (
    <View style={styles.container}>
      <View style={styles.coupleRow}>
        <TreeNode
          member={a}
          onPress={onMemberPress}
          isSelected={selectedMemberId === a.id}
          variant={variant}
        />
        <View style={{ width: SPOUSE_GAP }} />
        <TreeNode
          member={b}
          onPress={onMemberPress}
          isSelected={selectedMemberId === b.id}
          variant={variant}
        />
      </View>

      {unit.children.length > 0 && (
        <View style={{ height: CONNECTOR_GAP }} />
      )}

      {unit.children.length > 0 && (
        <View style={styles.childrenRow}>
          {unit.children.map((child) => {
            const childKey = getChildKey(child);
            return (
              <View key={childKey}>
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
            );
          })}
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
