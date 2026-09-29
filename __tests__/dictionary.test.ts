import { loadDictionary } from '../src/dictionary';
import { TWO_LETTER_TIPS } from '../src/game/taunts';
import { normalizeRoomCode, parseServerMessage } from '../src/online/protocol';

describe('bundled dictionary', () => {
  const words = loadDictionary();

  it('holds the SOWPODS list', () => {
    expect(words.size).toBeGreaterThan(260000);
    for (const w of ['QI', 'ZA', 'BANANA', 'BANANAS', 'PEEL', 'CAT']) expect(words.has(w)).toBe(true);
  });

  it('has no single letters or lowercase entries', () => {
    expect(words.has('A')).toBe(false);
    expect(words.has('cat')).toBe(false);
    expect(words.has('')).toBe(false);
  });

  it('knows every two-letter word the tips suggest', () => {
    const tips = TWO_LETTER_TIPS.match(/\b[A-Z]{2}\b/g) ?? [];
    expect(tips.length).toBeGreaterThan(30);
    expect(tips.filter((w) => !words.has(w))).toEqual([]);
  });
});

describe('online protocol helpers', () => {
  it('normalizes typed room codes', () => {
    expect(normalizeRoomCode(' ab-c12de9 ')).toBe('ABC12D');
  });

  it('parses server messages and rejects junk', () => {
    expect(parseServerMessage('{"type":"ROOM_CREATED","roomCode":"ABCDEF"}')).toEqual({
      type: 'ROOM_CREATED',
      roomCode: 'ABCDEF',
    });
    expect(parseServerMessage('not json')).toBeNull();
    expect(parseServerMessage('{"hello":1}')).toBeNull();
    expect(parseServerMessage(42)).toBeNull();
  });
});
