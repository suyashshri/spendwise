import { ScrollView, StyleSheet } from 'react-native';
import { SUPPORTED_CURRENCIES } from '@spendwise/shared';

import { AnimatedPressable } from './AnimatedPressable';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (currency: string) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {SUPPORTED_CURRENCIES.map((currency) => {
        const selected = currency.code === value;
        return (
          <AnimatedPressable
            key={currency.code}
            onPress={() => onChange(currency.code)}
            scaleTo={0.94}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.surfaceElevated,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText style={styles.symbol} themeColor={selected ? undefined : 'textSecondary'}>
              {currency.symbol}
            </ThemedText>
            <ThemedText
              style={[styles.label, selected && styles.labelSelected]}
              themeColor={selected ? undefined : 'textSecondary'}
            >
              {currency.code}
            </ThemedText>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  symbol: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700' },
  labelSelected: { color: '#fff' },
});
