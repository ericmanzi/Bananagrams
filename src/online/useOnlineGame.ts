// ─── Online game ──────────────────────────────────────────────────────────────
// The WebSocket client and state machine for Bananagrams Online, ported from
// the web game (ericmanzi.github.io/bananagrams/game.js).
//
// One thing the phone has to handle that a browser tab mostly doesn't: iOS
// drops the socket when the app is backgrounded. An unexpected close while in
// a room rejoins it automatically as soon as the app is in the foreground,
// restoring the board from memory.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { checkPeel, createEmptyGrid, getWordsOnGrid } from '../game/grid';
import { swapHandTiles } from '../game/moves';
import { pickTaunt, twoLetterCheck } from '../game/taunts';
import { DUMP_DRAW, STARTING_TILES } from '../game/tiles';
import type { Board, Dictionary, Grid, Tile } from '../game/types';
import { haptics } from '../haptics';
import { useLatest } from '../hooks/useLatest';
import { useTicker } from '../hooks/useTicker';
import { onlineStore, type SavedOnline } from '../storage';
import {
  type ClientMessage,
  OPPONENT_REJOIN_TIMEOUT_MS,
  parseServerMessage,
  PING_INTERVAL_MS,
  REJOIN_TIMEOUT_MS,
  type Role,
  type ServerMessage,
  STATUS_INTERVAL_MS,
  WS_URL,
} from './protocol';

export type OnlineScreen = 'menu' | 'connecting' | 'waiting' | 'playing' | 'won' | 'error';

const emptyBoard = (): Board => ({ hand: [], grid: createEmptyGrid() });

export function useOnlineGame(dictionary: Dictionary | null, toast: (msg: string, ms?: number) => void) {
  const [screen, setScreenState] = useState<OnlineScreen>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [board, updateBoard, boardRef] = useLatest<Board>(emptyBoard);
  const [bunchSize, setBunchSize] = useState(0);
  const [opponent, setOpponent] = useState({ handSize: STARTING_TILES, wordCount: 0 });
  const [timer, setTimer] = useState(0);
  const [winner, setWinner] = useState<'me' | 'them' | null>(null);
  const [finalGrids, setFinalGrids] = useState<{ mine: Grid | null; theirs: Grid | null }>({ mine: null, theirs: null });
  const [error, setError] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [opponentAway, setOpponentAway] = useState<{ since: number; long: boolean } | null>(null);
  const [saved, setSaved] = useState<SavedOnline | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const screenRef = useRef<OnlineScreen>('menu');
  const roomRef = useRef('');
  const roleRef = useRef<Role | null>(null);
  const bunchRef = useRef(0);
  const timerRef = useRef(0);
  const twoLetterRef = useRef<string[]>([]);
  const pendingTaunt = useRef<string | null>(null);
  const restoreRef = useRef<{ grid: Grid; timer: number } | null>(null);
  const rejoinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rejoinWhenActive = useRef(false);

  const setScreen = useCallback((s: OnlineScreen) => {
    screenRef.current = s;
    setScreenState(s);
  }, []);
  const setRoom = (code: string) => {
    roomRef.current = code;
    setRoomCode(code);
  };
  const setMyRole = (r: Role | null) => {
    roleRef.current = r;
    setRole(r);
  };
  const setBunch = (n: number) => {
    bunchRef.current = n;
    setBunchSize(n);
  };
  timerRef.current = timer;

  const send = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg));
  }, []);

  const clearRejoinTimeout = () => {
    if (rejoinTimeout.current) clearTimeout(rejoinTimeout.current);
    rejoinTimeout.current = null;
  };

  // ── Server messages ────────────────────────────────────────────────────────

  const onServerMessage = (msg: ServerMessage) => {
    switch (msg.type) {
      case 'ROOM_CREATED':
        setRoom(msg.roomCode);
        setMyRole('host');
        onlineStore.save({ roomCode: msg.roomCode, role: 'host' });
        setScreen('waiting');
        break;

      case 'GAME_START':
        setMyRole(msg.role);
        updateBoard({ hand: msg.hand, grid: createEmptyGrid() });
        setBunch(msg.bunchSize);
        setOpponent({ handSize: STARTING_TILES, wordCount: 0 });
        setWinner(null);
        setOpponentAway(null);
        setTimer(0);
        twoLetterRef.current = [];
        pendingTaunt.current = null;
        setScreen('playing');
        haptics.success();
        break;

      case 'PEEL_RESULT': {
        updateBoard((b) => ({ ...b, hand: [...b.hand, msg.tile] }));
        setBunch(msg.bunchSize);
        const byMe = msg.initiator === roleRef.current;
        if (byMe && pendingTaunt.current) {
          toast(pendingTaunt.current, 6000);
        } else {
          toast(
            byMe
              ? `🍌 PEEL! Drew ${msg.tile.letter} (${msg.bunchSize} left)`
              : `🍌 Opponent peeled! You drew ${msg.tile.letter}`,
          );
          if (!byMe) haptics.place();
        }
        pendingTaunt.current = null;
        break;
      }

      case 'DUMP_RESULT':
        updateBoard((b) => ({ ...b, hand: swapHandTiles(b.hand, [msg.removedTileId], msg.tiles) }));
        setBunch(msg.bunchSize);
        toast(`Dumped ${msg.removedLetter}, drew ${msg.tiles.map((t) => t.letter).join(' ')}`);
        break;

      case 'DUMP_ERROR':
        haptics.refuse();
        toast(msg.reason);
        break;

      case 'OPPONENT_STATUS':
        setOpponent({ handSize: msg.handSize, wordCount: msg.wordCount });
        if (typeof msg.bunchSize === 'number') setBunch(msg.bunchSize);
        break;

      case 'GAME_OVER': {
        const mine = boardRef.current.grid;
        const iWon = msg.winner === roleRef.current;
        setWinner(iWon ? 'me' : 'them');
        setFinalGrids({ mine, theirs: null });
        setScreen('won');
        onlineStore.clear();
        if (iWon) haptics.success();
        else haptics.refuse();
        if (roleRef.current) send({ action: 'shareBoard', roomCode: roomRef.current, role: roleRef.current, grid: mine });
        break;
      }

      case 'OPPONENT_FINAL_BOARD':
        setFinalGrids((g) => ({ ...g, theirs: msg.grid }));
        break;

      case 'OPPONENT_DISCONNECTED':
        setOpponentAway({ since: Date.now(), long: false });
        break;

      case 'OPPONENT_RECONNECTED':
        setOpponentAway(null);
        toast('✅ Opponent reconnected! Game resumes.');
        break;

      case 'REJOIN_OK': {
        clearRejoinTimeout();
        setMyRole(msg.role);
        if (msg.roomCode) setRoom(msg.roomCode);
        if (msg.gameStatus === 'waiting') {
          onlineStore.save({ roomCode: roomRef.current, role: msg.role });
          setScreen('waiting');
          break;
        }
        const restore = restoreRef.current;
        const grid = restore?.grid ?? createEmptyGrid();
        const onBoard = new Set(grid.flat().filter((t): t is Tile => !!t).map((t) => t.id));
        updateBoard({ grid, hand: (msg.hand ?? []).filter((t) => !onBoard.has(t.id)) });
        setBunch(msg.bunchSize ?? 0);
        setTimer(restore?.timer ?? 0);
        setWinner(null);
        setOpponentAway(null);
        pendingTaunt.current = null;
        setScreen('playing');
        break;
      }

      case 'ERROR':
        clearRejoinTimeout();
        setError({ message: msg.message || 'An error occurred.', canRetry: !!restoreRef.current });
        setScreen('error');
        break;
    }
  };
  const onServerMessageRef = useRef(onServerMessage);
  onServerMessageRef.current = onServerMessage;

  // ── Connection ─────────────────────────────────────────────────────────────

  const closeSocket = useCallback(() => {
    const sock = ws.current;
    ws.current = null;
    sock?.close();
  }, []);

  const connect = useCallback(
    (first: ClientMessage) => {
      closeSocket();
      const sock = new WebSocket(WS_URL);
      ws.current = sock;
      sock.onopen = () => sock.send(JSON.stringify(first));
      sock.onmessage = (e) => {
        const msg = parseServerMessage(e.data);
        if (msg && ws.current === sock) onServerMessageRef.current(msg);
      };
      sock.onclose = () => {
        if (ws.current !== sock) return; // replaced or closed on purpose
        ws.current = null;
        const s = screenRef.current;
        if (s === 'playing' || s === 'waiting') {
          rejoinWhenActive.current = true;
          if (AppState.currentState === 'active') rejoinRef.current();
        } else if (s === 'connecting') {
          clearRejoinTimeout();
          setError({
            message: 'Could not reach the game server. Check your connection and try again.',
            canRetry: !!restoreRef.current,
          });
          setScreen('error');
        }
      };
    },
    [closeSocket, setScreen],
  );

  const createRoom = () => {
    restoreRef.current = null;
    setScreen('connecting');
    connect({ action: 'createRoom' });
  };

  const joinRoom = (code: string) => {
    restoreRef.current = null;
    setRoom(code);
    setScreen('connecting');
    connect({ action: 'joinRoom', roomCode: code });
  };

  const rejoin = useCallback(
    async (from?: SavedOnline | null) => {
      rejoinWhenActive.current = false;
      // Mid-game drops restore from memory; a rejoin from the menu from storage.
      let target: SavedOnline | null;
      if (from === undefined && roomRef.current && roleRef.current) {
        target = { roomCode: roomRef.current, role: roleRef.current };
        restoreRef.current = { grid: boardRef.current.grid, timer: timerRef.current };
      } else {
        target = from ?? (await onlineStore.load());
        restoreRef.current = target ? { grid: target.grid ?? createEmptyGrid(), timer: target.timer ?? 0 } : null;
      }
      if (!target) return;
      setRoom(target.roomCode);
      setMyRole(target.role);
      setScreen('connecting');
      connect({ action: 'rejoinRoom', roomCode: target.roomCode, role: target.role });
      clearRejoinTimeout();
      rejoinTimeout.current = setTimeout(() => {
        if (screenRef.current !== 'connecting') return;
        closeSocket();
        setError({ message: 'No response from the server — the room may have expired.', canRetry: true });
        setScreen('error');
      }, REJOIN_TIMEOUT_MS);
    },
    [boardRef, closeSocket, connect, setScreen],
  );
  const rejoinRef = useRef(rejoin);
  rejoinRef.current = rejoin;

  /** Back to the menu. `keepSave` leaves the room rejoinable (Pause). */
  const leave = useCallback(
    async (keepSave: boolean) => {
      clearRejoinTimeout();
      rejoinWhenActive.current = false;
      closeSocket();
      if (!keepSave) await onlineStore.clear();
      restoreRef.current = null;
      setRoom('');
      setMyRole(null);
      updateBoard(emptyBoard());
      setWinner(null);
      setError(null);
      setOpponentAway(null);
      setTimer(0);
      setSaved(await onlineStore.load());
      setScreen('menu');
    },
    [closeSocket, setScreen, updateBoard],
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    onlineStore.load().then(setSaved);
    return () => {
      clearRejoinTimeout();
      closeSocket();
    };
  }, [closeSocket]);

  // Rejoin after the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && rejoinWhenActive.current) rejoinRef.current();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (screen === 'playing' && roomCode && role) {
      onlineStore.save({ roomCode, role, hand: board.hand, grid: board.grid, timer });
    }
  }, [screen, roomCode, role, board, timer]);

  useTicker(screen === 'playing', () => setTimer((t) => t + 1));

  // Tell the opponent how we're doing, and keep bunch counts in sync.
  useEffect(() => {
    if (screen !== 'playing') return;
    const id = setInterval(() => {
      if (!roleRef.current) return;
      send({
        action: 'status',
        roomCode: roomRef.current,
        role: roleRef.current,
        handSize: boardRef.current.hand.length,
        wordCount: getWordsOnGrid(boardRef.current.grid).length,
        bunchSize: bunchRef.current,
      });
    }, STATUS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [screen, send, boardRef]);

  // API Gateway drops idle sockets after 10 minutes.
  useEffect(() => {
    if (screen !== 'playing' && screen !== 'waiting') return;
    const id = setInterval(() => send({ action: 'ping' }), PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [screen, send]);

  useEffect(() => {
    if (!opponentAway || opponentAway.long) return;
    const left = OPPONENT_REJOIN_TIMEOUT_MS - (Date.now() - opponentAway.since);
    const id = setTimeout(() => setOpponentAway((a) => a && { ...a, long: true }), Math.max(0, left));
    return () => clearTimeout(id);
  }, [opponentAway]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const peel = () => {
    const { hand, grid } = boardRef.current;
    const check = checkPeel(hand, grid, dictionary);
    if (!check.ok) {
      haptics.refuse();
      toast(check.reason);
      return;
    }
    const { current, hasNew } = twoLetterCheck(twoLetterRef.current, check.words);
    twoLetterRef.current = current;
    pendingTaunt.current = hasNew ? pickTaunt() : null;
    haptics.success();
    if (roleRef.current) send({ action: 'peel', roomCode: roomRef.current, role: roleRef.current });
  };

  /** Asks the server to trade a hand tile; the hand changes when DUMP_RESULT arrives. */
  const dump = (tile: Tile | null) => {
    if (!tile) {
      toast('Select a tile from your hand, then DUMP.');
      return false;
    }
    if (bunchRef.current < DUMP_DRAW) {
      toast(`Not enough tiles in the bunch to dump (${bunchRef.current} left).`);
      return false;
    }
    if (roleRef.current) send({ action: 'dump', roomCode: roomRef.current, role: roleRef.current, tile });
    return true;
  };

  return {
    screen,
    roomCode,
    role,
    board,
    updateBoard,
    bunchSize,
    opponent,
    timer,
    winner,
    finalGrids,
    error,
    opponentAway,
    saved,
    createRoom,
    joinRoom,
    rejoin: () => rejoin(null),
    leave,
    peel,
    dump,
  };
}
