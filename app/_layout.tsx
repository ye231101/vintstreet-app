import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider, useToast } from 'react-native-toast-notifications';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useNotifications } from '@/hooks/use-notifications';
import { ReduxProvider } from '@/providers/redux-provider';
import { setToastRef, showErrorToast } from '@/utils/toast';

SplashScreen.preventAutoHideAsync();

// Toast initializer component - must be inside ToastProvider
function ToastInit() {
  const toast = useToast();
  useEffect(() => {
    setToastRef(toast);
  }, [toast]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    'inter-thin': Inter_100Thin,
    'inter-extralight': Inter_200ExtraLight,
    'inter-light': Inter_300Light,
    'inter-regular': Inter_400Regular,
    'inter-medium': Inter_500Medium,
    'inter-semibold': Inter_600SemiBold,
    'inter-bold': Inter_700Bold,
    'inter-extrabold': Inter_800ExtraBold,
    'inter-black': Inter_900Black,
  });

  // If fonts failed to load, at least hide splash
  useEffect(() => {
    if (fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontError]);

  // Hide splash *only* when fonts are ready
  useEffect(() => {
    if (fontsLoaded) {
      (async () => {
        await SplashScreen.hideAsync();
      })();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      showErrorToast('❌ Stripe publishable key is not set');
    }
  }, []);

  if (!fontsLoaded) {
    // Show a loading screen or return null while fonts are loading
    return null;
  }

  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string}>
          <ToastProvider offsetTop={100}>
            <ToastInit />
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="product" options={{ headerShown: false }} />
                <Stack.Screen name="message" options={{ headerShown: false }} />
                <Stack.Screen name="seller-profile" options={{ headerShown: false }} />
                <Stack.Screen name="seller" options={{ headerShown: false }} />
                <Stack.Screen name="other" options={{ headerShown: false }} />
                <Stack.Screen name="cart" options={{ headerShown: false }} />
                <Stack.Screen name="checkout" options={{ headerShown: false }} />
                <Stack.Screen name="payment-success" options={{ headerShown: false }} />
                <Stack.Screen name="stream" options={{ headerShown: false }} />
                <Stack.Screen name="articles" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </ToastProvider>
        </StripeProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
