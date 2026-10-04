import { useEffect, useState } from 'react';
import { shared } from './shared';

const RACE_X = 35;
const RACE_Z = 15;
const RACE_RADIUS = 8;

export function startRace(): void {
  shared.race.active = true;
  shared.race.countdown = '3';
  shared.race.started = false;
}

export function RaceInteraction() {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const dx = shared.player.x - RACE_X;
      const dz = shared.player.z - RACE_Z;
      const distance = Math.hypot(dx, dz);
      setNear(distance <= RACE_RADIUS);
    }, 150);

    return () => window.clearInterval(timer);
  }, []);

  if (!near || shared.driving) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '18%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        pointerEvents: 'none',
        padding: '12px 22px',
        borderRadius: 14,
        background: 'rgba(20,24,30,.88)',
        border: '2px solid rgba(255,216,61,.9)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(16px, 4vw, 24px)',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,.35)',
      }}
    >
      🏁 RACE START
      <div
        style={{
          marginTop: 4,
          fontSize: '0.7em',
          fontWeight: 600,
          opacity: 0.82,
        }}
      >
        ចូលទៅកាន់កន្លែងប្រណាំង
      </div>
    </div>
  );
}
