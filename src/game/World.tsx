// The first map: ground, roads, river + bridge, town buildings, trees, hills, clouds.

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BRIDGE, BUILDINGS, GATE, HILLS, RIVER, ROAD_A_Z, ROAD_B_X, ROAD_W, TOWN_SQUARE, TREES, WORLD,
  CAR_START, type Box,
} from './constants';
import { RaceTrack } from './RaceTrack';
import { RaceZone } from './RaceZone';

// ---- shared materials / textures ----

function makeRoadTexture(repeatY: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#4b5059';
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#5c626c';
  g.fillRect(0, 0, 4, 128);
  g.fillRect(60, 0, 4, 128);
  g.fillStyle = '#f2e9b8';
  g.fillRect(30, 12, 4, 44);
  g.fillRect(30, 76, 4, 44);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeWindowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 96;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 128, 96);
  g.fillStyle = '#ffd98a';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) g.fillRect(8 + col * 30, 8 + row * 30, 18, 20);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Lit windows: DayNight fades this in at dusk. */
export const windowMat = new THREE.MeshBasicMaterial({
  map: makeWindowTexture(),
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// ---- pieces ----

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshLambertMaterial color="#5d9a5a" />
      </mesh>
      {/* south: town + home */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(WORLD.minX + WORLD.maxX) / 2, 0, (WORLD.maxZ + RIVER.z1) / 2]} receiveShadow>
        <planeGeometry args={[WORLD.maxX - WORLD.minX + 6, WORLD.maxZ - RIVER.z1 + 3]} />
        <meshLambertMaterial color="#86c97a" />
      </mesh>
      {/* north: wilder area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(WORLD.minX + WORLD.maxX) / 2, 0, (WORLD.minZ + RIVER.z0) / 2]} receiveShadow>
        <planeGeometry args={[WORLD.maxX - WORLD.minX + 6, RIVER.z0 - WORLD.minZ + 3]} />
        <meshLambertMaterial color="#6aa86a" />
      </mesh>
    </group>
  );
}

function RoadStrip({ length, alongX, center, y }: { length: number; alongX: boolean; center: [number, number]; y: number }) {
  const tex = useMemo(() => makeRoadTexture(length / 8), [length]);
  return (
    <group position={[center[0], y, center[1]]} rotation={[0, alongX ? Math.PI / 2 : 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_W, length]} />
        <meshLambertMaterial map={tex} />
      </mesh>
    </group>
  );
}

function Roads() {
  const lenA = WORLD.maxX - WORLD.minX;
  const lenB = WORLD.maxZ - WORLD.minZ;
  return (
    <group>
      <RoadStrip length={lenA} alongX center={[(WORLD.minX + WORLD.maxX) / 2, ROAD_A_Z]} y={0.02} />
      <RoadStrip length={lenB} alongX={false} center={[ROAD_B_X, (WORLD.maxZ + WORLD.minZ) / 2]} y={0.03} />
      {/* parking pad at home */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CAR_START[0], 0.025, CAR_START[1]]}>
        <planeGeometry args={[5, 7]} />
        <meshLambertMaterial color="#8c8f94" />
      </mesh>
      {/* town square plaza + fountain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TOWN_SQUARE[0], 0.04, TOWN_SQUARE[1]]}>
        <circleGeometry args={[5.5, 28]} />
        <meshLambertMaterial color="#d8c79a" />
      </mesh>
      <mesh position={[TOWN_SQUARE[0], 0.3, TOWN_SQUARE[1] + 3.2]} castShadow>
        <cylinderGeometry args={[1.1, 1.3, 0.6, 14]} />
        <meshLambertMaterial color="#b8b8c0" />
      </mesh>
      <mesh position={[TOWN_SQUARE[0], 0.5, TOWN_SQUARE[1] + 3.2]}>
        <cylinderGeometry args={[0.9, 0.9, 0.3, 14]} />
        <meshLambertMaterial color="#5dade2" />
      </mesh>
    </group>
  );
}

function River() {
  const width = WORLD.maxX - WORLD.minX + 8;
  const cx = (WORLD.minX + WORLD.maxX) / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.04, (RIVER.z0 + RIVER.z1) / 2]}>
        <planeGeometry args={[width, RIVER.z1 - RIVER.z0]} />
        <meshLambertMaterial color="#3fa7d6" transparent opacity={0.9} />
      </mesh>
      {/* sandy banks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, RIVER.z1 + 0.8]}>
        <planeGeometry args={[width, 1.6]} />
        <meshLambertMaterial color="#e3d5a3" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, RIVER.z0 - 0.8]}>
        <planeGeometry args={[width, 1.6]} />
        <meshLambertMaterial color="#e3d5a3" />
      </mesh>
    </group>
  );
}

function Bridge() {
  const len = RIVER.z1 - RIVER.z0 + 3;
  const cx = (BRIDGE.x0 + BRIDGE.x1) / 2;
  const cz = (RIVER.z0 + RIVER.z1) / 2;
  const w = BRIDGE.x1 - BRIDGE.x0;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, 0.12, len]} />
        <meshLambertMaterial color="#8d6e63" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.1), 0.6, 0]} castShadow>
          <boxGeometry args={[0.2, 0.9, len]} />
          <meshLambertMaterial color="#6d4c41" />
        </mesh>
      ))}
    </group>
  );
}

function Building({ b }: { b: Box }) {
  const doorSide = b.z < ROAD_A_Z ? 1 : -1; // door faces the main road
  return (
    <group position={[b.x, 0, b.z]}>
      <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshLambertMaterial color={b.color} />
      </mesh>
      <mesh position={[0, b.h + 0.3, 0]} castShadow>
        <boxGeometry args={[b.w + 0.6, 0.6, b.d + 0.6]} />
        <meshLambertMaterial color={b.roof ?? '#555'} />
      </mesh>
      <mesh position={[0, 1.0, doorSide * (b.d / 2 + 0.03)]} rotation={[0, doorSide === 1 ? 0 : Math.PI, 0]}>
        <planeGeometry args={[1.2, 2]} />
        <meshLambertMaterial color="#5d4037" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={[0, b.h * 0.58, s * (b.d / 2 + 0.04)]}
          rotation={[0, s === 1 ? 0 : Math.PI, 0]}
          material={windowMat}
        >
          <planeGeometry args={[b.w * 0.82, b.h * 0.5]} />
        </mesh>
      ))}
    </group>
  );
}

function Trees() {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const low = useRef<THREE.InstancedMesh>(null);
  const high = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    TREES.forEach((t, i) => {
      o.rotation.set(0, i, 0);
      o.scale.setScalar(t.s);
      o.position.set(t.x, 0.9 * t.s, t.z);
      o.updateMatrix();
      trunk.current?.setMatrixAt(i, o.matrix);
      o.position.set(t.x, 2.5 * t.s, t.z);
      o.updateMatrix();
      low.current?.setMatrixAt(i, o.matrix);
      o.position.set(t.x, 3.7 * t.s, t.z);
      o.updateMatrix();
      high.current?.setMatrixAt(i, o.matrix);
      col.setHSL(0.3 + ((i * 37) % 10) / 120, 0.5, 0.32 + ((i * 13) % 10) / 100);
      low.current?.setColorAt(i, col);
      high.current?.setColorAt(i, col);
    });
    for (const m of [trunk.current, low.current, high.current]) {
      if (m) m.instanceMatrix.needsUpdate = true;
    }
    if (low.current?.instanceColor) low.current.instanceColor.needsUpdate = true;
    if (high.current?.instanceColor) high.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, TREES.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.8, 6]} />
        <meshLambertMaterial color="#8b5a2b" />
      </instancedMesh>
      <instancedMesh ref={low} args={[undefined, undefined, TREES.length]} castShadow>
        <coneGeometry args={[1.3, 2.3, 7]} />
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={high} args={[undefined, undefined, TREES.length]} castShadow>
        <coneGeometry args={[0.95, 1.9, 7]} />
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
}

function Hills() {
  return (
    <group>
      {HILLS.map((h, i) => (
        <mesh key={i} position={[h.x, 0, h.z]} scale={[h.r, h.h, h.r]} castShadow receiveShadow>
          <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshLambertMaterial color={i % 2 ? '#6f9f5c' : '#7aa862'} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Gate() {
  return (
    <group position={[GATE.x, 0, GATE.z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (GATE.w / 2 - 0.4), GATE.h / 2, 0]} castShadow>
          <boxGeometry args={[0.8, GATE.h, 0.8]} />
          <meshLambertMaterial color="#7f8c8d" />
        </mesh>
      ))}
      <mesh position={[0, GATE.h * 0.55, 0]} castShadow>
        <boxGeometry args={[GATE.w - 1.2, 1.4, 0.4]} />
        <meshLambertMaterial color={GATE.color} />
      </mesh>
      <mesh position={[0, GATE.h * 0.55, 0.22]}>
        <boxGeometry args={[GATE.w - 3, 0.35, 0.05]} />
        <meshBasicMaterial color="#ffd43b" />
      </mesh>
    </group>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: -60 + i * 20,
        y: 32 + (i % 3) * 5,
        z: -40 + ((i * 37) % 90),
        s: 1 + (i % 3) * 0.4,
      })),
    [],
  );
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((c) => {
      c.position.x += dt * 1.2;
      if (c.position.x > 80) c.position.x = -80;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[[0, 0, 0, 4], [3.5, -0.4, 0.5, 3], [-3.5, -0.5, -0.3, 3], [1, 0.8, 0, 2.6]].map(([x, y, z, r], j) => (
            <mesh key={j} position={[x, y, z]}>
              <sphereGeometry args={[r, 8, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function World() {
  return (
    <group>
      <Ground />
      <Roads />
      <River />
      <Bridge />
      {BUILDINGS.map((b, i) => (
        <Building key={i} b={b} />
      ))}
      <Trees />
      <Hills />
      <Gate />
      <Clouds />
      <RaceTrack />
      <RaceZone />
    </group>
  );
}
