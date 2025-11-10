import { DropdownComponent, InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormData {
  email: string;
  fullName: string;
  username: string;
  accountType: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
  username?: string;
  accountType?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    username: '',
    accountType: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);

  const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Buyer - I want to shop', value: 'buyer' },
    { label: 'Seller - I want to sell', value: 'seller' },
    { label: 'Both - Buy and sell', value: 'both' },
  ];

  const validateUsername = (username: string): string | undefined => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.includes(' ')) return 'Username cannot contain spaces';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== formData.password) return 'Passwords do not match';
    return undefined;
  };

  const validateRequired = (value: string, fieldName: string): string | undefined => {
    if (!value) return `${fieldName} is required`;
    return undefined;
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    newErrors.email = validateEmail(formData.email);
    newErrors.fullName = validateRequired(formData.fullName, 'Full Name');
    newErrors.username = validateUsername(formData.username);
    newErrors.accountType = validateRequired(formData.accountType, 'Account Type');
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword);

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async () => {
    if (await validateForm()) {
      const result = await register(
        formData.email,
        formData.fullName,
        formData.username,
        formData.accountType,
        formData.password
      );

      if (result?.requiresVerification) {
        router.replace({
          pathname: '/(auth)/check-email',
          params: {
            email: formData.email,
            password: formData.password,
          },
        });
      } else if (error) {
        Alert.alert('Registration Failed', error);
      }
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-6 p-6">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-inter-bold">Create Account</Text>
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
              <Text className="text-2xl font-inter-bold text-black text-center">Welcome to Vint Street</Text>
              <Text className="text-base font-inter-semibold text-gray-500  text-center">
                Create an account to continue
              </Text>
            </View>

            {error && (
              <View className="w-full p-2.5 rounded-lg bg-red-50 border border-red-300">
                <Text className="font-inter-semibold text-red-700">{error}</Text>
              </View>
            )}

            <InputComponent
              value={formData.email}
              icon="mail"
              placeholder="Enter your email"
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              error={errors.email}
            />

            <InputComponent
              value={formData.fullName}
              icon="user"
              placeholder="Enter your full name"
              onChangeText={(text) => updateFormData('fullName', text)}
              error={errors.fullName}
            />

            <InputComponent
              value={formData.username}
              icon="user"
              placeholder="Choose a username"
              onChangeText={(text) => updateFormData('username', text)}
              error={errors.username}
            />

            <DropdownComponent
              data={ACCOUNT_TYPE_OPTIONS}
              value={formData.accountType}
              icon="users"
              placeholder="Choose your account type"
              onChange={(item) => updateFormData('accountType', item.value)}
              error={errors.accountType}
            />

            <InputComponent
              value={formData.password}
              icon="lock"
              placeholder="Create a password (min 6 characters)"
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry={obscurePassword}
              showPasswordToggle={true}
              onTogglePassword={() => setObscurePassword(!obscurePassword)}
              error={errors.password}
            />

            <InputComponent
              value={formData.confirmPassword}
              icon="lock"
              placeholder="Confirm your password"
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry={obscureConfirmPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setObscureConfirmPassword(!obscureConfirmPassword)}
              error={errors.confirmPassword}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`w-full h-14 items-center justify-center rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="text-base font-inter-bold text-white">
                {loading ? <ActivityIndicator size="small" color="white" /> : 'Create Account'}
              </Text>
            </Pressable>

            <View className="w-full flex-row items-center justify-center">
              <Text className="font-inter text-gray-800">Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)')}>
                <Text className="font-inter-bold text-gray-800">Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
