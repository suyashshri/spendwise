import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_CATEGORY_NAMES } from '@spendwise/shared';

import { ThemedText } from '@/components/themed-text';
import { TransactionCard } from '@/components/TransactionCard';
import { useTheme } from '@/hooks/use-theme';
import { useTransactionStore } from '@/store/transactionStore';

const ALL = 'All';

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = useMemo(
    () => (activeCategory === ALL ? transactions : transactions.filter((t) => t.category === activeCategory)),
    [transactions, activeCategory]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Transactions</ThemedText>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/transaction/new')}
        >
          <ThemedText style={styles.addButtonText}>+ Add</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {[ALL, ...DEFAULT_CATEGORY_NAMES].map((category) => {
          const selected = category === activeCategory;
          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? theme.primary : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText
                style={styles.filterChipText}
                themeColor={selected ? undefined : 'textSecondary'}
              >
                {category}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchTransactions()} />}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onPress={() => router.push(`/transaction/${item.id}`)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No transactions in this category yet.
            </ThemedText>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterRow: { alignItems: 'flex-start', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
