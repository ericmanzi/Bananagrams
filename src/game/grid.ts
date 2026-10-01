// ─── Grid rules ───────────────────────────────────────────────────────────────
// Word extraction, connectivity and the checks a board must pass before a PEEL.
// Ported from the web game (bananagrams/game.js), which is the stricter of the
// two web versions: one connected crossword, no lone tiles, every word valid.

import type { CellPos, Dictionary, Grid, PlacedWord, Tile } from './types';

export const GRID_SIZE = 25;

export const cellKey = (row: number, col: number) => `${row}-${col}`;

export function createEmptyGrid(size = GRID_SIZE): Grid {
  return Array.from({ length: size }, () => Array<Tile | null>(size).fill(null));
}

export function tilesOnGrid(grid: Grid): (CellPos & { tile: Tile })[] {
  const out: (CellPos & { tile: Tile })[] = [];
  grid.forEach((row, r) =>
    row.forEach((tile, c) => {
      if (tile) out.push({ row: r, col: c, tile });
    }),
  );
  return out;
}

export function getWordsOnGrid(grid: Grid): PlacedWord[] {
  const size = grid.length;
  const words: PlacedWord[] = [];
  for (let row = 0; row < size; row++) {
    let word = '';
    let start = -1;
    for (let col = 0; col <= size; col++) {
      const cell = col < size ? grid[row][col] : null;
      if (cell) {
        if (!word) start = col;
        word += cell.letter;
      } else {
        if (word.length >= 2) words.push({ word, row, col: start, direction: 'h' });
        word = '';
      }
    }
  }
  for (let col = 0; col < size; col++) {
    let word = '';
    let start = -1;
    for (let row = 0; row <= size; row++) {
      const cell = row < size ? grid[row][col] : null;
      if (cell) {
        if (!word) start = row;
        word += cell.letter;
      } else {
        if (word.length >= 2) words.push({ word, row: start, col, direction: 'v' });
        word = '';
      }
    }
  }
  return words;
}

export function wordCells({ word, row, col, direction }: PlacedWord): string[] {
  return Array.from({ length: word.length }, (_, i) =>
    direction === 'h' ? cellKey(row, col + i) : cellKey(row + i, col),
  );
}

/** Groups of orthogonally adjacent tiles, largest first. */
export function clusters(grid: Grid): Set<string>[] {
  const size = grid.length;
  const remaining = new Set(tilesOnGrid(grid).map(({ row, col }) => cellKey(row, col)));
  const groups: Set<string>[] = [];
  for (const start of remaining) {
    remaining.delete(start);
    const group = new Set([start]);
    const queue = [start.split('-').map(Number)];
    while (queue.length) {
      const [r, c] = queue.shift()!;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr;
        const nc = c + dc;
        const k = cellKey(nr, nc);
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && remaining.has(k)) {
          remaining.delete(k);
          group.add(k);
          queue.push([nr, nc]);
        }
      }
    }
    groups.push(group);
  }
  return groups.sort((a, b) => b.size - a.size);
}

export function isBoardConnected(grid: Grid): boolean {
  return clusters(grid).length <= 1;
}

export type CellState = 'valid' | 'invalid' | 'disconnected';

export interface BoardAnalysis {
  words: PlacedWord[];
  cells: Map<string, CellState>;
  hasInvalid: boolean;
  hasDisconnected: boolean;
}

/**
 * Colours every tile on the board. Tiles off the largest connected group are
 * 'disconnected'; tiles in a misspelled word, or in no word at all, are
 * 'invalid'; everything else is 'valid'. Without a dictionary, spelling is not
 * judged and only lone and disconnected tiles are flagged.
 */
export function analyzeBoard(grid: Grid, dictionary: Dictionary | null): BoardAnalysis {
  const words = getWordsOnGrid(grid);
  const valid = new Set<string>();
  const invalid = new Set<string>();
  for (const w of words) {
    const ok = !dictionary || dictionary.has(w.word);
    for (const k of wordCells(w)) (ok ? valid : invalid).add(k);
  }

  const groups = clusters(grid);
  const disconnected = new Set<string>();
  for (const group of groups.slice(1)) for (const k of group) disconnected.add(k);

  const cells = new Map<string, CellState>();
  for (const { row, col } of tilesOnGrid(grid)) {
    const k = cellKey(row, col);
    if (disconnected.has(k)) cells.set(k, 'disconnected');
    else if (invalid.has(k) || !valid.has(k)) cells.set(k, 'invalid');
    else cells.set(k, 'valid');
  }

  const states = [...cells.values()];
  return {
    words,
    cells,
    hasInvalid: states.includes('invalid'),
    hasDisconnected: states.includes('disconnected'),
  };
}

export type PeelCheck = { ok: true; words: PlacedWord[] } | { ok: false; reason: string };

/** Whether the player may call PEEL (or BANANAS) with this hand and board. */
export function checkPeel(hand: Tile[], grid: Grid, dictionary: Dictionary | null): PeelCheck {
  if (hand.length > 0) return { ok: false, reason: 'Place all your tiles before peeling!' };
  if (tilesOnGrid(grid).length === 0) return { ok: false, reason: 'Place some tiles on the board first!' };
  if (!isBoardConnected(grid)) {
    return { ok: false, reason: 'All tiles must form one connected crossword.' };
  }
  const { words, cells, hasInvalid } = analyzeBoard(grid, dictionary);
  if (hasInvalid) {
    const covered = new Set(words.flatMap(wordCells));
    const lone = [...cells.keys()].some((k) => !covered.has(k));
    return {
      ok: false,
      reason: lone ? 'Every tile must be part of a word.' : 'Fix invalid words before peeling!',
    };
  }
  return { ok: true, words };
}

/** Smallest rectangle holding every tile, or null for an empty board. */
export function gridBounds(grid: Grid): { minR: number; maxR: number; minC: number; maxC: number } | null {
  const tiles = tilesOnGrid(grid);
  if (!tiles.length) return null;
  return {
    minR: Math.min(...tiles.map((t) => t.row)),
    maxR: Math.max(...tiles.map((t) => t.row)),
    minC: Math.min(...tiles.map((t) => t.col)),
    maxC: Math.max(...tiles.map((t) => t.col)),
  };
}
