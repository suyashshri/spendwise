import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/formatCurrency';

export function BudgetProgressBar({
  label,
  spent,
  limit,
  alertAt,
}: {
  label: string;
  spent: number;
  limit: number;
  alertAt: number;
}) {
  const theme = useTheme();
  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOverAlert = limit > 0 && (spent / limit) * 100 >= alertAt;
  const isOverLimit = spent > limit;

  const barColor = isOverLimit ? theme.danger : isOverAlert ? theme.warning : theme.success;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label} numberOfLines={1}>
          {label}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.amounts}>
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', flexShrink: 1, marginRight: 8 },
  amounts: { fontSize: 13 },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
