import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DEFAULT_CATEGORIES } from '@spendwise/shared';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {DEFAULT_CATEGORIES.map((category) => {
        const selected = category.name === value;
        return (
          <TouchableOpacity
            key={category.name}
            onPress={() => onChange(category.name)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? category.color : theme.backgroundElement,
                borderColor: selected ? category.color : theme.border,
              },
            ]}
          >
            <ThemedText style={styles.icon}>{category.icon}</ThemedText>
            <ThemedText
              style={[styles.label, selected && styles.labelSelected]}
              themeColor={selected ? undefined : 'textSecondary'}
            >
              {category.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600' },
  labelSelected: { color: '#fff' },
});
