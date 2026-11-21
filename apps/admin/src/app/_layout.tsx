import { Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { ReadexPro_400Regular, ReadexPro_500Medium, ReadexPro_600SemiBold } from '@expo-google-fonts/readex-pro';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ComingSoonHost, ToastHost } from '@/components/ui';
import { queryClient } from '@/data/queries';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Native layout is forced right-to-left by the expo-localization plugin in app.json;
// the web build needs the direction on the page itself.
const webDirection = Platform.OS === 'web' ? ({ dir: 'rtl', lang: 'ar' } as object) : {};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.root} {...webDirection}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.sand } }} />
        <ComingSoonHost />
        <ToastHost />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
});
