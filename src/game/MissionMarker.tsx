import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MISSIONS } from './missions';
import { useGame } from './store';

/** Glowing beam over the current mission target (drive / go-to missions). */
export function MissionMarker() {
  const index = useGame((s) => s.missionIndex);
  const active = useGame((s) => s.missionActive);
  const ring = useRef<THREE.Mesh>(null);
  const m = active ? MISSIONS[index] : undefined;

  useFrame((state) => {
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.06);
  });

  if (!m || !m.target) return null;
  const r = m.radius ?? 4;
  return (
    <group position={[m.target[0], 0, m.target[1]]}>
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 14, 20, 1, true]} />
        <meshBasicMaterial
          color="#ffd93b"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r - 0.35, r, 40]} />
        <meshBasicMaterial color="#ffd93b" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
