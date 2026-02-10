import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  LayoutChangeEvent,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { TreeNode, TREE_NODE_HEIGHT, TREE_NODE_WIDTH } from '../../src/components/tree';
import { Avatar } from '../../src/components/common';
import { borderRadius, colors, spacing } from '../../src/constants';
import { FamilyMember, FamilyUnit, isFamilyUnit } from '../../src/types';
import { useFamilyStore } from '../../src/stores';

const SPOUSE_GAP = spacing['2xl']; // 48px between ancestor branches
const COUPLE_GAP = spacing.md; // 16px between spouses within a couple
const CHILD_GAP = spacing.md;
const CONNECTOR_GAP = 48;
const LAYOUT_PADDING = 48;
const ZOOM_IN_MULTIPLIER = 3;
const CONNECTOR_STROKE = 2.5;
const CONNECTOR_COLOR = colors.brown.branch;

type LineSeg = { x1: number; y1: number; x2: number; y2: number };
type NodeFrame = { x: number; y: number; width: number; height: number };
type Variant = 'brown' | 'green' | 'branch';
type PartnerLine = {
  x1: number;
  x2: number;
  y: number;
  midX: number;
  bottomY: number;
  topY: number;
  partnerCount: 1 | 2;
};
type LayoutResult = {
  width: number;
  height: number;
  frames: Record<string, NodeFrame>;
  variants: Record<string, Variant>;
};
type TreeLayout = LayoutResult & { treeSize: { width: number; height: number } };

const EMPTY_LAYOUT: TreeLayout = {
  width: 1,
  height: 1,
  frames: {},
  variants: {},
  treeSize: { width: 1, height: 1 },
};

const depthVariant = (depth: number): Variant => {
  if (depth === 0) return 'brown';
  if (depth === 1) return 'green';
  return 'branch';
};

const layoutUnit = (unit: FamilyUnit): LayoutResult => {
  const partnerCount = unit.partners.length;
  const partnerWidth = partnerCount === 2 ? TREE_NODE_WIDTH * 2 + COUPLE_GAP : TREE_NODE_WIDTH;
  const partnerHeight = TREE_NODE_HEIGHT;

  const childLayouts = unit.children.map((child) => {
    if (isFamilyUnit(child)) {
      return layoutUnit(child);
    }
    return {
      width: TREE_NODE_WIDTH,
      height: TREE_NODE_HEIGHT,
      frames: {
        [child.id]: { x: 0, y: 0, width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT },
      },
      variants: {
        [child.id]: depthVariant(unit.depth + 1),
      },
    } satisfies LayoutResult;
  });

  const childrenRowWidth =
    childLayouts.reduce((sum, layout) => sum + layout.width, 0) +
    Math.max(childLayouts.length - 1, 0) * CHILD_GAP;
  const childrenRowHeight = childLayouts.length
    ? Math.max(...childLayouts.map((layout) => layout.height))
    : 0;

  const unitWidth = Math.max(partnerWidth, childrenRowWidth);
  const unitHeight =
    partnerHeight + (childLayouts.length > 0 ? CONNECTOR_GAP + childrenRowHeight : 0);

  const partnerRowX = (unitWidth - partnerWidth) / 2;
  const partnerRowY = 0;

  const frames: Record<string, NodeFrame> = {
    ...(partnerCount >= 1
      ? {
          [unit.partners[0].id]: {
            x: partnerRowX,
            y: partnerRowY,
            width: TREE_NODE_WIDTH,
            height: TREE_NODE_HEIGHT,
          },
        }
      : {}),
    ...(partnerCount === 2
      ? {
          [unit.partners[1].id]: {
            x: partnerRowX + TREE_NODE_WIDTH + COUPLE_GAP,
            y: partnerRowY,
            width: TREE_NODE_WIDTH,
            height: TREE_NODE_HEIGHT,
          },
        }
      : {}),
  };
  const variants: Record<string, Variant> = {
    ...(partnerCount >= 1 ? { [unit.partners[0].id]: depthVariant(unit.depth) } : {}),
    ...(partnerCount === 2 ? { [unit.partners[1].id]: depthVariant(unit.depth) } : {}),
  };

  if (childLayouts.length > 0) {
    let cursorX = (unitWidth - childrenRowWidth) / 2;
    const childRowY = partnerHeight + CONNECTOR_GAP;
    for (const layout of childLayouts) {
      Object.entries(layout.frames).forEach(([memberId, frame]) => {
        frames[memberId] = {
          x: frame.x + cursorX,
          y: frame.y + childRowY,
          width: frame.width,
          height: frame.height,
        };
      });
      Object.assign(variants, layout.variants);
      cursorX += layout.width + CHILD_GAP;
    }
  }

  return { width: unitWidth, height: unitHeight, frames, variants };
};

const buildTreeLayout = (
  centerUnit: FamilyUnit,
  spouse1Parents: FamilyMember[] | null,
  spouse2Parents: FamilyMember[] | null,
): TreeLayout => {
  const centerLayout = layoutUnit(centerUnit);
  const coupleWidth = TREE_NODE_WIDTH * 2 + COUPLE_GAP;
  const getParentWidth = (parents: FamilyMember[] | null) => {
    if (!parents || parents.length === 0) return 0;
    return parents.length === 2 ? coupleWidth : TREE_NODE_WIDTH;
  };
  const leftWidth = getParentWidth(spouse1Parents);
  const rightWidth = getParentWidth(spouse2Parents);
  const hasAncestors = leftWidth > 0 || rightWidth > 0;
  const topRowWidth =
    leftWidth > 0 && rightWidth > 0 ? leftWidth + rightWidth + SPOUSE_GAP : leftWidth + rightWidth;
  const topRowHeight = hasAncestors ? TREE_NODE_HEIGHT : 0;

  const baseWidth = Math.max(centerLayout.width, topRowWidth);
  const baseHeight = hasAncestors
    ? topRowHeight + CONNECTOR_GAP + centerLayout.height
    : centerLayout.height;

  const centerOffsetX = (baseWidth - centerLayout.width) / 2;
  const centerOffsetY = hasAncestors ? topRowHeight + CONNECTOR_GAP : 0;

  const frames: Record<string, NodeFrame> = {};
  const variants: Record<string, Variant> = { ...centerLayout.variants };

  Object.entries(centerLayout.frames).forEach(([memberId, frame]) => {
    frames[memberId] = {
      x: frame.x + centerOffsetX,
      y: frame.y + centerOffsetY,
      width: frame.width,
      height: frame.height,
    };
  });

  if (hasAncestors) {
    const topRowX = (baseWidth - topRowWidth) / 2;
    const leftX = topRowX;
    const rightX =
      leftWidth > 0 ? topRowX + leftWidth + (rightWidth > 0 ? SPOUSE_GAP : 0) : topRowX;

    if (spouse1Parents && spouse1Parents.length > 0) {
      frames[spouse1Parents[0].id] = {
        x: leftX,
        y: 0,
        width: TREE_NODE_WIDTH,
        height: TREE_NODE_HEIGHT,
      };
      variants[spouse1Parents[0].id] = depthVariant(0);
      if (spouse1Parents.length === 2) {
        frames[spouse1Parents[1].id] = {
          x: leftX + TREE_NODE_WIDTH + COUPLE_GAP,
          y: 0,
          width: TREE_NODE_WIDTH,
          height: TREE_NODE_HEIGHT,
        };
        variants[spouse1Parents[1].id] = depthVariant(0);
      }
    }

    if (spouse2Parents && spouse2Parents.length > 0) {
      frames[spouse2Parents[0].id] = {
        x: rightX,
        y: 0,
        width: TREE_NODE_WIDTH,
        height: TREE_NODE_HEIGHT,
      };
      variants[spouse2Parents[0].id] = depthVariant(0);
      if (spouse2Parents.length === 2) {
        frames[spouse2Parents[1].id] = {
          x: rightX + TREE_NODE_WIDTH + COUPLE_GAP,
          y: 0,
          width: TREE_NODE_WIDTH,
          height: TREE_NODE_HEIGHT,
        };
        variants[spouse2Parents[1].id] = depthVariant(0);
      }
    }
  }

  const squareSide = Math.max(baseWidth, baseHeight) + LAYOUT_PADDING * 2;
  const squareOffsetX = (squareSide - baseWidth) / 2;
  const squareOffsetY = (squareSide - baseHeight) / 2;

  Object.entries(frames).forEach(([memberId, frame]) => {
    frames[memberId] = {
      x: frame.x + squareOffsetX,
      y: frame.y + squareOffsetY,
      width: frame.width,
      height: frame.height,
    };
  });

  return {
    width: baseWidth,
    height: baseHeight,
    frames,
    variants,
    treeSize: { width: squareSide, height: squareSide },
  };
};

export default function TreeScreen() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isManageListOpen, setIsManageListOpen] = useState(false);
  const router = useRouter();
  const isLoading = useFamilyStore((state) => state.isLoading);
  const buildFamilyTree = useFamilyStore((state) => state.buildFamilyTree);
  const members = useFamilyStore((state) => state.members);

  // Gesture shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Layout measurement for dynamic min-scale
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });

  const handleViewportLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewportSize({ width, height });
  }, []);

  const tree = buildFamilyTree();
  const spouse1Parents = tree?.spouse1Parents ?? null;
  const spouse2Parents = tree?.spouse2Parents ?? null;
  const centerUnit = tree?.centerUnit ?? null;
  const spouse1 = centerUnit?.partners[0] ?? null;
  const spouse2 = centerUnit?.partners[1] ?? null;

  const layout = useMemo(() => {
    if (!centerUnit) return EMPTY_LAYOUT;
    return buildTreeLayout(centerUnit, spouse1Parents, spouse2Parents);
  }, [centerUnit, spouse1Parents, spouse2Parents]);

  const minScale = useMemo(() => {
    const fit = Math.min(
      viewportSize.width / layout.treeSize.width,
      viewportSize.height / layout.treeSize.height,
      1,
    );
    return Number.isFinite(fit) ? fit : 0.3;
  }, [layout.treeSize.height, layout.treeSize.width, viewportSize.height, viewportSize.width]);
  const maxScale = Math.max(minScale * ZOOM_IN_MULTIPLIER, 1);

  useEffect(() => {
    const clamped = Math.min(Math.max(savedScale.value, minScale), maxScale);
    scale.value = clamped;
    savedScale.value = clamped;
  }, [maxScale, minScale, savedScale, scale]);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, minScale), maxScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleMemberPress = (member: FamilyMember) => {
    setSelectedMember(member);
    router.push(`/member/${member.id}`);
  };

  const handleManageFamily = () => {
    if (!members.length) return;
    setIsManageListOpen(true);
  };

  const closeManageList = () => {
    setIsManageListOpen(false);
  };

  const handleManageSelect = (member: FamilyMember) => {
    setIsManageListOpen(false);
    setSelectedMember(member);
    router.push({ pathname: '/member/[id]', params: { id: member.id, manage: '1' } });
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName);
      if (last !== 0) return last;
      return a.firstName.localeCompare(b.firstName);
    });
  }, [members]);

  const connectors = useMemo(() => {
    if (!centerUnit) {
      return { spouseLines: [], stemLines: [], railLines: [], dropLines: [] };
    }
    const spouseLines: LineSeg[] = [];
    const stemLines: LineSeg[] = [];
    const railLines: LineSeg[] = [];
    const dropLines: LineSeg[] = [];

    const getFrame = (memberId: string) => layout.frames[memberId];

    const getPartnerLine = (partnerIds: string[]): PartnerLine | null => {
      if (partnerIds.length === 0) return null;
      if (partnerIds.length === 1) {
        const frame = getFrame(partnerIds[0]);
        if (!frame) return null;
        const midX = frame.x + frame.width / 2;
        const y = frame.y + frame.height / 2;
        return {
          x1: midX,
          x2: midX,
          y,
          midX,
          bottomY: frame.y + frame.height,
          topY: frame.y,
          partnerCount: 1 as const,
        };
      }

      const aFrame = getFrame(partnerIds[0]);
      const bFrame = getFrame(partnerIds[1]);
      if (!aFrame || !bFrame) return null;

      const isALeft = aFrame.x <= bFrame.x;
      const left = isALeft ? aFrame : bFrame;
      const right = isALeft ? bFrame : aFrame;
      const leftMidY = left.y + left.height / 2;
      const rightMidY = right.y + right.height / 2;
      const y = (leftMidY + rightMidY) / 2;
      const x1 = left.x + left.width;
      const x2 = right.x;
      const midX = (x1 + x2) / 2;
      const bottomY = Math.max(left.y + left.height, right.y + right.height);
      const topY = Math.min(left.y, right.y);
      return { x1, x2, y, midX, bottomY, topY, partnerCount: 2 as const };
    };

    const getChildAnchor = (child: FamilyUnit | FamilyMember) => {
      if (isFamilyUnit(child)) {
        const line = getPartnerLine(child.partners.map((partner) => partner.id));
        if (!line) return null;
        return { x: line.midX, y: line.y };
      }
      const frame = getFrame(child.id);
      if (!frame) return null;
      return { x: frame.x + frame.width / 2, y: frame.y };
    };

    const addUnit = (unit: FamilyUnit) => {
      const line = getPartnerLine(unit.partners.map((partner) => partner.id));
      if (!line) return;

      if (line.partnerCount === 2) {
        spouseLines.push({ x1: line.x1, y1: line.y, x2: line.x2, y2: line.y });
      }

      const anchors = unit.children
        .map(getChildAnchor)
        .filter((anchor): anchor is { x: number; y: number } => anchor !== null);

      if (anchors.length === 0) return;

      const anchorXs = anchors.map((a) => a.x);
      const leftmostX = Math.min(line.midX, ...anchorXs);
      const rightmostX = Math.max(line.midX, ...anchorXs);
      const topY = Math.min(...anchors.map((a) => a.y));
      const railCandidate = Math.max(line.y + spacing.sm, topY - spacing.sm);
      const railY = Math.min(railCandidate, topY);

      stemLines.push({ x1: line.midX, y1: line.y, x2: line.midX, y2: railY });
      railLines.push({ x1: leftmostX, y1: railY, x2: rightmostX, y2: railY });
      for (const anchor of anchors) {
        dropLines.push({ x1: anchor.x, y1: railY, x2: anchor.x, y2: anchor.y });
      }
    };

    const traverse = (unit: FamilyUnit) => {
      addUnit(unit);
      unit.children.filter(isFamilyUnit).forEach(traverse);
    };

    traverse(centerUnit);

    if (spouse1Parents && spouse1) {
      addUnit({ partners: spouse1Parents, children: [spouse1], depth: 0 });
    }
    if (spouse2Parents && spouse2) {
      addUnit({ partners: spouse2Parents, children: [spouse2], depth: 0 });
    }

    return { spouseLines, stemLines, railLines, dropLines };
  }, [centerUnit, layout.frames, spouse1Parents, spouse2Parents, spouse1, spouse2]);

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

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
          <Text style={styles.title} accessibilityRole="header">
            Family Tree
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image source={require('../../assets/app_logo_icon.png')} style={styles.logo} />
        <Text style={styles.title} accessibilityRole="header">
          Family Tree
        </Text>
      </View>
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.manageButton, !members.length && styles.manageButtonDisabled]}
          onPress={handleManageFamily}
          disabled={!members.length}
          accessibilityRole="button"
          accessibilityLabel="Manage family"
          accessibilityHint="Opens the add or edit family member flow"
        >
          <Text style={styles.manageButtonText}>Manage Family</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isManageListOpen}
        onRequestClose={closeManageList}
      >
        <View style={styles.manageOverlay}>
          <View style={styles.manageCard}>
            <View style={styles.manageHeaderRow}>
              <Text style={styles.manageTitle} accessibilityRole="header">
                Manage Family
              </Text>
              <TouchableOpacity
                onPress={closeManageList}
                accessibilityRole="button"
                accessibilityLabel="Close manage family list"
              >
                <Text style={styles.manageCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.manageSubtitle}>
              Choose a family member to add relatives or edit details.
            </Text>

            <ScrollView contentContainerStyle={styles.manageList}>
              {sortedMembers.map((member) => {
                const displayName = member.nickname || `${member.firstName} ${member.lastName}`;
                const secondaryName = member.nickname && `${member.firstName} ${member.lastName}`;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.manageRow}
                    onPress={() => handleManageSelect(member)}
                    accessibilityRole="button"
                    accessibilityLabel={`Manage ${displayName}`}
                  >
                    <Avatar name={member.firstName} size="sm" variant="green" />
                    <View style={styles.manageRowInfo}>
                      <Text style={styles.manageRowName}>{displayName}</Text>
                      {secondaryName ? (
                        <Text style={styles.manageRowMeta}>{secondaryName}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <GestureDetector gesture={composed}>
        <View style={styles.panArea} onLayout={handleViewportLayout}>
          <Animated.View style={animatedStyle}>
            <View
              style={[
                styles.treeContainer,
                { width: layout.treeSize.width, height: layout.treeSize.height },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.connectorLayer,
                  { width: layout.treeSize.width, height: layout.treeSize.height },
                ]}
              >
                <Svg width={layout.treeSize.width} height={layout.treeSize.height}>
                  {connectors.spouseLines.map((line, index) => (
                    <Line
                      key={`spouse-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                  {connectors.stemLines.map((line, index) => (
                    <Line
                      key={`stem-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                  {connectors.railLines.map((line, index) => (
                    <Line
                      key={`rail-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                  {connectors.dropLines.map((line, index) => (
                    <Line
                      key={`drop-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={CONNECTOR_COLOR}
                      strokeWidth={CONNECTOR_STROKE}
                      strokeLinecap="round"
                    />
                  ))}
                </Svg>
              </View>

              {Array.from(memberMap.entries()).map(([memberId, member]) => {
                const frame = layout.frames[memberId];
                if (!frame) return null;
                return (
                  <TreeNode
                    key={memberId}
                    member={member}
                    onPress={handleMemberPress}
                    isSelected={selectedMember?.id === memberId}
                    variant={layout.variants[memberId] ?? 'green'}
                    style={{
                      position: 'absolute',
                      left: frame.x,
                      top: frame.y,
                      width: frame.width,
                      height: frame.height,
                    }}
                  />
                );
              })}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
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
  actionBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  manageButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  manageButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  manageButtonDisabled: {
    backgroundColor: colors.background.tertiary,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeContainer: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  connectorLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  manageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  manageCard: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  manageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  manageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  manageCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  manageSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  manageList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  manageRowInfo: {
    marginLeft: spacing.sm,
  },
  manageRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  manageRowMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
