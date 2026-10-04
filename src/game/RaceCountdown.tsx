import { useEffect, useState } from 'react';
import { shared } from './shared';

export function RaceCountdown({ active }: { active?: boolean }) {
  const [raceActive, setRaceActive] = useState(shared.race.active);
  const [value, setValue] = useState('');

  useEffect(() => {
    const poll = window.setInterval(() => {
      setRaceActive(shared.race.active);
    }, 100);

    return () => window.clearInterval(poll);
  }, []);

  active = raceActive;

  useEffect(() => {
    if (!active) {
      setValue('');
      return;
    }
    const steps = ['3', '2', '1', 'GO!'];
    let i = 0;

    setValue(steps[0]);
    shared.race.countdown = steps[0];
    shared.race.started = false;

    const timer = window.setInterval(() => {
      i += 1;

      if (i >= steps.length) {
        window.clearInterval(timer);
        shared.race.countdown = 'GO!';
        shared.race.started = true;
        setValue('GO!');
        return;
      }

      setValue(steps[i]);
      shared.race.countdown = steps[i];
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: '18%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        pointerEvents: 'none',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 900,
        fontSize: 'clamp(64px, 16vw, 150px)',
        lineHeight: 1,
        color: '#ffffff',
        WebkitTextStroke: '4px #20242a',
        textShadow: '0 8px 18px rgba(0,0,0,.55)',
      }}
    >
      {value}
    </div>
  );
}
