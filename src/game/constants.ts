// Static description of the first map ("Area 1"). Pure data + collision helpers, no React.

export type V2 = [number, number];

export interface Box {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roof?: string;
}

export const WORLD = { minX: -47, maxX: 47, minZ: -44, maxZ: 47 };
export const ROAD_W = 6;
export const ROAD_A_Z = 10; // east-west road
export const ROAD_B_X = 10; // north-south road (crosses the bridge)
export const RIVER = { z0: -16, z1: -8 };
export const BRIDGE = { x0: 7.5, x1: 12.5 };
export const DAY_SECONDS = 240; // one full in-game day

export const HOME_SPAWN: V2 = [-24, 24];
export const CAR_START: V2 = [-19, 24];
export const CAR_START_YAW = Math.PI;
export const NPC_POS: V2 = [-23, 19];
export const TOWN_SQUARE: V2 = [28, 10];
export const HOME_TARGET: V2 = [-26, 24];

export const BUILDINGS: Box[] = [
  { x: -32, z: 31, w: 9, d: 7, h: 5, color: '#f0c27b', roof: '#c0392b' }, // player home
  { x: 18, z: 2, w: 8, d: 6, h: 6, color: '#7fb5e6', roof: '#34495e' },
  { x: 30, z: 2, w: 7, d: 6, h: 8, color: '#e68f8f', roof: '#7f3b3b' },
  { x: 40, z: 3, w: 6, d: 7, h: 5, color: '#9fd49a', roof: '#2e6b3a' },
  { x: 20, z: 20, w: 9, d: 6, h: 5, color: '#c9a0e0', roof: '#5b3a78' },
  { x: 34, z: 21, w: 8, d: 6, h: 7, color: '#f2d36b', roof: '#8a6d1a' },
  { x: -10, z: 2, w: 7, d: 6, h: 4, color: '#f0a87a', roof: '#8a4b2a' },
  { x: -14, z: 20, w: 6, d: 5, h: 4, color: '#8ad0c9', roof: '#2d6b66' },
];

export const HILLS = [
  { x: -36, z: -32, r: 8, h: 6 },
  { x: 38, z: -36, r: 7, h: 5 },
  { x: -42, z: 2, r: 5, h: 4 },
];

// Closed gate: the future "locked area" starts beyond it.
export const GATE: Box = { x: 10, z: -43, w: 9, d: 1, h: 3.2, color: '#c0392b' };

export const ENEMY_HOMES: V2[] = [
  [4, -30],
  [16, -35],
  [25, -24],
];

export const COINS: V2[] = [
  [-14, 12], [-4, 12], [3, 8], [17, 12], [24, 8], [36, 12],
  [16, -3], [-34, -4], [30, -5], [42, 12], [-10, -5], [-28, 18],
  [10, -22], [6, -38], [18, -22], [27, -37], [-6, -26], [-20, -22],
];

// Hidden crystals: no marker on the map, the player has to explore.
export const GEMS: V2[] = [
  [-44, 40],
  [-30, -42],
  [44, -24],
];

export interface Checkpoint {
  pos: V2;
  name: { km: string; en: string };
}

export const CHECKPOINTS: Checkpoint[] = [
  { pos: [-24, 24], name: { km: 'ផ្ទះ', en: 'Home' } },
  { pos: [28, 13.5], name: { km: 'ទីប្រជុំជន', en: 'Town' } },
  { pos: [10, -20], name: { km: 'ច្រាំងខាងជើង', en: 'North Bank' } },
];

export interface Pickup {
  id: string;
  kind: 'coin' | 'gem';
  x: number;
  z: number;
}

export const PICKUPS: Pickup[] = [
  ...COINS.map(([x, z], i): Pickup => ({ id: `c${i}`, kind: 'coin', x, z })),
  ...GEMS.map(([x, z], i): Pickup => ({ id: `g${i}`, kind: 'gem', x, z })),
];

// ---------- collision ----------

export function isBlockedStatic(x: number, z: number, r: number): boolean {
  if (x < WORLD.minX + r || x > WORLD.maxX - r || z < WORLD.minZ + r || z > WORLD.maxZ - r) return true;
  if (z > RIVER.z0 - r && z < RIVER.z1 + r && !(x > BRIDGE.x0 + r && x < BRIDGE.x1 - r)) return true;
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.x) < b.w / 2 + r && Math.abs(z - b.z) < b.d / 2 + r) return true;
  }
  for (const h of HILLS) {
    if (Math.hypot(x - h.x, z - h.z) < h.r + r * 0.5) return true;
  }
  if (Math.abs(x - GATE.x) < GATE.w / 2 + r && Math.abs(z - GATE.z) < GATE.d / 2 + r) return true;
  return false;
}

/** Height of the walkable surface (the bridge deck is slightly raised). */
export function groundY(x: number, z: number): number {
  return z > RIVER.z0 - 1 && z < RIVER.z1 + 1 && x > BRIDGE.x0 && x < BRIDGE.x1 ? 0.12 : 0;
}

// ---------- trees (deterministic, generated once) ----------

function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Tree {
  x: number;
  z: number;
  s: number;
}

function buildTrees(): Tree[] {
  const rand = rng(7);
  const keep: V2[] = [
    HOME_SPAWN, CAR_START, NPC_POS, TOWN_SQUARE, HOME_TARGET,
    ...ENEMY_HOMES, ...COINS, ...GEMS, ...CHECKPOINTS.map((c) => c.pos),
  ];
  const out: Tree[] = [];
  let guard = 0;
  while (out.length < 64 && guard++ < 4000) {
    const x = WORLD.minX + 2 + rand() * (WORLD.maxX - WORLD.minX - 4);
    const z = WORLD.minZ + 2 + rand() * (WORLD.maxZ - WORLD.minZ - 4);
    const s = 0.8 + rand() * 0.7;
    if (Math.abs(z - ROAD_A_Z) < ROAD_W / 2 + 3 || Math.abs(x - ROAD_B_X) < ROAD_W / 2 + 3) continue;
    if (isBlockedStatic(x, z, 2.5)) continue;
    if (keep.some(([kx, kz]) => Math.hypot(kx - x, kz - z) < 3)) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 2.5)) continue;
    out.push({ x, z, s });
  }
  return out;
}

export const TREES: Tree[] = buildTrees();

export function isBlocked(x: number, z: number, r: number): boolean {
  if (isBlockedStatic(x, z, r)) return true;
  for (const t of TREES) {
    if (Math.abs(x - t.x) < 0.6 * t.s + r && Math.abs(z - t.z) < 0.6 * t.s + r) return true;
  }
  return false;
}
