// ─── Online protocol ──────────────────────────────────────────────────────────
// Messages exchanged with the Bananagrams Online WebSocket backend
// (ericmanzi.github.io/backend/handler.js). The app talks to the same server
// as the web game, so web and iOS players can share a room.

import type { Grid, Tile } from '../game/types';

// From ericmanzi.github.io/bananagrams/config.js.
export const WS_URL = 'wss://51obau5kch.execute-api.us-east-1.amazonaws.com/prod';

export const PING_INTERVAL_MS = 8 * 60 * 1000;
export const STATUS_INTERVAL_MS = 3000;
export const REJOIN_TIMEOUT_MS = 8000;
export const OPPONENT_REJOIN_TIMEOUT_MS = 2 * 60 * 1000;
export const ROOM_CODE_LENGTH = 6;

export type Role = 'host' | 'guest';

export type ClientMessage =
  | { action: 'createRoom' }
  | { action: 'joinRoom'; roomCode: string }
  | { action: 'rejoinRoom'; roomCode: string; role: Role }
  | { action: 'peel'; roomCode: string; role: Role }
  | { action: 'dump'; roomCode: string; role: Role; tile: Tile }
  | { action: 'status'; roomCode: string; role: Role; handSize: number; wordCount: number; bunchSize: number }
  | { action: 'shareBoard'; roomCode: string; role: Role; grid: Grid }
  | { action: 'ping' };

export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string }
  | { type: 'GAME_START'; role: Role; hand: Tile[]; bunchSize: number }
  | { type: 'PEEL_RESULT'; tile: Tile; bunchSize: number; initiator: Role }
  | { type: 'DUMP_RESULT'; tiles: Tile[]; removedTileId: number; removedLetter: string; bunchSize: number }
  | { type: 'DUMP_ERROR'; reason: string }
  | { type: 'OPPONENT_STATUS'; handSize: number; wordCount: number; bunchSize?: number }
  | { type: 'GAME_OVER'; winner: Role }
  | { type: 'OPPONENT_FINAL_BOARD'; grid: Grid }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'OPPONENT_RECONNECTED' }
  | {
      type: 'REJOIN_OK';
      role: Role;
      roomCode?: string;
      gameStatus?: 'waiting';
      hand?: Tile[];
      bunchSize?: number;
    }
  | { type: 'ERROR'; message?: string };

export function parseServerMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data.type === 'string' ? (data as ServerMessage) : null;
  } catch {
    return null;
  }
}

/** Room codes are six characters from the backend's unambiguous alphabet. */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}
