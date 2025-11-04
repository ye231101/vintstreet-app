import { authService } from '@/api';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const password = params.password as string; // We'll pass this from registration

  const [resendLoading, setResendLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Poll for email confirmation status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let attemptCount = 0;
    const MAX_ATTEMPTS = 200; // Poll for ~10 minutes (200 * 3 seconds)

    const checkEmailConfirmation = async () => {
      if (isConfirmed) {
        clearInterval(interval);
        return;
      }

      try {
        setCheckingStatus(true);
        attemptCount++;

        // First, try to get existing session
        const { session: existingSession } = await authService.getSession();

        if (existingSession) {
          // Session exists! User is confirmed
          clearInterval(interval);
          setIsConfirmed(true);

          // Auto redirect after 1 second
          setTimeout(() => router.replace('/(tabs)'), 1000);
          return;
        }

        // If no session, try to sign in (this will work if email is confirmed)
        if (password) {
          const { session: newSession, error } = await authService.signIn({
            email,
            password,
          });

          if (newSession && !error) {
            // Sign in successful! Email must be confirmed
            clearInterval(interval);
            setIsConfirmed(true);

            // Auto redirect after 1 second
            setTimeout(() => router.replace('/(tabs)'), 1000);
            return;
          }
        }

        // Stop polling after max attempts
        if (attemptCount >= MAX_ATTEMPTS) {
          clearInterval(interval);
          setCheckingStatus(false);
        }
      } catch (error) {
        console.log('Error checking email confirmation:', error);
      } finally {
        if (attemptCount < MAX_ATTEMPTS) {
          setCheckingStatus(attemptCount % 2 === 0); // Blink the indicator
        }
      }
    };

    // Check immediately
    checkEmailConfirmation();

    // Then check every 3 seconds
    interval = setInterval(checkEmailConfirmation, 3000);

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router, email, password, isConfirmed]);

  const handleResendEmail = async () => {
    setResendLoading(true);

    try {
      const { success, error } = await authService.resendEmail(email, 'signup');

      if (error || !success) {
        Alert.alert('Error', error || 'Failed to resend confirmation email');
        return;
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-6 p-6">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-inter-bold">Check Your Email</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="w-full max-w-lg flex-1 items-center justify-center gap-4 p-6 mx-auto">
          <View className="w-full items-center">
            <Image source={require('@/assets/images/splash-logo.png')} resizeMode="contain" className="w-40 h-40" />
            <Text className="mt-4 text-2xl font-inter-bold text-center">Verify Your Email</Text>
            <Text className="mt-2 text-base font-inter-semibold text-gray-500 text-center">
              We've sent a confirmation link to
            </Text>
          </View>

          <Text className="w-full mt-2 text-xl font-inter-bold text-center text-black">{email}</Text>

          <View className="w-full p-5 rounded-lg bg-gray-100">
            <Text className="text-sm font-inter-bold text-center text-gray-800 leading-5">
              Click the link in the email to confirm your account and get started.
            </Text>
          </View>

          {!isConfirmed && (
            <View
              className={`w-full flex-row items-center justify-center gap-2 p-3 rounded-lg ${
                checkingStatus ? 'bg-blue-50' : 'bg-gray-100'
              }`}
            >
              <Feather name="refresh-cw" size={16} color={checkingStatus ? '#1976d2' : '#999'} />
              <Text className={`text-sm font-inter-semibold ${checkingStatus ? 'text-blue-600' : 'text-gray-500'}`}>
                Waiting for email confirmation...
              </Text>
            </View>
          )}

          {isConfirmed && (
            <View className="w-full flex-row items-center justify-center gap-2 p-3 rounded-lg bg-green-50">
              <Feather name="check-circle" size={16} color="#4CAF50" />
              <Text className="text-sm font-inter-bold text-green-600">Email confirmed! Redirecting...</Text>
            </View>
          )}

          <View className="w-full gap-2">
            <View className="w-full flex-row items-start gap-2">
              <Feather name="info" size={18} color="#666" />
              <Text className="flex-1 text-sm font-inter-semibold text-gray-600 leading-5">
                Check your spam or junk folder if you don't see the email
              </Text>
            </View>

            <View className="w-full flex-row items-start gap-2">
              <Feather name="info" size={18} color="#666" />
              <Text className="flex-1 text-sm font-inter-semibold text-gray-600 leading-5">
                The confirmation link will expire in 24 hours
              </Text>
            </View>

            <View className="w-full flex-row items-start gap-2">
              <Feather name="info" size={18} color="#666" />
              <Text className="flex-1 text-sm font-inter-semibold text-gray-600 leading-5">
                After clicking the link, return to this screen and you'll be automatically signed in
              </Text>
            </View>
          </View>

          <View className="w-full gap-2 p-4 rounded-lg bg-orange-50 border-l-4 border-orange-500">
            <Text className="text-sm font-inter-semibold text-orange-800">📱 Mobile Users:</Text>
            <Text className="text-xs font-inter-semibold text-orange-800 leading-4">
              Click the link in your email, then come back to this app. We'll automatically detect your confirmation and
              sign you in!
            </Text>
          </View>

          <Pressable
            onPress={handleResendEmail}
            disabled={resendLoading}
            className={`w-full h-14 items-center justify-center rounded-lg ${
              resendLoading ? 'bg-gray-400' : 'bg-black'
            }`}
          >
            <Text className="text-base font-inter-bold text-white">
              {resendLoading ? <ActivityIndicator size="small" color="white" /> : 'Resend Confirmation Email'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
