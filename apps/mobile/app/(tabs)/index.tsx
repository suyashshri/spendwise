import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FadeInView } from '@/components/FadeInView';
import { SpendingChart } from '@/components/SpendingChart';
import { ThemedText } from '@/components/themed-text';
import { TransactionCard } from '@/components/TransactionCard';
import { Elevation, FloatingTabBarSpace, Gradients, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyTransactions } from '@/hooks/useTransactions';
import { monthLabel, currentMonthYear } from '@/utils/dateHelpers';
import { formatCurrency } from '@/utils/formatCurrency';

export default function HomeScreen() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const router = useRouter();
  const { user } = useAuth();
  const { month, year } = currentMonthYear();
  const { transactions, totalSpent, byCategory, isLoading, refetch } = useMonthlyTransactions();

  const recent = transactions.slice(0, 5);
  const budget = user?.monthlyBudget;
  const budgetPercent = budget ? Math.min((totalSpent / budget) * 100, 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <ThemedText themeColor="textSecondary" style={styles.greeting}>
          {user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Hi there 👋'}
        </ThemedText>

        <FadeInView>
          <LinearGradient
            colors={Gradients[scheme].hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, Elevation.raised, { shadowColor: Gradients[scheme].hero[1] }]}
          >
            <ThemedText style={styles.heroLabel}>{monthLabel(month, year)} spending</ThemedText>
            <ThemedText style={styles.heroAmount}>{formatCurrency(totalSpent, user?.currency)}</ThemedText>

            {budget ? (
              <View style={styles.heroBudget}>
                <View style={styles.heroTrack}>
                  <View style={[styles.heroFill, { width: `${budgetPercent}%` }]} />
                </View>
                <ThemedText style={styles.heroBudgetText}>
                  of {formatCurrency(budget, user?.currency)} budget
                </ThemedText>
              </View>
            ) : null}
          </LinearGradient>
        </FadeInView>

        <FadeInView delay={80}>
          <Button title="+ Add expense" onPress={() => router.push('/transaction/new')} variant="secondary" />
        </FadeInView>

        <FadeInView delay={140} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Where it went
          </ThemedText>
          <Card>
            <SpendingChart data={byCategory} />
          </Card>
        </FadeInView>

        <FadeInView delay={200} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent transactions
          </ThemedText>
          {recent.length === 0 ? (
            <Card>
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Share a UPI payment confirmation to SpendWise, or add an expense manually, to get
                started.
              </ThemedText>
            </Card>
          ) : (
            recent.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                onPress={() => router.push(`/transaction/${t.id}`)}
              />
            ))
          )}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: FloatingTabBarSpace, gap: 20 },
  greeting: { fontSize: 15, fontWeight: '600' },
  hero: { borderRadius: Radii.xl, padding: 24, gap: 6 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  heroAmount: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: '#fff' },
  heroBudget: { marginTop: 10, gap: 6 },
  heroTrack: { height: 6, borderRadius: Radii.pill, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: Radii.pill, backgroundColor: '#fff' },
  heroBudgetText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 19, lineHeight: 24 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
