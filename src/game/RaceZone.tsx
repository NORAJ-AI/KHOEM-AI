import { useMemo } from 'react';
import * as THREE from 'three';

export function RaceZone() {
  const markers = useMemo(
    () =>
      [
        [-4, -24],
        [4, -24],
        [-4, -16],
        [4, -16],
      ] as [number, number][],
    [],
  );

  return (
    <group position={[35, 0, 35]}>
      {/* Race entrance arch */}
      <mesh position={[-6, 2.5, -20]} castShadow>
        <boxGeometry args={[0.6, 5, 0.6]} />
        <meshLambertMaterial color="#24282e" />
      </mesh>

      <mesh position={[6, 2.5, -20]} castShadow>
        <boxGeometry args={[0.6, 5, 0.6]} />
        <meshLambertMaterial color="#24282e" />
      </mesh>

      <mesh position={[0, 5, -20]} castShadow>
        <boxGeometry args={[12.6, 0.7, 0.7]} />
        <meshLambertMaterial color="#24282e" />
      </mesh>

      {/* glowing entrance sign */}
      <mesh position={[0, 5, -19.55]}>
        <planeGeometry args={[8.5, 1.2]} />
        <meshBasicMaterial
          color="#ffd83d"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* starting lights */}
      {markers.map(([x, z], i) => (
        <mesh key={i} position={[x, 3.5, z]}>
          <sphereGeometry args={[0.28, 12, 8]} />
          <meshBasicMaterial color="#ff3030" />
        </mesh>
      ))}
    </group>
  );
}
