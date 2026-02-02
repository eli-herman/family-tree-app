import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants';

const STROKE_WIDTH = 2.5;
const CORNER_RADIUS = 8;
const VINE_COLOR = colors.brown.branch;

interface VineConnectorProps {
  /** Number of children nodes to connect to */
  childCount: number;
  /** Width of each child node */
  nodeWidth: number;
  /** Gap between nodes */
  gap: number;
  /** Height of the vertical drop from parent */
  dropHeight?: number;
  /** Height of the vertical rise to children */
  riseHeight?: number;
}

/**
 * Draws a smooth, connected vine from a single parent point
 * down to multiple children with rounded corners
 */
export function VineConnector({
  childCount,
  nodeWidth,
  gap,
  dropHeight = 24,
  riseHeight = 20,
}: VineConnectorProps) {
  if (childCount === 0) return null;

  // Calculate total width needed
  const totalWidth = childCount * nodeWidth + (childCount - 1) * gap;
  const totalHeight = dropHeight + riseHeight;

  // Center point at top
  const centerX = totalWidth / 2;

  // If only one child, draw a simple vertical line
  if (childCount === 1) {
    return (
      <View style={{ width: totalWidth, height: totalHeight, alignItems: 'center' }}>
        <Svg width={STROKE_WIDTH} height={totalHeight}>
          <Path
            d={`M ${STROKE_WIDTH / 2} 0 L ${STROKE_WIDTH / 2} ${totalHeight}`}
            stroke={VINE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Calculate x positions for each child (center of each node)
  const childPositions: number[] = [];
  for (let i = 0; i < childCount; i++) {
    const x = nodeWidth / 2 + i * (nodeWidth + gap);
    childPositions.push(x);
  }

  // Build the SVG path
  // Start from center top, go down, then branch out to each child
  const horizontalY = dropHeight;
  const leftX = childPositions[0];
  const rightX = childPositions[childPositions.length - 1];

  let pathData = '';

  // Main vertical drop from center
  pathData += `M ${centerX} 0 `;
  pathData += `L ${centerX} ${horizontalY - CORNER_RADIUS} `;

  // Draw left side with rounded corner
  pathData += `Q ${centerX} ${horizontalY} ${centerX - CORNER_RADIUS} ${horizontalY} `;
  pathData += `L ${leftX + CORNER_RADIUS} ${horizontalY} `;
  pathData += `Q ${leftX} ${horizontalY} ${leftX} ${horizontalY + CORNER_RADIUS} `;
  pathData += `L ${leftX} ${totalHeight} `;

  // Go back to center and draw right side
  pathData += `M ${centerX} ${horizontalY - CORNER_RADIUS} `;
  pathData += `Q ${centerX} ${horizontalY} ${centerX + CORNER_RADIUS} ${horizontalY} `;
  pathData += `L ${rightX - CORNER_RADIUS} ${horizontalY} `;
  pathData += `Q ${rightX} ${horizontalY} ${rightX} ${horizontalY + CORNER_RADIUS} `;
  pathData += `L ${rightX} ${totalHeight} `;

  // Draw drops for middle children
  for (let i = 1; i < childCount - 1; i++) {
    const x = childPositions[i];
    pathData += `M ${x} ${horizontalY} L ${x} ${totalHeight} `;
  }

  return (
    <View style={{ width: totalWidth, height: totalHeight }}>
      <Svg width={totalWidth} height={totalHeight}>
        <Path
          d={pathData}
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
  /** Width of the connection */
  width: number;
}

/**
 * Horizontal connector between spouses with rounded ends
 */
export function SpouseConnector({ width }: SpouseConnectorProps) {
  const height = STROKE_WIDTH;

  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      <Svg width={width} height={height}>
        <Path
          d={`M 0 ${height / 2} L ${width} ${height / 2}`}
          stroke={VINE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
