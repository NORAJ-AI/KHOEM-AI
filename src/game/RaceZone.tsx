// The start gate: an arch across the road, three start lights and a beam that shows where the race begins.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RACE } from './constants';
import { shared } from './shared';

const OFF = '#3a1414';
const RED = '#ff3030';
const GREEN = '#37ff6b';
const LIGHT_Z = [-2.5, 0, 2.5]; // relative to the line, across the road

export function RaceZone() {
  const lights = useRef<(THREE.Mesh | null)[]>([]);
  const beam = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const r = shared.race;
    let colors = [OFF, OFF, OFF];
    if (r.phase === 'countdown') {
      const n = r.countdown === '3' ? 1 : r.countdown === '2' ? 2 : r.countdown === '1' ? 3 : 0;
      colors = colors.map((_, i) => (i < n ? RED : OFF));
    } else if (r.phase === 'racing' && r.time < 4) {
      colors = [GREEN, GREEN, GREEN];
    }
    lights.current.forEach((m, i) => {
      if (m) (m.material as THREE.MeshBasicMaterial).color.set(colors[i]);
    });
    if (beam.current) beam.current.visible = r.phase === 'idle' || r.phase === 'finished';
  });

  const halfRoad = (RACE.outer - RACE.inner) / 2 + 0.7; // pillars just outside the road edges

  return (
    <group position={[RACE.cx, 0, RACE.cz - RACE.laneR]}>
      {/* pillars */}
      {[-halfRoad, halfRoad].map((z) => (
        <mesh key={z} position={[0, 2.5, z]} castShadow>
          <boxGeometry args={[0.7, 5, 0.7]} />
          <meshLambertMaterial color="#24282e" />
        </mesh>
      ))}

      {/* beam across the road */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, halfRoad * 2 + 0.7]} />
        <meshLambertMaterial color="#24282e" />
      </mesh>

      {/* banner, readable from both sides */}
      <mesh position={[0, 5.9, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[halfRoad * 2, 1.1]} />
        <meshBasicMaterial color="#ffd83d" side={THREE.DoubleSide} />
      </mesh>

      {/* start lights hanging from the beam */}
      {LIGHT_Z.map((z, i) => (
        <mesh
          key={z}
          position={[0, 4.0, z]}
          ref={(el) => {
            lights.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.5, 14, 10]} />
          <meshBasicMaterial color={OFF} />
        </mesh>
      ))}

      {/* beam of light so the start can be seen from far away */}
      <mesh ref={beam} position={[0, 13, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 26, 18, 1, true]} />
        <meshBasicMaterial
          color="#ffd93b"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
