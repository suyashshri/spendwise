import { StyleSheet, View } from 'react-native';
import type { Transaction } from '@spendwise/shared';

import { AnimatedPressable } from './AnimatedPressable';
import { CategoryAvatar } from './CategoryAvatar';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';
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
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
    >
      <CategoryAvatar category={transaction.category} />

      <View style={styles.middle}>
        <ThemedText style={styles.merchant} numberOfLines={1}>
          {transaction.merchant}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText themeColor="textSecondary" style={styles.category} numberOfLines={1}>
            {transaction.category}
          </ThemedText>
          {transaction.needsReview ? (
            <View style={[styles.reviewTag, { backgroundColor: theme.warningMuted }]}>
              <ThemedText themeColor="warning" style={styles.reviewTagText}>
                Review
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        <ThemedText style={styles.amount}>{formatCurrency(transaction.amount)}</ThemedText>
        <ThemedText themeColor="textTertiary" style={styles.date}>
          {formatTransactionDate(transaction.date)}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  middle: { flex: 1, gap: 4 },
  merchant: { fontSize: 15, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { fontSize: 13, flexShrink: 1 },
  reviewTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.pill },
  reviewTagText: { fontSize: 11, fontWeight: '700' },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 15, fontWeight: '800' },
  date: { fontSize: 11 },
});
