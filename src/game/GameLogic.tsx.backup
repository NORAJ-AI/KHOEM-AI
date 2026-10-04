// Glue logic that runs every frame while playing: interactions, pickups, checkpoints,
// mission targets, respawn, clock, autosave.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { sfx } from './audio';
import { CHECKPOINTS, DAY_SECONDS, HOME_SPAWN, PICKUPS, isBlocked } from './constants';
import { MISSIONS } from './missions';
import { input, placeAtCheckpoint, shared } from './shared';
import { useGame } from './store';

function enterVehicle(): void {
  const st = useGame.getState();
  shared.driving = true;
  shared.player.x = shared.vehicle.x;
  shared.player.z = shared.vehicle.z;
  sfx('enter');
  if (st.missionActive) st.advanceTutorial(4);
}

function exitVehicle(): void {
  const v = shared.vehicle;
  // Right side of the car first, then left, then behind.
  const rx = -Math.cos(v.yaw);
  const rz = Math.sin(v.yaw);
  const options: [number, number][] = [
    [v.x + rx * 2.5, v.z + rz * 2.5],
    [v.x - rx * 2.5, v.z - rz * 2.5],
    [v.x - Math.sin(v.yaw) * 3, v.z - Math.cos(v.yaw) * 3],
  ];
  const spot = options.find(([x, z]) => !isBlocked(x, z, 0.45)) ?? [v.x, v.z];
  shared.driving = false;
  shared.player.x = spot[0];
  shared.player.z = spot[1];
  shared.player.yaw = v.yaw;
  sfx('enter');
}

function talkToNpc(): void {
  const st = useGame.getState();
  const lang = st.settings.lang;
  sfx('click');
  if (st.missionIndex >= MISSIONS.length) {
    st.say(`${st.t('npcName')}: ${st.t('npcDone')}`);
    return;
  }
  const m = MISSIONS[st.missionIndex];
  if (!st.missionActive) {
    st.say(`${st.t('npcName')}: ${m.intro[lang]}`);
    st.startMission();
    st.advanceTutorial(3);
  } else {
    st.say(`${st.t('npcName')}: ${m.hint[lang]}`);
  }
}

export function GameLogic() {
  const saveTimer = useRef(0);

  useFrame((_, dtRaw) => {
    const st = useGame.getState();
    if (st.screen !== 'playing') return;
    const dt = Math.min(dtRaw, 0.05);
    const p = shared.player;
    const v = shared.vehicle;

    // clock
    shared.hours = (shared.hours + (dt * 24) / DAY_SECONDS) % 24;
    if (p.invuln > 0) p.invuln -= dt;

    // knocked out -> respawn at the last checkpoint (progress is kept)
    if (st.health <= 0) {
      placeAtCheckpoint(st.checkpoint);
      st.respawn();
      return;
    }

    const ax = shared.driving ? v.x : p.x;
    const az = shared.driving ? v.z : p.z;

    // what can the player interact with right now?
    if (shared.driving) shared.nearby = 'exit';
    else if (Math.hypot(p.x - v.x, p.z - v.z) < 3.4) shared.nearby = 'car';
    else if (Math.hypot(p.x - shared.npc.x, p.z - shared.npc.z) < 3.2) shared.nearby = 'npc';
    else shared.nearby = 'none';

    if (input.interact) {
      input.interact = false;
      if (shared.nearby === 'car') enterVehicle();
      else if (shared.nearby === 'exit') exitVehicle();
      else if (shared.nearby === 'npc') talkToNpc();
    }

    // tutorial: first step ends once the player has walked a bit
    if (st.tutorial === 0 && Math.hypot(p.x - HOME_SPAWN[0], p.z - HOME_SPAWN[1]) > 3) st.advanceTutorial(1);

    // pickups
    const reach = shared.driving ? 2.6 : 1.7;
    for (const c of PICKUPS) {
      if (st.collected.includes(c.id)) continue;
      if (Math.hypot(c.x - ax, c.z - az) < reach) {
        st.collect(c.id, c.kind);
        break;
      }
    }

    // checkpoints
    CHECKPOINTS.forEach((c, i) => {
      if (i !== st.checkpoint && Math.hypot(c.pos[0] - ax, c.pos[1] - az) < 4) st.setCheckpoint(i);
    });

    // mission targets (drive / go-to)
    if (st.missionActive && st.missionIndex < MISSIONS.length) {
      const m = MISSIONS[st.missionIndex];
      if (m.target && (m.type === 'goto' || (m.type === 'drive' && shared.driving))) {
        if (Math.hypot(m.target[0] - ax, m.target[1] - az) < (m.radius ?? 4)) st.setMissionFlag();
      }
    }

    // autosave
    saveTimer.current += dt;
    if (saveTimer.current > 20) {
      saveTimer.current = 0;
      st.save();
    }
  });

  return null;
}
