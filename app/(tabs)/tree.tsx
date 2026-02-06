import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TreeNode, SpouseConnector, FamilyConnector, FamilyUnitNode } from '../../src/components/tree';
import { VineVertical } from '../../src/components/tree';
import { colors, spacing } from '../../src/constants';
import { FamilyMember, isFamilyUnit } from '../../src/types';
import { useFamilyStore } from '../../src/stores';

const GAP = spacing.md;
const SPOUSE_GAP = spacing['2xl']; // 48px between ancestor branches
const COUPLE_GAP = spacing.md;     // 16px between spouses within a couple
const CONNECTOR_HEIGHT = 48;

export default function TreeScreen() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const isLoading = useFamilyStore((state) => state.isLoading);
  const buildFamilyTree = useFamilyStore((state) => state.buildFamilyTree);

  // Free-pan state
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    }),
  ).current;

  // Measurement state for connectors
  const [ancestorRowWidth, setAncestorRowWidth] = useState(0);
  const [childPositions, setChildPositions] = useState<number[]>([]);
  const [childrenRowWidth, setChildrenRowWidth] = useState(0);

  const handleAncestorRowLayout = useCallback((e: LayoutChangeEvent) => {
    setAncestorRowWidth(e.nativeEvent.layout.width);
  }, []);

  const handleChildLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      setChildPositions((prev) => {
        const next = [...prev];
        next[index] = x + width / 2;
        return next;
      });
    },
    [],
  );

  const handleChildrenRowLayout = useCallback((e: LayoutChangeEvent) => {
    setChildrenRowWidth(e.nativeEvent.layout.width);
  }, []);

  const handleMemberPress = (member: FamilyMember) => {
    setSelectedMember(member);
  };

  const tree = buildFamilyTree();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!tree) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Tree</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { spouse1Parents, spouse2Parents, centerUnit } = tree;
  const [spouse1, spouse2] = centerUnit.couple;

  const allChildMeasured =
    centerUnit.children.length > 0 &&
    childPositions.length === centerUnit.children.length &&
    childPositions.every((p) => p !== undefined);

  const connectorWidth = Math.max(ancestorRowWidth, childrenRowWidth);
  const childrenOffset =
    childrenRowWidth < connectorWidth ? (connectorWidth - childrenRowWidth) / 2 : 0;
  const ancestorOffset =
    ancestorRowWidth < connectorWidth ? (connectorWidth - ancestorRowWidth) / 2 : 0;
  const adjustedChildPositions = allChildMeasured
    ? childPositions.map((p) => p + childrenOffset)
    : [];
  const adjustedFocusCenter = ancestorRowWidth / 2 + ancestorOffset;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/app_logo_icon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Family Tree</Text>
      </View>

      <View style={styles.panArea} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.treeContainer,
            { transform: pan.getTranslateTransform() },
          ]}
        >
          {/* Grandparents row: two branches side by side */}
          <View style={styles.ancestorRow} onLayout={handleAncestorRowLayout}>
            {/* Left branch: spouse1's parents → spouse1 */}
            <View style={styles.ancestorBranch}>
              {spouse1Parents && (
                <>
                  <View style={styles.coupleRow}>
                    <TreeNode
                      member={spouse1Parents[0]}
                      onPress={handleMemberPress}
                      isSelected={selectedMember?.id === spouse1Parents[0].id}
                      variant="brown"
                    />
                    <SpouseConnector width={COUPLE_GAP} />
                    <TreeNode
                      member={spouse1Parents[1]}
                      onPress={handleMemberPress}
                      isSelected={selectedMember?.id === spouse1Parents[1].id}
                      variant="brown"
                    />
                  </View>
                  <VineVertical height={CONNECTOR_HEIGHT} />
                </>
              )}
              <TreeNode
                member={spouse1}
                onPress={handleMemberPress}
                isSelected={selectedMember?.id === spouse1.id}
                variant="green"
              />
            </View>

            <SpouseConnector width={SPOUSE_GAP} height={100} />

            {/* Right branch: spouse2's parents → spouse2 */}
            <View style={styles.ancestorBranch}>
              {spouse2Parents && (
                <>
                  <View style={styles.coupleRow}>
                    <TreeNode
                      member={spouse2Parents[0]}
                      onPress={handleMemberPress}
                      isSelected={selectedMember?.id === spouse2Parents[0].id}
                      variant="brown"
                    />
                    <SpouseConnector width={COUPLE_GAP} />
                    <TreeNode
                      member={spouse2Parents[1]}
                      onPress={handleMemberPress}
                      isSelected={selectedMember?.id === spouse2Parents[1].id}
                      variant="brown"
                    />
                  </View>
                  <VineVertical height={CONNECTOR_HEIGHT} />
                </>
              )}
              <TreeNode
                member={spouse2}
                onPress={handleMemberPress}
                isSelected={selectedMember?.id === spouse2.id}
                variant="green"
              />
            </View>
          </View>

          {/* Connector from focus couple to children */}
          {centerUnit.children.length > 0 && (
            <FamilyConnector
              childPositions={adjustedChildPositions}
              width={connectorWidth}
              coupleCenter={adjustedFocusCenter}
              height={CONNECTOR_HEIGHT}
            />
          )}

          {/* Children row */}
          {centerUnit.children.length > 0 && (
            <View style={styles.childrenRow} onLayout={handleChildrenRowLayout}>
              {centerUnit.children.map((child, i) => (
                <View
                  key={isFamilyUnit(child) ? child.couple[0].id : child.id}
                  onLayout={handleChildLayout(i)}
                >
                  {isFamilyUnit(child) ? (
                    <FamilyUnitNode
                      unit={child}
                      selectedMemberId={selectedMember?.id ?? null}
                      onMemberPress={handleMemberPress}
                    />
                  ) : (
                    <TreeNode
                      member={child}
                      onPress={handleMemberPress}
                      isSelected={selectedMember?.id === child.id}
                      variant="branch"
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  panArea: {
    flex: 1,
    overflow: 'hidden',
  },
  treeContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  ancestorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ancestorBranch: {
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
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});
