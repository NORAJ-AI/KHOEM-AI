// All audio is synthesized with the Web Audio API, so the game needs no audio files
// (nothing to license, nothing to download, works offline).

export type SfxName = 'coin' | 'gem' | 'jump' | 'hit' | 'hurt' | 'mission' | 'click' | 'swing' | 'enter' | 'checkpoint';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let soundOn = true;
let musicOn = true;
let daylight = 1;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let loopsStarted = false;
let musicStep = 0;

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

export function initAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const AC = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  startLoops();
}

export function applyAudioSettings(sound: boolean, music: boolean): void {
  soundOn = sound;
  musicOn = music;
  if (!sound) setEngine(-1);
}

export function setDaylight(v: number): void {
  daylight = v;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export function sfx(name: SfxName): void {
  if (!soundOn || !ctx) return;
  switch (name) {
    case 'coin':
      tone(988, 0.08, 'square', 0.1);
      tone(1319, 0.14, 'square', 0.1, undefined, 0.07);
      break;
    case 'gem':
      tone(660, 0.1, 'triangle', 0.18);
      tone(880, 0.1, 'triangle', 0.18, undefined, 0.09);
      tone(1320, 0.25, 'triangle', 0.18, undefined, 0.18);
      break;
    case 'jump':
      tone(280, 0.16, 'sine', 0.16, 560);
      break;
    case 'swing':
      tone(500, 0.12, 'sawtooth', 0.05, 160);
      break;
    case 'hit':
      tone(180, 0.14, 'square', 0.16, 70);
      break;
    case 'hurt':
      tone(220, 0.25, 'sawtooth', 0.14, 90);
      break;
    case 'mission':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, undefined, i * 0.11));
      break;
    case 'checkpoint':
      tone(784, 0.12, 'sine', 0.15);
      tone(1175, 0.2, 'sine', 0.15, undefined, 0.1);
      break;
    case 'enter':
      tone(150, 0.2, 'square', 0.1, 90);
      break;
    case 'click':
      tone(700, 0.05, 'square', 0.06);
      break;
  }
}

/** level 0..1 = engine load; negative = engine off */
export function setEngine(level: number): void {
  if (!ctx || !master) return;
  if (level < 0 || !soundOn) {
    if (engineGain) engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    return;
  }
  if (!engineOsc) {
    engineOsc = ctx.createOscillator();
    engineGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    engineOsc.type = 'sawtooth';
    engineGain.gain.value = 0;
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(master);
    engineOsc.start();
  }
  engineOsc.frequency.setTargetAtTime(48 + level * 90, ctx.currentTime, 0.08);
  engineGain?.gain.setTargetAtTime(0.05 + level * 0.04, ctx.currentTime, 0.1);
}

function startLoops(): void {
  if (loopsStarted) return;
  loopsStarted = true;
  // Calm background music: a slow random walk on a pentatonic scale.
  window.setInterval(() => {
    if (!ctx || !musicOn || document.hidden) return;
    const n = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    tone(n, 1.2, 'triangle', 0.035);
    if (musicStep++ % 4 === 0) tone(n / 2, 2.2, 'sine', 0.05);
  }, 900);
  // Ambient birds during the day.
  window.setInterval(() => {
    if (!ctx || !soundOn || document.hidden || daylight < 0.5 || Math.random() < 0.5) return;
    const f = 2200 + Math.random() * 900;
    tone(f, 0.08, 'sine', 0.025, f * 1.3);
    tone(f * 1.1, 0.1, 'sine', 0.025, f * 1.4, 0.12);
  }, 3500);
}
