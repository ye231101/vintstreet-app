import { authService } from '@/api/services';
import { InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { useAppDispatch } from '@/store/hooks';
import { handleAuthStateChange } from '@/store/slices/authSlice';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { removeSecureValue, setSecureValue } from '@/utils/secure-storage';
import { removeStorageValue, setStorageValue } from '@/utils/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const appState = useRef(AppState.currentState);
  const dispatch = useAppDispatch();
  const { login, loading, error, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  // Listen to auth state changes (handles email confirmation links)
  useEffect(() => {
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      logger.info('Auth event:', event, 'Session:', !!session);

      // Dispatch auth state change to Redux
      dispatch(handleAuthStateChange({ event, session }));

      if (event === 'SIGNED_IN' && session) {
        const { user: currentUser } = await authService.getCurrentUser();
        if (currentUser) {
          // Store token in secure storage (encrypted)
          await setSecureValue('TOKEN', session.access_token);
          // Store user data in regular storage (non-sensitive)
          await setStorageValue('USER_DATA', JSON.stringify(currentUser));
        }
      } else if (event === 'SIGNED_OUT') {
        // Remove token from secure storage
        await removeSecureValue('TOKEN');
        // Remove user data from regular storage
        await removeStorageValue('USER_DATA');
        router.replace('/(tabs)');
      } else if (event === 'USER_UPDATED' && session) {
        // Handle email confirmation
        const { user: currentUser } = await authService.getCurrentUser();
        if (currentUser) {
          // Store token in secure storage (encrypted)
          await setSecureValue('TOKEN', session.access_token);
          // Store user data in regular storage (non-sensitive)
          await setStorageValue('USER_DATA', JSON.stringify(currentUser));
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [dispatch, redirect, router]);

  // Refresh session when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app transitions from background/inactive to active (foreground)
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Check session validity by getting current user
        if (isAuthenticated) {
          const { user: currentUser } = await authService.getCurrentUser();
          if (!currentUser) {
            // Session expired, clear auth state
            // Remove token from secure storage
            await removeSecureValue('TOKEN');
            // Remove user data from regular storage
            await removeStorageValue('USER_DATA');
            dispatch(handleAuthStateChange({ event: 'SIGNED_OUT', session: null }));
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [dispatch, isAuthenticated]);

  // Redirect after successful login (fallback)
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const redirectPath = redirect || '/(tabs)';
      router.replace(redirectPath as unknown);
    }
  }, [isAuthenticated, loading, redirect, router]);

  const onSubmit = async () => {
    await login(email, password);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="w-full max-w-lg flex-1 items-center justify-center gap-4 p-6 mx-auto">
            <View className="w-full items-center gap-2">
              <Text className="text-2xl font-inter-bold text-black text-center">Welcome to Vint Street</Text>
              <Text className="text-base font-inter-semibold text-gray-500 text-center">Sign in to continue</Text>
            </View>

            {error && (
              <View className="w-full p-2.5 rounded-lg bg-red-50 border border-red-300">
                <Text className="font-inter text-red-700">{error}</Text>
              </View>
            )}

            <InputComponent
              value={email}
              icon="mail"
              placeholder="Enter your email"
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              returnKeyType="next"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <InputComponent
              value={password}
              icon="lock"
              placeholder="Enter your password"
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={secure}
              showPasswordToggle={true}
              onTogglePassword={() => setSecure((s) => !s)}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              textContentType="password"
              autoComplete="password"
            />

            <View className="w-full items-end">
              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="font-inter text-gray-800">Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              className={`w-full h-14 items-center justify-center rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="text-base font-inter-bold text-white">
                {loading ? <ActivityIndicator size="small" color="white" /> : 'LOG IN'}
              </Text>
            </Pressable>

            <View className="w-full flex-row items-center justify-center">
              <Text className="font-inter text-gray-800">Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text className="font-inter-bold text-gray-800">Register</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
