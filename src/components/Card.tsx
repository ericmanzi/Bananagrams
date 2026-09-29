import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';

/** A full screen with the yellow card from the web game's menus in the middle. */
export function CardScreen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, style]}>{children}</View>
    </ScrollView>
  );
}

export function Title({ children, sub }: { children: string; sub?: string }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Body({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.navy },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: Colors.banana,
    borderRadius: 24,
    padding: 28,
    gap: 12,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  titleWrap: { alignItems: 'center', marginBottom: 8 },
  title: { color: Colors.brown, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  sub: { color: Colors.brownLight, fontSize: 16, fontWeight: '600', marginTop: 4 },
  body: { color: Colors.brownLight, fontSize: 15, textAlign: 'center' },
});
