// ─── Storage ──────────────────────────────────────────────────────────────────
// Saved games survive the app being closed, like the web game's localStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SoloGame } from './game/solo';
import type { Grid, Tile } from './game/types';
import type { Role } from './online/protocol';

const KEYS = {
  solo: 'bananagrams_solo_state',
  online: 'bananagrams_online_state',
  bestTime: 'bananagrams_best_time',
};

export interface SavedOnline {
  roomCode: string;
  role: Role;
  hand?: Tile[];
  grid?: Grid;
  timer?: number;
}

async function read<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Losing a save is not worth interrupting the game over.
  }
}

async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export const soloStore = {
  load: () => read<SoloGame>(KEYS.solo),
  save: (game: SoloGame) => write(KEYS.solo, game),
  clear: () => remove(KEYS.solo),
};

export const onlineStore = {
  load: async () => {
    const saved = await read<SavedOnline>(KEYS.online);
    return saved?.roomCode && saved.role ? saved : null;
  },
  save: (state: SavedOnline) => write(KEYS.online, state),
  clear: () => remove(KEYS.online),
};

export const bestTimeStore = {
  load: () => read<number>(KEYS.bestTime),
  /** Records the time if it beats the best; returns true when it does. */
  offer: async (seconds: number) => {
    const best = await read<number>(KEYS.bestTime);
    if (best !== null && best <= seconds) return false;
    await write(KEYS.bestTime, seconds);
    return true;
  },
};
