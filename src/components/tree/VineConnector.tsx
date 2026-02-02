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
}

/**
 * Horizontal connector between spouses
 */
export function SpouseConnector({ width }: SpouseConnectorProps) {
  return (
    <View style={[styles.spouseContainer, { width }]}>
      <Svg width={width} height={STROKE_WIDTH}>
        <Line
          x1={0}
          y1={STROKE_WIDTH / 2}
          x2={width}
          y2={STROKE_WIDTH / 2}
          stroke={VINE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  spouseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
