export interface Tile {
  id: number;
  letter: string;
}

/** GRID_SIZE × GRID_SIZE, null for an empty cell. */
export type Grid = (Tile | null)[][];

export interface CellPos {
  row: number;
  col: number;
}

export type TileSource = { type: 'hand' } | ({ type: 'grid' } & CellPos);

export interface Selection {
  tile: Tile;
  source: TileSource;
}

/** The part of a game that the player rearranges: tiles in hand and on the board. */
export interface Board {
  hand: Tile[];
  grid: Grid;
}

export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: 'h' | 'v';
}

export interface Dictionary {
  has(word: string): boolean;
}
