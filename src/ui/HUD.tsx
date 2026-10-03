import { MISSIONS, missionProgress } from '../game/missions';
import { useGame } from '../game/store';
import { maxHealthOf, carMaxHealthOf } from '../game/store';
import { sfx } from '../game/audio';
import { ActionButtons, Joystick, LookPad } from './Controls';
import { MiniMap } from './MiniMap';
import { useHudPoll } from './useHudPoll';
import { useT } from './useT';

export function HUD() {
  const t = useT();
  const snap = useHudPoll();
  const g = useGame();
  const lang = g.settings.lang;
  const maxHp = maxHealthOf(g.upgrades);
  const carMax = carMaxHealthOf(g.upgrades);

  const mission = g.missionIndex < MISSIONS.length ? MISSIONS[g.missionIndex] : undefined;
  let missionLine = t('allDone');
  let progress = '';
  if (mission) {
    if (g.missionActive) {
      missionLine = mission.objective[lang];
      const p = missionProgress(mission, {
        coinsCollected: g.collected.filter((id) => id.startsWith('c')).length,
        kills: g.kills,
        flag: g.missionFlag,
      });
      if (p.max > 1) progress = `${p.cur}/${p.max}`;
    } else {
      missionLine = t('talkToSok');
    }
  }

  return (
    <div className="hud">
      <LookPad />
      <Joystick />

      <div className="stats">
        <div className="bar hp">
          <div className="fill" style={{ width: `${(g.health / maxHp) * 100}%` }} />
          <span>❤ {Math.ceil(g.health)}</span>
        </div>
        <div className="chips">
          <span className="chip">🪙 {g.coins}</span>
          <span className="chip">💎 {g.gems}</span>
          <span className="chip">🕒 {snap.clock}</span>
        </div>
        {snap.driving && (
          <div className="bar car">
            <div className="fill" style={{ width: `${(snap.carHealth / carMax) * 100}%` }} />
            <span>🚗 {snap.speed} km/h</span>
          </div>
        )}
      </div>

      <div className="topright">
        {g.settings.minimap && <MiniMap />}
        <button
          className="pausebtn"
          onPointerDown={(e) => {
            e.preventDefault();
            sfx('click');
            g.pause();
          }}
          aria-label="pause"
        >
          ⏸
        </button>
      </div>

      <div className="mission">
        <div className="mtitle">{mission && g.missionActive ? mission.title[lang] : t('mission')}</div>
        <div className="mtext">
          {missionLine} {progress && <b>{progress}</b>}
        </div>
      </div>

      {g.tutorial < 5 && <div className="tutorial">{t(`tut${g.tutorial}` as 'tut0')}</div>}
      {g.dialogue && <div className="dialogue">{g.dialogue.text}</div>}
      {g.toast && (
        <div key={g.toast.id} className="toast">
          {g.toast.text}
        </div>
      )}

      <ActionButtons />
    </div>
  );
}
