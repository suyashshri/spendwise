import { StyleSheet, View } from 'react-native';
import { getCategoryMeta } from '@spendwise/shared';

import { ThemedText } from './themed-text';
import { useCategoryStore } from '@/store/categoryStore';

export function CategoryAvatar({ category, size = 44 }: { category: string; size?: number }) {
  // Reactive lookup against fetched categories (defaults + this user's custom ones) — falls back
  // to the static shared defaults (e.g. before the first fetch resolves, or for a category that
  // no longer exists) rather than showing nothing.
  const match = useCategoryStore((s) => s.categories.find((c) => c.name === category));
  const { icon, color } = match ?? getCategoryMeta(category);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}26` },
      ]}
    >
      <ThemedText style={{ fontSize: size * 0.45 }}>{icon}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
