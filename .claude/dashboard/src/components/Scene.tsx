import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Billboard, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../stores/useStore';

// Node positions - arranged in a logical flow left to right
const NODE_POSITIONS: Record<string, [number, number, number]> = {
  'claude': [-6, 0, 0],
  'orchestrator': [-2, 0, 0],
  'local-7b': [2, 2, 0],
  'remote-14b': [2, 0, 0],
  'embeddings': [2, -2, 0],
  'chromadb': [6, -1, 0],
};

const CONNECTIONS = [
  { from: 'claude', to: 'orchestrator' },
  { from: 'orchestrator', to: 'local-7b' },
  { from: 'orchestrator', to: 'remote-14b' },
  { from: 'orchestrator', to: 'embeddings' },
  { from: 'embeddings', to: 'chromadb' },
  { from: 'remote-14b', to: 'chromadb' },
];

export function Scene() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      style={{ background: '#0a0a0a' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}

function SceneContent() {
  const activeModels = useStore((state) => state.activeModels);

  return (
    <>
      {/* Camera - static angle, no auto-rotate */}
      <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={25}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={false}
      />

      {/* Minimal lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#ffffff" />

      {/* Grid floor */}
      <MonochromeGrid />

      {/* Nodes */}
      <MonochromeNode
        id="claude"
        label="CLAUDE"
        sublabel="Cloud API"
        position={NODE_POSITIONS['claude']}
        active={activeModels.has('claude')}
      />
      <MonochromeNode
        id="orchestrator"
        label="ORCHESTRATOR"
        sublabel="Router"
        position={NODE_POSITIONS['orchestrator']}
        active={activeModels.has('orchestrator')}
      />
      <MonochromeNode
        id="local-7b"
        label="LOCAL 7B"
        sublabel="Mac"
        position={NODE_POSITIONS['local-7b']}
        active={activeModels.has('local-7b')}
      />
      <MonochromeNode
        id="remote-14b"
        label="REMOTE 14B"
        sublabel="Windows"
        position={NODE_POSITIONS['remote-14b']}
        active={activeModels.has('remote-14b')}
      />
      <MonochromeNode
        id="embeddings"
        label="EMBEDDINGS"
        sublabel="Search"
        position={NODE_POSITIONS['embeddings']}
        active={activeModels.has('embeddings')}
      />
      <MonochromeNode
        id="chromadb"
        label="CHROMADB"
        sublabel="Vectors"
        position={NODE_POSITIONS['chromadb']}
        active={activeModels.has('chromadb')}
      />

      {/* Connections */}
      {CONNECTIONS.map((conn, i) => (
        <MonochromeConnection
          key={i}
          from={NODE_POSITIONS[conn.from]}
          to={NODE_POSITIONS[conn.to]}
          active={activeModels.has(conn.from) || activeModels.has(conn.to)}
        />
      ))}

      {/* Subtle bloom for active elements */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          intensity={0.3}
        />
      </EffectComposer>
    </>
  );
}

function MonochromeGrid() {
  const gridLines = useMemo(() => {
    const size = 20;
    const divisions = 20;
    const lines: [number, number, number][][] = [];
    const step = size / divisions;
    const half = size / 2;

    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      lines.push([[-half, 0, pos], [half, 0, pos]]);
      lines.push([[pos, 0, -half], [pos, 0, half]]);
    }
    return lines;
  }, []);

  return (
    <group position={[0, -2, 0]}>
      {gridLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#ffffff"
          lineWidth={0.5}
          transparent
          opacity={0.06}
        />
      ))}
    </group>
  );
}

function MonochromeNode({
  id,
  label,
  sublabel,
  position,
  active,
}: {
  id: string;
  label: string;
  sublabel: string;
  position: [number, number, number];
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const stats = useStore((state) => state.stats[id]);

  useFrame(({ clock }) => {
    if (meshRef.current && active) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.05;
      meshRef.current.scale.setScalar(scale);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      {/* Box node */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 0.8, 0.1]} />
        <meshStandardMaterial
          color={active ? '#ffffff' : '#333333'}
          transparent
          opacity={active ? 0.3 : 0.1}
        />
      </mesh>

      {/* Wireframe outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 0.8, 0.1)]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={active ? 0.8 : 0.3} />
      </lineSegments>

      {/* Active indicator */}
      {active && (
        <mesh position={[0.6, 0.3, 0.06]}>
          <circleGeometry args={[0.05, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}

      {/* Label */}
      <Billboard position={[0, 0.05, 0.1]}>
        <Text
          fontSize={0.15}
          color={active ? '#ffffff' : '#888888'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.05}
        >
          {label}
        </Text>
      </Billboard>

      {/* Sublabel */}
      <Billboard position={[0, -0.15, 0.1]}>
        <Text
          fontSize={0.08}
          color="#555555"
          anchorX="center"
          anchorY="middle"
        >
          {sublabel}
        </Text>
      </Billboard>

      {/* Stats below */}
      {stats && stats.calls > 0 && (
        <Billboard position={[0, -0.55, 0]}>
          <Text
            fontSize={0.07}
            color="#444444"
            anchorX="center"
            anchorY="middle"
          >
            {stats.calls} calls
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function MonochromeConnection({
  from,
  to,
  active,
}: {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
}) {
  return (
    <group>
      <Line
        points={[from, to]}
        color="#ffffff"
        lineWidth={active ? 1.5 : 0.5}
        transparent
        opacity={active ? 0.5 : 0.1}
      />

      {/* Arrow indicator at midpoint when active */}
      {active && (
        <mesh position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
