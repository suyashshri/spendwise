import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from '@spendwise/shared';

import { AnimatedPressable } from './AnimatedPressable';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';

/** Compact "tap to open a picker" selector for currency — replaces an always-expanded horizontal
 * chip strip in the transaction forms, where scrolling through 10 currency pills inline felt heavy
 * for a field that's rarely changed. Same bottom-sheet pattern as CategoryDropdown. */
export function CurrencyDropdown({ value, onChange }: { value: string; onChange: (currency: string) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = getCurrencyInfo(value);

  return (
    <>
      <AnimatedPressable
        onPress={() => setOpen(true)}
        scaleTo={0.94}
        style={[styles.trigger, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
      >
        <ThemedText style={styles.triggerText}>
          {selected.symbol} {selected.code}
        </ThemedText>
        <Ionicons name="chevron-down" size={14} color={theme.textTertiary} />
      </AnimatedPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Select currency</ThemedText>
              <AnimatedPressable onPress={() => setOpen(false)} scaleTo={0.9} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </AnimatedPressable>
            </View>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {SUPPORTED_CURRENCIES.map((c) => {
                const isSelected = c.code === value;
                return (
                  <AnimatedPressable
                    key={c.code}
                    onPress={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    scaleTo={0.98}
                    style={[styles.row, isSelected && { backgroundColor: theme.primaryMuted }]}
                  >
                    <ThemedText style={styles.symbol}>{c.symbol}</ThemedText>
                    <View style={styles.rowText}>
                      <ThemedText style={styles.rowLabel}>{c.code}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.rowSub}>
                        {c.name}
                      </ThemedText>
                    </View>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  triggerText: { fontSize: 13, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, maxHeight: '70%', padding: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  closeButton: { padding: 4 },
  list: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
  },
  symbol: { fontSize: 18, width: 28 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 1 },
});
