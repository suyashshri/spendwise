import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';
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

  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: percent, duration: 600, useNativeDriver: false }).start();
  }, [percent, width]);

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
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '700', flexShrink: 1, marginRight: 8 },
  amounts: { fontSize: 13 },
  track: { height: 10, borderRadius: Radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radii.pill },
});
