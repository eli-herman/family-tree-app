/**
 * VineConnector.tsx
 *
 * SVG-based vine connector components that draw the lines connecting
 * family members in the family tree visualization. These connectors
 * create a circuit-like aesthetic with thin, rounded-cap strokes in
 * the branch brown color (#D4C4B0).
 *
 * Three connector types are exported:
 *
 *   1. GenerationConnector - Draws a branching connector from a single
 *      point (parent couple) downward to multiple evenly-spaced children.
 *      Uses smooth rounded corners at branch points.
 *
 *   2. SpouseConnector - Draws a horizontal line between two spouse
 *      TreeNodes, optionally centered vertically within a given height.
 *
 *   3. FamilyConnector - Draws SVG paths from a couple's center point
 *      down to measured child positions. Unlike GenerationConnector
 *      (which assumes even spacing), this uses actual measured x-positions
 *      for precise layout alignment.
 *
 * All connectors use react-native-svg for cross-platform SVG rendering.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
// SVG components from react-native-svg for drawing vector lines and curves
import Svg, { Path, Line } from 'react-native-svg';
// Import the app's color constants for the vine color
import { colors } from '../../constants';

/** Thickness of all vine connector strokes in pixels */
const STROKE_WIDTH = 2.5;

/** Radius for rounded corners at branch junctions (in the GenerationConnector) */
const CORNER_RADIUS = 10;

/** The color used for all vine connectors - the "branch" brown from the design system */
const VINE_COLOR = colors.brown.branch;

/**
 * Props for the GenerationConnector component.
 */
interface GenerationConnectorProps {
  /** Number of children to connect to */
  childCount: number;
  /** Total width of the children row in pixels */
  rowWidth: number;
  /** Height of the connector area in pixels (default: 48) */
  height?: number;
}

/**
 * GenerationConnector - draws a smooth branching connector from a single center
 * point at the top down to multiple evenly-spaced children positions at the bottom.
 *
 * For a single child: draws a straight vertical line.
 * For multiple children: draws a T-shape with rounded corners:
 *   - Vertical stem from center top to mid-height
 *   - Horizontal bar at mid-height spanning from first to last child
 *   - Vertical drops from the bar down to each child position
 *
 * Uses SVG quadratic Bezier curves (Q) for smooth rounded corners at branch points.
 *
 * @param childCount - How many children to connect to
 * @param rowWidth - The total pixel width of the children row
 * @param height - The vertical height of the connector area (default: 48px)
 */
export function GenerationConnector({
  childCount,
  rowWidth,
  height = 48, // Default connector height of 48px
}: GenerationConnectorProps) {
  // If there are no children, render nothing
  if (childCount === 0) return null;

  // Calculate the horizontal center of the connector area
  const centerX = rowWidth / 2;
  // Calculate the vertical midpoint where the horizontal bar will be drawn
  const midY = height / 2;

  // Single child - just a vertical line from top center to bottom center
  if (childCount === 1) {
    return (
      <View style={[styles.container, { width: rowWidth, height }]}>
        <Svg width={rowWidth} height={height}>
          {/* Straight vertical line from the parent down to the single child */}
          <Line
            x1={centerX} // Start at horizontal center
            y1={0} // Start at the top
            x2={centerX} // End at horizontal center (straight down)
            y2={height} // End at the bottom
            stroke={VINE_COLOR} // Branch brown color
            strokeWidth={STROKE_WIDTH} // 2.5px thickness
            strokeLinecap="round" // Rounded line ends
          />
        </Svg>
      </View>
    );
  }

  // Calculate spacing for multiple children - evenly distributed across rowWidth
  const spacing = rowWidth / childCount; // Width allotted to each child
  const firstChildX = spacing / 2; // X position of the first (leftmost) child center
  const lastChildX = rowWidth - spacing / 2; // X position of the last (rightmost) child center

  // Build the SVG path string piece by piece
  let path = '';

  // Step 1: Draw vertical stem from top center down to just above the midpoint
  path += `M ${centerX} 0 `; // Move to top center
  path += `L ${centerX} ${midY - CORNER_RADIUS} `; // Line down to where the curve begins

  // Step 2: Curve from the vertical stem to the left along the horizontal bar
  // Q draws a quadratic Bezier curve: Q controlX controlY, endX endY
  path += `Q ${centerX} ${midY}, ${centerX - CORNER_RADIUS} ${midY} `;

  // Step 3: Continue left to the first child position, then curve downward
  path += `L ${firstChildX + CORNER_RADIUS} ${midY} `; // Horizontal line to near the first child
  path += `Q ${firstChildX} ${midY}, ${firstChildX} ${midY + CORNER_RADIUS} `; // Curve downward
  path += `L ${firstChildX} ${height} `; // Vertical drop to the first child

  // Step 4: Go back to center and curve right along the horizontal bar
  path += `M ${centerX} ${midY - CORNER_RADIUS} `; // Move back to the stem junction
  path += `Q ${centerX} ${midY}, ${centerX + CORNER_RADIUS} ${midY} `; // Curve to the right

  // Step 5: Continue right to the last child position, then curve downward
  path += `L ${lastChildX - CORNER_RADIUS} ${midY} `; // Horizontal line to near the last child
  path += `Q ${lastChildX} ${midY}, ${lastChildX} ${midY + CORNER_RADIUS} `; // Curve downward
  path += `L ${lastChildX} ${height} `; // Vertical drop to the last child

  // Step 6: Add straight vertical drops for all middle children (between first and last)
  for (let i = 1; i < childCount - 1; i++) {
    const x = firstChildX + i * spacing; // Calculate the x position of this middle child
    path += `M ${x} ${midY} L ${x} ${height} `; // Vertical line from the bar down to the child
  }

  return (
    <View style={[styles.container, { width: rowWidth, height }]}>
      <Svg width={rowWidth} height={height}>
        {/* Render the complete branching path */}
        <Path
          d={path} // The SVG path data string built above
          stroke={VINE_COLOR} // Branch brown color
          strokeWidth={STROKE_WIDTH} // 2.5px thickness
          strokeLinecap="round" // Rounded line ends
          strokeLinejoin="round" // Rounded corners where lines meet
          fill="none" // No fill - stroke only
        />
      </Svg>
    </View>
  );
}

/**
 * Props for the SpouseConnector component.
 */
interface SpouseConnectorProps {
  width: number; // The horizontal distance to span between the two spouse nodes
  /** Optional height; when provided the line draws at height/2 instead of flush */
  height?: number; // When given, the SVG is this tall and the line is vertically centered
}

/**
 * SpouseConnector - draws a horizontal line connecting two spouse TreeNodes.
 * When `height` is provided, the SVG canvas is that tall and the line is drawn
 * at the vertical center, which aligns it with the center of adjacent TreeNodes.
 * When `height` is omitted, the SVG is just as tall as the stroke width.
 *
 * @param width - The horizontal width of the connector in pixels
 * @param height - Optional height for the SVG canvas; line draws at height/2
 */
export function SpouseConnector({ width, height }: SpouseConnectorProps) {
  // If no explicit height, make the SVG just tall enough for the stroke
  const svgHeight = height ?? STROKE_WIDTH;
  // Draw the line at the vertical center of the SVG canvas
  const lineY = svgHeight / 2;

  return (
    <View style={[styles.spouseContainer, { width, height: svgHeight }]}>
      <Svg width={width} height={svgHeight}>
        {/* Horizontal line from left edge to right edge, centered vertically */}
        <Line
          x1={0} // Start at the left edge
          y1={lineY} // At the vertical center
          x2={width} // End at the right edge
          y2={lineY} // Same vertical position (horizontal line)
          stroke={VINE_COLOR} // Branch brown color
          strokeWidth={STROKE_WIDTH} // 2.5px thickness
          strokeLinecap="round" // Rounded line ends
        />
      </Svg>
    </View>
  );
}

/**
 * Props for the FamilyConnector component.
 */
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
 * FamilyConnector - draws SVG paths from a couple's center point down to
 * measured child positions. Unlike GenerationConnector (which assumes even
 * spacing), this component uses actual measured x-positions from the layout
 * for precise alignment with dynamically-sized child nodes.
 *
 * Renders nothing when childPositions is empty or width is 0 (first frame
 * before layout measurements are available).
 *
 * For a single child:
 *   - If the child is directly below the couple center: straight vertical line
 *   - If the child is offset: L-shaped path (down, across, down)
 *
 * For multiple children:
 *   - Vertical stem from couple center to mid-height
 *   - Horizontal rail spanning from the leftmost to rightmost child
 *   - Vertical drops from the rail to each child position
 *
 * @param childPositions - Array of x-center positions for each child
 * @param width - Total width of the children row
 * @param coupleCenter - X-center of the couple row above
 * @param height - Connector height in pixels (default: 48)
 */
export function FamilyConnector({
  childPositions,
  width,
  coupleCenter,
  height = 48, // Default connector height of 48px
}: FamilyConnectorProps) {
  // Don't render anything until we have child positions and a valid width
  if (childPositions.length === 0 || width === 0) return null;

  // Calculate the vertical midpoint for the horizontal rail
  const midY = height / 2;

  // Special case: single child - draw a simple line or L-shape
  if (childPositions.length === 1) {
    const childX = childPositions[0]; // The single child's x-center position
    // Start with a vertical line from the couple center down to mid-height
    let path = `M ${coupleCenter} 0 L ${coupleCenter} ${midY}`;
    if (Math.abs(childX - coupleCenter) > 1) {
      // The child is horizontally offset from the couple center:
      // Draw an L-shape: down to midY, across to child's x, then down to bottom
      path += ` L ${childX} ${midY} L ${childX} ${height}`;
    } else {
      // The child is directly below the couple center:
      // Continue the vertical line straight down to the bottom
      path += ` L ${coupleCenter} ${height}`;
    }
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          <Path
            d={path} // The single-child path (vertical line or L-shape)
            stroke={VINE_COLOR} // Branch brown color
            strokeWidth={STROKE_WIDTH} // 2.5px thickness
            strokeLinecap="round" // Rounded line ends
            strokeLinejoin="round" // Rounded corners at bends
            fill="none" // Stroke only, no fill
          />
        </Svg>
      </View>
    );
  }

  // Multiple children case: find the leftmost and rightmost positions for the rail
  const leftmost = Math.min(...childPositions); // X position of the leftmost child
  const rightmost = Math.max(...childPositions); // X position of the rightmost child

  let path = '';

  // 1. Vertical stem: draw from the couple center at the top down to the horizontal rail
  path += `M ${coupleCenter} 0 L ${coupleCenter} ${midY} `;

  // 2. Horizontal rail: draw from the leftmost child to the rightmost child at mid-height
  path += `M ${leftmost} ${midY} L ${rightmost} ${midY} `;

  // 3. Vertical drops: draw a vertical line from the rail down to each child's position
  for (const pos of childPositions) {
    path += `M ${pos} ${midY} L ${pos} ${height} `; // Drop from rail to child
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Render the complete T-shaped connector path */}
        <Path
          d={path} // The multi-child path (stem + rail + drops)
          stroke={VINE_COLOR} // Branch brown color
          strokeWidth={STROKE_WIDTH} // 2.5px thickness
          strokeLinecap="round" // Rounded line ends
          strokeLinejoin="round" // Rounded corners where segments meet
          fill="none" // Stroke only, no fill
        />
      </Svg>
    </View>
  );
}

/**
 * StyleSheet for the vine connector components.
 * Minimal styles since most sizing is done inline via props.
 */
const styles = StyleSheet.create({
  // Container for GenerationConnector and FamilyConnector
  container: {
    overflow: 'visible', // Allow SVG strokes to render outside the container bounds
  },
  // Container for SpouseConnector with centering
  spouseContainer: {
    justifyContent: 'center', // Vertically center the SVG
    alignItems: 'center', // Horizontally center the SVG
  },
});
