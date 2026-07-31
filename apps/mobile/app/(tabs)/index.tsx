import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpendingChart } from '@/components/SpendingChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionCard } from '@/components/TransactionCard';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyTransactions } from '@/hooks/useTransactions';
import { monthLabel, currentMonthYear } from '@/utils/dateHelpers';
import { formatCurrency } from '@/utils/formatCurrency';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { month, year } = currentMonthYear();
  const { transactions, totalSpent, byCategory, isLoading, refetch } = useMonthlyTransactions();

  const recent = transactions.slice(0, 5);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <ThemedText themeColor="textSecondary" style={styles.greeting}>
          {user ? `Hi, ${user.name.split(' ')[0]}` : 'Hi there'}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.summaryCard}>
          <ThemedText themeColor="textSecondary" style={styles.summaryLabel}>
            {monthLabel(month, year)} spending
          </ThemedText>
          <ThemedText type="title" style={styles.summaryAmount}>
            {formatCurrency(totalSpent, user?.currency)}
          </ThemedText>
          {user?.monthlyBudget ? (
            <ThemedText themeColor="textSecondary" style={styles.budgetHint}>
              of {formatCurrency(user.monthlyBudget, user.currency)} monthly budget
            </ThemedText>
          ) : null}
        </ThemedView>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Where it went
          </ThemedText>
          <SpendingChart data={byCategory} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent transactions
            </ThemedText>
          </View>
          {recent.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Share a UPI payment confirmation to SpendWise, or add an expense manually, to get
              started.
            </ThemedText>
          ) : (
            recent.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                onPress={() => router.push(`/transaction/${t.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  greeting: { fontSize: 15 },
  summaryCard: { borderRadius: 20, padding: 20, gap: 4 },
  summaryLabel: { fontSize: 14 },
  summaryAmount: { fontSize: 36, lineHeight: 42 },
  budgetHint: { fontSize: 13 },
  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, lineHeight: 26 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
