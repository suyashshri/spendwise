import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { useTheme } from '@/hooks/use-theme';
import { Elevation, Radii } from '@/constants/theme';

export function Card({
  children,
  onPress,
  style,
  elevated = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  const theme = useTheme();
  const cardStyle = [
    styles.card,
    { backgroundColor: theme.surfaceElevated },
    elevated && Elevation.card,
    elevated && { shadowColor: theme.shadow },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} scaleTo={0.98} style={cardStyle}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    padding: 18,
  },
});
