import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Elevation, Radii } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  fullWidth = true,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = {
    primary: theme.primary,
    secondary: theme.backgroundSelected,
    ghost: 'transparent',
    danger: theme.danger,
    'danger-ghost': theme.dangerMuted,
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: theme.text,
    ghost: theme.primary,
    danger: '#FFFFFF',
    'danger-ghost': theme.danger,
  }[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor, opacity: isDisabled ? 0.55 : 1 },
        fullWidth && styles.fullWidth,
        variant === 'primary' && Elevation.floating,
        variant === 'primary' && { shadowColor: theme.primary },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <ThemedText style={[styles.label, { color: textColor }]}>{title}</ThemedText>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontWeight: '700' },
});
