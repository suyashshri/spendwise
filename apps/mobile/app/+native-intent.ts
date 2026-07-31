import { getShareExtensionKey } from 'expo-share-intent';

// Expo Router special file: intercepts the native deep link a share extension launches the app
// with, before normal routing runs, and sends it straight to the share-intent handler screen.
export function redirectSystemPath({ path }: { path: string; initial: string }) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/share-intent';
    }
    return path;
  } catch {
    return '/';
  }
}
