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
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider, useToast } from 'react-native-toast-notifications';
import '../global.css';

import { authService } from '@/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useNotifications } from '@/hooks/use-notifications';
import { ReduxProvider } from '@/providers/redux-provider';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { handleAuthStateChange, initializeAuth } from '@/store/slices/authSlice';
import { removeStorageValue, setStorageValue } from '@/utils/storage';
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

// Auth handler component that manages authentication logic
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  const appState = useRef(AppState.currentState);

  // Initialize push notifications only when authenticated
  // useNotifications(isAuthenticated);

  useEffect(() => {
    // Initialize authentication on app start
    dispatch(initializeAuth());

    // Listen to auth state changes (handles email confirmation links)
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);

      // Dispatch auth state change to Redux
      dispatch(handleAuthStateChange({ event, session }));

      if (event === 'SIGNED_IN' && session) {
        const { user: currentUser } = await authService.getCurrentUser();
        if (currentUser) {
          await setStorageValue('TOKEN', session.access_token);
          await setStorageValue('USER_DATA', JSON.stringify(currentUser));

          // Auto-redirect to main app after email confirmation
          router.replace('/(tabs)');
        }
      } else if (event === 'SIGNED_OUT') {
        await removeStorageValue('TOKEN');
        await removeStorageValue('USER_DATA');
        router.replace('/(auth)');
      } else if (event === 'USER_UPDATED' && session) {
        // Handle email confirmation
        const { user: currentUser } = await authService.getCurrentUser();
        if (currentUser) {
          await setStorageValue('TOKEN', session.access_token);
          await setStorageValue('USER_DATA', JSON.stringify(currentUser));
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  // Refresh session when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app transitions from background/inactive to active (foreground)
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Only refresh if user is authenticated
        if (isAuthenticated) {
          // Re-initialize auth to check session validity
          dispatch(initializeAuth());
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [dispatch, isAuthenticated]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)');
      }
    }
  }, [isAuthenticated, isInitialized]);

  return <>{children}</>;
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
      console.warn('❌ Font loading error:', fontError);
      SplashScreen.hideAsync();
    }
  }, [fontError]);

  // Hide splash *only* when fonts are ready
  useEffect(() => {
    if (fontsLoaded) {
      (async () => {
        await SplashScreen.hideAsync();
        console.log('✅ Fonts loaded and splash hidden');
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
              <AuthWrapper>
                <Stack>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
              </AuthWrapper>
              <StatusBar style="auto" />
            </ThemeProvider>
          </ToastProvider>
        </StripeProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
