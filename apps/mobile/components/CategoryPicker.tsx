import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { CreateCategoryModal } from './CreateCategoryModal';
import { ThemedText } from './themed-text';
import { useCategories } from '@/hooks/useCategories';
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
  const { categories } = useCategories();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((category) => {
          const selected = category.name === value;
          return (
            <AnimatedPressable
              key={category.id}
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
        <AnimatedPressable
          onPress={() => setIsCreating(true)}
          scaleTo={0.94}
          style={[styles.chip, styles.newChip, { borderColor: theme.border }]}
        >
          <Ionicons name="add" size={16} color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary" style={styles.label}>
            New
          </ThemedText>
        </AnimatedPressable>
      </ScrollView>

      <CreateCategoryModal
        visible={isCreating}
        onClose={() => setIsCreating(false)}
        onCreated={(category) => onChange(category.name)}
      />
    </>
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
  newChip: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  icon: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '700' },
  labelSelected: { color: '#fff' },
});
