import { createEmptyGrid } from '../src/game/grid';
import { recallAll, returnToHand, swapHandTiles, tapCell, tapHandTile } from '../src/game/moves';
import type { Board, Selection } from '../src/game/types';
import { t } from './helpers';

const A = t('A');
const B = t('B');
const C = t('C');

const fresh = (): Board => ({ hand: [A, B], grid: createEmptyGrid() });
const fromHand = (tile = A): Selection => ({ tile, source: { type: 'hand' } });

describe('tapCell', () => {
  it('places a selected hand tile on an empty cell', () => {
    const r = tapCell(fresh(), fromHand(), 3, 4);
    expect(r.board.grid[3][4]).toBe(A);
    expect(r.board.hand).toEqual([B]);
    expect(r.selection).toBeNull();
    expect(r.moved).toBe(true);
  });

  it('picks up a board tile when nothing is selected', () => {
    const placed = tapCell(fresh(), fromHand(), 3, 4).board;
    const r = tapCell(placed, null, 3, 4);
    expect(r.selection).toEqual({ tile: A, source: { type: 'grid', row: 3, col: 4 } });
    expect(r.moved).toBe(false);
  });

  it('does nothing on an empty cell with nothing selected', () => {
    const board = fresh();
    expect(tapCell(board, null, 0, 0)).toEqual({ board, selection: null, moved: false });
  });

  it('moves a board tile to another cell', () => {
    const placed = tapCell(fresh(), fromHand(), 3, 4).board;
    const r = tapCell(placed, { tile: A, source: { type: 'grid', row: 3, col: 4 } }, 7, 7);
    expect(r.board.grid[3][4]).toBeNull();
    expect(r.board.grid[7][7]).toBe(A);
  });

  it('deselects when the selected board tile is tapped again', () => {
    const placed = tapCell(fresh(), fromHand(), 3, 4).board;
    const r = tapCell(placed, { tile: A, source: { type: 'grid', row: 3, col: 4 } }, 3, 4);
    expect(r.selection).toBeNull();
    expect(r.board).toBe(placed);
  });

  it('swaps a hand tile with the board tile it lands on', () => {
    const placed = tapCell(fresh(), fromHand(A), 3, 4).board; // hand [B]
    const r = tapCell(placed, fromHand(B), 3, 4);
    expect(r.board.grid[3][4]).toBe(B);
    expect(r.board.hand).toEqual([A]);
  });

  it('swaps two board tiles', () => {
    let board = tapCell(fresh(), fromHand(A), 1, 1).board;
    board = tapCell(board, fromHand(B), 2, 2).board;
    const r = tapCell(board, { tile: A, source: { type: 'grid', row: 1, col: 1 } }, 2, 2);
    expect(r.board.grid[1][1]).toBe(B);
    expect(r.board.grid[2][2]).toBe(A);
  });

  it('never mutates the board it was given', () => {
    const board = fresh();
    tapCell(board, fromHand(), 3, 4);
    expect(board.grid[3][4]).toBeNull();
    expect(board.hand).toEqual([A, B]);
  });
});

describe('tapHandTile', () => {
  it('selects, then deselects, a hand tile', () => {
    const board = fresh();
    const first = tapHandTile(board, null, A);
    expect(first.selection).toEqual(fromHand(A));
    expect(tapHandTile(board, first.selection, A).selection).toBeNull();
  });

  it('switches the selection to another hand tile', () => {
    expect(tapHandTile(fresh(), fromHand(A), B).selection).toEqual(fromHand(B));
  });

  it('swaps a selected board tile with the tapped hand tile', () => {
    const placed = tapCell(fresh(), fromHand(A), 3, 4).board; // hand [B]
    const r = tapHandTile(placed, { tile: A, source: { type: 'grid', row: 3, col: 4 } }, B);
    expect(r.board.grid[3][4]).toBe(B);
    expect(r.board.hand).toEqual([A]);
    expect(r.moved).toBe(true);
  });
});

describe('returning tiles', () => {
  it('returns the selected board tile to the hand', () => {
    const placed = tapCell(fresh(), fromHand(A), 3, 4).board;
    const r = returnToHand(placed, { tile: A, source: { type: 'grid', row: 3, col: 4 } });
    expect(r.board.grid[3][4]).toBeNull();
    expect(r.board.hand).toEqual([B, A]);
  });

  it('ignores a hand selection', () => {
    const board = fresh();
    expect(returnToHand(board, fromHand()).board).toBe(board);
  });

  it('recalls every tile', () => {
    let board = tapCell(fresh(), fromHand(A), 1, 1).board;
    board = tapCell(board, fromHand(B), 2, 2).board;
    const r = recallAll(board);
    expect(r.board.hand.map((x) => x.letter).sort()).toEqual(['A', 'B']);
    expect(r.board.grid.flat().every((x) => x === null)).toBe(true);
  });
});

describe('swapHandTiles', () => {
  it('drops the dumped tile and appends the new ones', () => {
    expect(swapHandTiles([A, B], [A.id], [C])).toEqual([B, C]);
  });
});
