// iOS and Android: Supabase's Expo guide keeps the session in expo-sqlite's localStorage.
import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

export const authStorage = globalThis.localStorage;
