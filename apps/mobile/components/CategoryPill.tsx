import { StyleSheet, View } from 'react-native';
import { getCategoryMeta } from '@spendwise/shared';

import { ThemedText } from './themed-text';

export function CategoryPill({ category }: { category: string }) {
  const { icon, color } = getCategoryMeta(category);

  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={[styles.label, { color }]} numberOfLines={1}>
        {category}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600' },
});
