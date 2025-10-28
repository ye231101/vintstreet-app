import InputComponent from '@/components/common/input';
import { useAuth } from '@/hooks/use-auth';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return undefined;
  };

  const handleResetPassword = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setEmailError(undefined);
    await resetPassword(email);

    if (!error) {
      setIsSuccess(true);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError(undefined);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 items-center justify-center p-6">
            <View className="gap-4 w-full max-w-lg">
              <View className="items-center">
                <Feather name="check-circle" size={80} color="#4CAF50" />
              </View>

              <Text className="text-2xl font-inter-bold text-center">Password Reset Email Sent</Text>

              <Text className="text-base font-inter-semibold text-center text-gray-500">
                We've sent a password reset link to:
              </Text>

              <Text className="mt-2 text-xl font-inter-bold text-center text-black">{email}</Text>

              <Text className="mt-2 text-sm font-inter-semibold text-center text-gray-500">
                Please check your inbox and spam folder. Click the link in the email to reset your password.
              </Text>

              <Pressable onPress={() => router.back()} className="items-center justify-center h-14 rounded-lg bg-black">
                <Text className="font-inter-semibold text-white text-base">Return to Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-6">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-inter-bold flex-1 ml-6">Forgot Password</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 items-center justify-center p-6">
          <View className="gap-4 w-full max-w-lg">
            <View className="items-center">
              <Image source={require('@/assets/images/splash-icon.png')} resizeMode="contain" className="w-40 h-40" />
              <Text className="mt-4 text-2xl font-inter-bold text-center">Forgot your password?</Text>
              <Text className="mt-2 text-base font-inter-semibold text-gray-500  text-center">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            {error && (
              <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg">
                <Text className="font-inter-semibold text-red-700">{error}</Text>
              </View>
            )}

            <InputComponent
              value={email}
              icon="mail"
              placeholder="Enter your email"
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              error={emailError}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />

            <Pressable
              onPress={handleResetPassword}
              disabled={loading}
              className={`items-center justify-center h-14 rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="font-inter-semibold text-white text-base">
                {loading ? <ActivityIndicator size="small" color="white" /> : 'Reset Password'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
