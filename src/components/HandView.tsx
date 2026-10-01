import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Selection, Tile } from '../game/types';
import { Colors } from '../theme';
import { TileFace } from './Tile';

const HAND_TILE = 40;

interface Props {
  hand: Tile[];
  selection: Selection | null;
  onTilePress: (tile: Tile) => void;
  /** Tapping the tray itself sends a selected board tile back. */
  onTrayPress: () => void;
}

export function HandView({ hand, selection, onTilePress, onTrayPress }: Props) {
  const returning = selection?.source.type === 'grid';
  return (
    <Pressable
      onPress={onTrayPress}
      style={[styles.tray, returning && styles.trayReturning]}
      accessibilityLabel={`Your hand, ${hand.length} tiles`}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>YOUR HAND ({hand.length})</Text>
        {returning && <Text style={styles.hint}>tap here to return the tile</Text>}
      </View>
      <View style={styles.tiles}>
        {hand.map((tile) => {
          const selected = selection?.source.type === 'hand' && selection.tile.id === tile.id;
          return (
            <Pressable
              key={tile.id}
              onPress={() => onTilePress(tile)}
              hitSlop={2}
              accessibilityRole="button"
              accessibilityLabel={`${tile.letter}${selected ? ', selected' : ''}`}
            >
              <TileFace letter={tile.letter} size={HAND_TILE} look={selected ? 'selected' : 'plain'} />
            </Pressable>
          );
        })}
        {hand.length === 0 && <Text style={styles.empty}>Hand empty — PEEL when your words are good.</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: Colors.panel,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trayReturning: {
    backgroundColor: 'rgba(52,152,219,0.15)',
    borderColor: 'rgba(52,152,219,0.6)',
    borderStyle: 'dashed',
  },
  header: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  headerText: { color: Colors.textDim, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  hint: { color: Colors.blue, fontSize: 11, fontStyle: 'italic' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: HAND_TILE },
  empty: { color: Colors.textDim, fontSize: 13, alignSelf: 'center' },
});
