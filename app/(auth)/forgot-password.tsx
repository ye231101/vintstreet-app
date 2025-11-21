import { InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
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
          <View className="w-full max-w-lg flex-1 items-center justify-center gap-4 p-6 mx-auto">
            <View className="w-full items-center">
              <Feather name="check-circle" size={80} color="#4CAF50" />
            </View>

            <Text className="w-full text-2xl font-inter-bold text-center">Password Reset Email Sent</Text>

            <Text className="w-full text-base font-inter-semibold text-center text-gray-500">
              We've sent a password reset link to:
            </Text>

            <Text className="w-full mt-2 text-xl font-inter-bold text-center text-black">{email}</Text>

            <Text className="w-full mt-2 text-sm font-inter-semibold text-center text-gray-500">
              Please check your inbox and spam folder. Click the link in the email to reset your password.
            </Text>

            <Pressable
              onPress={() => router.push('/(auth)')}
              className="w-full h-14 items-center justify-center rounded-lg bg-black"
            >
              <Text className="text-base font-inter-bold text-white">Return to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-6 p-6">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-inter-bold">Forgot Password</Text>
      </View>

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
              <Text className="text-2xl font-inter-bold text-black text-center">Forgot your password?</Text>
              <Text className="text-base font-inter-semibold text-gray-500  text-center">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            {error && (
              <View className="w-full p-2.5 rounded-lg bg-red-50 border border-red-300">
                <Text className="font-inter-semibold text-red-700">{error}</Text>
              </View>
            )}

            <InputComponent
              value={email}
              icon="mail"
              placeholder="Enter your email"
              onChangeText={(text) => handleEmailChange(text)}
              keyboardType="email-address"
              error={emailError}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />

            <Pressable
              onPress={handleResetPassword}
              disabled={loading}
              className={`w-full h-14 items-center justify-center rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="text-base font-inter-bold text-white">
                {loading ? <ActivityIndicator size="small" color="white" /> : 'Reset Password'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
