// Race overlay: countdown, lap + time panel, start hint and the result card.

import { useEffect, useState } from 'react';
import { fmtTime } from '../game/race';
import { type RacePhase, shared } from '../game/shared';
import { useGame } from '../game/store';
import { useT } from './useT';

interface Snap {
  phase: RacePhase;
  countdown: string;
  lap: number;
  laps: number;
  time: number;
  newBest: boolean;
  reward: number;
  nearRace: boolean;
}

function read(): Snap {
  const r = shared.race;
  return {
    phase: r.phase,
    countdown: r.countdown,
    lap: r.lap,
    laps: r.laps,
    time: Math.round(r.time * 10) / 10,
    newBest: r.newBest,
    reward: r.reward,
    nearRace: shared.nearby === 'race',
  };
}

export function RaceHud() {
  const t = useT();
  const bestTime = useGame((s) => s.bestTime);
  const [s, setS] = useState<Snap>(read);

  useEffect(() => {
    const id = window.setInterval(() => {
      const n = read();
      setS((o) => (JSON.stringify(o) === JSON.stringify(n) ? o : n));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const inRace = s.phase === 'countdown' || s.phase === 'racing';

  return (
    <div className="racehud">
      {s.countdown !== '' && (
        <div key={s.countdown} className={`racecount ${s.countdown === 'GO!' ? 'go' : ''}`}>
          {s.countdown}
        </div>
      )}

      {inRace && (
        <div className="racepanel">
          <b>
            🏁 {t('raceLap')} {s.lap}/{s.laps}
          </b>
          <span>⏱ {fmtTime(s.time)}</span>
          {bestTime > 0 && <span>🏆 {fmtTime(bestTime)}</span>}
        </div>
      )}

      {s.phase === 'finished' && (
        <div className="racecard">
          <h3>🏁 {t('raceDone')}</h3>
          <p>
            {t('raceTime')}: <b>{fmtTime(s.time)}</b>
          </p>
          {s.newBest && <p className="best">{t('raceNewBest')}</p>}
          {bestTime > 0 && (
            <p>
              {t('raceBest')}: <b>{fmtTime(bestTime)}</b>
            </p>
          )}
          <p>
            {t('reward')}: +{s.reward} 🪙
          </p>
        </div>
      )}

      {s.nearRace && !inRace && <div className="racehint">{t('raceHint')}</div>}
    </div>
  );
}
