import { useMemo } from 'react';
import * as THREE from 'three';

function Grass({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.04, z]}>
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
    <group position={[x, 0.12, z]}>
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

function Spectator({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.65, 4, 8]} />
        <meshLambertMaterial color="#4d7cff" />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshLambertMaterial color="#e8b08a" />
      </mesh>
    </group>
  );
}

function StartGirl() {
  return (
    <group position={[0, 0, -17]}>
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

function StartFinish() {
  return (
    <group position={[0, 0, -20]}>
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[15, 1.2, 0.6]} />
        <meshLambertMaterial color="#20242a" />
      </mesh>

      {[-6.5, 6.5].map((x) => (
        <mesh key={x} position={[x, 2.1, 0]} castShadow>
          <boxGeometry args={[0.7, 4.2, 0.7]} />
          <meshLambertMaterial color="#30343b" />
        </mesh>
      ))}

      <mesh position={[0, 4.2, 0.35]}>
        <boxGeometry args={[12, 0.55, 0.08]} />
        <meshBasicMaterial color="#ffcc33" />
      </mesh>
    </group>
  );
}

export function RaceTrack() {
  const flowers = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        x: Math.cos(i * 0.83) * (27 + (i % 3) * 2),
        z: Math.sin(i * 0.83) * (16 + (i % 4)),
        color: i % 2 ? '#ff6fae' : '#ffe066',
      })),
    [],
  );

  const grass = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: Math.cos(i * 1.7) * 25,
        z: Math.sin(i * 1.7) * 15,
      })),
    [],
  );

  return (
    <group position={[35, 0, 35]}>
      {/* grass island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[28, 64]} />
        <meshLambertMaterial color="#69ad62" />
      </mesh>

      {/* circular racing road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[15, 23, 64]} />
        <meshLambertMaterial color="#30343a" />
      </mesh>

      {/* inner grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <circleGeometry args={[15, 64]} />
        <meshLambertMaterial color="#72b968" />
      </mesh>

      {/* outer curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
        <ringGeometry args={[23, 24, 64]} />
        <meshLambertMaterial color="#e8e8e8" />
      </mesh>

      {/* start/finish line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, -20]}>
        <planeGeometry args={[12, 1.2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <StartFinish />
      <StartGirl />

      {grass.map((g, i) => (
        <Grass key={`g-${i}`} x={g.x} z={g.z} />
      ))}

      {flowers.map((f, i) => (
        <Flower key={`f-${i}`} x={f.x} z={f.z} color={f.color} />
      ))}

      {/* spectators */}
      <Spectator x={-26} z={-4} rotation={Math.PI / 2} />
      <Spectator x={-25} z={2} rotation={Math.PI / 2} />
      <Spectator x={25} z={-4} rotation={-Math.PI / 2} />
      <Spectator x={25} z={2} rotation={-Math.PI / 2} />
      <Spectator x={-8} z={25} />
      <Spectator x={0} z={26} />
      <Spectator x={8} z={25} />
    </group>
  );
}
