import { StyleSheet, View } from 'react-native';
import { getCategoryMeta } from '@spendwise/shared';

import { ThemedText } from './themed-text';

export function CategoryAvatar({ category, size = 44 }: { category: string; size?: number }) {
  const { icon, color } = getCategoryMeta(category);

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
