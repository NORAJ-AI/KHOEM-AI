// Low-poly character and car models built from primitives (no external assets).

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface AnimState {
  speed: number; // horizontal speed in m/s
  attack: number; // seconds left of the attack swing (0.3 -> 0)
  flash: number; // 0..1 hit flash
}

interface HumanoidProps {
  shirt: string;
  pants?: string;
  skin?: string;
  hair?: string;
  scarf?: string;
  hat?: string;
  scale?: number;
  getAnim: () => AnimState;
}

export function Humanoid({
  shirt, pants = '#2d3a55', skin = '#f1c9a0', hair = '#2b1d16', scarf, hat, scale = 1, getAnim,
}: HumanoidProps) {
  const root = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const phase = useRef(0);

  useFrame((_, dtRaw) => {
    const a = getAnim();
    const dt = Math.min(dtRaw, 0.05);
    phase.current += dt * (3 + a.speed * 1.6);
    const amp = Math.min(1, a.speed / 3) * 0.9;
    const sw = Math.sin(phase.current) * amp;
    if (lLeg.current) lLeg.current.rotation.x = sw;
    if (rLeg.current) rLeg.current.rotation.x = -sw;
    if (lArm.current) lArm.current.rotation.x = -sw * 0.8;
    if (rArm.current) {
      rArm.current.rotation.x =
        a.attack > 0 ? -Math.PI * 0.85 * Math.sin((1 - a.attack / 0.3) * Math.PI) : sw * 0.8;
    }
    if (root.current) root.current.scale.setScalar(scale * (1 + 0.15 * a.flash));
  });

  return (
    <group ref={root} scale={scale}>
      {/* torso */}
      <mesh position={[0, 1.16, 0]} castShadow>
        <boxGeometry args={[0.62, 0.78, 0.38]} />
        <meshLambertMaterial color={shirt} />
      </mesh>
      {scarf && (
        <mesh position={[0, 1.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.08, 6, 14]} />
          <meshLambertMaterial color={scarf} />
        </mesh>
      )}
      {/* head */}
      <mesh position={[0, 1.86, 0]} castShadow>
        <sphereGeometry args={[0.27, 14, 12]} />
        <meshLambertMaterial color={skin} />
      </mesh>
      <mesh position={[0, 1.9, -0.01]}>
        <sphereGeometry args={[0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={hair} />
      </mesh>
      <mesh position={[-0.1, 1.87, 0.24]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.1, 1.87, 0.24]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      {hat && (
        <mesh position={[0, 2.12, 0]}>
          <coneGeometry args={[0.34, 0.3, 10]} />
          <meshLambertMaterial color={hat} />
        </mesh>
      )}
      {/* legs: pivot at the hip */}
      <group ref={lLeg} position={[-0.16, 0.78, 0]}>
        <mesh position={[0, -0.39, 0]} castShadow>
          <boxGeometry args={[0.24, 0.78, 0.26]} />
          <meshLambertMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.76, 0.05]}>
          <boxGeometry args={[0.26, 0.12, 0.34]} />
          <meshLambertMaterial color="#222" />
        </mesh>
      </group>
      <group ref={rLeg} position={[0.16, 0.78, 0]}>
        <mesh position={[0, -0.39, 0]} castShadow>
          <boxGeometry args={[0.24, 0.78, 0.26]} />
          <meshLambertMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.76, 0.05]}>
          <boxGeometry args={[0.26, 0.12, 0.34]} />
          <meshLambertMaterial color="#222" />
        </mesh>
      </group>
      {/* arms: pivot at the shoulder */}
      <group ref={lArm} position={[-0.41, 1.5, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshLambertMaterial color={shirt} />
        </mesh>
        <mesh position={[0, -0.66, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshLambertMaterial color={skin} />
        </mesh>
      </group>
      <group ref={rArm} position={[0.41, 1.5, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshLambertMaterial color={shirt} />
        </mesh>
        <mesh position={[0, -0.66, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshLambertMaterial color={skin} />
        </mesh>
      </group>
    </group>
  );
}

interface CarProps {
  color: string;
  getSpeed: () => number;
  getSteer?: () => number;
}

const WHEELS: [number, number][] = [
  [-0.95, 1.25],
  [0.95, 1.25],
  [-0.95, -1.25],
  [0.95, -1.25],
];

/** The model faces +Z. Wheels spin with speed; the front wheels turn with the steering. */
export function CarModel({ color, getSpeed, getSteer }: CarProps) {
  const spin = useRef<(THREE.Group | null)[]>([]);
  const steer = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const sp = getSpeed();
    const st = getSteer ? getSteer() : 0;
    for (const w of spin.current) if (w) w.rotation.x += (sp * dt) / 0.38;
    if (steer.current[0]) steer.current[0].rotation.y = -st * 0.45;
    if (steer.current[1]) steer.current[1].rotation.y = -st * 0.45;
  });

  return (
    <group>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.9, 0.6, 3.8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.22, -0.2]} castShadow>
        <boxGeometry args={[1.62, 0.55, 1.95]} />
        <meshLambertMaterial color="#bfe3f7" />
      </mesh>
      <mesh position={[0, 1.52, -0.2]}>
        <boxGeometry args={[1.66, 0.08, 2.0]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[-0.62, 0.72, 1.92]}>
        <boxGeometry args={[0.4, 0.18, 0.08]} />
        <meshBasicMaterial color="#fff6c0" />
      </mesh>
      <mesh position={[0.62, 0.72, 1.92]}>
        <boxGeometry args={[0.4, 0.18, 0.08]} />
        <meshBasicMaterial color="#fff6c0" />
      </mesh>
      <mesh position={[-0.62, 0.72, -1.92]}>
        <boxGeometry args={[0.4, 0.18, 0.08]} />
        <meshBasicMaterial color="#e03131" />
      </mesh>
      <mesh position={[0.62, 0.72, -1.92]}>
        <boxGeometry args={[0.4, 0.18, 0.08]} />
        <meshBasicMaterial color="#e03131" />
      </mesh>
      {WHEELS.map(([x, z], i) => (
        <group
          key={i}
          position={[x, 0.38, z]}
          ref={(el) => {
            if (i < 2) steer.current[i] = el;
          }}
        >
          <group
            ref={(el) => {
              spin.current[i] = el;
            }}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.3, 12]} />
              <meshLambertMaterial color="#1e1e1e" />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.32, 8]} />
              <meshLambertMaterial color="#c8c8c8" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
