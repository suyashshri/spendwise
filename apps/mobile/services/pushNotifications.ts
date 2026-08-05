import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

async function getExpoPushToken(): Promise<string | null> {
  // Push tokens only exist on physical devices, and only once this app has a real EAS project —
  // see specifications/16-push-notifications.md for the `eas init` step this still needs.
  if (!Device.isDevice) return null;
  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push] no EAS projectId configured (app.json extra.eas.projectId) — skipping push registration');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

/** Called after login/register and on app mount when already authenticated. Never throws. */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await api.post('/auth/push-token', { token });
  } catch (error) {
    console.warn('[push] registration failed', error);
  }
}

/** Called on logout so this device stops receiving alerts for the account that just signed out. */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await api.delete('/auth/push-token', { data: { token } });
  } catch (error) {
    console.warn('[push] unregistration failed', error);
  }
}
