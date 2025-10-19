import { useAuth } from '@/hooks/use-auth';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
        className="p-6"
      >
        <View className="flex-1 items-center justify-center">
          <View className="w-full max-w-lg">
            <View className="items-center mb-10">
              <Image source={require('@/assets/images/splash-logo.png')} resizeMode="contain" className="w-40 h-40" />
              <Text className="text-2xl font-inter-bold mt-4 text-center">Welcome to Vint Street</Text>
              <Text className="text-base font-inter text-gray-500 mt-2 text-center">Sign in to continue</Text>
            </View>

            {error && (
              <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg mb-4">
                <Text className="font-inter text-red-700">{error}</Text>
              </View>
            )}

            <View className="w-full">
              <View className="border border-gray-300 rounded-lg flex-row items-center px-3 h-13">
                <Text className="mr-2">
                  <Feather name="mail" size={24} color="black" />
                </Text>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  className="flex-1 font-inter text-base h-14"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View className="w-full mt-4">
              <View className="border border-gray-300 rounded-lg flex-row items-center px-3 h-13">
                <Text className="mr-2">
                  <Feather name="lock" size={24} color="black" />
                </Text>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 font-inter text-base h-14"
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                />
                <Pressable onPress={() => setSecure((s) => !s)} hitSlop={8}>
                  <Text className="text-base font-inter">
                    {secure ? (
                      <Feather name="eye" size={24} color="black" />
                    ) : (
                      <Feather name="eye-off" size={24} color="black" />
                    )}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="items-end mt-4">
              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="font-inter text-gray-800">Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              className={`h-12 rounded-lg items-center justify-center mt-6 ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="font-inter text-white text-base">{loading ? '...' : 'Login'}</Text>
            </Pressable>

            <View className="flex-row justify-center mt-6">
              <Text className="font-inter">Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text className="font-inter text-gray-800 font-medium">Register</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
