import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Humanoid, type AnimState } from './Character';
import { attackNearby } from './combat';
import { groundY, isBlocked } from './constants';
import { sfx } from './audio';
import { axes, input, lerpAngle, shared } from './shared';
import { useGame } from './store';

export function Player() {
  const group = useRef<THREE.Group>(null);
  const anim = useRef<AnimState>({ speed: 0, attack: 0, flash: 0 });

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const st = useGame.getState();
    const p = shared.player;
    g.visible = !shared.driving;

    if (st.screen === 'playing') {
      const dt = Math.min(dtRaw, 0.05);

      if (shared.driving) {
        p.x = shared.vehicle.x;
        p.z = shared.vehicle.z;
        p.y = 0;
        anim.current.speed = 0;
        input.jump = false;
        input.attack = false;
      } else {
        // --- movement (camera-relative) ---
        const a = axes();
        const len = Math.hypot(a.x, a.y);
        let speed = 0;
        if (len > 0.1) {
          const cy = shared.camYaw;
          const dx = -Math.sin(cy) * a.y + Math.cos(cy) * a.x;
          const dz = -Math.cos(cy) * a.y - Math.sin(cy) * a.x;
          const nx = dx / len;
          const nz = dz / len;
          speed = (len < 0.7 ? 3.4 : 7.2) * (1 + 0.1 * st.upgrades.move);
          const sx = nx * speed * dt;
          const sz = nz * speed * dt;
          if (!isBlocked(p.x + sx, p.z, 0.45)) p.x += sx;
          if (!isBlocked(p.x, p.z + sz, 0.45)) p.z += sz;
          p.yaw = lerpAngle(p.yaw, Math.atan2(nx, nz), 1 - Math.exp(-14 * dt));
        }

        // --- jump / gravity ---
        const gy = groundY(p.x, p.z);
        if (input.jump) {
          input.jump = false;
          if (p.y <= gy + 0.02) {
            p.vy = 8;
            sfx('jump');
            st.advanceTutorial(2);
          }
        }
        p.vy -= 24 * dt;
        p.y += p.vy * dt;
        if (p.y <= gy) {
          p.y = gy;
          p.vy = 0;
        }

        // --- attack ---
        p.attackCd = Math.max(0, p.attackCd - dt);
        p.attackAnim = Math.max(0, p.attackAnim - dt);
        if (input.attack) {
          input.attack = false;
          if (p.attackCd <= 0) {
            p.attackCd = 0.45;
            p.attackAnim = 0.3;
            sfx('swing');
            attackNearby();
          }
        }
        anim.current.speed = speed;
        anim.current.attack = p.attackAnim;
      }
    }

    // Blink while invulnerable after being hit.
    anim.current.flash = shared.player.invuln > 0 ? 0.6 : 0;
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.yaw;
  });

  return (
    <group ref={group}>
      <Humanoid shirt="#2f80ed" scarf="#e74c3c" getAnim={() => anim.current} />
    </group>
  );
}
