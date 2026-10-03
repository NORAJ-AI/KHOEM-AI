// Mutable, per-frame game state that must NOT live in React state.
// React components read/write it inside useFrame; the HUD polls it a few times per second.

import { CAR_START, CAR_START_YAW, CHECKPOINTS, ENEMY_HOMES, HOME_SPAWN, NPC_POS } from './constants';

export type EnemyState = 'patrol' | 'chase' | 'attack' | 'return' | 'dead';

export interface EnemyRuntime {
  x: number;
  z: number;
  yaw: number;
  hp: number;
  state: EnemyState;
  hitFlash: number;
  attackAnim: number;
  moveSpeed: number;
  cd: number;
  wait: number;
  wx: number;
  wz: number;
  respawnAt: number;
}

export type Nearby = 'none' | 'npc' | 'car' | 'exit';

export const ENEMY_MAX_HP = 3;

export function makeEnemy(i: number): EnemyRuntime {
  const [x, z] = ENEMY_HOMES[i];
  return {
    x, z, yaw: 0, hp: ENEMY_MAX_HP, state: 'patrol', hitFlash: 0, attackAnim: 0,
    moveSpeed: 0, cd: 0, wait: 0, wx: x, wz: z, respawnAt: 0,
  };
}

export const shared = {
  player: {
    x: HOME_SPAWN[0], z: HOME_SPAWN[1], y: 0, yaw: 0, vy: 0,
    attackCd: 0, attackAnim: 0, invuln: 0,
  },
  vehicle: {
    x: CAR_START[0], z: CAR_START[1], yaw: CAR_START_YAW, speed: 0, steer: 0,
    health: 100, crashCd: 0, distAcc: 0,
  },
  npc: { x: NPC_POS[0], z: NPC_POS[1] },
  enemies: ENEMY_HOMES.map((_, i) => makeEnemy(i)),
  driving: false,
  nearby: 'none' as Nearby,
  camYaw: 0,
  camPitch: 0.42,
  hours: 8, // in-game clock, 0..24
  daylight: 1,
};

/** Touch / keyboard input. Triggers (jump, attack, interact) are consumed by the system that handles them. */
export const input = {
  joyX: 0,
  joyY: 0,
  keyX: 0,
  keyY: 0,
  lookDX: 0,
  lookDY: 0,
  brake: false,
  jump: false,
  attack: false,
  interact: false,
};

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function axes(): { x: number; y: number } {
  return { x: clamp(input.joyX + input.keyX, -1, 1), y: clamp(input.joyY + input.keyY, -1, 1) };
}

export function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function resetWorld(): void {
  shared.vehicle.x = CAR_START[0];
  shared.vehicle.z = CAR_START[1];
  shared.vehicle.yaw = CAR_START_YAW;
  shared.vehicle.speed = 0;
  shared.vehicle.steer = 0;
  shared.vehicle.crashCd = 0;
  shared.driving = false;
  shared.enemies = ENEMY_HOMES.map((_, i) => makeEnemy(i));
}

export function placeAtCheckpoint(index: number): void {
  const c = CHECKPOINTS[index] ?? CHECKPOINTS[0];
  shared.driving = false;
  shared.player.x = c.pos[0];
  shared.player.z = c.pos[1];
  shared.player.y = 0;
  shared.player.vy = 0;
}
