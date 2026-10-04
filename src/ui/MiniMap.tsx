import { useEffect, useRef } from 'react';
import {
  BRIDGE, BUILDINGS, CHECKPOINTS, RACE, RACE_START, RIVER, ROAD_A_Z, ROAD_B_X, ROAD_W, WORLD,
} from '../game/constants';
import { MISSIONS } from '../game/missions';
import { shared } from '../game/shared';
import { useGame } from '../game/store';

const SIZE = 118; // css px
const VIEW_R = 34; // world metres from the player to the edge of the map

export function MiniMap() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const g = canvas.getContext('2d');
    if (!g) return;
    const k = SIZE / (2 * VIEW_R);
    const c = SIZE / 2;

    const draw = () => {
      const me = shared.driving ? shared.vehicle : shared.player;
      const px = me.x;
      const pz = me.z;
      const X = (x: number) => c + (x - px) * k;
      const Z = (z: number) => c + (z - pz) * k;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, SIZE, SIZE);
      g.save();
      g.beginPath();
      g.arc(c, c, c - 1, 0, Math.PI * 2);
      g.clip();

      g.fillStyle = '#6fae63';
      g.fillRect(0, 0, SIZE, SIZE);
      // out of bounds
      g.fillStyle = '#2a3a2a';
      g.fillRect(0, 0, SIZE, Z(WORLD.minZ));
      g.fillRect(0, Z(WORLD.maxZ), SIZE, SIZE);
      g.fillRect(0, 0, X(WORLD.minX), SIZE);
      g.fillRect(X(WORLD.maxX), 0, SIZE, SIZE);
      // river + bridge
      g.fillStyle = '#3fa7d6';
      g.fillRect(0, Z(RIVER.z0), SIZE, (RIVER.z1 - RIVER.z0) * k);
      // roads
      g.fillStyle = '#5b6068';
      g.fillRect(X(WORLD.minX), Z(ROAD_A_Z - ROAD_W / 2), (WORLD.maxX - WORLD.minX) * k, ROAD_W * k);
      g.fillRect(X(ROAD_B_X - ROAD_W / 2), Z(WORLD.minZ), ROAD_W * k, (WORLD.maxZ - WORLD.minZ) * k);
      g.fillStyle = '#8d6e63';
      g.fillRect(X(BRIDGE.x0), Z(RIVER.z0 - 1), (BRIDGE.x1 - BRIDGE.x0) * k, (RIVER.z1 - RIVER.z0 + 2) * k);
      // race track
      g.strokeStyle = '#3a3f47';
      g.lineWidth = (RACE.outer - RACE.inner) * k;
      g.beginPath();
      g.arc(X(RACE.cx), Z(RACE.cz), RACE.laneR * k, 0, Math.PI * 2);
      g.stroke();
      // buildings
      g.fillStyle = '#c9a56a';
      for (const b of BUILDINGS) g.fillRect(X(b.x - b.w / 2), Z(b.z - b.d / 2), b.w * k, b.d * k);
      // checkpoints
      g.fillStyle = '#ffffff';
      for (const cp of CHECKPOINTS) g.fillRect(X(cp.pos[0]) - 2, Z(cp.pos[1]) - 2, 4, 4);
      // npc
      g.fillStyle = '#f1c40f';
      g.beginPath();
      g.arc(X(shared.npc.x), Z(shared.npc.z), 3, 0, Math.PI * 2);
      g.fill();
      // enemies
      g.fillStyle = '#e03131';
      for (const e of shared.enemies) {
        if (e.state === 'dead') continue;
        g.beginPath();
        g.arc(X(e.x), Z(e.z), 2.5, 0, Math.PI * 2);
        g.fill();
      }
      // car (when the player is on foot)
      if (!shared.driving) {
        g.fillStyle = '#ff6b6b';
        g.fillRect(X(shared.vehicle.x) - 3, Z(shared.vehicle.z) - 3, 6, 6);
      }
      // race start flag (clamped to the edge of the map when far away)
      {
        let fx = X(RACE_START[0]);
        let fz = Z(RACE_START[1]);
        const fdx = fx - c;
        const fdz = fz - c;
        const fd = Math.hypot(fdx, fdz);
        if (fd > c - 8) {
          fx = c + (fdx / fd) * (c - 8);
          fz = c + (fdz / fd) * (c - 8);
        }
        g.fillStyle = '#ffffff';
        g.fillRect(fx - 4, fz - 4, 8, 8);
        g.fillStyle = '#111111';
        g.fillRect(fx - 4, fz - 4, 4, 4);
        g.fillRect(fx, fz, 4, 4);
      }
      // mission target (clamped to the edge if far away)
      const st = useGame.getState();
      const m = st.missionActive ? MISSIONS[st.missionIndex] : undefined;
      if (m?.target) {
        let tx = X(m.target[0]);
        let tz = Z(m.target[1]);
        const dx = tx - c;
        const dz = tz - c;
        const d = Math.hypot(dx, dz);
        if (d > c - 8) {
          tx = c + (dx / d) * (c - 8);
          tz = c + (dz / d) * (c - 8);
        }
        g.fillStyle = '#ffd93b';
        g.strokeStyle = '#7a5a00';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(tx, tz, 4.5, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      // player arrow (points where the player/car faces)
      const yaw = shared.driving ? shared.vehicle.yaw : shared.player.yaw;
      g.save();
      g.translate(c, c);
      g.rotate(Math.PI - yaw);
      g.fillStyle = '#ffffff';
      g.strokeStyle = '#1f4e8c';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(0, -7);
      g.lineTo(5, 6);
      g.lineTo(0, 3);
      g.lineTo(-5, 6);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();

      g.restore();
    };

    draw();
    const id = window.setInterval(draw, 100);
    return () => window.clearInterval(id);
  }, []);

  return <canvas ref={ref} className="minimap" style={{ width: SIZE, height: SIZE }} />;
}
