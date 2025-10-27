import { InputComponent } from '@/components/input';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 items-center justify-center p-6">
          <View className="gap-4 w-full max-w-lg">
            <View className="items-center">
              <Image source={require('@/assets/images/splash-icon.png')} resizeMode="contain" className="w-40 h-40" />
              <Text className="mt-4 text-2xl font-inter-bold text-center">Welcome to Vint Street</Text>
              <Text className="mt-2 text-base font-inter-semibold text-gray-500 text-center">Sign in to continue</Text>
            </View>

            {error && (
              <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg">
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
            />

            <View className="items-end">
              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="font-inter text-gray-800">Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              className={`items-center justify-center h-14 rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="text-base font-inter-bold text-white">
                {loading ? <ActivityIndicator size="small" color="white" /> : 'LOG IN'}
              </Text>
            </Pressable>

            <View className="flex-row justify-center">
              <Text className="font-inter text-gray-800">Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text className="font-inter-bold text-gray-800">Register</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
