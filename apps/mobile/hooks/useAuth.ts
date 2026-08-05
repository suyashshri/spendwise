import { useCallback } from 'react';
import type { User } from '@spendwise/shared';
import { api, extractApiErrorMessage } from '../services/api';
import { registerForPushNotifications, unregisterPushNotifications } from '../services/pushNotifications';
import { useAuthStore } from '../store/authStore';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

type AuthResult = { success: true } | { success: false; message: string };

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.logout);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        setSession(data);
        void registerForPushNotifications();
        return { success: true };
      } catch (error) {
        return { success: false, message: extractApiErrorMessage(error) };
      }
    },
    [setSession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      try {
        const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
        setSession(data);
        void registerForPushNotifications();
        return { success: true };
      } catch (error) {
        return { success: false, message: extractApiErrorMessage(error) };
      }
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    // Must run before clearSession — it needs the still-live access token to authenticate the
    // DELETE /auth/push-token call that removes this device from the account being signed out of.
    await unregisterPushNotifications();
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(
    async (updates: { name?: string; currency?: string; monthlyBudget?: number | null }): Promise<AuthResult> => {
      try {
        const { data } = await api.patch<{ user: User }>('/auth/me', updates);
        setUser(data.user);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractApiErrorMessage(error) };
      }
    },
    [setUser]
  );

  return {
    user,
    isAuthenticated: Boolean(accessToken && user),
    hasHydrated,
    login,
    register,
    logout,
    updateProfile,
  };
}
