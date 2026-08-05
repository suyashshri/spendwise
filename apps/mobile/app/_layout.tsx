import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuth();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  // Covers the case where the app is already running in the foreground and receives a new
  // share (cold-launch is instead handled by app/+native-intent.ts before routing even starts).
  useEffect(() => {
    if (hasShareIntent && isAuthenticated) {
      router.replace('/share-intent');
    }
  }, [hasShareIntent, isAuthenticated, router]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="transaction/[id]" options={{ title: 'Transaction' }} />
            <Stack.Screen
              name="transaction/new"
              options={{ presentation: 'modal', title: 'Add expense' }}
            />
            <Stack.Screen
              name="share-intent"
              options={{ presentation: 'modal', title: 'Confirm expense' }}
            />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
        {/* Not style="auto": that follows the OS setting directly, which would ignore a manual
            light/dark override from the theme store. */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();

  return (
    <ShareIntentProvider
      options={{
        resetOnBackground: true,
        onResetShareIntent: () => router.replace('/'),
      }}
    >
      <AppNavigator />
    </ShareIntentProvider>
  );
}
