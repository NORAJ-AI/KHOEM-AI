// Global game state (progress, settings, screens) + save/load. Uses zustand.

import { create } from 'zustand';
import { CHECKPOINTS } from './constants';
import { MISSIONS, missionProgress } from './missions';
import { applyAudioSettings, sfx } from './audio';
import { type Lang, type Key, tr } from './i18n';
import { placeAtCheckpoint, resetWorld, shared } from './shared';

export type Quality = 'low' | 'medium' | 'high';
export type UpgradeKey = 'hp' | 'move' | 'carSpeed' | 'carArmor';

export interface Settings {
  quality: Quality;
  fps: 30 | 60;
  minimap: boolean;
  sound: boolean;
  music: boolean;
  rain: boolean;
  lang: Lang;
}

export interface Upgrades {
  hp: number;
  move: number;
  carSpeed: number;
  carArmor: number;
}

export const UPGRADE_MAX = 5;
export const upgradeCost = (level: number): number => 20 + level * 20;
export const maxHealthOf = (u: Upgrades): number => 100 + 20 * u.hp;
export const carMaxHealthOf = (u: Upgrades): number => 100 + 25 * u.carArmor;

interface Progress {
  coins: number;
  gems: number;
  kills: number;
  distance: number;
  upgrades: Upgrades;
  collected: string[];
  missionIndex: number;
  missionActive: boolean;
  missionFlag: boolean;
  checkpoint: number;
  tutorial: number; // 0..4 = steps, 5 = finished
  achievements: string[];
}

interface SaveData extends Progress {
  v: 1;
  hours: number;
}

export interface Achievement {
  id: string;
  km: string;
  en: string;
  test: (s: Progress) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_mission', km: 'បេសកកម្មដំបូង', en: 'First Mission', test: (s) => s.missionIndex >= 1 },
  { id: 'fighter', km: 'អ្នកប្រយុទ្ធ', en: 'Fighter', test: (s) => s.kills >= 3 },
  { id: 'rich', km: 'អ្នកមានកាក់', en: 'Pocket Full of Coins', test: (s) => s.coins >= 50 },
  { id: 'explorer', km: 'អ្នករុករក', en: 'Explorer', test: (s) => s.gems >= 1 },
  { id: 'driver', km: 'អ្នកបើកបរ', en: 'Road Warrior', test: (s) => s.distance >= 500 },
];

const SAVE_KEY = 'khoem-ai-save-v1';
const SETTINGS_KEY = 'khoem-ai-settings-v1';

const defaultSettings: Settings = {
  quality: 'medium', fps: 60, minimap: true, sound: true, music: true, rain: false, lang: 'km',
};

function freshProgress(): Progress {
  return {
    coins: 0, gems: 0, kills: 0, distance: 0,
    upgrades: { hp: 0, move: 0, carSpeed: 0, carArmor: 0 },
    collected: [], missionIndex: 0, missionActive: false, missionFlag: false,
    checkpoint: 0, tutorial: 0, achievements: [],
  };
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* ignore corrupt settings */
  }
  return defaultSettings;
}

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<SaveData>;
    if (d.v !== 1) return null;
    const base = freshProgress();
    return {
      ...base,
      ...d,
      upgrades: { ...base.upgrades, ...(d.upgrades ?? {}) },
      v: 1,
      hours: typeof d.hours === 'number' ? d.hours : 8,
    };
  } catch {
    return null;
  }
}

let toastId = 0;
let toastTimer: number | undefined;
let dialogueTimer: number | undefined;

export interface Toast {
  id: number;
  text: string;
}

interface GameState extends Progress {
  screen: 'menu' | 'playing' | 'paused';
  hasSave: boolean;
  settings: Settings;
  health: number;
  toast: Toast | null;
  dialogue: Toast | null;

  newGame: () => void;
  continueGame: () => void;
  pause: () => void;
  resume: () => void;
  toMenu: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  collect: (id: string, kind: 'coin' | 'gem') => void;
  onKill: () => void;
  startMission: () => void;
  setMissionFlag: () => void;
  evaluateMission: () => void;
  completeMission: () => void;
  damagePlayer: (n: number) => void;
  respawn: () => void;
  buyUpgrade: (key: UpgradeKey) => boolean;
  setCheckpoint: (i: number) => void;
  addDistance: (m: number) => void;
  advanceTutorial: (minStep: number) => void;
  showToast: (text: string) => void;
  say: (text: string) => void;
  save: () => void;
  checkAchievements: () => void;
  t: (key: Key) => string;
}

const initialSettings = loadSettings();

export const useGame = create<GameState>((set, get) => ({
  ...freshProgress(),
  screen: 'menu',
  hasSave: readSave() !== null,
  settings: initialSettings,
  health: 100,
  toast: null,
  dialogue: null,

  t: (key) => tr(get().settings.lang, key),

  newGame: () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    const fresh = freshProgress();
    resetWorld();
    shared.hours = 8;
    shared.vehicle.health = carMaxHealthOf(fresh.upgrades);
    placeAtCheckpoint(0);
    set({ ...fresh, hasSave: false, screen: 'playing', health: maxHealthOf(fresh.upgrades) });
  },

  continueGame: () => {
    const s = readSave();
    if (!s) {
      get().newGame();
      return;
    }
    resetWorld();
    shared.hours = s.hours;
    shared.vehicle.health = carMaxHealthOf(s.upgrades);
    placeAtCheckpoint(s.checkpoint);
    set({ ...s, screen: 'playing', health: maxHealthOf(s.upgrades), hasSave: true });
  },

  pause: () => {
    if (get().screen === 'playing') {
      get().save();
      set({ screen: 'paused' });
    }
  },
  resume: () => {
    if (get().screen === 'paused') set({ screen: 'playing' });
  },
  toMenu: () => {
    get().save();
    shared.driving = false;
    set({ screen: 'menu', hasSave: readSave() !== null });
  },

  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    applyAudioSettings(settings.sound, settings.music);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  },

  collect: (id, kind) => {
    const s = get();
    if (s.collected.includes(id)) return;
    set({
      collected: [...s.collected, id],
      coins: s.coins + (kind === 'gem' ? 10 : 1),
      gems: s.gems + (kind === 'gem' ? 1 : 0),
    });
    sfx(kind === 'gem' ? 'gem' : 'coin');
    get().showToast(get().t(kind === 'gem' ? 'gotGem' : 'gotCoin'));
    get().evaluateMission();
    get().checkAchievements();
  },

  onKill: () => {
    set((s) => ({ kills: s.kills + 1, coins: s.coins + 5 }));
    get().showToast(get().t('enemyReward'));
    get().evaluateMission();
    get().checkAchievements();
    get().save();
  },

  startMission: () => {
    const s = get();
    if (s.missionActive || s.missionIndex >= MISSIONS.length) return;
    set({ missionActive: true, missionFlag: false });
    sfx('click');
    const lang = s.settings.lang;
    get().showToast(`${get().t('missionStart')} ${MISSIONS[s.missionIndex].title[lang]}`);
    get().evaluateMission();
  },

  setMissionFlag: () => {
    if (get().missionFlag) return;
    set({ missionFlag: true });
    get().evaluateMission();
  },

  evaluateMission: () => {
    const s = get();
    if (!s.missionActive || s.missionIndex >= MISSIONS.length) return;
    const m = MISSIONS[s.missionIndex];
    const p = missionProgress(m, {
      coinsCollected: s.collected.filter((id) => id.startsWith('c')).length,
      kills: s.kills,
      flag: s.missionFlag,
    });
    if (p.cur >= p.max) get().completeMission();
  },

  completeMission: () => {
    const s = get();
    const m = MISSIONS[s.missionIndex];
    if (!m) return;
    const lang = s.settings.lang;
    set({
      coins: s.coins + m.reward,
      missionIndex: s.missionIndex + 1,
      missionActive: false,
      missionFlag: false,
    });
    sfx('mission');
    get().say(m.done[lang]);
    get().showToast(`${get().t('missionDone')} ${get().t('reward')}: +${m.reward}`);
    if (s.missionIndex === 0) get().advanceTutorial(5);
    get().checkAchievements();
    get().save();
  },

  damagePlayer: (n) => {
    if (shared.player.invuln > 0) return;
    shared.player.invuln = 0.7;
    sfx('hurt');
    set((s) => ({ health: Math.max(0, s.health - n) }));
  },

  respawn: () => {
    set((s) => ({ health: maxHealthOf(s.upgrades) }));
    get().showToast(get().t('died'));
  },

  buyUpgrade: (key) => {
    const s = get();
    const level = s.upgrades[key];
    if (level >= UPGRADE_MAX) return false;
    const cost = upgradeCost(level);
    if (s.coins < cost) {
      get().showToast(get().t('notEnough'));
      return false;
    }
    const upgrades = { ...s.upgrades, [key]: level + 1 };
    set({
      coins: s.coins - cost,
      upgrades,
      health: key === 'hp' ? maxHealthOf(upgrades) : s.health,
    });
    if (key === 'carArmor') shared.vehicle.health = carMaxHealthOf(upgrades);
    sfx('coin');
    get().save();
    return true;
  },

  setCheckpoint: (i) => {
    if (get().checkpoint === i) return;
    set({ checkpoint: i });
    sfx('checkpoint');
    const lang = get().settings.lang;
    get().showToast(`${get().t('checkpoint')} ${CHECKPOINTS[i].name[lang]}`);
    get().save();
  },

  addDistance: (m) => {
    set((s) => ({ distance: s.distance + m }));
    get().checkAchievements();
  },

  advanceTutorial: (minStep) => {
    if (get().tutorial < minStep) set({ tutorial: minStep });
  },

  showToast: (text) => {
    const id = ++toastId;
    set({ toast: { id, text } });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 2300);
  },

  say: (text) => {
    const id = ++toastId;
    set({ dialogue: { id, text } });
    window.clearTimeout(dialogueTimer);
    dialogueTimer = window.setTimeout(() => {
      if (get().dialogue?.id === id) set({ dialogue: null });
    }, 5000);
  },

  save: () => {
    const s = get();
    if (s.screen === 'menu') return; // never overwrite a save with the idle menu state
    const data: SaveData = {
      v: 1,
      coins: s.coins, gems: s.gems, kills: s.kills, distance: s.distance,
      upgrades: s.upgrades, collected: s.collected,
      missionIndex: s.missionIndex, missionActive: s.missionActive, missionFlag: s.missionFlag,
      checkpoint: s.checkpoint, tutorial: s.tutorial, achievements: s.achievements,
      hours: shared.hours,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      if (!s.hasSave) set({ hasSave: true });
    } catch {
      /* storage full or blocked: the game still works, it just can't save */
    }
  },

  checkAchievements: () => {
    const s = get();
    const lang = s.settings.lang;
    const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.test(s));
    if (unlocked.length === 0) return;
    set({ achievements: [...s.achievements, ...unlocked.map((a) => a.id)] });
    sfx('mission');
    get().showToast(`${get().t('achievement')} ${unlocked[0][lang]}`);
  },
}));

// Make sure the audio module knows the stored settings from the very start.
applyAudioSettings(initialSettings.sound, initialSettings.music);
