import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { Transaction } from '@spendwise/shared';

import { CategoryPicker } from '@/components/CategoryPicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTransactionStore } from '@/store/transactionStore';
import { api, extractApiErrorMessage } from '@/services/api';
import { formatTransactionDate } from '@/utils/dateHelpers';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const fromStore = useTransactionStore((s) => s.transactions.find((t) => t.id === id));
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);

  // Falls back to a direct fetch when the transaction isn't already loaded in the store —
  // e.g. a cold app start landing straight on this route via a deep link.
  const [fetched, setFetched] = useState<Transaction | null>(null);
  useEffect(() => {
    if (!fromStore && id) {
      api
        .get<{ transaction: Transaction }>(`/transactions/${id}`)
        .then(({ data }) => setFetched(data.transaction))
        .catch(() => setFetched(null));
    }
  }, [fromStore, id]);

  const transaction = fromStore ?? fetched;

  const [category, setCategory] = useState(transaction?.category ?? '');
  const [note, setNote] = useState(transaction?.note ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setCategory(transaction.category);
      setNote(transaction.note ?? '');
    }
  }, [transaction]);

  const isDirty = useMemo(
    () => transaction && (category !== transaction.category || note !== (transaction.note ?? '')),
    [transaction, category, note]
  );

  if (!transaction) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Transaction not found.</ThemedText>
      </ThemedView>
    );
  }

  const onSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await updateTransaction(transaction.id, { category, note: note || undefined });
      router.back();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transaction.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <ThemedText type="title" style={styles.amount}>
            ₹{transaction.amount.toLocaleString('en-IN')}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{transaction.merchant}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.date}>
            {formatTransactionDate(transaction.date)} ·{' '}
            {transaction.inputType === 'manual' ? 'Manual entry' : 'Shared from UPI app'}
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Category
          </ThemedText>
          <CategoryPicker value={category} onChange={setCategory} />
        </View>

        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Note
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Add a note"
            placeholderTextColor={theme.textSecondary}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {transaction.rawInput ? (
          <View style={styles.field}>
            <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
              Original share text
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.rawInput}>
              {transaction.rawInput}
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <ThemedText themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        {isDirty ? (
          <Pressable
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Save changes</ThemedText>}
          </Pressable>
        ) : null}

        <Pressable style={[styles.button, styles.deleteButton, { borderColor: theme.danger }]} onPress={onDelete}>
          <ThemedText themeColor="danger" style={styles.deleteButtonText}>
            Delete transaction
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  amount: { fontSize: 34, lineHeight: 40 },
  date: { marginTop: 2, fontSize: 13 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  rawInput: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  error: { fontSize: 14 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  deleteButton: { borderWidth: 1, backgroundColor: 'transparent' },
  deleteButtonText: { fontWeight: '600', fontSize: 16 },
});
