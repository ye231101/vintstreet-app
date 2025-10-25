import { useAuth } from '@/hooks/use-auth';
import { showToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/api/config/supabase';

const CATEGORIES = [
  { id: 'mens_fashion', label: "Men's Fashion" },
  { id: 'womens_fashion', label: "Women's Fashion" },
  { id: 'junior_fashion', label: 'Junior Fashion' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'games_consoles', label: 'Games & consoles' },
  { id: 'vinyl', label: 'Vinyl' },
  { id: 'comic_books', label: 'Comic Books' },
  { id: 'trading_cards', label: 'Trading Cards' },
  { id: 'veefriends', label: 'VeeFriends' },
];

export default function SellerSetupScreen() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 2: Selling methods
  const [uploadListings, setUploadListings] = useState(false);
  const [livestream, setLivestream] = useState(false);

  // Step 3: Shop name
  const [shopName, setShopName] = useState('');

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleContinueStep1 = () => {
    if (selectedCategories.length === 0) {
      showToast('Please select at least one category', 'danger');
      return;
    }
    setCurrentStep(2);
  };

  const handleContinueStep2 = () => {
    if (!uploadListings && !livestream) {
      showToast('Please select at least one selling method', 'danger');
      return;
    }
    setCurrentStep(3);
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);

      // Validate shop name
      if (!shopName.trim()) {
        showToast('Shop name is required', 'danger');
        setLoading(false);
        return;
      }

      if (shopName.trim().length > 50) {
        showToast('Shop name must be 50 characters or less', 'danger');
        setLoading(false);
        return;
      }

      if (!user?.id) {
        showToast('User not authenticated', 'danger');
        setLoading(false);
        return;
      }

      // Update user type to seller or both
      const newUserType = user.user_type === 'buyer' ? 'both' : 'seller';

      // Update user_type in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: newUserType,
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      // Try to update shop_name if the column exists
      try {
        await supabase
          .from('profiles')
          .update({
            shop_name: shopName.trim(),
          })
          .eq('user_id', user.id);
      } catch (err) {
        // Shop name column might not exist, continue anyway
        console.log('Could not update shop_name:', err);
      }

      // Store seller preferences in user metadata (optional)
      try {
        const sellerPreferences = {
          categories: selectedCategories,
          selling_methods: {
            upload_listings: uploadListings,
            livestream: livestream,
          },
          shop_name: shopName.trim(),
        };

        // Store in local storage or could be added to profiles as jsonb
        console.log('Seller preferences:', sellerPreferences);
      } catch (err) {
        console.log('Could not store preferences:', err);
      }

      // Refresh user profile to get updated user_type
      await updateProfile({});

      showToast('Seller account setup successful!', 'success');

      // Navigate to seller dashboard
      router.replace('/account');
    } catch (error) {
      console.error('Error setting up seller account:', error);
      showToast(error instanceof Error ? error.message : 'Failed to setup seller account', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const renderProgressBar = () => {
    return (
      <View className="flex-row items-center justify-center px-4 py-6">
        {[1, 2, 3].map((step, index) => (
          <React.Fragment key={step}>
            <View className={`h-1 flex-1 ${step <= currentStep ? 'bg-black' : 'bg-gray-300'}`} />
            {index < 2 && <View className="w-2" />}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <View className="flex-1">
      <View className="px-6 py-8">
        <Text className="mb-2 text-3xl font-inter-bold text-black text-center">
          What type of things would you like to sell?
        </Text>
        <Text className="text-sm font-inter-regular text-gray-600 text-center">Select all that apply</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="pb-6">
          {CATEGORIES.map((category, index) => (
            <Pressable
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              className={`flex-row items-center px-5 py-4 mb-3 bg-white border rounded-xl ${
                selectedCategories.includes(category.id) ? 'border-black' : 'border-gray-200'
              }`}
            >
              <View
                className={`w-5 h-5 border-2 rounded mr-4 items-center justify-center ${
                  selectedCategories.includes(category.id) ? 'bg-black border-black' : 'border-gray-300'
                }`}
              >
                {selectedCategories.includes(category.id) && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text className="text-base font-inter-semibold text-black">{category.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <Pressable onPress={handleContinueStep1} className="py-4 bg-gray-600 rounded-xl">
          <Text className="text-base font-inter-bold text-center text-white">Continue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="flex-1">
      <View className="px-6 py-8">
        <Text className="mb-2 text-3xl font-inter-bold text-black text-center">How would you like to sell?</Text>
        <Text className="text-sm font-inter-regular text-gray-600 text-center">You can choose one or both</Text>
      </View>

      <View className="flex-1 px-4 justify-center">
        <Pressable
          onPress={() => setUploadListings(!uploadListings)}
          className={`px-6 py-6 mb-4 bg-white border rounded-xl ${uploadListings ? 'border-black' : 'border-gray-200'}`}
        >
          <View className="flex-row items-center">
            <View
              className={`w-5 h-5 border-2 rounded mr-4 items-center justify-center ${
                uploadListings ? 'bg-black border-black' : 'border-gray-300'
              }`}
            >
              {uploadListings && <Feather name="check" size={14} color="#fff" />}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-inter-bold text-black mb-1">Upload listings</Text>
              <Text className="text-sm font-inter-regular text-gray-600">Create product listings to sell anytime</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setLivestream(!livestream)}
          className={`px-6 py-6 bg-white border rounded-xl ${livestream ? 'border-black' : 'border-gray-200'}`}
        >
          <View className="flex-row items-center">
            <View
              className={`w-5 h-5 border-2 rounded mr-4 items-center justify-center ${
                livestream ? 'bg-black border-black' : 'border-gray-300'
              }`}
            >
              {livestream && <Feather name="check" size={14} color="#fff" />}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-inter-bold text-black mb-1">Livestream</Text>
              <Text className="text-sm font-inter-regular text-gray-600">
                Sell live and engage with buyers in real-time
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      <View className="px-6 pb-6">
        <Pressable onPress={handleContinueStep2} className="py-4 bg-gray-600 rounded-xl">
          <Text className="text-base font-inter-bold text-center text-white">Continue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="flex-1">
      <View className="px-6 py-8">
        <Text className="mb-2 text-3xl font-inter-bold text-black text-center">Your shop name</Text>
        <Text className="text-sm font-inter-regular text-gray-600 text-center">
          Choose a memorable name for your shop
        </Text>
      </View>

      <View className="flex-1 px-6 justify-center">
        <View className="mb-2">
          <Text className="mb-3 text-sm font-inter-semibold text-black">Shop name</Text>
          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="Enter your shop name"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            className="px-5 py-4 text-base font-inter-regular text-black bg-white border border-gray-200 rounded-xl"
          />
          <Text className="mt-2 text-xs font-inter-regular text-gray-500">{shopName.length}/50 characters</Text>
        </View>
      </View>

      <View className="px-6 pb-6">
        <Pressable
          onPress={handleCompleteSetup}
          disabled={loading}
          className={`py-4 rounded-xl ${loading ? 'bg-gray-400' : 'bg-gray-600'}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-inter-bold text-center text-white">Complete Setup</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="bg-white">
          <View className="flex-row items-center justify-between px-4 py-4">
            <Pressable onPress={handleBack} className="p-2 -ml-2">
              <Feather name="x" size={24} color="#000" />
            </Pressable>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Bar */}
          {renderProgressBar()}

          <View className="items-center pb-2">
            <Text className="text-sm font-inter-semibold text-gray-600">Step {currentStep} of 3</Text>
          </View>
        </View>

        {/* Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
