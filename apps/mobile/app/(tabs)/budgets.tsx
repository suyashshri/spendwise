import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { Card } from '@/components/Card';
import { FadeInView } from '@/components/FadeInView';
import { SpendingChart } from '@/components/SpendingChart';
import { ThemedText } from '@/components/themed-text';
import { FloatingTabBarSpace, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyTransactions } from '@/hooks/useTransactions';
import { monthLabel, currentMonthYear } from '@/utils/dateHelpers';

export default function BudgetsScreen() {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const { month, year } = currentMonthYear();
  const { totalSpent, byCategory } = useMonthlyTransactions();

  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState(user?.monthlyBudget ? String(user.monthlyBudget) : '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    const value = Number(input);
    if (!(value > 0)) {
      setError('Enter an amount greater than 0');
      return;
    }
    setError(null);
    setIsSaving(true);
    const result = await updateProfile({ monthlyBudget: value });
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Budgets</ThemedText>

        <FadeInView>
          <Card>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.iconBadge, { backgroundColor: theme.primaryMuted }]}>
                  <Ionicons name="wallet" size={16} color={theme.primary} />
                </View>
                <ThemedText style={styles.cardTitle}>{monthLabel(month, year)} budget</ThemedText>
              </View>
              <AnimatedPressable onPress={() => setIsEditing((v) => !v)} scaleTo={0.94}>
                <ThemedText themeColor="primary" style={styles.editLink}>
                  {user?.monthlyBudget ? 'Edit' : 'Set budget'}
                </ThemedText>
              </AnimatedPressable>
            </View>

            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                  placeholder="e.g. 20000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  value={input}
                  onChangeText={setInput}
                  autoFocus
                />
                <AnimatedPressable
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveButtonText}>Save</ThemedText>}
                </AnimatedPressable>
              </View>
            ) : user?.monthlyBudget ? (
              <View style={styles.progressWrap}>
                <BudgetProgressBar label="Overall" spent={totalSpent} limit={user.monthlyBudget} alertAt={80} />
              </View>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Set a monthly budget to track how much of it you&apos;ve used.
              </ThemedText>
            )}

            {error ? (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}
          </Card>
        </FadeInView>

        <FadeInView delay={100} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Spending by category
          </ThemedText>
          <Card>
            <SpendingChart data={byCategory} />
          </Card>
        </FadeInView>

        <ThemedText themeColor="textTertiary" style={styles.footnote}>
          Per-category budgets with alerts are coming soon — for now, the chart above breaks down
          this month&apos;s spend by category.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20, paddingBottom: FloatingTabBarSpace },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  editLink: { fontSize: 14, fontWeight: '700' },
  editRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  saveButton: { borderRadius: Radii.md, paddingHorizontal: 18, justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  progressWrap: { marginTop: 16 },
  empty: { fontSize: 14, lineHeight: 20, marginTop: 12 },
  error: { fontSize: 13, marginTop: 8 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 19 },
  footnote: { fontSize: 13, lineHeight: 18, textAlign: 'center', paddingHorizontal: 12 },
});
