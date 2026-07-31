import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { DEFAULT_CATEGORY_NAMES } from '@spendwise/shared';

import { CategoryPicker } from '@/components/CategoryPicker';
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Amount
          </ThemedText>
          <TextInput
            style={[styles.input, styles.amountInput, { borderColor: theme.border, color: theme.text }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Paid to
          </ThemedText>
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="e.g. Swiggy, Local Cafe, Landlord"
            placeholderTextColor={theme.textSecondary}
            value={merchant}
            onChangeText={setMerchant}
          />
        </View>

        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Category
          </ThemedText>
          <CategoryPicker value={category} onChange={setCategory} />
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
            onChangeText={setNote}
          />
        </View>

        {error ? (
          <ThemedText themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }, !canSubmit && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Save expense</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  amountInput: { fontSize: 28, fontWeight: '700' },
  error: { fontSize: 14 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
