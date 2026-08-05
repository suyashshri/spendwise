import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';
import { extractApiErrorMessage } from '@/services/api';
import { exportTransactions, type ExportFormat } from '@/services/exportTransactions';

export function ExportSheet({
  visible,
  onClose,
  category,
}: {
  visible: boolean;
  onClose: () => void;
  category?: string;
}) {
  const theme = useTheme();
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setPending(format);
    setError(null);
    try {
      await exportTransactions(format, { category });
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Export transactions</ThemedText>
            <AnimatedPressable onPress={onClose} scaleTo={0.9} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </AnimatedPressable>
          </View>
          {category ? (
            <ThemedText themeColor="textSecondary" style={styles.hint}>
              Filtered to {category}
            </ThemedText>
          ) : null}

          <AnimatedPressable
            onPress={() => handleExport('csv')}
            scaleTo={0.98}
            disabled={pending !== null}
            style={styles.row}
          >
            <Ionicons name="grid-outline" size={20} color={theme.primary} />
            <View style={styles.rowText}>
              <ThemedText style={styles.rowLabel}>Export as CSV</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.rowSub}>
                For spreadsheets
              </ThemedText>
            </View>
            {pending === 'csv' ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => handleExport('pdf')}
            scaleTo={0.98}
            disabled={pending !== null}
            style={styles.row}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            <View style={styles.rowText}>
              <ThemedText style={styles.rowLabel}>Export as PDF</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.rowSub}>
                A formatted report
              </ThemedText>
            </View>
            {pending === 'pdf' ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </AnimatedPressable>

          {error ? (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: 20, gap: 2 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  closeButton: { padding: 4 },
  hint: { fontSize: 13, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  error: { fontSize: 13, marginTop: 8 },
});
