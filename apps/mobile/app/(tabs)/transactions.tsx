import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ExportSheet } from '@/components/ExportSheet';
import { ThemedText } from '@/components/themed-text';
import { TransactionCard } from '@/components/TransactionCard';
import { Elevation, FloatingTabBarSpace, Radii } from '@/constants/theme';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/use-theme';
import { useScreenshotUpload } from '@/hooks/useScreenshotUpload';
import { useTransactionStore } from '@/store/transactionStore';

const ALL = 'All';

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const { categories } = useCategories();
  const { uploadScreenshot, isUploading } = useScreenshotUpload();
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [exportOpen, setExportOpen] = useState(false);

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
        <View style={styles.headerActions}>
          <AnimatedPressable
            onPress={() => setExportOpen(true)}
            scaleTo={0.9}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          >
            <Ionicons name="download-outline" size={18} color={theme.text} />
          </AnimatedPressable>
          <AnimatedPressable
            onPress={uploadScreenshot}
            scaleTo={0.9}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="image-outline" size={18} color={theme.text} />
            )}
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.push('/transaction/new')}
            scaleTo={0.92}
            style={[styles.addButton, { backgroundColor: theme.primary, shadowColor: theme.primary }, Elevation.floating]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <ThemedText style={styles.addButtonText}>Add</ThemedText>
          </AnimatedPressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {[ALL, ...categories.map((c) => c.name)].map((category) => {
          const selected = category === activeCategory;
          return (
            <AnimatedPressable
              key={category}
              onPress={() => setActiveCategory(category)}
              scaleTo={0.94}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? theme.primary : theme.surfaceElevated,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                style={styles.filterChipText}
                themeColor={selected ? undefined : 'textSecondary'}
                type="default"
              >
                {category}
              </ThemedText>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        onRefresh={() => fetchTransactions()}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onPress={() => router.push(`/transaction/${item.id}`)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <ThemedText style={styles.emptyIcon}>🧾</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                No transactions in this category yet.
              </ThemedText>
            </View>
          ) : null
        }
      />

      <ExportSheet
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        category={activeCategory === ALL ? undefined : activeCategory}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterRow: { alignItems: 'flex-start', gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  filterChip: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radii.pill },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: FloatingTabBarSpace },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 32 },
  empty: { textAlign: 'center', fontSize: 14 },
});
