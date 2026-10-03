import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stepEnemy } from './ai';
import { Humanoid, type AnimState } from './Character';
import { ENEMY_HOMES, groundY } from './constants';
import { ENEMY_MAX_HP, shared } from './shared';
import { useGame } from './store';

function Enemy({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const bar = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const anim = useRef<AnimState>({ speed: 0, attack: 0, flash: 0 });

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    if (useGame.getState().screen === 'playing') stepEnemy(shared.enemies[index], index, Math.min(dtRaw, 0.05));
    const e = shared.enemies[index];
    g.visible = e.state !== 'dead';
    g.position.set(e.x, groundY(e.x, e.z), e.z);
    g.rotation.y = e.yaw;
    anim.current.speed = e.moveSpeed;
    anim.current.attack = e.attackAnim;
    anim.current.flash = e.hitFlash;
    if (bar.current) {
      bar.current.visible = e.hp < ENEMY_MAX_HP && e.state !== 'dead';
      bar.current.rotation.y = shared.camYaw - e.yaw; // keep the bar facing the camera
    }
    if (fill.current) {
      const f = Math.max(0.001, e.hp / ENEMY_MAX_HP);
      fill.current.scale.x = f;
      fill.current.position.x = -(1 - f) * 0.5;
    }
  });

  return (
    <group ref={group} position={[ENEMY_HOMES[index][0], 0, ENEMY_HOMES[index][1]]}>
      <Humanoid shirt="#7b1e3a" pants="#1e1e2a" hair="#111" hat="#b02a2a" getAnim={() => anim.current} />
      <group ref={bar} position={[0, 2.7, 0]} visible={false}>
        <mesh>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="#222" depthTest={false} transparent opacity={0.8} />
        </mesh>
        <mesh ref={fill} position={[0, 0, 0.001]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#ff4d4d" depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}

export function Enemies() {
  return (
    <>
      {ENEMY_HOMES.map((_, i) => (
        <Enemy key={i} index={i} />
      ))}
    </>
  );
}
