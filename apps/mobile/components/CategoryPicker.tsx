import { ScrollView, StyleSheet } from 'react-native';
import { DEFAULT_CATEGORIES } from '@spendwise/shared';

import { AnimatedPressable } from './AnimatedPressable';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';

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
          <AnimatedPressable
            key={category.name}
            onPress={() => onChange(category.name)}
            scaleTo={0.94}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? category.color : theme.surfaceElevated,
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
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  icon: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '700' },
  labelSelected: { color: '#fff' },
});
