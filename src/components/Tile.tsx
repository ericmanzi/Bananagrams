import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { CellState } from '../game/grid';
import { Colors } from '../theme';

export type TileLook = CellState | 'plain' | 'selected';

const LOOKS: Record<TileLook, { bg: string; edge: string; text: string }> = {
  plain: { bg: Colors.banana, edge: Colors.bananaEdge, text: Colors.brown },
  selected: { bg: Colors.blue, edge: Colors.blueEdge, text: Colors.white },
  valid: { bg: Colors.valid, edge: Colors.greenEdge, text: Colors.white },
  invalid: { bg: Colors.red, edge: Colors.redEdge, text: Colors.white },
  disconnected: { bg: Colors.orange, edge: Colors.orangeEdge, text: Colors.white },
};

interface Props {
  letter: string;
  size: number;
  look?: TileLook;
  style?: ViewStyle;
}

/** A letter tile. Purely visual; the parent decides what a tap does. */
export const TileFace = React.memo(function TileFace({ letter, size, look = 'plain', style }: Props) {
  const { bg, edge, text } = LOOKS[look];
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.18,
          backgroundColor: bg,
          borderBottomColor: edge,
          borderBottomWidth: Math.max(2, size * 0.07),
        },
        look === 'selected' && styles.lifted,
        style,
      ]}
    >
      <Text style={[styles.letter, { color: text, fontSize: size * 0.5 }]}>{letter}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontWeight: '800' },
  lifted: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    transform: [{ scale: 1.08 }],
  },
});
