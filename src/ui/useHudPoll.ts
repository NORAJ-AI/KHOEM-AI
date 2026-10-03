import { useEffect, useState } from 'react';
import { shared } from '../game/shared';

export interface HudSnap {
  nearby: typeof shared.nearby;
  driving: boolean;
  carHealth: number;
  speed: number;
  clock: string;
}

function read(): HudSnap {
  const h = Math.floor(shared.hours);
  const m = Math.floor((shared.hours - h) * 60);
  return {
    nearby: shared.nearby,
    driving: shared.driving,
    carHealth: Math.max(0, Math.round(shared.vehicle.health)),
    speed: Math.round(Math.abs(shared.vehicle.speed) * 3.6),
    clock: `${String(h).padStart(2, '0')}:${String(m - (m % 5)).padStart(2, '0')}`,
  };
}

/** Per-frame game values live outside React; the HUD samples them a few times per second. */
export function useHudPoll(ms = 150): HudSnap {
  const [snap, setSnap] = useState<HudSnap>(read);
  useEffect(() => {
    const id = window.setInterval(() => {
      const n = read();
      setSnap((o) => (JSON.stringify(o) === JSON.stringify(n) ? o : n));
    }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return snap;
}
