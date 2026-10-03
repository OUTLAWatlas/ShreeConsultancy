'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useThemeColors, useThemeName } from '../../hooks/useThemeColors';
import SceneBoundary from '../SceneBoundary';

// Generates a sparse point lattice with short edges between nearby nodes —
// a deliberately abstract stand-in for a substation one-line diagram, not a
// literal circuit render.
function generateLattice(nodeCount = 40, spread = 6) {
  const nodes = [];
  for (let i = 0; i < nodeCount; i += 1) {
    nodes.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 2
      )
    );
  }

  const edges = [];
  nodes.forEach((node, i) => {
    let connections = 0;
    nodes.forEach((other, j) => {
      if (i === j || connections >= 2) return;
      if (node.distanceTo(other) < spread * 0.55) {
        edges.push(node, other);
        connections += 1;
      }
    });
  });

  return { nodes, edges };
}

function Lattice() {
  const groupRef = useRef();
  // WebGL materials can't read CSS variables, so pull the live token
  // values and fall back to the dark-theme colours for the first frame
  // before they resolve.
  const themeColors = useThemeColors();
  const isLight = useThemeName() === 'light';
  const colors = { ...{ accent: '#00E5FF', warn: '#FF7B00' }, ...themeColors };
  const target = useRef({ x: 0, y: 0 });
  const { nodes, edges } = useMemo(() => generateLattice(), []);
  const { viewport } = useThree();

  const nodePositions = useMemo(
    () => new Float32Array(nodes.flatMap((n) => [n.x, n.y, n.z])),
    [nodes]
  );
  const edgePositions = useMemo(
    () => new Float32Array(edges.flatMap((n) => [n.x, n.y, n.z])),
    [edges]
  );

  useFrame((state) => {
    target.current.x = (state.pointer.x * Math.PI) / 10;
    target.current.y = (state.pointer.y * Math.PI) / 14;

    if (groupRef.current) {
      groupRef.current.rotation.y += (target.current.x - groupRef.current.rotation.y) * 0.03;
      groupRef.current.rotation.x += (-target.current.y - groupRef.current.rotation.x) * 0.03;
      groupRef.current.rotation.z += 0.0006;
    }
  });

  const scale = Math.min(viewport.width / 10, 1.1);

  return (
    <group ref={groupRef} scale={scale}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={edgePositions.length / 3}
            array={edgePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={colors.accent} transparent opacity={isLight ? 0.5 : 0.25} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodePositions.length / 3}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color={colors.warn} size={0.06} sizeAttenuation />
      </points>
    </group>
  );
}

export default function HeroScene() {
  return (
    // The hero text sits over this canvas and must stay readable even if
    // WebGL is unavailable, so the fallback is simply nothing.
    <SceneBoundary fallback={null}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 9], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="!absolute inset-0"
      >
        <ambientLight intensity={0.6} />
        <Lattice />
      </Canvas>
    </SceneBoundary>
  );
}
