// ─── Home ─────────────────────────────────────────────────────────────────────

import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { CardScreen, Title } from '../src/components/Card';
import { HelpContent } from '../src/components/HelpContent';
import { Sheet } from '../src/components/Sheet';
import { TileFace } from '../src/components/Tile';
import type { SoloGame } from '../src/game/solo';
import { formatTime } from '../src/hooks/useTicker';
import { bestTimeStore, soloStore } from '../src/storage';
import { Colors } from '../src/theme';

export default function Home() {
  const [savedSolo, setSavedSolo] = useState<SoloGame | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [help, setHelp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      soloStore.load().then((g) => setSavedSolo(g?.status === 'playing' ? g : null));
      bestTimeStore.load().then(setBest);
    }, []),
  );

  return (
    <CardScreen>
      <View style={styles.tiles} accessible accessibilityLabel="Nanagrams">
        {'BANANA'.split('').map((l, i) => (
          <TileFace key={i} letter={l} size={40} look={i % 2 ? 'plain' : 'valid'} />
        ))}
      </View>
      <Title sub="Race to use every tile">NANAGRAMS</Title>

      {savedSolo ? (
        <>
          <Button label={`▶ Resume Solo (${formatTime(savedSolo.elapsed)})`} onPress={() => router.push('/solo')} />
          <Button label="🍌 New Solo Game" variant="orange" onPress={() => router.push('/solo?new=1')} />
        </>
      ) : (
        <Button label="🍌 Play Solo" onPress={() => router.push('/solo?new=1')} />
      )}
      <Button label="🌐 Play Online" variant="blue" onPress={() => router.push('/online')} />
      <Button label="📖 How to Play" variant="purple" onPress={() => setHelp(true)} />

      {best !== null && <Text style={styles.best}>Best solo time: {formatTime(best)}</Text>}

      <Sheet visible={help} title="How to Play" onClose={() => setHelp(false)}>
        <HelpContent />
      </Sheet>
    </CardScreen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 4 },
  best: { color: Colors.brownLight, textAlign: 'center', fontWeight: '600', marginTop: 4 },
});
