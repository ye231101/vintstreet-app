import { useAuth } from '@/hooks/use-auth';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-lg items-center">
              {/* Success Icon */}
              <View className="mb-6">
                <Feather name="check-circle" size={80} color="#4CAF50" />
              </View>

              {/* Success Title */}
              <Text className="text-2xl font-poppins-bold text-center mb-4">Password Reset Email Sent</Text>

              {/* Success Message */}
              <Text className="text-base font-poppins text-center text-gray-600 leading-6 mb-2">
                We've sent a password reset link to:
              </Text>

              <Text className="text-lg font-poppins-semibold text-center text-black mb-6">{email}</Text>

              <Text className="text-sm font-poppins text-center text-gray-600 leading-5 mb-8">
                Please check your inbox and spam folder. Click the link in the email to reset your password.
              </Text>

              {/* Return to Login Button */}
              <Pressable
                onPress={() => router.back()}
                className="h-12 rounded-lg bg-black items-center justify-center w-full"
              >
                <Text className="font-poppins text-white text-base">Return to Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Feather name="arrow-left" size={24} color="black" />
            </Pressable>
            <Text className="text-xl font-poppins-bold flex-1 ml-6">Forgot Password</Text>
          </View>

          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-lg items-center">
              {/* Logo */}
              <View className="items-center mb-8">
                <Image source={require('@/assets/images/splash-logo.png')} resizeMode="contain" className="w-40 h-40" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-poppins-bold text-center mb-4">Forgot your password?</Text>

              {/* Description */}
              <Text className="text-base font-poppins text-center text-gray-600 leading-6 mb-8">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>

              {/* Error message */}
              {error && (
                <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg mb-4 w-full">
                  <Text className="font-poppins text-red-700">{error}</Text>
                </View>
              )}

              {/* Email Input Field */}
              <View className="w-full mb-6">
                <View
                  className={`border rounded-lg flex-row items-center px-3 h-13 bg-white ${
                    emailError ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  <Text className="mr-2">
                    <Feather name="mail" size={24} color="black" />
                  </Text>
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 font-poppins text-base h-13"
                  />
                </View>
                {emailError && <Text className="text-red-400 text-xs mt-1 font-poppins">{emailError}</Text>}
              </View>

              {/* Reset Password Button */}
              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                className={`h-12 rounded-lg items-center justify-center w-full ${loading ? 'bg-gray-400' : 'bg-black'}`}
              >
                <Text className="font-poppins text-white text-base">{loading ? 'Sending...' : 'Reset Password'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
