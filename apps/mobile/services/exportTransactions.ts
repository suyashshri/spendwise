import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export type ExportFormat = 'csv' | 'pdf';

/**
 * Downloads straight to disk with an Authorization header (rather than fetch+base64 through JS)
 * so large exports don't have to round-trip through the JS thread as a string, then opens the
 * platform share sheet so the user can save it to Files/Drive/email it/etc.
 */
export async function exportTransactions(format: ExportFormat, filters: { category?: string } = {}): Promise<void> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) {
    throw new Error('You need to be signed in to export.');
  }

  const params = new URLSearchParams({ format });
  if (filters.category) {
    params.set('category', filters.category);
  }

  const destination = new File(Paths.cache, `spendwise-transactions-${Date.now()}.${format}`);

  await File.downloadFileAsync(`${API_URL}/transactions/export?${params.toString()}`, destination, {
    headers: { Authorization: `Bearer ${accessToken}` },
    idempotent: true,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    // No share sheet (e.g. some Android emulators) — the file is still on disk at destination.uri,
    // just nothing to hand it to. Nothing more to do here.
    return;
  }

  await Sharing.shareAsync(destination.uri, {
    mimeType: format === 'csv' ? 'text/csv' : 'application/pdf',
    UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
  });
}
