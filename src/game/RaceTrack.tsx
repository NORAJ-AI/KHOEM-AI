// The race track scenery: grass island, ring road, curbs, start line, flowers and spectators.
// Positions are local to the track centre (RACE.cx, RACE.cz); the start line is at the north point (z = -laneR).

import { useMemo } from 'react';
import * as THREE from 'three';
import { RACE } from './constants';

function makeCheckerTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 128;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 2; col++) {
      g.fillStyle = (row + col) % 2 ? '#111111' : '#ffffff';
      g.fillRect(col * 16, row * 16, 16, 16);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Grass({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.1, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 10]} />
        <meshLambertMaterial color="#5fb85f" />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.9, 5]} />
        <meshLambertMaterial color="#3f7f3f" />
      </mesh>
    </group>
  );
}

function Flower({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0.02, z]}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.5, 5]} />
        <meshLambertMaterial color="#3f8f3f" />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.13, 7, 5]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

function Spectator({ x, z, rotation = 0, color = '#4d7cff' }: { x: number; z: number; rotation?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.65, 4, 8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshLambertMaterial color="#e8b08a" />
      </mesh>
    </group>
  );
}

/** The flag waver, standing on the infield next to the start line. */
function StartGirl() {
  return (
    <group position={[0, 0, -RACE.inner + 1]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.23, 0.8, 5, 10]} />
        <meshLambertMaterial color="#f2f2f2" />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.25, 12, 10]} />
        <meshLambertMaterial color="#e7b08c" />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 8]} />
        <meshLambertMaterial color="#5a321f" />
      </mesh>
      {/* start flag */}
      <mesh position={[0.65, 1.45, 0]}>
        <boxGeometry args={[0.06, 1.9, 0.06]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      <mesh position={[0.95, 2.15, 0]}>
        <planeGeometry args={[0.65, 0.42]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function RaceTrack() {
  const checker = useMemo(makeCheckerTexture, []);

  // flowers between the curb (r = 24) and the edge of the island (r = 28)
  const flowers = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const r = 25.5 + (i % 3) * 0.9;
        return {
          x: Math.cos(i * 0.83) * r,
          z: Math.sin(i * 0.83) * r,
          color: i % 2 ? '#ff6fae' : '#ffe066',
        };
      }),
    [],
  );

  // grass tufts on the infield only (r < 13), never on the road
  const grass = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const r = 4 + (i % 5) * 2;
        return { x: Math.cos(i * 1.7) * r, z: Math.sin(i * 1.7) * r };
      }),
    [],
  );

  return (
    <group position={[RACE.cx, 0, RACE.cz]}>
      {/* grass island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[28, 64]} />
        <meshLambertMaterial color="#69ad62" />
      </mesh>

      {/* circular racing road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <ringGeometry args={[RACE.inner, RACE.outer, 64]} />
        <meshLambertMaterial color="#30343a" />
      </mesh>

      {/* inner grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <circleGeometry args={[RACE.inner - 0.4, 64]} />
        <meshLambertMaterial color="#72b968" />
      </mesh>

      {/* curbs */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[RACE.outer, RACE.outer + 1, 64]} />
        <meshLambertMaterial color="#e8e8e8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[RACE.inner - 0.4, RACE.inner, 64]} />
        <meshLambertMaterial color="#e8e8e8" />
      </mesh>

      {/* dashed centre line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[RACE.laneR - 0.12, RACE.laneR + 0.12, 64, 1]} />
        <meshBasicMaterial color="#d9d3a0" transparent opacity={0.55} />
      </mesh>

      {/* checkered start/finish line, across the road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, -RACE.laneR]}>
        <planeGeometry args={[2, RACE.outer - RACE.inner + 0.2]} />
        <meshBasicMaterial map={checker} />
      </mesh>

      <StartGirl />

      {grass.map((g, i) => (
        <Grass key={`g-${i}`} x={g.x} z={g.z} />
      ))}

      {flowers.map((f, i) => (
        <Flower key={`f-${i}`} x={f.x} z={f.z} color={f.color} />
      ))}

      {/* spectators, standing outside the curb */}
      <Spectator x={-26} z={-4} rotation={Math.PI / 2} />
      <Spectator x={-25.5} z={2} rotation={Math.PI / 2} color="#ff7a45" />
      <Spectator x={26} z={-4} rotation={-Math.PI / 2} color="#37b24d" />
      <Spectator x={25.5} z={2} rotation={-Math.PI / 2} />
      <Spectator x={-8} z={25.5} color="#be4bdb" />
      <Spectator x={0} z={26} />
      <Spectator x={8} z={25.5} color="#ff7a45" />
      <Spectator x={-6} z={-25.5} rotation={Math.PI} color="#37b24d" />
      <Spectator x={10} z={-25.5} rotation={Math.PI} />
    </group>
  );
}
