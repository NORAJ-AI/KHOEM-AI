import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CarModel, Humanoid, type AnimState } from './Character';
import { NPC_POS, ROAD_A_Z, isBlocked } from './constants';
import { MISSIONS } from './missions';
import { lerpAngle, shared } from './shared';
import { useGame } from './store';

/** Sok: wanders near the house, turns to face the player when close, gives missions. */
export function Npc() {
  const group = useRef<THREE.Group>(null);
  const mark = useRef<THREE.Group>(null);
  const anim = useRef<AnimState>({ speed: 0, attack: 0, flash: 0 });
  const st = useRef({ yaw: 0, wx: NPC_POS[0], wz: NPC_POS[1], wait: 0 });
  const hasMission = useGame((s) => !s.missionActive && s.missionIndex < MISSIONS.length);

  useFrame((state, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const n = shared.npc;
    const s = st.current;
    let speed = 0;
    if (useGame.getState().screen === 'playing') {
      const dt = Math.min(dtRaw, 0.05);
      const dpx = shared.player.x - n.x;
      const dpz = shared.player.z - n.z;
      if (Math.hypot(dpx, dpz) < 5 && !shared.driving) {
        s.yaw = lerpAngle(s.yaw, Math.atan2(dpx, dpz), 1 - Math.exp(-6 * dt));
      } else {
        s.wait -= dt;
        if (s.wait <= 0) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 3;
          s.wx = NPC_POS[0] + Math.cos(a) * r;
          s.wz = NPC_POS[1] + Math.sin(a) * r;
          s.wait = 3 + Math.random() * 4;
        }
        const dx = s.wx - n.x;
        const dz = s.wz - n.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.4) {
          speed = 1.3;
          const nx = (dx / d) * speed * dt;
          const nz = (dz / d) * speed * dt;
          if (!isBlocked(n.x + nx, n.z, 0.45)) n.x += nx;
          if (!isBlocked(n.x, n.z + nz, 0.45)) n.z += nz;
          s.yaw = lerpAngle(s.yaw, Math.atan2(dx, dz), 1 - Math.exp(-8 * dt));
        }
      }
    }
    anim.current.speed = speed;
    g.position.set(n.x, 0, n.z);
    g.rotation.y = s.yaw;
    if (mark.current) mark.current.position.y = 2.7 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
  });

  return (
    <group ref={group} position={[NPC_POS[0], 0, NPC_POS[1]]}>
      <Humanoid shirt="#f1c40f" pants="#5d4037" hat="#c0392b" getAnim={() => anim.current} />
      {hasMission && (
        <group ref={mark} position={[0, 2.7, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.16, 0.42, 0.16]} />
            <meshBasicMaterial color="#ffd43b" />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ffd43b" />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Decorative traffic: a blue car that loops along the main road. */
export function TrafficCar() {
  const group = useRef<THREE.Group>(null);
  const speed = 7;
  const x = useRef(-44);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    if (useGame.getState().screen === 'playing') {
      x.current += speed * Math.min(dtRaw, 0.05);
      if (x.current > 44) x.current = -44;
    }
    g.position.set(x.current, 0, ROAD_A_Z + 1.5);
    g.rotation.y = Math.PI / 2;
  });

  return (
    <group ref={group}>
      <CarModel color="#3b82f6" getSpeed={() => speed} />
    </group>
  );
}
