import { type ReactNode, useState } from 'react';
import { sfx } from '../game/audio';
import { shared, placeAtCheckpoint } from '../game/shared';
import {
  ACHIEVEMENTS, UPGRADE_MAX, type Quality, type UpgradeKey, upgradeCost, useGame,
} from '../game/store';
import type { Key } from '../game/i18n';
import { fmtTime } from '../game/race';
import { useT } from './useT';

type Panel = null | 'settings' | 'upgrades' | 'inventory' | 'credits';

function MenuButton({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      className={`btn ${primary ? 'primary' : ''}`}
      onClick={() => {
        sfx('click');
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function Segment<T extends string | number | boolean>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segment">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={o.value === value ? 'sel' : ''}
          onClick={() => {
            sfx('click');
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const t = useT();
  return (
    <div className="modal">
      <h2>{title}</h2>
      <div className="modal-body">{children}</div>
      <MenuButton onClick={onBack}>{t('back')}</MenuButton>
    </div>
  );
}

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const t = useT();
  const s = useGame((x) => x.settings);
  const set = useGame((x) => x.setSettings);
  const onOff = [
    { value: true, label: t('on') },
    { value: false, label: t('off') },
  ];
  return (
    <Modal title={t('settings')} onBack={onBack}>
      <div className="row">
        <span>{t('graphics')}</span>
        <Segment<Quality>
          value={s.quality}
          onChange={(v) => set({ quality: v })}
          options={[
            { value: 'low', label: t('low') },
            { value: 'medium', label: t('medium') },
            { value: 'high', label: t('high') },
          ]}
        />
      </div>
      <div className="row">
        <span>{t('fps')}</span>
        <Segment<30 | 60>
          value={s.fps}
          onChange={(v) => set({ fps: v })}
          options={[{ value: 30, label: '30' }, { value: 60, label: '60' }]}
        />
      </div>
      <div className="row">
        <span>{t('minimap')}</span>
        <Segment value={s.minimap} onChange={(v) => set({ minimap: v })} options={onOff} />
      </div>
      <div className="row">
        <span>{t('sound')}</span>
        <Segment value={s.sound} onChange={(v) => set({ sound: v })} options={onOff} />
      </div>
      <div className="row">
        <span>{t('music')}</span>
        <Segment value={s.music} onChange={(v) => set({ music: v })} options={onOff} />
      </div>
      <div className="row">
        <span>{t('rain')}</span>
        <Segment value={s.rain} onChange={(v) => set({ rain: v })} options={onOff} />
      </div>
      <div className="row">
        <span>{t('language')}</span>
        <Segment<'km' | 'en'>
          value={s.lang}
          onChange={(v) => set({ lang: v })}
          options={[{ value: 'km', label: 'ខ្មែរ' }, { value: 'en', label: 'English' }]}
        />
      </div>
    </Modal>
  );
}

const UPGRADE_ROWS: { key: UpgradeKey; label: Key; icon: string }[] = [
  { key: 'hp', label: 'upHp', icon: '❤' },
  { key: 'move', label: 'upMove', icon: '👟' },
  { key: 'carSpeed', label: 'upCarSpeed', icon: '🏎' },
  { key: 'carArmor', label: 'upCarArmor', icon: '🛡' },
];

function UpgradesPanel({ onBack }: { onBack: () => void }) {
  const t = useT();
  const coins = useGame((s) => s.coins);
  const up = useGame((s) => s.upgrades);
  const buy = useGame((s) => s.buyUpgrade);
  return (
    <Modal title={`${t('upgrades')} · 🪙 ${coins}`} onBack={onBack}>
      {UPGRADE_ROWS.map((r) => {
        const level = up[r.key];
        const maxed = level >= UPGRADE_MAX;
        const cost = upgradeCost(level);
        return (
          <div className="row" key={r.key}>
            <span>
              {r.icon} {t(r.label)}
              <span className="pips">
                {Array.from({ length: UPGRADE_MAX }, (_, i) => (
                  <i key={i} className={i < level ? 'on' : ''} />
                ))}
              </span>
            </span>
            <button className="buy" disabled={maxed || coins < cost} onClick={() => buy(r.key)}>
              {maxed ? t('maxLevel') : `🪙 ${cost}`}
            </button>
          </div>
        );
      })}
    </Modal>
  );
}

function InventoryPanel({ onBack }: { onBack: () => void }) {
  const t = useT();
  const g = useGame();
  const lang = g.settings.lang;
  const got = ACHIEVEMENTS.filter((a) => g.achievements.includes(a.id));
  return (
    <Modal title={t('inventory')} onBack={onBack}>
      <div className="row"><span>🪙 {t('coins')}</span><b>{g.coins}</b></div>
      <div className="row"><span>💎 {t('gems')}</span><b>{g.gems}</b></div>
      <div className="row"><span>👊 {t('kills')}</span><b>{g.kills}</b></div>
      <div className="row"><span>🚗 {t('distance')}</span><b>{Math.round(g.distance)} m</b></div>
      <div className="row"><span>🏁 {t('races')}</span><b>{g.races}</b></div>
      <div className="row"><span>⏱ {t('bestTime')}</span><b>{g.bestTime > 0 ? fmtTime(g.bestTime) : '-'}</b></div>
      <div className="row col">
        <span>🏆 {t('achievements')}</span>
        <div className="tags">
          {got.length === 0 ? <em>{t('none')}</em> : got.map((a) => <span className="tag" key={a.id}>{a[lang]}</span>)}
        </div>
      </div>
    </Modal>
  );
}

function CreditsPanel({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <Modal title={t('credits')} onBack={onBack}>
      <p>{t('creditsText')}</p>
      <p>{t('credits2')}</p>
    </Modal>
  );
}

function SubPanel({ panel, onBack }: { panel: Exclude<Panel, null>; onBack: () => void }) {
  if (panel === 'settings') return <SettingsPanel onBack={onBack} />;
  if (panel === 'upgrades') return <UpgradesPanel onBack={onBack} />;
  if (panel === 'inventory') return <InventoryPanel onBack={onBack} />;
  return <CreditsPanel onBack={onBack} />;
}

export function MainMenu() {
  const t = useT();
  const hasSave = useGame((s) => s.hasSave);
  const newGame = useGame((s) => s.newGame);
  const continueGame = useGame((s) => s.continueGame);
  const [panel, setPanel] = useState<Panel>(null);

  if (panel) return <div className="overlay"><SubPanel panel={panel} onBack={() => setPanel(null)} /></div>;

  return (
    <div className="overlay">
      <div className="menu">
        <h1 className="logo">KHOEM-AI</h1>
        <p className="tagline">3D Adventure · Explore · Drive · Fight</p>
        {hasSave && <MenuButton primary onClick={continueGame}>{t('continue')}</MenuButton>}
        <MenuButton
          primary={!hasSave}
          onClick={() => {
            if (!hasSave || window.confirm(t('confirmNew'))) newGame();
          }}
        >
          {t('play')}
        </MenuButton>
        <MenuButton onClick={() => setPanel('settings')}>{t('settings')}</MenuButton>
        <MenuButton onClick={() => setPanel('credits')}>{t('credits')}</MenuButton>
      </div>
    </div>
  );
}

export function PauseMenu() {
  const t = useT();
  const resume = useGame((s) => s.resume);
  const toMenu = useGame((s) => s.toMenu);
  const checkpoint = useGame((s) => s.checkpoint);
  const [panel, setPanel] = useState<Panel>(null);

  if (panel) return <div className="overlay dim"><SubPanel panel={panel} onBack={() => setPanel(null)} /></div>;

  return (
    <div className="overlay dim">
      <div className="menu">
        <h2 className="ptitle">⏸</h2>
        <MenuButton primary onClick={resume}>{t('resume')}</MenuButton>
        <MenuButton onClick={() => setPanel('upgrades')}>{t('upgrades')}</MenuButton>
        <MenuButton onClick={() => setPanel('inventory')}>{t('inventory')}</MenuButton>
        <MenuButton onClick={() => setPanel('settings')}>{t('settings')}</MenuButton>
        <MenuButton
          onClick={() => {
            placeAtCheckpoint(checkpoint);
            shared.vehicle.speed = 0;
            resume();
          }}
        >
          {t('toCheckpoint')}
        </MenuButton>
        <MenuButton onClick={toMenu}>{t('toMenu')}</MenuButton>
      </div>
    </div>
  );
}
