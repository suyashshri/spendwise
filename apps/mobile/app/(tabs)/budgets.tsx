import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { SpendingChart } from '@/components/SpendingChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>{monthLabel(month, year)} budget</ThemedText>
            <Pressable onPress={() => setIsEditing((v) => !v)}>
              <ThemedText themeColor="primary" style={styles.editLink}>
                {user?.monthlyBudget ? 'Edit' : 'Set budget'}
              </ThemedText>
            </Pressable>
          </View>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. 20000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={input}
                onChangeText={setInput}
              />
              <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={onSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveButtonText}>Save</ThemedText>}
              </Pressable>
            </View>
          ) : user?.monthlyBudget ? (
            <BudgetProgressBar label="Overall" spent={totalSpent} limit={user.monthlyBudget} alertAt={80} />
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
        </ThemedView>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Spending by category
          </ThemedText>
          <SpendingChart data={byCategory} />
        </View>

        <ThemedText themeColor="textSecondary" style={styles.footnote}>
          Per-category budgets with alerts are coming soon — for now, the chart above breaks down
          this month&apos;s spend by category.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  editLink: { fontSize: 14, fontWeight: '600' },
  editRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  saveButton: { borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  empty: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18 },
  footnote: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
