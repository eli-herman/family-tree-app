import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../stores/useStore';

interface AINodeProps {
  id: string;
  label: string;
  position: [number, number, number];
  color: string;
}

export function AINode({ id, label, position, color }: AINodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const activeModels = useStore((state) => state.activeModels);
  const stats = useStore((state) => state.stats[id]);
  const isActive = activeModels.has(id);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8 + position[0]) * 0.1;

      // Pulse when active
      if (isActive) {
        const scale = 1 + Math.sin(clock.elapsedTime * 4) * 0.1;
        meshRef.current.scale.setScalar(scale);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }

    // Rotate the outer ring
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.5;
      ringRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.2;
    }

    // Glow intensity
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity = isActive ? 0.4 : 0.15;
      material.opacity = baseOpacity + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.8 : 0.3}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1.2 : 0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.8}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.8, 0.02, 8, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Second ring (perpendicular) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.015, 8, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, 1.2, 0]}>
        <Text
          fontSize={0.25}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      </Billboard>

      {/* Status indicator */}
      {isActive && (
        <Billboard position={[0, 0.9, 0]}>
          <Text
            fontSize={0.15}
            color="#00ff88"
            anchorX="center"
            anchorY="middle"
          >
            ACTIVE
          </Text>
        </Billboard>
      )}

      {/* Stats on hover */}
      {hovered && stats && (
        <Billboard position={[0, -1, 0]}>
          <Text
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="top"
            maxWidth={3}
            textAlign="center"
          >
            {`Calls: ${stats.calls} | Tokens: ${stats.tokens.toLocaleString()}`}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
