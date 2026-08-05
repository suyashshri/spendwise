import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export type ExportFormat = 'csv' | 'pdf';

/**
 * Downloads straight to disk with an Authorization header (rather than fetch+base64 through JS)
 * so large exports don't have to round-trip through the JS thread as a string, then opens the
 * platform share sheet so the user can save it to Files/Drive/email it/etc.
 *
 * Uses the `expo-file-system/legacy` subpath (SDK 54) rather than the newer `File`/`Paths` class
 * API — that API's `downloadFileAsync` doesn't exist at this SDK version. Unlike that newer API,
 * `downloadAsync` here resolves even on a non-2xx response instead of rejecting, so the status
 * check below is what actually catches a failed export.
 */
export async function exportTransactions(format: ExportFormat, filters: { category?: string } = {}): Promise<void> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) {
    throw new Error('You need to be signed in to export.');
  }
  if (!FileSystem.cacheDirectory) {
    throw new Error('No writable cache directory available on this device.');
  }

  const params = new URLSearchParams({ format });
  if (filters.category) {
    params.set('category', filters.category);
  }

  const fileUri = `${FileSystem.cacheDirectory}spendwise-transactions-${Date.now()}.${format}`;

  const result = await FileSystem.downloadAsync(`${API_URL}/transactions/export?${params.toString()}`, fileUri, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Export failed (status ${result.status}).`);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    // No share sheet (e.g. some Android emulators) — the file is still on disk at result.uri,
    // just nothing to hand it to. Nothing more to do here.
    return;
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: format === 'csv' ? 'text/csv' : 'application/pdf',
    UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
  });
}
