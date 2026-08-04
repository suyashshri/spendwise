import { Alert, Platform } from 'react-native';

/**
 * React Native Web doesn't render a usable dialog for Alert.alert's button list in most setups —
 * it either no-ops or silently drops the buttons, so a "Delete"/"Log out" confirmation that relies
 * on it appears completely broken on web (tap does nothing, no visible error). Falls back to the
 * browser's native window.confirm on web; uses the real Alert.alert on native, where it works fine.
 */
export function confirmAction(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  const { title, message, confirmLabel = 'OK', destructive = false, onConfirm } = options;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
