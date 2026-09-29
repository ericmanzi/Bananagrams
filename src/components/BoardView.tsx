// ─── Board ────────────────────────────────────────────────────────────────────
// The 25×25 play area. It scrolls in both directions and pinch-zooms (iOS
// ScrollView does both natively). Rather than 625 pressable cells, the whole
// board is one Pressable and the tapped cell comes from the touch position;
// the tiles and grid lines ignore touches so the position is always relative
// to the board.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { cellKey, type CellState } from '../game/grid';
import type { Grid } from '../game/types';
import { CELL, Colors } from '../theme';
import { TileFace } from './Tile';

const PAD = 16;
const INSET = 2;

interface Props {
  grid: Grid;
  cellStates: Map<string, CellState> | null;
  selectedKey: string | null;
  selecting: boolean;
  onCellPress: (row: number, col: number) => void;
}

export function BoardView({ grid, cellStates, selectedKey, selecting, onCellPress }: Props) {
  const size = grid.length;
  const boardPx = size * CELL;
  const scrollRef = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null);

  // Start centred on the middle of the board, where the first word usually goes.
  useEffect(() => {
    if (!viewport) return;
    const total = boardPx + PAD * 2;
    scrollRef.current?.scrollTo({
      x: Math.max(0, (total - viewport.w) / 2),
      y: Math.max(0, (total - viewport.h) / 2),
      animated: false,
    });
    // Only on first layout; after that the player owns the scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport === null]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!viewport) setViewport({ w: width, h: height });
  };

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      // iOS reports the touch position as locationX/Y; react-native-web hands
      // over a DOM click, which calls it offsetX/Y.
      const ne = e.nativeEvent as GestureResponderEvent['nativeEvent'] & { offsetX?: number; offsetY?: number };
      const col = Math.floor((ne.locationX ?? ne.offsetX ?? -1) / CELL);
      const row = Math.floor((ne.locationY ?? ne.offsetY ?? -1) / CELL);
      if (row >= 0 && row < size && col >= 0 && col < size) onCellPress(row, col);
    },
    [onCellPress, size],
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      // An explicit content size is what lets an iOS ScrollView scroll sideways too.
      contentContainerStyle={{ padding: PAD, width: boardPx + PAD * 2, height: boardPx + PAD * 2 }}
      onLayout={onLayout}
      centerContent
      minimumZoomScale={0.35}
      maximumZoomScale={2.5}
      bouncesZoom
      directionalLockEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={onPress}
        style={[styles.board, { width: boardPx, height: boardPx }, selecting && styles.selecting]}
        accessibilityLabel="Game board"
        accessibilityHint="Tap a cell to place the selected tile, or tap a tile to pick it up"
      >
        <GridLines size={size} />
        {grid.map((row, r) =>
          row.map((tile, c) => {
            if (!tile) return null;
            const k = cellKey(r, c);
            const look = k === selectedKey ? 'selected' : cellStates?.get(k) ?? 'plain';
            return (
              <View key={tile.id} pointerEvents="none" style={[styles.cell, { top: r * CELL, left: c * CELL }]}>
                <TileFace letter={tile.letter} size={CELL - INSET * 2} look={look} />
              </View>
            );
          }),
        )}
      </Pressable>
    </ScrollView>
  );
}

const GridLines = React.memo(function GridLines({ size }: { size: number }) {
  const px = size * CELL;
  const lines = [];
  for (let i = 1; i < size; i++) {
    lines.push(<View key={`h${i}`} style={[styles.line, { top: i * CELL, left: 0, width: px, height: 1 }]} />);
    lines.push(<View key={`v${i}`} style={[styles.line, { left: i * CELL, top: 0, height: px, width: 1 }]} />);
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines}
    </View>
  );
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  board: { backgroundColor: Colors.boardBg, borderRadius: 8, overflow: 'hidden' },
  selecting: { backgroundColor: '#2f4a4a' },
  line: { position: 'absolute', backgroundColor: Colors.boardLine },
  cell: { position: 'absolute', width: CELL, height: CELL, padding: INSET },
});
