import { analyzeBoard, checkPeel, clusters, getWordsOnGrid, gridBounds, isBoardConnected } from '../src/game/grid';
import { dict, gridWith, t } from './helpers';

describe('getWordsOnGrid', () => {
  it('finds across and down words of two or more letters', () => {
    const grid = gridWith(['CAT', 5, 5, 'h'], ['CAR', 5, 5, 'v']);
    const words = getWordsOnGrid(grid).map((w) => `${w.word}:${w.direction}`);
    expect(words.sort()).toEqual(['CAR:v', 'CAT:h']);
  });

  it('reads words that touch the edge of the board', () => {
    const grid = gridWith(['ZA', 24, 23, 'h']);
    expect(getWordsOnGrid(grid)).toEqual([{ word: 'ZA', row: 24, col: 23, direction: 'h' }]);
  });

  it('ignores single tiles', () => {
    expect(getWordsOnGrid(gridWith(['A', 3, 3, 'h']))).toEqual([]);
  });
});

describe('connectivity', () => {
  it('treats one crossword as connected', () => {
    expect(isBoardConnected(gridWith(['CAT', 5, 5, 'h'], ['CAR', 5, 5, 'v']))).toBe(true);
  });

  it('spots a separate island', () => {
    const grid = gridWith(['CAT', 5, 5, 'h'], ['DOG', 10, 10, 'h']);
    expect(isBoardConnected(grid)).toBe(false);
    expect(clusters(grid).map((c) => c.size)).toEqual([3, 3]);
  });

  it('counts an empty board as connected', () => {
    expect(isBoardConnected(gridWith())).toBe(true);
  });
});

describe('analyzeBoard', () => {
  it('marks tiles in real words valid and the rest invalid', () => {
    const grid = gridWith(['CAT', 5, 5, 'h'], ['CXR', 5, 5, 'v']);
    const { cells, hasInvalid } = analyzeBoard(grid, dict('CAT'));
    expect(cells.get('5-6')).toBe('valid'); // A, only in CAT
    expect(cells.get('5-5')).toBe('invalid'); // C, in CAT and CXR
    expect(cells.get('6-5')).toBe('invalid');
    expect(hasInvalid).toBe(true);
  });

  it('marks the smaller group disconnected', () => {
    const grid = gridWith(['CATS', 5, 5, 'h'], ['DO', 10, 10, 'h']);
    const { cells, hasDisconnected } = analyzeBoard(grid, dict('CATS', 'DO'));
    expect(cells.get('10-10')).toBe('disconnected');
    expect(cells.get('5-5')).toBe('valid');
    expect(hasDisconnected).toBe(true);
  });

  it('flags a lone tile as invalid', () => {
    const { cells } = analyzeBoard(gridWith(['Q', 1, 1, 'h']), dict());
    expect(cells.get('1-1')).toBe('invalid');
  });

  it('judges only shape when no dictionary is loaded', () => {
    const { hasInvalid } = analyzeBoard(gridWith(['XQZ', 5, 5, 'h']), null);
    expect(hasInvalid).toBe(false);
  });
});

describe('checkPeel', () => {
  const words = dict('CAT', 'CAR');
  const good = gridWith(['CAT', 5, 5, 'h'], ['CAR', 5, 5, 'v']);

  it('passes a clean board with an empty hand', () => {
    const r = checkPeel([], good, words);
    expect(r.ok).toBe(true);
  });

  it('refuses with tiles still in hand', () => {
    expect(checkPeel([t('E')], good, words)).toMatchObject({ ok: false, reason: expect.stringMatching(/Place all/) });
  });

  it('refuses an empty board', () => {
    expect(checkPeel([], gridWith(), words)).toMatchObject({ ok: false, reason: expect.stringMatching(/first/) });
  });

  it('refuses separate islands', () => {
    const grid = gridWith(['CAT', 5, 5, 'h'], ['CAR', 10, 10, 'h']);
    expect(checkPeel([], grid, words)).toMatchObject({ ok: false, reason: expect.stringMatching(/connected/) });
  });

  it('refuses misspellings', () => {
    const grid = gridWith(['CAT', 5, 5, 'h'], ['CAX', 5, 5, 'v']);
    expect(checkPeel([], grid, words)).toMatchObject({ ok: false, reason: expect.stringMatching(/invalid words/) });
  });

  it('refuses a board that is a single tile', () => {
    expect(checkPeel([], gridWith(['A', 5, 5, 'h']), words)).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/part of a word/),
    });
  });
});

describe('gridBounds', () => {
  it('crops to the tiles', () => {
    expect(gridBounds(gridWith(['CAT', 5, 6, 'h'], ['CAR', 5, 6, 'v']))).toEqual({ minR: 5, maxR: 7, minC: 6, maxC: 8 });
    expect(gridBounds(gridWith())).toBeNull();
  });
});
