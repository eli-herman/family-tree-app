import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface DataStreamProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
  particleCount?: number;
}

export function DataStream({
  from,
  to,
  color,
  active,
  particleCount = 30
}: DataStreamProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Calculate direction and distance
  const direction = useMemo(() => {
    const dir = new THREE.Vector3(
      to[0] - from[0],
      to[1] - from[1],
      to[2] - from[2]
    );
    return dir;
  }, [from, to]);

  const distance = useMemo(() => direction.length(), [direction]);

  // Create particle positions
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      pos[i * 3] = from[0] + direction.x * t;
      pos[i * 3 + 1] = from[1] + direction.y * t;
      pos[i * 3 + 2] = from[2] + direction.z * t;
      spd[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions: pos, speeds: spd };
  }, [from, direction, particleCount]);

  // Create curve points for the line
  const curvePoints = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(
        (from[0] + to[0]) / 2,
        Math.max(from[1], to[1]) + 1,
        (from[2] + to[2]) / 2
      ),
      new THREE.Vector3(...to)
    );
    return curve.getPoints(50).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [from, to]);

  // Animate particles
  useFrame(() => {
    if (!particlesRef.current || !active) return;

    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const normalizedDir = direction.clone().normalize();

    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] += normalizedDir.x * 0.05 * speeds[i];
      posArray[i * 3 + 1] += normalizedDir.y * 0.05 * speeds[i];
      posArray[i * 3 + 2] += normalizedDir.z * 0.05 * speeds[i];

      const dx = posArray[i * 3] - from[0];
      const dy = posArray[i * 3 + 1] - from[1];
      const dz = posArray[i * 3 + 2] - from[2];
      const traveled = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (traveled > distance) {
        posArray[i * 3] = from[0] + (Math.random() * 0.5) * normalizedDir.x;
        posArray[i * 3 + 1] = from[1] + (Math.random() * 0.5) * normalizedDir.y;
        posArray[i * 3 + 2] = from[2] + (Math.random() * 0.5) * normalizedDir.z;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Create geometry for particles
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [positions]);

  return (
    <group>
      {/* Connection line using drei's Line component */}
      <Line
        points={curvePoints}
        color={color}
        lineWidth={1}
        transparent
        opacity={active ? 0.4 : 0.1}
      />

      {/* Particles */}
      {active && (
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial
            color={color}
            size={0.08}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

// Predefined connections between nodes
export const NODE_POSITIONS = {
  'claude': [-4, 2, 0] as [number, number, number],
  'orchestrator': [0, 0, 0] as [number, number, number],
  'local-7b': [3, 1, 2] as [number, number, number],
  'remote-14b': [4, 0, -2] as [number, number, number],
  'embeddings': [2, -1, -3] as [number, number, number],
  'chromadb': [5, -2, -1] as [number, number, number],
};

export const NODE_COLORS = {
  'claude': '#ff6b35',
  'orchestrator': '#00d4ff',
  'local-7b': '#00ff88',
  'remote-14b': '#ff00ff',
  'embeddings': '#ffff00',
  'chromadb': '#00ffff',
};
