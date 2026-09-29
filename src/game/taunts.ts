import type { PlacedWord } from './types';

export const TWO_LETTER_TAUNTS = [
  'Wow, you really sat there for three minutes just to play a two-letter word.',
  "That's not a word, that's a cry for help.",
  'You know the tiles are free, right? You can use more than two letters.',
  'Really pushing the boundaries of human vocabulary there with those words.',
  'Two letters? At least commit to three. Have some self-respect.',
];

export const pickTaunt = (random: () => number = Math.random) =>
  TWO_LETTER_TAUNTS[Math.floor(random() * TWO_LETTER_TAUNTS.length)];

/**
 * The two-letter words on the board now, and whether any of them is new since
 * the last peel. The web game taunts the player when one is.
 */
export function twoLetterCheck(previous: readonly string[], words: PlacedWord[]) {
  const current = [...new Set(words.filter((w) => w.word.length === 2).map((w) => w.word))];
  const before = new Set(previous);
  return { current, hasNew: current.some((w) => !before.has(w)) };
}

export const TWO_LETTER_TIPS =
  'QI, ZA, XI, XU, JO, KA, KI, OX, AX, EX, ZO — and the H words: AH, EH, UH, OH, HA, HE, HI, HM, HO, SH. ' +
  'Everyday ones: AB, AM, AN, AS, AT, AW, BY, DO, GO, IF, IN, IS, ME, MY, NO, OF, ON, OR, OW, PA, PI, RE, TO, UP, US, WE, YO.';
