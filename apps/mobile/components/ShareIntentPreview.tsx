import { StyleSheet, View } from 'react-native';
import type { Transaction } from '@spendwise/shared';

import { Button } from './Button';
import { Card } from './Card';
import { CategoryAvatar } from './CategoryAvatar';
import { CategoryPicker } from './CategoryPicker';
import { TextField } from './TextField';
import { ThemedText } from './themed-text';
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
        <Card elevated={false} style={[styles.banner, { backgroundColor: theme.warningMuted }]}>
          <ThemedText themeColor="warning" style={styles.bannerText}>
            You already added this payment — showing the existing entry.
          </ThemedText>
        </Card>
      ) : transaction.needsReview ? (
        <Card elevated={false} style={[styles.banner, { backgroundColor: theme.primaryMuted }]}>
          <ThemedText themeColor="primary" style={styles.bannerText}>
            Not fully sure about the category — please confirm it below.
          </ThemedText>
        </Card>
      ) : null}

      <View style={styles.header}>
        <CategoryAvatar category={category} size={56} />
        <ThemedText type="title" style={styles.amount}>
          {formatCurrency(transaction.amount, transaction.currency)}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{transaction.merchant}</ThemedText>
        <ThemedText themeColor="textTertiary" style={styles.date}>
          {formatTransactionDate(transaction.date)}
        </ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
          Category
        </ThemedText>
        <CategoryPicker value={category} onChange={onCategoryChange} />
      </View>

      <TextField label="Note (optional)" icon="create-outline" placeholder="Add a note" value={note} onChangeText={onNoteChange} />

      <Button title="Done" onPress={onConfirm} loading={isSaving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 22 },
  banner: { padding: 14 },
  bannerText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  header: { alignItems: 'center', gap: 6 },
  amount: { fontSize: 34, lineHeight: 40, marginTop: 8 },
  date: { fontSize: 13 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
});
