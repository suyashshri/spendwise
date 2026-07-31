import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ShareIntentPreview } from '@/components/ShareIntentPreview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { extractApiErrorMessage } from '@/services/api';
import { parseSharedImage, parseSharedText, type ParseResponse } from '@/services/shareIntent';
import { useTransactionStore } from '@/store/transactionStore';

type Status = 'parsing' | 'ready' | 'error' | 'empty';

export default function ShareIntentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);

  const [status, setStatus] = useState<Status>('parsing');
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const hasStartedParse = useRef(false);

  useEffect(() => {
    if (hasStartedParse.current) return;

    const text = shareIntent.text?.trim();
    const file = shareIntent.files?.[0];

    if (!text && !file) {
      setStatus('empty');
      return;
    }

    hasStartedParse.current = true;
    setStatus('parsing');

    const run = text
      ? parseSharedText(text)
      : parseSharedImage({ path: file!.path, mimeType: file!.mimeType, fileName: file!.fileName });

    run
      .then((data) => {
        setResult(data);
        setCategory(data.transaction.category);
        setNote(data.transaction.note ?? '');
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMessage(extractApiErrorMessage(err));
        setStatus('error');
      });
  }, [shareIntent]);

  const finish = () => {
    resetShareIntent();
    fetchTransactions();
    router.replace('/(tabs)');
  };

  const onConfirm = async () => {
    if (!result) return;
    const { transaction } = result;
    const categoryChanged = category !== transaction.category;
    const noteChanged = note !== (transaction.note ?? '');

    if (!categoryChanged && !noteChanged) {
      finish();
      return;
    }

    setIsSaving(true);
    try {
      await updateTransaction(transaction.id, {
        category: categoryChanged ? category : undefined,
        note: noteChanged ? note || undefined : undefined,
      });
      finish();
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const onAddManually = () => {
    resetShareIntent();
    router.replace('/transaction/new');
  };

  const onCancel = () => {
    resetShareIntent();
    router.replace('/(tabs)');
  };

  if (status === 'parsing') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          Reading your payment…
        </ThemedText>
      </ThemedView>
    );
  }

  if (status === 'empty') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary" style={styles.centeredText}>
          No shared content was found.
        </ThemedText>
        <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={onCancel}>
          <ThemedText style={styles.buttonText}>Go home</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (status === 'error') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="danger" style={styles.centeredText}>
          {errorMessage}
        </ThemedText>
        <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={onAddManually}>
          <ThemedText style={styles.buttonText}>Add expense manually</ThemedText>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onCancel}>
          <ThemedText themeColor="textSecondary">Cancel</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!result) return null;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <ShareIntentPreview
          transaction={result.transaction}
          duplicate={result.duplicate}
          category={category}
          note={note}
          onCategoryChange={setCategory}
          onNoteChange={setNote}
          onConfirm={onConfirm}
          isSaving={isSaving}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  centeredText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  content: { padding: 20, paddingBottom: 40 },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: { paddingVertical: 8 },
});
