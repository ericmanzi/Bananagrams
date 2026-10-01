// ─── Moves ────────────────────────────────────────────────────────────────────
// Tap-to-select, tap-to-place, as in the web game. Every function is pure: it
// takes the board and the current selection and returns the new ones.
//
// Beyond the web game, tapping an occupied cell (or a hand tile while a board
// tile is selected) swaps the two tiles instead of refusing, which saves a
// round trip through the hand on a small screen.

import type { Board, Grid, Selection, Tile } from './types';

export interface MoveResult {
  board: Board;
  selection: Selection | null;
  /** True when a tile actually changed place (for haptics). */
  moved: boolean;
}

const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

const same = (a: Selection | null, b: Selection) =>
  !!a && a.tile.id === b.tile.id && a.source.type === b.source.type;

export function tapCell(board: Board, selection: Selection | null, row: number, col: number): MoveResult {
  const target = board.grid[row][col];

  if (!selection) {
    return {
      board,
      selection: target ? { tile: target, source: { type: 'grid', row, col } } : null,
      moved: false,
    };
  }

  const { source, tile } = selection;
  if (source.type === 'grid' && source.row === row && source.col === col) {
    return { board, selection: null, moved: false };
  }

  const grid = cloneGrid(board.grid);
  let hand = board.hand;
  grid[row][col] = tile;

  if (source.type === 'hand') {
    // A tile already there goes back to the hand, into the slot the placed one left.
    hand = target
      ? board.hand.map((t) => (t.id === tile.id ? target : t))
      : board.hand.filter((t) => t.id !== tile.id);
  } else {
    grid[source.row][source.col] = target;
  }

  return { board: { hand, grid }, selection: null, moved: true };
}

export function tapHandTile(board: Board, selection: Selection | null, tile: Tile): MoveResult {
  const next: Selection = { tile, source: { type: 'hand' } };

  if (selection?.source.type === 'grid') {
    const { row, col } = selection.source;
    const grid = cloneGrid(board.grid);
    grid[row][col] = tile;
    const hand = board.hand.map((t) => (t.id === tile.id ? selection.tile : t));
    return { board: { hand, grid }, selection: null, moved: true };
  }

  return { board, selection: same(selection, next) ? null : next, moved: false };
}

/** Sends the selected board tile back to the hand. */
export function returnToHand(board: Board, selection: Selection | null): MoveResult {
  if (selection?.source.type !== 'grid') return { board, selection, moved: false };
  const grid = cloneGrid(board.grid);
  grid[selection.source.row][selection.source.col] = null;
  return { board: { hand: [...board.hand, selection.tile], grid }, selection: null, moved: true };
}

/** Sends every board tile back to the hand. */
export function recallAll(board: Board): MoveResult {
  const placed = board.grid.flat().filter((t): t is Tile => !!t);
  if (!placed.length) return { board, selection: null, moved: false };
  const grid = board.grid.map((row) => row.map(() => null));
  return { board: { hand: [...board.hand, ...placed], grid }, selection: null, moved: true };
}

/** Removes tiles the server says are gone and appends new ones, keeping order. */
export function swapHandTiles(hand: Tile[], removeIds: number[], add: Tile[]): Tile[] {
  const drop = new Set(removeIds);
  return [...hand.filter((t) => !drop.has(t.id)), ...add];
}
