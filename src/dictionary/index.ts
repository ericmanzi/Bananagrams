// ─── Dictionary ───────────────────────────────────────────────────────────────
// The public-domain ENABLE word list, bundled into the app (see
// scripts/build-dictionary.js). Splitting ~173k words into a Set takes a
// moment on a phone, so it is built once, on demand, and shared.

import type { Dictionary } from '../game/types';

let cached: Set<string> | null = null;

export function loadDictionary(): Set<string> {
  if (!cached) {
    const words: string = require('./enable');
    cached = new Set(words.split('\n'));
  }
  return cached;
}

/** Builds the dictionary after the current frame so a loading state can render first. */
export function loadDictionaryAsync(): Promise<Dictionary> {
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => setTimeout(() => resolve(loadDictionary()), 0));
}
