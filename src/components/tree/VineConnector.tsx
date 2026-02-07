import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { colors } from '../../constants';

const STROKE_WIDTH = 2.5;
const CORNER_RADIUS = 10;
const VINE_COLOR = colors.brown.branch;

interface GenerationConnectorProps {
  /** Number of children to connect to */
  childCount: number;
  /** Total width of the children row */
  rowWidth: number;
  /** Height of the connector */
  height?: number;
}

/**
 * Draws a smooth branching connector from a single point
 * down to multiple evenly-spaced children
 */
export function GenerationConnector({
  childCount,
  rowWidth,
  height = 48,
}: GenerationConnectorProps) {
  if (childCount === 0) return null;

  const centerX = rowWidth / 2;
  const midY = height / 2;

  // Single child - just a vertical line
  if (childCount === 1) {
    return (
      <View style={[styles.container, { width: rowWidth, height }]}>
        <Svg width={rowWidth} height={height}>
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={height}
            stroke={VINE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }

  // Calculate spacing - children are evenly distributed across rowWidth
  const spacing = rowWidth / childCount;
  const firstChildX = spacing / 2;
  const lastChildX = rowWidth - spacing / 2;

  // Build path: vertical drop, horizontal bar with rounded corners, vertical rises
  let path = '';

  // Start from center top, go down to mid-height
  path += `M ${centerX} 0 `;
  path += `L ${centerX} ${midY - CORNER_RADIUS} `;

  // Curve left
  path += `Q ${centerX} ${midY}, ${centerX - CORNER_RADIUS} ${midY} `;

  // Go to first child position with rounded corner down
  path += `L ${firstChildX + CORNER_RADIUS} ${midY} `;
  path += `Q ${firstChildX} ${midY}, ${firstChildX} ${midY + CORNER_RADIUS} `;
  path += `L ${firstChildX} ${height} `;

  // Back to center, curve right
  path += `M ${centerX} ${midY - CORNER_RADIUS} `;
  path += `Q ${centerX} ${midY}, ${centerX + CORNER_RADIUS} ${midY} `;

  // Go to last child position with rounded corner down
  path += `L ${lastChildX - CORNER_RADIUS} ${midY} `;
  path += `Q ${lastChildX} ${midY}, ${lastChildX} ${midY + CORNER_RADIUS} `;
  path += `L ${lastChildX} ${height} `;

  // Add vertical lines for middle children
  for (let i = 1; i < childCount - 1; i++) {
    const x = firstChildX + i * spacing;
    path += `M ${x} ${midY} L ${x} ${height} `;
  }

  return (
    <View style={[styles.container, { width: rowWidth, height }]}>
      <Svg width={rowWidth} height={height}>
        <Path
          d={path}
          stroke={VINE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

interface SpouseConnectorProps {
  width: number;
  /** Optional height; when provided the line draws at height/2 instead of flush */
  height?: number;
}

/**
 * Horizontal connector between spouses.
 * When `height` is provided the SVG is that tall and the line sits at the vertical center,
 * which is useful for aligning the connector with the center of adjacent TreeNodes.
 */
export function SpouseConnector({ width, height }: SpouseConnectorProps) {
  const svgHeight = height ?? STROKE_WIDTH;
  const lineY = svgHeight / 2;

  return (
    <View style={[styles.spouseContainer, { width, height: svgHeight }]}>
      <Svg width={width} height={svgHeight}>
        <Line
          x1={0}
          y1={lineY}
          x2={width}
          y2={lineY}
          stroke={VINE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

interface FamilyConnectorProps {
  /** X-center positions of each child relative to the children row */
  childPositions: number[];
  /** Total width of the children row */
  width: number;
  /** X-center of the couple above */
  coupleCenter: number;
  /** Height of the connector */
  height?: number;
}

/**
 * Draws SVG paths from a couple center down to measured child positions.
 * Renders nothing until childPositions are provided (first frame).
 */
export function FamilyConnector({
  childPositions,
  width,
  coupleCenter,
  height = 48,
}: FamilyConnectorProps) {
  if (childPositions.length === 0 || width === 0) return null;

  const midY = height / 2;

  // Single child - just a vertical line from couple center to child center
  if (childPositions.length === 1) {
    const childX = childPositions[0];
    let path = `M ${coupleCenter} 0 L ${coupleCenter} ${midY}`;
    if (Math.abs(childX - coupleCenter) > 1) {
      // Offset child: go down, across, then down
      path += ` L ${childX} ${midY} L ${childX} ${height}`;
    } else {
      path += ` L ${coupleCenter} ${height}`;
    }
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          <Path
            d={path}
            stroke={VINE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  const leftmost = Math.min(...childPositions);
  const rightmost = Math.max(...childPositions);

  let path = '';

  // 1. Vertical stem from couple center down to the horizontal rail
  path += `M ${coupleCenter} 0 L ${coupleCenter} ${midY} `;

  // 2. Horizontal rail from leftmost child to rightmost child at midY
  path += `M ${leftmost} ${midY} L ${rightmost} ${midY} `;

  // 3. Vertical drop for EVERY child from rail to bottom
  for (const pos of childPositions) {
    path += `M ${pos} ${midY} L ${pos} ${height} `;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Path
          d={path}
          stroke={VINE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  spouseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
