import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from './AnimatedPressable';
import { useTheme } from '@/hooks/use-theme';
import { Elevation, Radii } from '@/constants/theme';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  transactions: 'receipt',
  budgets: 'pie-chart',
  profile: 'person',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          { backgroundColor: theme.surfaceElevated, shadowColor: theme.shadow },
          Elevation.floating,
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = ICONS[route.name] ?? 'ellipse';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedPressable
              key={route.key}
              onPress={onPress}
              scaleTo={0.9}
              style={[styles.tab, isFocused && { backgroundColor: theme.primaryMuted }]}
            >
              <Ionicons
                name={isFocused ? iconName : (`${iconName}-outline` as keyof typeof Ionicons.glyphMap)}
                size={24}
                color={isFocused ? theme.primary : theme.textTertiary}
              />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    borderRadius: Radii.xl,
    padding: 6,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
  },
});
