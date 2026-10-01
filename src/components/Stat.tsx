import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

/** A small labelled count for the footer strip. */
export function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.value, color ? { backgroundColor: color, color: Colors.white } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function StatDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: {
    backgroundColor: 'rgba(93,64,55,0.18)',
    color: Colors.brown,
    fontWeight: '800',
    fontSize: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  label: { color: Colors.brownLight, fontSize: 12, fontWeight: '600' },
  divider: { width: 1, height: 18, backgroundColor: 'rgba(93,64,55,0.25)' },
});
