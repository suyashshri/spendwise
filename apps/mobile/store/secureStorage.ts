import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

// Zustand persist adapter backed by SecureStore (iOS Keychain / Android Keystore) rather than
// AsyncStorage, since this store holds JWTs — see specifications/04-auth-flow.md.
export const secureStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};
