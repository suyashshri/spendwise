import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { Transaction } from '@spendwise/shared';

import { CategoryPicker } from './CategoryPicker';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/dateHelpers';

export function ShareIntentPreview({
  transaction,
  duplicate,
  category,
  note,
  onCategoryChange,
  onNoteChange,
  onConfirm,
  isSaving,
}: {
  transaction: Transaction;
  duplicate: boolean;
  category: string;
  note: string;
  onCategoryChange: (category: string) => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {duplicate ? (
        <ThemedView type="backgroundSelected" style={styles.banner}>
          <ThemedText themeColor="warning" style={styles.bannerText}>
            You already added this payment — showing the existing entry.
          </ThemedText>
        </ThemedView>
      ) : transaction.needsReview ? (
        <ThemedView type="backgroundSelected" style={styles.banner}>
          <ThemedText themeColor="textSecondary" style={styles.bannerText}>
            Not fully sure about the category — please confirm it below.
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedText type="title" style={styles.amount}>
        {formatCurrency(transaction.amount)}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{transaction.merchant}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.date}>
        {formatTransactionDate(transaction.date)}
      </ThemedText>

      <View style={styles.field}>
        <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
          Category
        </ThemedText>
        <CategoryPicker value={category} onChange={onCategoryChange} />
      </View>

      <View style={styles.field}>
        <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
          Note (optional)
        </ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Add a note"
          placeholderTextColor={theme.textSecondary}
          value={note}
          onChangeText={onNoteChange}
        />
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={onConfirm}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Done</ThemedText>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  banner: { borderRadius: 12, padding: 12 },
  bannerText: { fontSize: 13, lineHeight: 18 },
  amount: { fontSize: 34, lineHeight: 40 },
  date: { fontSize: 13, marginTop: 2 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
