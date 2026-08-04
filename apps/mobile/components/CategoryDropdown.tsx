import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DEFAULT_CATEGORIES } from '@spendwise/shared';

import { AnimatedPressable } from './AnimatedPressable';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';

/** Compact "tap to open a picker" selector — replaces always-expanded chip strips in contexts
 * where showing every category inline felt cluttered (e.g. the budgets add-form). */
export function CategoryDropdown({ value, onChange }: { value: string; onChange: (category: string) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = DEFAULT_CATEGORIES.find((c) => c.name === value) ?? DEFAULT_CATEGORIES[0];

  return (
    <>
      <AnimatedPressable
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
      >
        <ThemedText style={styles.icon}>{selected.icon}</ThemedText>
        <ThemedText style={styles.fieldLabel}>{selected.name}</ThemedText>
        <Ionicons name="chevron-down" size={18} color={theme.textTertiary} />
      </AnimatedPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Select category</ThemedText>
              <AnimatedPressable onPress={() => setOpen(false)} scaleTo={0.9} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </AnimatedPressable>
            </View>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {DEFAULT_CATEGORIES.map((c) => {
                const isSelected = c.name === value;
                return (
                  <AnimatedPressable
                    key={c.name}
                    onPress={() => {
                      onChange(c.name);
                      setOpen(false);
                    }}
                    scaleTo={0.98}
                    style={[styles.row, isSelected && { backgroundColor: theme.primaryMuted }]}
                  >
                    <ThemedText style={styles.icon}>{c.icon}</ThemedText>
                    <ThemedText style={styles.rowLabel}>{c.name}</ThemedText>
                    {isSelected ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: { fontSize: 18 },
  fieldLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, maxHeight: '70%', padding: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  closeButton: { padding: 4 },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: Radii.md },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
