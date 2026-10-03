// Combat rules: player attacks and enemy damage. No React in here.

import { sfx } from './audio';
import { type EnemyRuntime, shared } from './shared';
import { useGame } from './store';

export const ATTACK_RANGE = 2.8;

export function damageEnemy(e: EnemyRuntime, amount: number): void {
  if (e.state === 'dead') return;
  e.hp -= amount;
  e.hitFlash = 1;
  sfx('hit');
  if (e.hp <= 0) {
    e.state = 'dead';
    e.respawnAt = performance.now() + 45000;
    useGame.getState().onKill();
  } else if (e.state === 'patrol' || e.state === 'return') {
    e.state = 'chase';
  }
}

/** Hit every living enemy that is close and roughly in front of the player. */
export function attackNearby(): void {
  const p = shared.player;
  const fx = Math.sin(p.yaw);
  const fz = Math.cos(p.yaw);
  for (const e of shared.enemies) {
    if (e.state === 'dead') continue;
    const dx = e.x - p.x;
    const dz = e.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d > ATTACK_RANGE) continue;
    const dot = d > 0.001 ? (dx * fx + dz * fz) / d : 1;
    if (dot > -0.3) damageEnemy(e, 1);
  }
}
