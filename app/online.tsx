// ─── Online game ──────────────────────────────────────────────────────────────
// Create or join a room on the same server as the web game, then play.

import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { BoardPreview } from '../src/components/BoardPreview';
import { Button } from '../src/components/Button';
import { Body, CardScreen, Title } from '../src/components/Card';
import { HelpContent } from '../src/components/HelpContent';
import { PlayArea } from '../src/components/PlayArea';
import { Sheet } from '../src/components/Sheet';
import { Stat, StatDivider } from '../src/components/Stat';
import { useToast } from '../src/components/Toast';
import { loadDictionaryAsync } from '../src/dictionary';
import { recallAll } from '../src/game/moves';
import type { Dictionary, Selection } from '../src/game/types';
import { formatTime } from '../src/hooks/useTicker';
import { goHome } from '../src/nav';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from '../src/online/protocol';
import { useOnlineGame } from '../src/online/useOnlineGame';
import { Colors } from '../src/theme';

function RoomCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View style={styles.codeBox}>
      <Text style={styles.code} selectable accessibilityLabel={`Room code ${code.split('').join(' ')}`}>
        {code}
      </Text>
      <View style={styles.codeButtons}>
        <Button label={copied ? '✓ Copied' : '📋 Copy'} size="small" variant={copied ? 'green' : 'grey'} onPress={copy} />
        <Button
          label="📤 Share"
          size="small"
          variant="blue"
          onPress={() => Share.share({ message: `Play Bananagrams with me! Room code: ${code}` })}
        />
      </View>
    </View>
  );
}

export default function OnlineScreen() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [menu, setMenu] = useState<'closed' | 'menu' | 'help' | 'room'>('closed');
  const [boardTab, setBoardTab] = useState<'mine' | 'theirs'>('mine');
  const toast = useToast();
  const game = useOnlineGame(dictionary, toast.show);

  useEffect(() => {
    loadDictionaryAsync().then(setDictionary);
  }, []);

  useEffect(() => {
    setSelection(null);
    setMenu('closed');
    setBoardTab('mine');
  }, [game.screen]);

  // Only one modal shows at a time on iOS; the disconnect notice wins.
  useEffect(() => {
    if (game.opponentAway) setMenu('closed');
  }, [game.opponentAway]);

  const closeMenuThen = (fn: () => void) => () => {
    setMenu('closed');
    fn();
  };

  switch (game.screen) {
    case 'menu': {
      const code = normalizeRoomCode(joinInput);
      return (
        <CardScreen>
          <Title sub="Online — play a friend">🍌 BANANAGRAMS</Title>
          {game.saved && (
            <Button label={`↩ Rejoin ${game.saved.roomCode}`} variant="orange" onPress={game.rejoin} />
          )}
          <Button label="Create Room" onPress={game.createRoom} />
          <View style={styles.joinRow}>
            <TextInput
              style={styles.input}
              value={joinInput}
              onChangeText={(t) => setJoinInput(normalizeRoomCode(t))}
              placeholder="ROOM CODE"
              placeholderTextColor="rgba(93,64,55,0.4)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={ROOM_CODE_LENGTH}
              returnKeyType="go"
              onSubmitEditing={() => code.length === ROOM_CODE_LENGTH && game.joinRoom(code)}
              accessibilityLabel="Room code"
            />
            <Button
              label="Join"
              variant="blue"
              disabled={code.length !== ROOM_CODE_LENGTH}
              onPress={() => game.joinRoom(code)}
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.infoText}>
              • Share the 6-letter room code with a friend — they can join from this app or the web game{'\n'}• Each
              player starts with 21 tiles{'\n'}• <Text style={styles.bold}>PEEL</Text> when your hand is empty — both
              players draw{'\n'}• First to finish once the bunch runs dry wins <Text style={styles.bold}>BANANAS!</Text>
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.link}>← Back</Text>
          </Pressable>
        </CardScreen>
      );
    }

    case 'connecting':
      return (
        <CardScreen>
          <Text style={styles.emoji}>🍌</Text>
          <ActivityIndicator color={Colors.brown} />
          <Body>Connecting…</Body>
        </CardScreen>
      );

    case 'waiting':
      return (
        <CardScreen>
          <Title>🍌 Room Ready</Title>
          <Body>Share this code with your opponent:</Body>
          <RoomCode code={game.roomCode} />
          <Body>⏳ Waiting for player 2 to join…</Body>
          <Pressable onPress={() => game.leave(false)} hitSlop={8}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        </CardScreen>
      );

    case 'error':
      return (
        <CardScreen>
          <Text style={styles.emoji}>⚠️</Text>
          <Title>Connection Problem</Title>
          <Body>{game.error?.message}</Body>
          {game.error?.canRetry ? (
            <>
              <Button label="Try Rejoining Again" variant="orange" onPress={game.rejoin} />
              <Button label="Back to Menu" onPress={() => game.leave(true)} />
              <Pressable onPress={() => game.leave(false)} hitSlop={8}>
                <Text style={styles.link}>Start fresh (forget this game)</Text>
              </Pressable>
            </>
          ) : (
            <Button label="Back to Menu" onPress={() => game.leave(false)} />
          )}
        </CardScreen>
      );

    case 'won': {
      const iWon = game.winner === 'me';
      const grid = boardTab === 'mine' ? game.finalGrids.mine : game.finalGrids.theirs;
      return (
        <CardScreen>
          <Text style={styles.emoji}>{iWon ? '🎉🍌🏆' : '🍌😔'}</Text>
          <Title sub={iWon ? 'You won!' : 'Your opponent wins this time.'}>{iWon ? 'BANANAS!' : 'So close!'}</Title>
          <Text style={styles.time}>{formatTime(game.timer)}</Text>
          <View style={styles.tabs}>
            {(['mine', 'theirs'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setBoardTab(tab)}
                style={[styles.tab, boardTab === tab && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: boardTab === tab }}
              >
                <Text style={[styles.tabText, boardTab === tab && styles.tabTextActive]}>
                  {tab === 'mine' ? 'My Board' : "Opponent's Board"}
                </Text>
              </Pressable>
            ))}
          </View>
          {grid ? <BoardPreview grid={grid} /> : <Body>⏳ Waiting for your opponent's board…</Body>}
          <Button label="Play Again" onPress={() => game.leave(false)} />
          <Button label="Home" variant="grey" onPress={() => goHome()} />
        </CardScreen>
      );
    }

    case 'playing': {
      const mine = game.role === 'host' ? 'P1 (you)' : 'P2 (you)';
      const theirs = game.role === 'host' ? 'P2' : 'P1';
      return (
        <>
          <PlayArea
            board={game.board}
            updateBoard={game.updateBoard}
            selection={selection}
            setSelection={setSelection}
            dictionary={dictionary}
            message={toast.message}
            onPeel={game.peel}
            onDump={() => {
              if (game.dump(selection?.source.type === 'hand' ? selection.tile : null)) setSelection(null);
            }}
            onMenu={() => setMenu('menu')}
            footer={
              <>
                <Text style={styles.footerLabel}>{theirs}</Text>
                <Stat label="hand" value={game.opponent.handSize} color={Colors.orange} />
                <Stat label="bunch" value={game.bunchSize} color={Colors.blue} />
                <StatDivider />
                <Text style={styles.footerLabel}>{mine}</Text>
                <Stat label="hand" value={game.board.hand.length} />
              </>
            }
          />

          <Sheet visible={menu === 'menu'} title="☰ Menu" onClose={() => setMenu('closed')}>
            <View style={styles.menu}>
              <Button label="📖 How to Play" variant="blue" onPress={() => setMenu('help')} />
              <Button label={`🔑 Room ${game.roomCode}`} variant="purple" onPress={() => setMenu('room')} />
              <Button
                label="🧺 Recall All Tiles"
                variant="orange"
                onPress={closeMenuThen(() => {
                  game.updateBoard((b) => recallAll(b).board);
                  setSelection(null);
                })}
              />
              <Button label="⏸ Pause (rejoin later)" variant="grey" onPress={closeMenuThen(() => game.leave(true))} />
              <Button label="🚪 Quit Game" variant="red" onPress={closeMenuThen(() => game.leave(false))} />
            </View>
          </Sheet>

          <Sheet visible={menu === 'room'} title="🔑 Room" onClose={() => setMenu('closed')}>
            <Body>Both players use this code to rejoin.</Body>
            <RoomCode code={game.roomCode} />
          </Sheet>

          <Sheet visible={menu === 'help'} title="How to Play" onClose={() => setMenu('closed')}>
            <HelpContent online />
          </Sheet>

          <Modal visible={!!game.opponentAway} transparent animationType="fade">
            <View style={styles.awayBackdrop}>
              <View style={styles.awayCard}>
                <Text style={styles.emoji}>⏳</Text>
                <Title>Opponent Disconnected</Title>
                <Body>
                  {game.opponentAway?.long
                    ? "They've been gone a while. You can keep waiting or leave."
                    : 'Game paused. Waiting for them to rejoin…'}
                </Body>
                <Button label="Leave (rejoin later)" variant="red" onPress={() => game.leave(true)} />
              </View>
            </View>
          </Modal>
        </>
      );
    }
  }
}

const styles = StyleSheet.create({
  emoji: { fontSize: 48, textAlign: 'center' },
  time: { fontSize: 28, fontWeight: '800', color: Colors.brown, textAlign: 'center' },
  joinRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(93,64,55,0.3)',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    color: Colors.brown,
  },
  info: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 14 },
  infoText: { color: Colors.brown, fontSize: 14, lineHeight: 22 },
  bold: { fontWeight: '800' },
  link: { color: Colors.brownLight, textAlign: 'center', fontSize: 15, fontWeight: '600', padding: 4 },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  code: { fontSize: 38, fontWeight: '900', color: Colors.brown, letterSpacing: 8 },
  codeButtons: { flexDirection: 'row', gap: 10 },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.35)' },
  tabActive: { backgroundColor: Colors.brown },
  tabText: { textAlign: 'center', fontWeight: '700', color: Colors.brown, fontSize: 14 },
  tabTextActive: { color: Colors.white },
  footerLabel: { color: 'rgba(93,64,55,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  menu: { gap: 10 },
  awayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  awayCard: {
    backgroundColor: Colors.banana,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    width: '100%',
    maxWidth: 360,
  },
});
