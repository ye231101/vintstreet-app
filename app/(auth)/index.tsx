import { InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

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
