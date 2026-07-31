import { StyleSheet, View } from 'react-native';
import { getCategoryMeta } from '@spendwise/shared';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/formatCurrency';

export interface CategoryBreakdown {
  category: string;
  amount: number;
}

/** Simple horizontal-bar category breakdown — no charting library dependency needed for the MVP. */
export function SpendingChart({ data }: { data: CategoryBreakdown[] }) {
  const theme = useTheme();
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const sorted = [...data].sort((a, b) => b.amount - a.amount);

  if (sorted.length === 0) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.empty}>
        No spending yet this month.
      </ThemedText>
    );
  }

  return (
    <View style={styles.container}>
      {sorted.map(({ category, amount }) => {
        const { icon, color } = getCategoryMeta(category);
        const width = (amount / maxAmount) * 100;
        return (
          <View key={category} style={styles.row}>
            <ThemedText style={styles.icon}>{icon}</ThemedText>
            <View style={styles.barArea}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.label} numberOfLines={1}>
                  {category}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.amount}>
                  {formatCurrency(amount)}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View style={[styles.fill, { width: `${width}%`, backgroundColor: color }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 18 },
  barArea: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', flexShrink: 1, marginRight: 8 },
  amount: { fontSize: 13 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
