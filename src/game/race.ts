// Race rules: start, countdown, lap counting, finish and reward. No React in here.
//
// Laps are counted by the angle driven around the ring's centre. The angle only counts while the car is
// on the road, so cutting across the grass never gives a shortcut, and driving backwards takes progress away.

import { sfx } from './audio';
import { RACE, RACE_START } from './constants';
import { shared } from './shared';
import { useGame } from './store';

const TAU = Math.PI * 2;
const START_ANGLE = -Math.PI / 2; // the start line is at the north point of the ring

function angleOf(x: number, z: number): number {
  return Math.atan2(z - RACE.cz, x - RACE.cx);
}

function wrapAngle(a: number): number {
  let d = a % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** 83.4 seconds -> "1:23.4" */
export function fmtTime(sec: number): string {
  const tenths = Math.round(sec * 10);
  const m = Math.floor(tenths / 600);
  const s = (tenths % 600) / 10;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/** Is the player (or the car they are driving) close enough to the start line to begin? */
export function nearRaceStart(x: number, z: number): boolean {
  return Math.hypot(x - RACE_START[0], z - RACE_START[1]) <= RACE.startRadius;
}

/** Puts the car on the starting grid, seats the player in it and starts the countdown. */
export function startRace(): void {
  const r = shared.race;
  const v = shared.vehicle;
  v.x = RACE_START[0] - 5; // on the grid, just behind the line
  v.z = RACE_START[1];
  v.yaw = Math.PI / 2; // facing east = the racing direction
  v.speed = 0;
  v.steer = 0;
  shared.driving = true;
  shared.player.x = v.x;
  shared.player.z = v.z;
  shared.camYaw = v.yaw + Math.PI; // camera behind the car

  r.phase = 'countdown';
  r.countdown = '3';
  r.timer = 0;
  r.time = 0;
  r.lap = 1;
  r.laps = RACE.laps;
  r.lastAngle = angleOf(v.x, v.z);
  r.progress = wrapAngle(r.lastAngle - START_ANGLE); // a little below 0: the line is still ahead
  r.newBest = false;
  r.reward = 0;
  sfx('click');
}

export function cancelRace(): void {
  shared.race.phase = 'idle';
  shared.race.countdown = '';
}

function finishRace(): void {
  const r = shared.race;
  r.phase = 'finished';
  r.countdown = '';
  r.resultTimer = 7;
  const result = useGame.getState().finishRace(r.time);
  r.newBest = result.newBest;
  r.reward = result.reward;
}

/** Runs every frame while playing. */
export function stepRace(dt: number): void {
  const r = shared.race;
  if (r.phase === 'idle') return;

  if (r.phase === 'finished') {
    r.resultTimer -= dt;
    if (r.resultTimer <= 0) cancelRace();
    return;
  }

  // Getting out of the car (or wrecking it) ends the race.
  if (!shared.driving) {
    cancelRace();
    return;
  }

  const v = shared.vehicle;

  if (r.phase === 'countdown') {
    r.timer += dt;
    const next = r.timer < 1 ? '3' : r.timer < 2 ? '2' : r.timer < 3 ? '1' : 'GO!';
    if (next !== r.countdown) {
      r.countdown = next;
      sfx(next === 'GO!' ? 'checkpoint' : 'click');
    }
    if (r.timer >= 3) {
      r.phase = 'racing';
      r.timer = 0;
    }
    return;
  }

  // racing
  r.timer += dt;
  r.time += dt;
  if (r.countdown === 'GO!' && r.timer > 1) r.countdown = '';

  const a = angleOf(v.x, v.z);
  const d = wrapAngle(a - r.lastAngle);
  r.lastAngle = a;
  const radius = Math.hypot(v.x - RACE.cx, v.z - RACE.cz);
  if (radius > RACE.inner - 2 && radius < RACE.outer + 3) r.progress += d;

  r.lap = Math.min(r.laps, Math.floor(Math.max(0, r.progress) / TAU) + 1);
  if (r.progress >= r.laps * TAU) finishRace();
}
