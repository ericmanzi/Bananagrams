// ─── Solo game ────────────────────────────────────────────────────────────────
// Single-player Bananagrams. The game is saved after every change and resumed
// when the screen opens, unless it was opened with ?new=1.

import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BoardPreview } from '../src/components/BoardPreview';
import { Button } from '../src/components/Button';
import { Body, CardScreen, Title } from '../src/components/Card';
import { HelpContent } from '../src/components/HelpContent';
import { PlayArea } from '../src/components/PlayArea';
import { Sheet } from '../src/components/Sheet';
import { Stat, StatDivider } from '../src/components/Stat';
import { useToast } from '../src/components/Toast';
import { loadDictionaryAsync } from '../src/dictionary';
import { getWordsOnGrid } from '../src/game/grid';
import { recallAll } from '../src/game/moves';
import { dump, newSoloGame, peel, type SoloGame } from '../src/game/solo';
import { pickTaunt } from '../src/game/taunts';
import type { Board, Dictionary, Selection } from '../src/game/types';
import { haptics } from '../src/haptics';
import { useLatest } from '../src/hooks/useLatest';
import { formatTime, useTicker } from '../src/hooks/useTicker';
import { goHome } from '../src/nav';
import { bestTimeStore, soloStore } from '../src/storage';
import { Colors } from '../src/theme';

export default function SoloScreen() {
  const params = useLocalSearchParams<{ new?: string }>();
  const [game, updateGame] = useLatest<SoloGame | null>(null);
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [menu, setMenu] = useState<'closed' | 'menu' | 'help'>('closed');
  const [best, setBest] = useState<{ time: number | null; isNew: boolean }>({ time: null, isNew: false });
  const toast = useToast();

  useEffect(() => {
    loadDictionaryAsync().then(setDictionary);
    (async () => {
      const saved = params.new ? null : await soloStore.load();
      updateGame(saved?.status === 'playing' ? saved : newSoloGame());
      setBest({ time: await bestTimeStore.load(), isNew: false });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game?.status === 'playing') soloStore.save(game);
  }, [game]);

  useTicker(game?.status === 'playing' && !!dictionary && menu === 'closed', () =>
    updateGame((g) => g && { ...g, elapsed: g.elapsed + 1 }),
  );

  const updateBoard = useCallback(
    (fn: (prev: Board) => Board) =>
      updateGame((g) => {
        if (!g) return g;
        const { hand, grid } = fn({ hand: g.hand, grid: g.grid });
        return { ...g, hand, grid };
      }),
    [updateGame],
  );

  const startNew = () => {
    updateGame(newSoloGame());
    setSelection(null);
    setMenu('closed');
    toast.show('');
  };

  const onPeel = async () => {
    if (!game) return;
    const result = peel(game, dictionary);
    if (!result.ok) {
      haptics.refuse();
      toast.show(result.reason);
      return;
    }
    haptics.success();
    setSelection(null);
    updateGame(result.game);
    if (result.won) {
      soloStore.clear();
      const isNew = await bestTimeStore.offer(result.game.elapsed);
      setBest({ time: isNew ? result.game.elapsed : await bestTimeStore.load(), isNew });
      return;
    }
    if (result.newTwoLetterWord) toast.show(pickTaunt(), 6000);
    else toast.show(`🍌 PEEL! Drew ${result.drawn.letter} (${result.game.bunch.length} left)`, 1800);
  };

  const onDump = () => {
    if (!game) return;
    const tileId = selection?.source.type === 'hand' ? selection.tile.id : null;
    const result = dump(game, tileId);
    if (!result.ok) {
      haptics.refuse();
      toast.show(result.reason);
      return;
    }
    haptics.place();
    setSelection(null);
    updateGame(result.game);
    toast.show(`Dumped ${selection!.tile.letter}, drew ${result.drawn.map((t) => t.letter).join(' ')}`);
  };

  if (!game || !dictionary) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.banana} />
        <Text style={styles.loadingText}>Shuffling tiles…</Text>
      </View>
    );
  }

  if (game.status === 'won') {
    return (
      <CardScreen>
        <Text style={styles.emoji}>🎉🍌🏆</Text>
        <Title sub="You used every tile!">BANANAS!</Title>
        <Text style={styles.time}>{formatTime(game.elapsed)}</Text>
        <Body>
          {best.isNew
            ? 'New best time!'
            : best.time !== null
              ? `Best: ${formatTime(best.time)}`
              : ''}
        </Body>
        <Body>Words formed: {getWordsOnGrid(game.grid).length}</Body>
        <BoardPreview grid={game.grid} />
        <Button label="Play Again" onPress={startNew} />
        <Button label="Home" variant="grey" onPress={() => goHome()} />
      </CardScreen>
    );
  }

  return (
    <>
      <PlayArea
        board={{ hand: game.hand, grid: game.grid }}
        updateBoard={updateBoard}
        selection={selection}
        setSelection={setSelection}
        dictionary={dictionary}
        message={toast.message}
        onPeel={onPeel}
        onDump={onDump}
        onMenu={() => setMenu('menu')}
        footer={
          <>
            <Text style={styles.timer}>{formatTime(game.elapsed)}</Text>
            <StatDivider />
            <Stat label="bunch" value={game.bunch.length} color={Colors.blue} />
            <Stat label="hand" value={game.hand.length} />
          </>
        }
      />

      <Sheet visible={menu === 'menu'} title="☰ Menu" onClose={() => setMenu('closed')}>
        <View style={styles.menu}>
          <Button label="📖 How to Play" variant="blue" onPress={() => setMenu('help')} />
          <Button
            label="🧺 Recall All Tiles"
            variant="orange"
            onPress={() => {
              updateBoard((b) => recallAll(b).board);
              setSelection(null);
              setMenu('closed');
            }}
          />
          <Button label="🔀 New Game" variant="green" onPress={startNew} />
          <Button label="🏠 Home (game is saved)" variant="grey" onPress={() => goHome()} />
        </View>
      </Sheet>

      <Sheet visible={menu === 'help'} title="How to Play" onClose={() => setMenu('closed')}>
        <HelpContent />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textDim, fontSize: 15 },
  emoji: { fontSize: 52, textAlign: 'center' },
  time: { fontSize: 30, fontWeight: '800', color: Colors.brown, textAlign: 'center' },
  timer: { fontSize: 17, fontWeight: '800', color: Colors.brown, fontVariant: ['tabular-nums'] },
  menu: { gap: 10 },
});
