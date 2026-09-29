import { createEmptyGrid } from '../src/game/grid';
import type { Grid, Tile } from '../src/game/types';

let nextId = 1000;
export const t = (letter: string): Tile => ({ id: nextId++, letter });

/** Lays words onto an empty grid: [word, row, col, 'h' | 'v']. */
export function gridWith(...words: [string, number, number, 'h' | 'v'][]): Grid {
  const grid = createEmptyGrid();
  for (const [word, row, col, dir] of words) {
    [...word].forEach((letter, i) => {
      const r = dir === 'h' ? row : row + i;
      const c = dir === 'h' ? col + i : col;
      if (!grid[r][c]) grid[r][c] = t(letter);
    });
  }
  return grid;
}

export const dict = (...words: string[]) => new Set(words);

/** Deterministic random for shuffles. */
export function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
