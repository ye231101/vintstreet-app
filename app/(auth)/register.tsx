import { useAuth } from '@/hooks/use-auth';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  shopName: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  country: string;
  state: string;
  phone: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  shopName?: string;
  address1?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    shopName: '',
    address1: '',
    address2: '',
    city: '',
    postcode: '',
    country: '',
    state: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

    newErrors.username = validateUsername(formData.username);
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirmPassword = validateConfirmPassword(formData.confirmPassword);
    newErrors.firstName = validateRequired(formData.firstName, 'First Name');
    newErrors.lastName = validateRequired(formData.lastName, 'Last Name');
    newErrors.shopName = validateRequired(formData.shopName, 'Shop Name');
    newErrors.address1 = validateRequired(formData.address1, 'Address Line 1');
    newErrors.city = validateRequired(formData.city, 'City / Town');
    newErrors.postcode = validateRequired(formData.postcode, 'Post/ZIP Code');
    newErrors.country = validateRequired(formData.country, 'Country');
    newErrors.phone = validateRequired(formData.phone, 'Phone Number');

    // Check email uniqueness if email is valid
    if (!newErrors.email && formData.email) {
      const emailUniquenessError = await validateEmailUniqueness(formData.email);
      if (emailUniquenessError) {
        newErrors.email = emailUniquenessError;
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'You must accept the terms and conditions');
      return;
    }

    if (await validateForm()) {
      const result = await register(formData.username, formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        shopName: formData.shopName,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country,
        state: formData.state,
        phone: formData.phone,
        termsAccepted: termsAccepted,
      });

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

  const openTermsAndConditions = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://vintstreet.com/terms-and-conditions/');
    } catch (error) {
      Alert.alert('Error', 'Could not open terms and conditions');
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    showPasswordToggle = false,
    onTogglePassword,
  }: {
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
  }) => (
    <View className="mb-4">
      <View
        className={`border rounded-lg flex-row items-center px-3 h-13 bg-white ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <Text className="mr-2">
          <Feather name={icon as any} size={24} color="black" />
        </Text>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          className="flex-1 font-poppins text-base h-13"
        />
        {showPasswordToggle && (
          <Pressable onPress={onTogglePassword} hitSlop={8}>
            <Feather name={secureTextEntry ? 'eye' : 'eye-off'} size={24} color="black" />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 font-poppins">{error}</Text>}
    </View>
  );

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
          <View className="flex-row items-center mb-5">
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Feather name="arrow-left" size={24} color="black" />
            </Pressable>
            <Text className="text-xl font-poppins-bold flex-1 text-center mr-6">Create Account</Text>
          </View>

          {/* Logo */}
          <View className="items-center mb-8">
            <Image source={require('@/assets/images/splash-logo.png')} resizeMode="contain" className="w-40 h-40" />
          </View>

          {/* Error message */}
          {error && (
            <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg mb-4">
              <Text className="font-poppins text-red-700">{error}</Text>
            </View>
          )}

          <View className="w-full max-w-lg self-center">
            {/* Account Information Section */}
            <Text className="text-lg font-poppins-bold mb-2 mt-2">Account Information</Text>

            <InputField
              label="Username"
              value={formData.username}
              onChangeText={(text) => updateFormData('username', text)}
              placeholder="Username"
              icon="user"
              error={errors.username}
              autoCapitalize="none"
            />

            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="Email"
              icon="mail"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <InputField
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              placeholder="Password"
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
              placeholder="Confirm Password"
              icon="lock"
              error={errors.confirmPassword}
              secureTextEntry={obscureConfirmPassword}
              autoCapitalize="none"
              showPasswordToggle={true}
              onTogglePassword={() => setObscureConfirmPassword(!obscureConfirmPassword)}
            />

            {/* Personal Information Section */}
            <Text className="text-lg font-poppins-bold mb-2 mt-2">Personal Information</Text>

            <InputField
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => updateFormData('firstName', text)}
              placeholder="First Name"
              icon="user"
              error={errors.firstName}
            />

            <InputField
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => updateFormData('lastName', text)}
              placeholder="Last Name"
              icon="user"
              error={errors.lastName}
            />

            <InputField
              label="Shop Name"
              value={formData.shopName}
              onChangeText={(text) => updateFormData('shopName', text)}
              placeholder="Shop Name"
              icon="shopping-bag"
              error={errors.shopName}
            />

            {/* Address Information Section */}
            <Text className="text-lg font-poppins-bold mb-2 mt-2">Address Information</Text>

            <InputField
              label="Address Line 1"
              value={formData.address1}
              onChangeText={(text) => updateFormData('address1', text)}
              placeholder="Address Line 1"
              icon="home"
              error={errors.address1}
            />

            <InputField
              label="Address Line 2"
              value={formData.address2}
              onChangeText={(text) => updateFormData('address2', text)}
              placeholder="Address Line 2"
              icon="home"
            />

            <InputField
              label="City / Town"
              value={formData.city}
              onChangeText={(text) => updateFormData('city', text)}
              placeholder="City / Town"
              icon="map-pin"
              error={errors.city}
            />

            <InputField
              label="Post/ZIP Code"
              value={formData.postcode}
              onChangeText={(text) => updateFormData('postcode', text)}
              placeholder="Post/ZIP Code"
              icon="mail"
              error={errors.postcode}
            />

            <InputField
              label="Country"
              value={formData.country}
              onChangeText={(text) => updateFormData('country', text)}
              placeholder="Country"
              icon="globe"
              error={errors.country}
            />

            <InputField
              label="State/County"
              value={formData.state}
              onChangeText={(text) => updateFormData('state', text)}
              placeholder="State/County"
              icon="map"
            />

            <InputField
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              placeholder="Phone Number"
              icon="phone"
              error={errors.phone}
              keyboardType="phone-pad"
            />

            {/* Terms and Conditions */}
            <View className="flex-row items-start mt-6 mb-6">
              <Pressable
                onPress={() => setTermsAccepted(!termsAccepted)}
                className={`w-5 h-5 border rounded mr-3 mt-0.5 items-center justify-center ${
                  termsAccepted ? 'bg-black border-black' : 'bg-white border-gray-300'
                }`}
              >
                {termsAccepted && <Feather name="check" size={16} color="white" />}
              </Pressable>
              <View className="flex-1">
                <Text className="font-poppins leading-5">
                  I have read and agree to the{' '}
                  <Text className="text-blue-500 underline" onPress={openTermsAndConditions}>
                    Terms and Conditions
                  </Text>
                </Text>
              </View>
            </View>

            {/* Create Account Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`h-12 rounded-lg items-center justify-center mb-6 ${loading ? 'bg-gray-400' : 'bg-black'}`}
            >
              <Text className="font-poppins text-white text-base">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>

            {/* Login Link */}
            <View className="flex-row justify-center items-center">
              <Text className="font-poppins">Already have an account? </Text>
              <Pressable onPress={() => router.back()}>
                <Text className="font-poppins text-gray-800 font-medium">Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
