import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { getCurrencyInfo, type Transaction } from '@spendwise/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryAvatar } from '@/components/CategoryAvatar';
import { CategoryPicker } from '@/components/CategoryPicker';
import { CurrencyDropdown } from '@/components/CurrencyDropdown';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useTransactionStore } from '@/store/transactionStore';
import { api, extractApiErrorMessage } from '@/services/api';
import { confirmAction } from '@/utils/confirm';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/dateHelpers';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
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

  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [currency, setCurrency] = useState(transaction?.currency ?? user?.currency ?? 'INR');
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [note, setNote] = useState(transaction?.note ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setCurrency(transaction.currency);
      setMerchant(transaction.merchant);
      setCategory(transaction.category);
      setNote(transaction.note ?? '');
    }
  }, [transaction]);

  const parsedAmount = Number(amount);
  const canSave = parsedAmount > 0 && merchant.trim().length > 0;

  const isDirty = useMemo(
    () =>
      transaction &&
      (parsedAmount !== transaction.amount ||
        currency !== transaction.currency ||
        merchant.trim() !== transaction.merchant ||
        category !== transaction.category ||
        note !== (transaction.note ?? '')),
    [transaction, parsedAmount, currency, merchant, category, note]
  );

  if (!transaction) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Transaction not found.</ThemedText>
      </ThemedView>
    );
  }

  const onSave = async () => {
    if (!canSave) return;
    setError(null);
    setIsSaving(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parsedAmount,
        currency,
        merchant: merchant.trim(),
        category,
        note: note || undefined,
      });
      router.back();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = () => {
    confirmAction({
      title: 'Delete transaction',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await deleteTransaction(transaction.id);
        router.back();
      },
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <CategoryAvatar category={category} size={56} />
          <View style={styles.amountRow}>
            <ThemedText style={[styles.currencySymbol, { color: theme.textTertiary }]}>
              {getCurrencyInfo(currency).symbol}
            </ThemedText>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          <CurrencyDropdown value={currency} onChange={setCurrency} />
          {user && transaction.currency !== user.currency ? (
            <ThemedText themeColor="textSecondary" style={styles.converted}>
              ≈ {formatCurrency(transaction.amountInBaseCurrency, user.currency)} as originally recorded
              {transaction.exchangeRate
                ? ` (1 ${transaction.currency} = ${transaction.exchangeRate.toFixed(2)} ${user.currency})`
                : ''}
            </ThemedText>
          ) : null}
          <ThemedText themeColor="textTertiary" style={styles.date}>
            {formatTransactionDate(transaction.date)} ·{' '}
            {transaction.inputType === 'manual' ? 'Manual entry' : 'Shared from UPI app'}
          </ThemedText>
        </View>

        <TextField label="Paid to" icon="storefront-outline" value={merchant} onChangeText={setMerchant} />

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

        {isDirty ? <Button title="Save changes" onPress={onSave} disabled={!canSave} loading={isSaving} /> : null}

        <Button title="Delete transaction" onPress={onDelete} variant="danger-ghost" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 22, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 6, marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  currencySymbol: { fontSize: 28, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 40, fontWeight: '800', minWidth: 70, textAlign: 'center' },
  converted: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  date: { fontSize: 13 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  rawInputCard: { gap: 8 },
  rawInput: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  error: { fontSize: 14 },
});
