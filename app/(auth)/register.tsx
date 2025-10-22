import { useAuth } from '@/hooks/use-auth';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}

interface DropdownFieldProps {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  icon: string;
  error?: string;
  options: { label: string; value: string }[];
}

const InputField = memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    showPasswordToggle = false,
    onTogglePassword,
  }: InputFieldProps) => (
    <View className="mb-4">
      <View
        className={`border rounded-lg flex-row items-center px-3 h-14 bg-white ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <Text className="mr-2">
          <Feather name={icon as any} size={24} color="black" />
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          className="flex-1 font-inter text-base h-14"
        />
        {showPasswordToggle && (
          <Pressable onPress={onTogglePassword} hitSlop={8}>
            <Feather name={secureTextEntry ? 'eye' : 'eye-off'} size={24} color="black" />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 font-inter">{error}</Text>}
    </View>
  )
);

const DropdownField = memo(({ label, value, onSelect, placeholder, icon, error, options }: DropdownFieldProps) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <View style={{ position: 'relative' }}>
        <DropDownPicker
          open={open}
          value={value}
          items={options}
          setOpen={setOpen}
          listMode="SCROLLVIEW"
          setValue={(callback) => {
            const newValue = typeof callback === 'function' ? callback(value) : callback;
            onSelect(newValue);
          }}
          placeholder={placeholder}
          style={{
            backgroundColor: 'white',
            borderColor: error ? '#f87171' : '#d1d5db',
            borderWidth: 1,
            borderRadius: 8,
            height: 56,
            paddingLeft: 46,
          }}
          dropDownContainerStyle={{
            backgroundColor: 'white',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 8,
          }}
          textStyle={{
            fontSize: 14,
            fontFamily: 'Inter',
            color: '#000000',
          }}
          placeholderStyle={{
            fontSize: 14,
            fontFamily: 'Inter',
            color: '#6b7280',
          }}
          listItemLabelStyle={{
            fontSize: 14,
            fontFamily: 'Inter',
            color: '#000000',
          }}
          arrowIconStyle={{
            width: 20,
            height: 20,
          }}
          tickIconStyle={{
            width: 16,
            height: 16,
          }}
          searchable={false}
          zIndex={3000}
          zIndexInverse={1000}
        />
        <View pointerEvents="none" className="absolute" style={{ left: 12, top: 16, zIndex: 9999, elevation: 5 }}>
          <Feather name={icon as any} size={24} color={error ? '#f87171' : 'black'} />
        </View>
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 font-inter">{error}</Text>}
    </View>
  );
});

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

  const accountTypeOptions = [
    { label: 'Buyer - I want to shop', value: 'buyer' },
    { label: 'Seller - I want to sell', value: 'seller' },
    { label: 'Both - Buy and sell', value: 'both' },
  ];

  const [errors, setErrors] = useState<FormErrors>({});
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);

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

  const validateEmailUniqueness = async (email: string): Promise<string | undefined> => {
    if (!email) return 'Email is required';

    try {
      // Import authService dynamically to avoid circular dependencies
      const { authService } = await import('@/api/services/auth.service');
      const emailExists = await authService.checkEmailExists(email);

      if (emailExists) {
        return 'An account with this email already exists.';
      }

      return undefined;
    } catch (error) {
      // If there's an error checking email uniqueness, don't block the form
      // The server-side validation will catch it
      return undefined;
    }
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

    // Check email uniqueness if email is valid
    // if (!newErrors.email && formData.email) {
    //   const emailUniquenessError = await validateEmailUniqueness(formData.email);
    //   if (emailUniquenessError) {
    //     newErrors.email = emailUniquenessError;
    //   }
    // }

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

      // If registration requires email verification, navigate to check-email screen
      if (result?.requiresVerification) {
        router.replace({
          pathname: '/(auth)/check-email',
          params: {
            email: formData.email,
            password: formData.password, // Pass password so we can auto-login after confirmation
          },
        });
      } else if (error) {
        Alert.alert('Registration Failed', error);
      }
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView className="flex-1 flex-col gap-6 bg-white p-6">
      {/* Header */}
      <View className="w-full flex-row items-center">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-inter-bold flex-1 ml-6">Create Account</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <View className="w-full max-w-lg">
            {/* Logo */}
            <View className="items-center mb-10">
              <Image source={require('@/assets/images/splash-logo.png')} resizeMode="contain" className="w-40 h-40" />
            </View>

            {/* Error message */}
            {error && (
              <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg mb-4">
                <Text className="font-inter text-red-700">{error}</Text>
              </View>
            )}

            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="Enter your email"
              icon="mail"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <InputField
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => updateFormData('fullName', text)}
              placeholder="Enter your full name"
              icon="user"
              error={errors.fullName}
            />

            <InputField
              label="Username"
              value={formData.username}
              onChangeText={(text) => updateFormData('username', text)}
              placeholder="Choose a username"
              icon="user"
              error={errors.username}
              autoCapitalize="none"
            />

            <DropdownField
              label="Account Type"
              value={formData.accountType}
              onSelect={(value) => updateFormData('accountType', value)}
              placeholder="Choose your account type"
              icon="users"
              error={errors.accountType}
              options={accountTypeOptions}
            />

            <InputField
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              placeholder="Create a password (min 6 characters)"
              icon="lock"
              error={errors.password}
              secureTextEntry={obscurePassword}
              autoCapitalize="none"
              showPasswordToggle={true}
              onTogglePassword={() => setObscurePassword(!obscurePassword)}
            />

            <InputField
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              placeholder="Confirm your password"
              icon="lock"
              error={errors.confirmPassword}
              secureTextEntry={obscureConfirmPassword}
              autoCapitalize="none"
              showPasswordToggle={true}
              onTogglePassword={() => setObscureConfirmPassword(!obscureConfirmPassword)}
            />

            {/* Create Account Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`h-14 rounded-lg items-center justify-center mb-6 ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="font-inter text-white text-base">
                {loading ? <ActivityIndicator size="small" color="white" /> : 'Create Account'}
              </Text>
            </Pressable>

            {/* Login Link */}
            <View className="flex-row justify-center items-center">
              <Text className="font-inter">Already have an account? </Text>
              <Pressable onPress={() => router.back()}>
                <Text className="font-inter text-gray-800 font-medium">Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
