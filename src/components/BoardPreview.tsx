import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { gridBounds } from '../game/grid';
import type { Grid } from '../game/types';
import { Colors } from '../theme';
import { TileFace } from './Tile';

const SIZE = 26;

/** A finished board, cropped to its tiles, for the end-of-game screens. */
export function BoardPreview({ grid }: { grid: Grid }) {
  const bounds = gridBounds(grid);
  if (!bounds) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Empty board</Text>
      </View>
    );
  }
  const rows = grid.slice(bounds.minR, bounds.maxR + 1).map((row) => row.slice(bounds.minC, bounds.maxC + 1));
  return (
    <ScrollView horizontal style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.board}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((tile, c) =>
              tile ? (
                <TileFace key={c} letter={tile.letter} size={SIZE} look="valid" />
              ) : (
                <View key={c} style={styles.gap} />
              ),
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: { flexGrow: 1, justifyContent: 'center' },
  board: { backgroundColor: Colors.boardBg, borderRadius: 10, padding: 6, gap: 2 },
  row: { flexDirection: 'row', gap: 2 },
  gap: { width: SIZE, height: SIZE },
  empty: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: 16 },
  emptyText: { color: Colors.brownLight, textAlign: 'center' },
});
