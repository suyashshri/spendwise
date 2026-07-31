import type { Transaction } from '@spendwise/shared';
import { api } from './api';

export interface ParseResponse {
  transaction: Transaction;
  duplicate: boolean;
}

export async function parseSharedText(text: string): Promise<ParseResponse> {
  const { data } = await api.post<ParseResponse>('/parse/text', { text });
  return data;
}

export async function parseSharedImage(file: {
  path: string;
  mimeType: string;
  fileName: string;
}): Promise<ParseResponse> {
  const formData = new FormData();
  // React Native's FormData accepts this {uri, type, name} shape in place of a Blob.
  formData.append(
    'screenshot',
    { uri: file.path, type: file.mimeType, name: file.fileName } as unknown as Blob
  );

  const { data } = await api.post<ParseResponse>('/parse/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
