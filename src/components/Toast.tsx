import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

/** A message that clears itself, like the web game's banner. */
export function useToast() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, ms = 2500) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    if (msg && ms > 0) timer.current = setTimeout(() => setMessage(''), ms);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { message, show };
}

export function Toast({ message, top }: { message: string; top: number }) {
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top }]}>
      <Text style={styles.text} accessibilityLiveRegion="polite">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    backgroundColor: Colors.banana,
    borderRadius: 12,
    borderBottomWidth: 3,
    borderBottomColor: Colors.bananaEdge,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  text: { color: Colors.brown, fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
