import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TWO_LETTER_TIPS } from '../game/taunts';
import { Colors } from '../theme';

function Section({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          • {line}
        </Text>
      ))}
    </View>
  );
}

export function HelpContent({ online }: { online?: boolean }) {
  return (
    <View>
      <Section
        title="🎯 Goal"
        lines={
          online
            ? ['Be the first to use every tile once the bunch runs dry.']
            : ['Use every tile in the bunch in one crossword, as fast as you can.']
        }
      />
      <Section
        title="🖐 Placing tiles"
        lines={[
          'Tap a tile in your hand to select it, then tap the board to place it.',
          'Tap a board tile to pick it up and move it.',
          'Tap an occupied spot, or a hand tile while a board tile is selected, to swap them.',
          'Tap the hand tray to send a selected board tile back.',
          'Pinch to zoom the board; drag to look around.',
        ]}
      />
      <Section
        title="📋 Rules"
        lines={[
          'All tiles must form one connected crossword.',
          'Every run of two or more tiles, across and down, must be a word.',
          'Once your hand is empty, tiles turn green (good), red (not a word) or orange (cut off).',
        ]}
      />
      <Section
        title="🍌 PEEL"
        lines={
          online
            ? [
                'Hand empty and board valid? PEEL — both players draw a tile.',
                'Peel with fewer than two tiles left in the bunch and you win: BANANAS!',
              ]
            : ['Hand empty and board valid? PEEL to draw a tile.', 'Peel with the bunch empty to win: BANANAS!']
        }
      />
      <Section title="🔄 DUMP" lines={['Select a hand tile and DUMP it to trade it for three from the bunch.']} />
      <Section title="💡 Two-letter words" lines={[TWO_LETTER_TIPS]} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 14 },
  heading: { color: Colors.brown, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  line: { color: Colors.brown, fontSize: 14, lineHeight: 21 },
});
