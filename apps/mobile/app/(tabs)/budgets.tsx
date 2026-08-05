import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BudgetPeriod } from '@spendwise/shared';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { BudgetProgressBar } from '@/components/BudgetProgressBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryDropdown } from '@/components/CategoryDropdown';
import { FadeInView } from '@/components/FadeInView';
import { SpendingChart } from '@/components/SpendingChart';
import { ThemedText } from '@/components/themed-text';
import { FloatingTabBarSpace, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useMonthlyTransactions } from '@/hooks/useTransactions';
import { extractApiErrorMessage } from '@/services/api';
import { confirmAction } from '@/utils/confirm';
import { monthLabel, currentMonthYear } from '@/utils/dateHelpers';

export default function BudgetsScreen() {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const { month, year } = currentMonthYear();
  const { totalSpent, byCategory } = useMonthlyTransactions();
  const { budgets, addBudget, deleteBudget } = useBudgets();

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
                <BudgetProgressBar
                  label="Overall"
                  spent={totalSpent}
                  limit={user.monthlyBudget}
                  alertAt={80}
                  currency={user.currency}
                />
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

        <FadeInView delay={80} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Category budgets
          </ThemedText>
          <CategoryBudgets budgets={budgets} onDelete={deleteBudget} onAdd={addBudget} currency={user?.currency} />
        </FadeInView>

        <FadeInView delay={160} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Spending by category
          </ThemedText>
          <Card>
            <SpendingChart data={byCategory} currency={user?.currency} />
          </Card>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryBudgets({
  budgets,
  onDelete: deleteBudget,
  onAdd,
  currency = 'INR',
}: {
  budgets: ReturnType<typeof useBudgets>['budgets'];
  onDelete: ReturnType<typeof useBudgets>['deleteBudget'];
  onAdd: ReturnType<typeof useBudgets>['addBudget'];
  currency?: string;
}) {
  const theme = useTheme();
  const { categories } = useCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState<string>(categories[0]?.name ?? 'Miscellaneous');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const availableCategories = categories
    .map((c) => c.name)
    .filter((c) => !budgets.some((b) => b.category === c && b.period === period));

  const onSubmit = async () => {
    const value = Number(limit);
    if (!(value > 0)) {
      setError('Enter an amount greater than 0');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onAdd({ category, limit: value, period, alertAt: 80 });
      setIsAdding(false);
      setLimit('');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onDeletePress = (id: string, label: string) => {
    confirmAction({
      title: 'Delete budget',
      message: `Remove the ${label} budget?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => deleteBudget(id),
    });
  };

  const closeForm = () => {
    setIsAdding(false);
    setError(null);
    setLimit('');
  };

  return (
    <Card style={{ gap: 4 }}>
      {budgets.length === 0 && !isAdding ? (
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          Set a budget for a specific category — like Food & Dining or Transport — to get alerts as
          you approach the limit.
        </ThemedText>
      ) : (
        budgets.map((b) => (
          <View key={b.id} style={styles.budgetRow}>
            <View style={{ flex: 1 }}>
              <BudgetProgressBar
                label={`${b.category} · ${b.period}`}
                spent={b.spent ?? 0}
                limit={b.limit}
                alertAt={b.alertAt}
                currency={currency}
              />
            </View>
            <AnimatedPressable onPress={() => onDeletePress(b.id, b.category)} scaleTo={0.9} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={16} color={theme.textTertiary} />
            </AnimatedPressable>
          </View>
        ))
      )}

      {isAdding ? (
        <View style={styles.addForm}>
          <View style={styles.addFormHeader}>
            <ThemedText style={styles.addFormTitle}>New category budget</ThemedText>
            <AnimatedPressable onPress={closeForm} scaleTo={0.9} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </AnimatedPressable>
          </View>

          <CategoryDropdown value={category} onChange={setCategory} />

          <View style={styles.periodRow}>
            {(['monthly', 'weekly'] as const).map((p) => (
              <AnimatedPressable
                key={p}
                onPress={() => setPeriod(p)}
                scaleTo={0.94}
                style={[
                  styles.periodChip,
                  { backgroundColor: period === p ? theme.primary : theme.background, borderColor: theme.border },
                ]}
              >
                <ThemedText style={styles.periodChipText} themeColor={period === p ? undefined : 'textSecondary'}>
                  {p === 'monthly' ? 'Monthly' : 'Weekly'}
                </ThemedText>
              </AnimatedPressable>
            ))}
          </View>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
            placeholder="Limit amount"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={limit}
            onChangeText={setLimit}
          />

          {error ? (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <Button title="Add budget" onPress={onSubmit} loading={isSaving} disabled={availableCategories.length === 0} />
        </View>
      ) : (
        <AnimatedPressable onPress={() => setIsAdding(true)} style={styles.addLink}>
          <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
          <ThemedText themeColor="primary" style={styles.editLink}>
            Add category budget
          </ThemedText>
        </AnimatedPressable>
      )}
    </Card>
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
  empty: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 13, marginTop: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 19 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteButton: { padding: 8, marginBottom: 12 },
  addForm: { gap: 12, marginTop: 8 },
  addFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addFormTitle: { fontSize: 15, fontWeight: '700' },
  closeButton: { padding: 4 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: { flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: Radii.md, paddingVertical: 10 },
  periodChipText: { fontSize: 13, fontWeight: '700' },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
});
