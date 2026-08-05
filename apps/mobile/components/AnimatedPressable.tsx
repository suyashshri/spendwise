import { useRef } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

/** Pressable with a tactile scale-down on press — the built-in Animated API only (no reanimated
 * dependency), so this stays compatible with Expo Go.
 *
 * Uses Animated.createAnimatedComponent(Pressable) rather than wrapping an inner Animated.View,
 * so `style` lands on the actual flex-row child. An earlier version put `style` on an inner View
 * instead, which silently broke `flex: 1`-based layouts (e.g. evenly distributing tab bar items) —
 * flex only affects how an element sizes within its own direct parent, and the inner View's parent
 * was this Pressable, not whatever row was laying out the Pressables themselves. */
export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  children,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; children?: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <AnimatedPressableBase
      onPressIn={(e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
        animateTo(scaleTo);
        props.onPressIn?.(e);
      }}
      onPressOut={(e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
        animateTo(1);
        props.onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
      {...props}
    >
      {children}
    </AnimatedPressableBase>
  );
}
