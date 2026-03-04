import type { SpecialId } from "./special";

export function dateKeyUTC(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10); // YYYY-MM-DD
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export function pickNBySeed<T>(items: T[], n: number, seedKey: string): T[] {
  if (items.length <= n) return items.slice();

  const rand = mulberry32(hashStringToSeed(seedKey));
  const pool = items.slice();
  const out: T[] = [];

  while (out.length < n && pool.length) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function computeSpecialValue(
  obj: Record<string, any>,
  specialId: SpecialId,
) {
  return Number(obj?.[specialId] ?? 0);
}
