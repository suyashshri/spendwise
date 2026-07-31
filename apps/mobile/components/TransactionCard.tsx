import { Pressable, StyleSheet, View } from 'react-native';
import type { Transaction } from '@spendwise/shared';

import { ThemedText } from './themed-text';
import { CategoryPill } from './CategoryPill';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatTransactionDate } from '@/utils/dateHelpers';

export function TransactionCard({
  transaction,
  onPress,
}: {
  transaction: Transaction;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
    >
      <View style={styles.left}>
        <ThemedText style={styles.merchant} numberOfLines={1}>
          {transaction.merchant}
        </ThemedText>
        <View style={styles.metaRow}>
          <CategoryPill category={transaction.category} />
          {transaction.needsReview ? (
            <ThemedText themeColor="warning" style={styles.reviewTag}>
              Needs review
            </ThemedText>
          ) : null}
        </View>
        <ThemedText themeColor="textSecondary" style={styles.date}>
          {formatTransactionDate(transaction.date)}
        </ThemedText>
      </View>
      <ThemedText style={styles.amount}>{formatCurrency(transaction.amount)}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  left: { flex: 1, gap: 6, marginRight: 12 },
  merchant: { fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewTag: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12 },
  amount: { fontSize: 16, fontWeight: '700' },
});
