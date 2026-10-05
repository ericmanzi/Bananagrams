import { createEmptyGrid } from '../src/game/grid';
import { dump, newSoloGame, peel, type SoloGame } from '../src/game/solo';
import { twoLetterCheck } from '../src/game/taunts';
import { createTileBag, LETTER_DISTRIBUTION, STARTING_TILES, TOTAL_TILES } from '../src/game/tiles';
import { dict, gridWith, seeded, t } from './helpers';

describe('tile bag', () => {
  it('holds the 144 tiles with unique ids', () => {
    const bag = createTileBag(seeded());
    expect(bag).toHaveLength(144);
    expect(TOTAL_TILES).toBe(144);
    expect(new Set(bag.map((x) => x.id)).size).toBe(144);
    for (const [letter, count] of Object.entries(LETTER_DISTRIBUTION)) {
      expect(bag.filter((x) => x.letter === letter)).toHaveLength(count);
    }
  });
});

describe('solo game', () => {
  it('deals 21 tiles and leaves the rest in the bunch', () => {
    const g = newSoloGame(seeded());
    expect(g.hand).toHaveLength(STARTING_TILES);
    expect(g.bunch).toHaveLength(144 - STARTING_TILES);
    expect(g.status).toBe('playing');
  });

  const solved = (bunch = [t('Z')]): SoloGame => ({
    hand: [],
    grid: gridWith(['CAT', 5, 5, 'h'], ['CAR', 5, 5, 'v']),
    bunch,
    elapsed: 42,
    twoLetterWords: [],
    status: 'playing',
  });

  it('peels one tile from the bunch', () => {
    const r = peel(solved([t('Z'), t('Y')]), dict('CAT', 'CAR'));
    if (!r.ok || r.won) throw new Error('expected a peel');
    expect(r.drawn.letter).toBe('Z');
    expect(r.game.hand).toHaveLength(1);
    expect(r.game.bunch).toHaveLength(1);
  });

  it('wins on a clean peel with an empty bunch', () => {
    const r = peel(solved([]), dict('CAT', 'CAR'));
    expect(r).toMatchObject({ ok: true, won: true, wordCount: 2 });
    if (r.ok) expect(r.game.status).toBe('won');
  });

  it('refuses a peel with a misspelled board', () => {
    expect(peel(solved(), dict('CAT')).ok).toBe(false);
  });

  it('notices a new two-letter word at peel time', () => {
    const game = { ...solved([t('E'), t('F')]), grid: gridWith(['CAT', 5, 5, 'h'], ['AX', 5, 6, 'v']) };
    const first = peel(game, dict('CAT', 'AX'));
    if (!first.ok || first.won) throw new Error('expected a peel');
    expect(first.newTwoLetterWord).toBe(true);
    const again = peel({ ...first.game, hand: [] }, dict('CAT', 'AX'));
    if (!again.ok || again.won) throw new Error('expected a peel');
    expect(again.newTwoLetterWord).toBe(false);
  });

  it('dumps the chosen tile for three from the bunch', () => {
    const x = t('Q');
    const game: SoloGame = { ...solved(), hand: [x, t('A')], bunch: [t('E'), t('R'), t('S'), t('T')] };
    const r = dump(game, x.id, seeded());
    if (!r.ok) throw new Error(r.reason);
    expect(r.drawn.map((d) => d.letter)).toEqual(['E', 'R', 'S']);
    expect(r.game.hand.map((h) => h.letter)).toEqual(['A', 'E', 'R', 'S']);
    expect(r.game.bunch.map((b) => b.letter).sort()).toEqual(['Q', 'T']);
  });

  it('refuses to dump without a selected hand tile or with a thin bunch', () => {
    const x = t('Q');
    expect(dump({ ...solved(), hand: [x] }, null).ok).toBe(false);
    expect(dump({ ...solved([t('A'), t('B')]), hand: [x] }, x.id).ok).toBe(false);
  });

  it('keeps every tile accounted for across a dump', () => {
    const g = newSoloGame(seeded(7));
    const r = dump(g, g.hand[0].id, seeded(8));
    if (!r.ok) throw new Error(r.reason);
    const ids = [...r.game.hand, ...r.game.bunch].map((x) => x.id);
    expect(new Set(ids).size).toBe(144);
    expect(r.game.grid).toEqual(createEmptyGrid());
  });
});

describe('twoLetterCheck', () => {
  it('reports only unseen two-letter words as new', () => {
    const words = [
      { word: 'QI', row: 0, col: 0, direction: 'h' as const },
      { word: 'CAT', row: 1, col: 0, direction: 'h' as const },
    ];
    expect(twoLetterCheck([], words)).toEqual({ current: ['QI'], hasNew: true });
    expect(twoLetterCheck(['QI'], words)).toEqual({ current: ['QI'], hasNew: false });
  });
});
