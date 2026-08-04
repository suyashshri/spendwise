import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { DEFAULT_CATEGORY_NAMES } from '@spendwise/shared';

import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTransactionStore } from '@/store/transactionStore';
import { extractApiErrorMessage } from '@/services/api';

export default function NewTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY_NAMES[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = Number(amount);
  const canSubmit = parsedAmount > 0 && merchant.trim().length > 0;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await addTransaction({
        amount: parsedAmount,
        merchant: merchant.trim(),
        category,
        date: new Date().toISOString(),
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.amountWrap}>
          <ThemedText themeColor="textSecondary" style={styles.amountLabel}>
            Amount
          </ThemedText>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.currencySymbol, { color: theme.textTertiary }]}>₹</ThemedText>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              placeholder="0"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        <TextField
          label="Paid to"
          icon="storefront-outline"
          placeholder="e.g. Swiggy, Local Cafe, Landlord"
          value={merchant}
          onChangeText={setMerchant}
        />

        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Category
          </ThemedText>
          <CategoryPicker value={category} onChange={setCategory} />
        </View>

        <TextField label="Note (optional)" icon="create-outline" placeholder="Add a note" value={note} onChangeText={setNote} />

        {error ? (
          <ThemedText themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Button title="Save expense" onPress={onSubmit} disabled={!canSubmit} loading={isSubmitting} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 22, paddingBottom: 40 },
  amountWrap: { alignItems: 'center', gap: 4, marginVertical: 12 },
  amountLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 32, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  error: { fontSize: 14 },
});
