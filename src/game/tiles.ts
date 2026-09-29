// ─── Tiles ────────────────────────────────────────────────────────────────────
// Letter distribution and bag helpers. These mirror backend/utils.js in the
// ericmanzi.github.io repo so solo games and online games deal the same set.

import type { Tile } from './types';

export const LETTER_DISTRIBUTION: Record<string, number> = {
  A: 13, B: 3, C: 3, D: 6, E: 18, F: 3, G: 4, H: 3, I: 12, J: 2, K: 2, L: 5,
  M: 3, N: 8, O: 11, P: 3, Q: 2, R: 9, S: 6, T: 9, U: 6, V: 3, W: 3, X: 2, Y: 3, Z: 2,
};

export const TOTAL_TILES = Object.values(LETTER_DISTRIBUTION).reduce((a, b) => a + b, 0); // 144
export const STARTING_TILES = 21;
export const DUMP_DRAW = 3;

export function shuffle<T>(arr: readonly T[], random: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createTileBag(random: () => number = Math.random): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;
  for (const [letter, count] of Object.entries(LETTER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) tiles.push({ id: id++, letter });
  }
  return shuffle(tiles, random);
}
