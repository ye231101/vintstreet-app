import { authService } from '@/api';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
      const { success, error } = await authService.resendOTP(email, 'signup');

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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6"
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center mb-5 w-full pt-2.5">
            <Pressable onPress={() => router.replace('/(auth)')} hitSlop={8}>
              <Feather name="arrow-left" size={24} color="black" />
            </Pressable>
            <Text className="text-xl font-inter-bold flex-1 text-center mr-6">Check Your Email</Text>
          </View>

          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-lg items-center">
              {/* Logo */}
              <View className="items-center mb-8">
                <Image source={require('@/assets/images/splash-logo.png')} resizeMode="contain" className="w-40 h-40" />
              </View>

              {/* Success Icon */}
              <View className="w-25 h-25 rounded-full bg-green-50 items-center justify-center mb-8">
                <Feather name="mail" size={50} color="#4CAF50" />
              </View>

              {/* Title */}
              <Text className="text-3xl font-inter-bold text-center mb-4">Verify Your Email</Text>

              {/* Description */}
              <Text className="text-base font-inter text-center text-gray-600 leading-6 mb-2">
                We've sent a confirmation link to
              </Text>

              <Text className="text-lg font-inter-semibold text-center text-black mb-8">{email}</Text>

              {/* Instructions */}
              <View className="bg-gray-100 p-5 rounded-xl mb-6 w-full">
                <Text className="text-sm font-inter text-center text-gray-800 leading-5">
                  Click the link in the email to confirm your account and get started.
                </Text>
              </View>

              {/* Checking Status Indicator */}
              {!isConfirmed && (
                <View
                  className={`flex-row items-center justify-center mb-6 p-3 rounded-lg ${
                    checkingStatus ? 'bg-blue-50' : 'bg-gray-100'
                  }`}
                >
                  <Feather name="refresh-cw" size={16} color={checkingStatus ? '#1976d2' : '#999'} className="mr-2" />
                  <Text className={`text-sm font-inter ${checkingStatus ? 'text-blue-600' : 'text-gray-500'}`}>
                    Waiting for email confirmation...
                  </Text>
                </View>
              )}

              {/* Confirmed Status Indicator */}
              {isConfirmed && (
                <View className="flex-row items-center justify-center mb-6 p-3 bg-green-50 rounded-lg">
                  <Feather name="check-circle" size={16} color="#4CAF50" className="mr-2" />
                  <Text className="text-sm font-inter-semibold text-green-600">Email confirmed! Redirecting...</Text>
                </View>
              )}

              {/* Helpful Tips */}
              <View className="w-full mb-8">
                <View className="flex-row items-start mb-3">
                  <Feather name="info" size={18} color="#666" className="mr-3 mt-0.5" />
                  <Text className="flex-1 text-sm font-inter text-gray-600 leading-5">
                    Check your spam or junk folder if you don't see the email
                  </Text>
                </View>

                <View className="flex-row items-start mb-3">
                  <Feather name="info" size={18} color="#666" className="mr-3 mt-0.5" />
                  <Text className="flex-1 text-sm font-inter text-gray-600 leading-5">
                    The confirmation link will expire in 24 hours
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <Feather name="info" size={18} color="#666" className="mr-3 mt-0.5" />
                  <Text className="flex-1 text-sm font-inter text-gray-600 leading-5">
                    After clicking the link, return to this screen and you'll be automatically signed in
                  </Text>
                </View>
              </View>

              {/* Important Note for Mobile */}
              <View className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 mb-8 w-full">
                <Text className="text-sm font-inter-semibold text-orange-800 mb-2">📱 Mobile Users:</Text>
                <Text className="text-xs font-inter text-orange-800 leading-4">
                  Click the link in your email, then come back to this app. We'll automatically detect your confirmation
                  and sign you in!
                </Text>
              </View>

              {/* Resend Email Button */}
              <Pressable
                onPress={handleResendEmail}
                disabled={resendLoading}
                className={`h-12 rounded-lg items-center justify-center w-full mb-4 ${
                  resendLoading ? 'bg-gray-400' : 'bg-black'
                }`}
              >
                <Text className="font-inter text-white text-base">
                  {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
                </Text>
              </Pressable>

              {/* Return to Login */}
              <Pressable onPress={() => router.replace('/(auth)')}>
                <Text className="font-inter text-gray-600 text-sm">Return to Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
