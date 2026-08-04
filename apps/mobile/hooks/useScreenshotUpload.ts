import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { extractApiErrorMessage } from '@/services/api';
import { parseSharedImage } from '@/services/shareIntent';
import { useTransactionStore } from '@/store/transactionStore';

/**
 * In-app alternative to the OS share-intent flow: lets a user pick a UPI payment screenshot
 * straight from their photo library instead of sharing it in from another app. Both paths hit the
 * same POST /api/parse/image endpoint (services/shareIntent.ts) — see specifications/09-mobile-app.md.
 */
export function useScreenshotUpload() {
  const router = useRouter();
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const [isUploading, setIsUploading] = useState(false);

  const uploadScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a payment screenshot.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setIsUploading(true);
    try {
      const { transaction, duplicate } = await parseSharedImage({
        path: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? 'screenshot.jpg',
      });
      await fetchTransactions();
      if (duplicate) {
        Alert.alert('Already added', 'This payment was already added earlier.');
      }
      router.push(`/transaction/${transaction.id}`);
    } catch (err) {
      Alert.alert('Could not read screenshot', extractApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadScreenshot, isUploading };
}
