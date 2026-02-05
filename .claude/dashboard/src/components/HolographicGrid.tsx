import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export function HolographicGrid() {
  const gridRef = useRef<THREE.Group>(null);

  // Create grid lines as point arrays for Line component
  const gridLines = useMemo(() => {
    const size = 40;
    const divisions = 40;
    const lines: [number, number, number][][] = [];

    const step = size / divisions;
    const half = size / 2;

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      lines.push([
        [-half, 0, pos],
        [half, 0, pos]
      ]);
    }

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      lines.push([
        [pos, 0, -half],
        [pos, 0, half]
      ]);
    }

    return lines;
  }, []);

  // Animate grid opacity pulse
  useFrame(({ clock }) => {
    if (gridRef.current) {
      // Could animate opacity here if needed
      gridRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group ref={gridRef} position={[0, -3, 0]}>
      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#00d4ff"
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}

      {/* Hexagonal rings for extra Iron Man feel */}
      <HexRing radius={8} y={0.01} />
      <HexRing radius={12} y={0.02} />
      <HexRing radius={16} y={0.03} />
    </group>
  );
}

function HexRing({ radius, y }: { radius: number; y: number }) {
  const ref = useRef<THREE.Group>(null);

  const hexPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      points.push([
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ]);
    }
    return points;
  }, [radius, y]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={ref}>
      <Line
        points={hexPoints}
        color="#00d4ff"
        lineWidth={1}
        transparent
        opacity={0.3}
      />
    </group>
  );
}
