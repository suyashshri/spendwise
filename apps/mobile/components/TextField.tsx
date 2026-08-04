import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';

export function TextField({
  label,
  icon,
  style,
  ...props
}: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <ThemedText themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: focused ? theme.primary : theme.border,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? theme.primary : theme.textTertiary} /> : null}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
});
