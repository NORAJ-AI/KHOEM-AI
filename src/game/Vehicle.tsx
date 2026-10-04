import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CarModel } from './Character';
import { CAR_START, CAR_START_YAW, groundY, isBlocked } from './constants';
import { setEngine, sfx } from './audio';
import { axes, clamp, input, shared } from './shared';
import { carMaxHealthOf, useGame } from './store';

type Veh = typeof shared.vehicle;

function stepVehicle(v: Veh, dt: number): void {
  const st = useGame.getState();
  const maxSpeed = 20 * (1 + 0.12 * st.upgrades.carSpeed);
  let throttle = 0;
  let steer = 0;
  const locked = shared.race.phase === 'countdown'; // cars wait at the start lights
  if (shared.driving && !locked) {
    const a = axes();
    throttle = Math.abs(a.y) < 0.1 ? 0 : a.y;
    steer = a.x;
  }

  // --- longitudinal ---
  if (throttle > 0) v.speed += throttle * (v.speed < 0 ? 30 : 14) * dt;
  else if (throttle < 0) v.speed += throttle * (v.speed > 0 ? 30 : 10) * dt;
  else v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), (shared.driving ? 5 : 12) * dt);
  if (shared.driving && input.brake) v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 34 * dt);
  v.speed = clamp(v.speed, -8, maxSpeed);
  if (locked) v.speed = 0;

  // --- steering (needs speed, like a real car) ---
  v.steer += (steer - v.steer) * Math.min(1, dt * 8);
  v.yaw -= steer * 1.7 * clamp(v.speed / 5, -1, 1) * dt;

  // --- movement + collision ---
  v.crashCd = Math.max(0, v.crashCd - dt);
  const nx = v.x + Math.sin(v.yaw) * v.speed * dt;
  const nz = v.z + Math.cos(v.yaw) * v.speed * dt;
  const okX = !isBlocked(nx, v.z, 1.3);
  const okZ = !isBlocked(v.x, nz, 1.3);
  if (okX && okZ && !isBlocked(nx, nz, 1.3)) {
    v.x = nx;
    v.z = nz;
  } else {
    let slid = false;
    if (okX) {
      v.x = nx;
      slid = true;
    } else if (okZ) {
      v.z = nz;
      slid = true;
    }
    const impact = Math.abs(v.speed);
    v.speed *= slid ? 0.7 : -0.3;
    if (impact > 7 && v.crashCd <= 0) {
      v.crashCd = 0.5;
      v.health -= (impact - 5) * 1.6;
      sfx('hit');
    }
  }

  // --- distance statistic (for achievements) ---
  if (shared.driving) {
    v.distAcc += Math.abs(v.speed) * dt;
    if (v.distAcc >= 25) {
      st.addDistance(v.distAcc);
      v.distAcc = 0;
    }
  }

  // --- wrecked: repaired at home, driver is dropped on the spot ---
  if (v.health <= 0) {
    if (shared.driving) {
      shared.driving = false;
      shared.player.x = v.x;
      shared.player.z = v.z;
    }
    v.x = CAR_START[0];
    v.z = CAR_START[1];
    v.yaw = CAR_START_YAW;
    v.speed = 0;
    v.health = carMaxHealthOf(st.upgrades);
    st.showToast(st.t('carWrecked'));
  }

  setEngine(shared.driving ? Math.min(1, Math.abs(v.speed) / maxSpeed) : -1);
}

export function Vehicle() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const v = shared.vehicle;
    if (useGame.getState().screen === 'playing') stepVehicle(v, Math.min(dtRaw, 0.05));
    else setEngine(-1);
    g.position.set(v.x, groundY(v.x, v.z), v.z);
    g.rotation.y = v.yaw;
  });

  return (
    <group ref={group}>
      <CarModel color="#e74c3c" getSpeed={() => shared.vehicle.speed} getSteer={() => shared.vehicle.steer} />
    </group>
  );
}
