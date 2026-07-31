import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

// expo-secure-store has no web implementation (its web shim is a literal empty object — see
// node_modules/expo-secure-store/src/ExpoSecureStore.web.ts), so calling it on web silently fails
// and previously left zustand's rehydration promise unresolved forever, hanging the app on a blank
// screen (hasHydrated never flips true). Native (iOS/Android — the real target for this app, since
// share-intent doesn't work on web anyway) keeps using SecureStore/Keychain as intended; web falls
// back to localStorage purely so the app is usable for local dev/preview in a browser.
const webStorage: StateStorage = {
  getItem: (name) => Promise.resolve(globalThis.localStorage?.getItem(name) ?? null),
  setItem: (name, value) => {
    globalThis.localStorage?.setItem(name, value);
    return Promise.resolve();
  },
  removeItem: (name) => {
    globalThis.localStorage?.removeItem(name);
    return Promise.resolve();
  },
};

const nativeStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};

export const secureStorage: StateStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
