import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Colors } from '../theme';

type Variant = 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'grey';

const VARIANTS: Record<Variant, [string, string]> = {
  green: [Colors.green, Colors.greenEdge],
  orange: [Colors.orange, Colors.orangeEdge],
  red: [Colors.red, Colors.redEdge],
  blue: [Colors.blue, Colors.blueEdge],
  purple: [Colors.purple, Colors.purpleEdge],
  grey: [Colors.grey, Colors.greyEdge],
};

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  size?: 'large' | 'small';
  style?: ViewStyle;
  accessibilityHint?: string;
}

/** A chunky button with a coloured bottom edge, like the web game's. */
export function Button({ label, onPress, variant = 'green', disabled, size = 'large', style, accessibilityHint }: Props) {
  const [bg, edge] = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.large,
        { backgroundColor: bg, borderBottomColor: edge, opacity: disabled ? 0.5 : 1 },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, size === 'small' && styles.labelSmall]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { paddingVertical: 14, paddingHorizontal: 28 },
  small: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderBottomWidth: 4 },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  label: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  labelSmall: { fontSize: 15 },
});
