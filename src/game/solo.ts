// ─── Solo game ────────────────────────────────────────────────────────────────
// Single-player rules, as in bananagrams-1p on the web: 21 tiles to start,
// PEEL draws one, DUMP trades one for three, and a clean PEEL with an empty
// bunch is BANANAS.

import { checkPeel, createEmptyGrid } from './grid';
import { createTileBag, DUMP_DRAW, shuffle, STARTING_TILES } from './tiles';
import { twoLetterCheck } from './taunts';
import type { Dictionary, Grid, Tile } from './types';

export interface SoloGame {
  hand: Tile[];
  grid: Grid;
  bunch: Tile[];
  /** Seconds of play so far. */
  elapsed: number;
  /** Two-letter words on the board at the last peel, for the taunts. */
  twoLetterWords: string[];
  status: 'playing' | 'won';
}

export function newSoloGame(random: () => number = Math.random): SoloGame {
  const bag = createTileBag(random);
  return {
    hand: bag.slice(0, STARTING_TILES),
    grid: createEmptyGrid(),
    bunch: bag.slice(STARTING_TILES),
    elapsed: 0,
    twoLetterWords: [],
    status: 'playing',
  };
}

export type PeelOutcome =
  | { ok: false; reason: string }
  | { ok: true; game: SoloGame; won: true; wordCount: number }
  | { ok: true; game: SoloGame; won: false; drawn: Tile; newTwoLetterWord: boolean };

export function peel(game: SoloGame, dictionary: Dictionary | null): PeelOutcome {
  const check = checkPeel(game.hand, game.grid, dictionary);
  if (!check.ok) return check;

  if (game.bunch.length === 0) {
    return { ok: true, won: true, wordCount: check.words.length, game: { ...game, status: 'won' } };
  }

  const { current, hasNew } = twoLetterCheck(game.twoLetterWords, check.words);
  const [drawn, ...bunch] = game.bunch;
  return {
    ok: true,
    won: false,
    drawn,
    newTwoLetterWord: hasNew,
    game: { ...game, hand: [...game.hand, drawn], bunch, twoLetterWords: current },
  };
}

export type DumpOutcome = { ok: false; reason: string } | { ok: true; game: SoloGame; drawn: Tile[] };

export function dump(game: SoloGame, tileId: number | null, random: () => number = Math.random): DumpOutcome {
  const tile = game.hand.find((t) => t.id === tileId);
  if (!tile) return { ok: false, reason: 'Select a tile from your hand, then DUMP.' };
  if (game.bunch.length < DUMP_DRAW) {
    return { ok: false, reason: `Not enough tiles in the bunch to dump (${game.bunch.length} left).` };
  }
  const drawn = game.bunch.slice(0, DUMP_DRAW);
  return {
    ok: true,
    drawn,
    game: {
      ...game,
      hand: [...game.hand.filter((t) => t.id !== tile.id), ...drawn],
      bunch: shuffle([...game.bunch.slice(DUMP_DRAW), tile], random),
    },
  };
}
