// Enemy AI: patrol -> chase -> attack -> return. One small state machine, cheap enough for phones.

import { ENEMY_HOMES, isBlocked } from './constants';
import { damageEnemy } from './combat';
import { ENEMY_MAX_HP, type EnemyRuntime, makeEnemy, shared } from './shared';
import { useGame } from './store';

const DETECT = 12;
const LOSE = 22;
const ATTACK_R = 1.8;

function moveToward(e: EnemyRuntime, tx: number, tz: number, speed: number, dt: number): void {
  const dx = tx - e.x;
  const dz = tz - e.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05) return;
  const nx = dx / d;
  const nz = dz / d;
  e.yaw = Math.atan2(nx, nz);
  const sx = nx * speed * dt;
  const sz = nz * speed * dt;
  if (!isBlocked(e.x + sx, e.z, 0.5)) e.x += sx;
  if (!isBlocked(e.x, e.z + sz, 0.5)) e.z += sz;
}

export function stepEnemy(e: EnemyRuntime, i: number, dt: number): void {
  e.hitFlash = Math.max(0, e.hitFlash - dt * 4);
  e.attackAnim = Math.max(0, e.attackAnim - dt);
  e.cd = Math.max(0, e.cd - dt);

  if (e.state === 'dead') {
    if (performance.now() >= e.respawnAt) shared.enemies[i] = makeEnemy(i);
    return;
  }

  const home = ENEMY_HOMES[i];
  const target = shared.driving ? shared.vehicle : shared.player;
  const dx = target.x - e.x;
  const dz = target.z - e.z;
  const d = Math.hypot(dx, dz);
  const dHome = Math.hypot(e.x - home[0], e.z - home[1]);

  // Getting run over by a fast car hurts.
  if (shared.driving && Math.abs(shared.vehicle.speed) > 6 && d < 2.4) {
    damageEnemy(e, ENEMY_MAX_HP);
    return;
  }

  let speed = 0;
  switch (e.state) {
    case 'patrol': {
      if (d < DETECT) {
        e.state = 'chase';
        break;
      }
      e.wait -= dt;
      if (e.wait <= 0) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 5;
        e.wx = home[0] + Math.cos(a) * r;
        e.wz = home[1] + Math.sin(a) * r;
        e.wait = 2 + Math.random() * 3;
      }
      if (Math.hypot(e.wx - e.x, e.wz - e.z) > 0.6) {
        speed = 1.6;
        moveToward(e, e.wx, e.wz, speed, dt);
      }
      break;
    }
    case 'chase': {
      if (d > LOSE || dHome > 28) {
        e.state = 'return';
        break;
      }
      if (d < ATTACK_R) {
        e.state = 'attack';
        break;
      }
      speed = 4.4;
      moveToward(e, target.x, target.z, speed, dt);
      break;
    }
    case 'attack': {
      e.yaw = Math.atan2(dx, dz);
      if (d > ATTACK_R + 0.8) {
        e.state = 'chase';
        break;
      }
      if (e.cd <= 0) {
        e.cd = 1.1;
        e.attackAnim = 0.3;
        if (shared.driving) shared.vehicle.health -= 4;
        else useGame.getState().damagePlayer(8);
      }
      break;
    }
    case 'return': {
      if (dHome < 1.5) {
        e.state = 'patrol';
        e.wait = 0;
        break;
      }
      if (d < DETECT * 0.8 && dHome < 20) {
        e.state = 'chase';
        break;
      }
      speed = 3.6;
      moveToward(e, home[0], home[1], speed, dt);
      break;
    }
    default:
      break;
  }
  e.moveSpeed = speed;
}
