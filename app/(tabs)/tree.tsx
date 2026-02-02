import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TreeNode, VineConnector, SpouseConnector } from '../../src/components/tree';
import { colors, spacing } from '../../src/constants';
import { mockFamilyMembers } from '../../src/utils/mockData';
import { FamilyMember } from '../../src/types';

const NODE_SIZES = {
  normal: 100,
  small: 80,
  tiny: 64,
};

const GAP = spacing.md; // 16px gap between nodes

export default function TreeScreen() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const handleMemberPress = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  // Group members by generation
  const grandparents = mockFamilyMembers.filter(
    (m) => m.relationships.some((r) => r.type === 'child') &&
           !m.relationships.some((r) => r.type === 'parent')
  );

  const parents = mockFamilyMembers.filter(
    (m) => m.relationships.some((r) => r.type === 'parent') &&
           (m.relationships.some((r) => r.type === 'child') || m.relationships.some((r) => r.type === 'spouse'))
  );

  const children = mockFamilyMembers.filter(
    (m) => !grandparents.includes(m) && !parents.includes(m)
  );

  // Calculate scale based on total members in a row
  const getScale = (count: number): 'normal' | 'small' | 'tiny' => {
    if (count <= 2) return 'normal';
    if (count <= 4) return 'small';
    return 'tiny';
  };

  const grandparentsScale = getScale(grandparents.length);
  const parentsScale = getScale(parents.length);
  const childrenScale = getScale(children.length);

  // Get node width for a scale
  const getNodeWidth = (scale: 'normal' | 'small' | 'tiny') => NODE_SIZES[scale];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Tree</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          <View style={styles.treeContainer}>
            {/* Grandparents Row */}
            {grandparents.length > 0 && (
              <View style={styles.generation}>
                {grandparents.map((member, index) => (
                  <React.Fragment key={member.id}>
                    <TreeNode
                      member={member}
                      onPress={handleMemberPress}
                      isSelected={selectedMember?.id === member.id}
                      variant="brown"
                      scale={grandparentsScale}
                    />
                    {index < grandparents.length - 1 && (
                      <SpouseConnector width={GAP} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Connector from grandparents to parents */}
            {grandparents.length > 0 && parents.length > 0 && (
              <VineConnector
                childCount={parents.length}
                nodeWidth={getNodeWidth(parentsScale)}
                gap={GAP}
                dropHeight={28}
                riseHeight={24}
              />
            )}

            {/* Parents Row */}
            {parents.length > 0 && (
              <View style={styles.generation}>
                {parents.map((member) => (
                  <TreeNode
                    key={member.id}
                    member={member}
                    onPress={handleMemberPress}
                    isSelected={selectedMember?.id === member.id}
                    variant="green"
                    scale={parentsScale}
                  />
                ))}
              </View>
            )}

            {/* Connector from parents to children */}
            {parents.length > 0 && children.length > 0 && (
              <VineConnector
                childCount={children.length}
                nodeWidth={getNodeWidth(childrenScale)}
                gap={GAP}
                dropHeight={28}
                riseHeight={24}
              />
            )}

            {/* Children Row */}
            {children.length > 0 && (
              <View style={styles.generation}>
                {children.map((member) => (
                  <TreeNode
                    key={member.id}
                    member={member}
                    onPress={handleMemberPress}
                    isSelected={selectedMember?.id === member.id}
                    variant="branch"
                    scale={childrenScale}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  horizontalContent: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100%',
  },
  treeContainer: {
    alignItems: 'center',
  },
  generation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: GAP,
  },
});
