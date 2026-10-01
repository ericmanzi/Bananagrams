// ─── Play area ────────────────────────────────────────────────────────────────
// Board, hand, action bar and footer, shared by solo and online games. The
// screen owns the rules (what PEEL and DUMP do); this owns tapping tiles about.

import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyzeBoard, cellKey } from '../game/grid';
import { returnToHand, tapCell, tapHandTile, type MoveResult } from '../game/moves';
import type { Board, Dictionary, Selection, Tile } from '../game/types';
import { haptics } from '../haptics';
import { Colors } from '../theme';
import { BoardView } from './BoardView';
import { Button } from './Button';
import { HandView } from './HandView';
import { Toast } from './Toast';

interface Props {
  board: Board;
  updateBoard: (fn: (prev: Board) => Board) => void;
  selection: Selection | null;
  setSelection: (s: Selection | null) => void;
  dictionary: Dictionary | null;
  message: string;
  onPeel: () => void;
  onDump: () => void;
  onMenu: () => void;
  footer: React.ReactNode;
}

export function PlayArea(props: Props) {
  const { board, updateBoard, selection, setSelection, dictionary, message, footer } = props;
  const insets = useSafeAreaInsets();

  const apply = (move: (b: Board) => MoveResult) => {
    let result: MoveResult | null = null;
    updateBoard((prev) => {
      result = move(prev);
      return result.board;
    });
    const r = result as MoveResult | null;
    if (!r) return;
    setSelection(r.selection);
    if (r.moved) haptics.place();
    else if (r.selection) haptics.select();
  };

  // Words are only judged once the hand is empty, so tiles don't flash red
  // while a word is still being laid down.
  const handEmpty = board.hand.length === 0;
  const analysis = useMemo(
    () => (handEmpty ? analyzeBoard(board.grid, dictionary) : null),
    [handEmpty, board.grid, dictionary],
  );
  const canPeel = handEmpty && !!analysis && analysis.cells.size > 0 && !analysis.hasInvalid && !analysis.hasDisconnected;
  const blocked = !!analysis && (analysis.hasInvalid || analysis.hasDisconnected);

  const selectedKey = selection?.source.type === 'grid' ? cellKey(selection.source.row, selection.source.col) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Toast message={message} top={insets.top + 8} />

      <View style={styles.boardWrap}>
        <BoardView
          grid={board.grid}
          cellStates={analysis?.cells ?? null}
          selectedKey={selectedKey}
          selecting={!!selection}
          onCellPress={(row, col) => apply((b) => tapCell(b, selection, row, col))}
        />
      </View>

      <HandView
        hand={board.hand}
        selection={selection}
        onTilePress={(tile: Tile) => apply((b) => tapHandTile(b, selection, tile))}
        onTrayPress={() => apply((b) => returnToHand(b, selection))}
      />

      <View style={styles.actions}>
        <Button
          label="🍌 PEEL"
          size="small"
          variant={canPeel ? 'green' : blocked ? 'red' : 'grey'}
          onPress={props.onPeel}
          style={styles.grow}
        />
        <Button
          label="🔄 DUMP"
          size="small"
          variant="orange"
          onPress={props.onDump}
          style={styles.grow}
          accessibilityHint="Trades the selected hand tile for three from the bunch"
        />
        <Button
          label="↩"
          size="small"
          variant={selectedKey ? 'blue' : 'grey'}
          disabled={!selectedKey}
          onPress={() => apply((b) => returnToHand(b, selection))}
          accessibilityHint="Returns the selected board tile to your hand"
        />
        <Button label="☰" size="small" variant="purple" onPress={props.onMenu} accessibilityHint="Opens the menu" />
      </View>

      <View style={styles.footer}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.navy, paddingHorizontal: 8, gap: 6 },
  boardWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' },
  actions: { flexDirection: 'row', gap: 6 },
  grow: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.banana,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
});
