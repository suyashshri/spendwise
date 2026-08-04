import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { Transaction } from '@spendwise/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryAvatar } from '@/components/CategoryAvatar';
import { CategoryPicker } from '@/components/CategoryPicker';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTransactionStore } from '@/store/transactionStore';
import { api, extractApiErrorMessage } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/dateHelpers';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <CategoryAvatar category={transaction.category} size={56} />
          <ThemedText type="title" style={styles.amount}>
            {formatCurrency(transaction.amount)}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{transaction.merchant}</ThemedText>
          <ThemedText themeColor="textTertiary" style={styles.date}>
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

        <TextField label="Note" icon="create-outline" placeholder="Add a note" value={note} onChangeText={setNote} />

        {transaction.rawInput ? (
          <Card elevated={false} style={styles.rawInputCard}>
            <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
              Original share text
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.rawInput}>
              {transaction.rawInput}
            </ThemedText>
          </Card>
        ) : null}

        {error ? (
          <ThemedText themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        {isDirty ? <Button title="Save changes" onPress={onSave} loading={isSaving} /> : null}

        <Button title="Delete transaction" onPress={onDelete} variant="danger-ghost" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 22, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 6, marginBottom: 4 },
  amount: { fontSize: 34, lineHeight: 40, marginTop: 8 },
  date: { fontSize: 13 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  rawInputCard: { gap: 8 },
  rawInput: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  error: { fontSize: 14 },
});
