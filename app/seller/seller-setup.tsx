import { authService, sellerService } from '@/api/services';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
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

      // 1) Update user_type on profiles table
      const { error: profileError, success } = await authService.updateProfile({
        user_type: newUserType,
      });

      if (!success || profileError) {
        throw new Error(`Failed to update profile: ${profileError || 'Unknown error'}`);
      }

      // 2) Save shop_name on seller_profiles table
      await sellerService.saveSellerProfile(user.id, {
        shop_name: shopName.trim(),
        updated_at: new Date().toISOString(),
      });

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
      } catch (err) {
        logger.error('Could not store preferences:', err);
      }

      // Refresh user profile to get updated user_type
      await updateProfile({});

      showToast('Seller account setup successful!', 'success');

      // Navigate to seller dashboard
      router.replace('/account');
    } catch (error) {
      logger.error('Error setting up seller account:', error);
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

  const handleClose = () => {
    router.push('/account');
  };

  const renderProgressBar = () => {
    return (
      <View className="flex-row items-center justify-center p-4">
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
    <View className="flex-1 p-4 bg-white">
      <View className="p-2">
        <Text className="mb-2 text-3xl font-inter-bold text-black text-center">
          What type of things would you like to sell?
        </Text>
        <Text className="text-sm font-inter text-gray-600 text-center">Select all that apply</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center p-2">
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              className={`flex-row items-center px-5 py-4 mb-3 bg-white border rounded-lg ${
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

      <View className="px-2">
        <Pressable
          onPress={handleContinueStep1}
          disabled={selectedCategories.length === 0}
          className={`py-4 rounded-lg ${selectedCategories.length === 0 ? 'bg-gray-400' : 'bg-black'}`}
        >
          <Text className="text-base font-inter-bold text-center text-white">Continue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="flex-1 p-4 bg-white">
      <View className="p-2">
        <Text className="mb-2 text-3xl font-inter-bold text-black text-center">How would you like to sell?</Text>
        <Text className="text-sm font-inter text-gray-600 text-center">You can choose one or both</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="flex-1">
        <View className="flex-1 justify-center p-2">
          <Pressable
            onPress={() => setUploadListings(!uploadListings)}
            className={`px-6 py-6 mb-4 bg-white border rounded-lg ${
              uploadListings ? 'border-black' : 'border-gray-200'
            }`}
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
                <Text className="text-sm font-inter text-gray-600">Create product listings to sell anytime</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setLivestream(!livestream)}
            className={`px-6 py-6 bg-white border rounded-lg ${livestream ? 'border-black' : 'border-gray-200'}`}
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
                <Text className="text-sm font-inter text-gray-600">Sell live and engage with buyers in real-time</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-2">
        <Pressable
          onPress={handleContinueStep2}
          disabled={!uploadListings && !livestream}
          className={`py-4 rounded-lg ${!uploadListings && !livestream ? 'bg-gray-400' : 'bg-black'}`}
        >
          <Text className="text-base font-inter-bold text-center text-white">Continue</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="flex-1 p-4 bg-white">
      <View className="p-2">
        <Text className="mb-2 text-3xl font-inter-bold text-black text-center">Your shop name</Text>
        <Text className="text-sm font-inter text-gray-600 text-center">Choose a memorable name for your shop</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center p-2">
          <Text className="mb-3 text-sm font-inter-bold text-black">Shop name</Text>
          <TextInput
            value={shopName}
            onChangeText={setShopName}
            placeholder="Enter your shop name"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            className="px-5 py-4 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
          />
          <Text className="mt-2 text-xs font-inter-semibold text-gray-500 text-right">
            {shopName.length}/50 characters
          </Text>
        </View>
      </ScrollView>

      <View className="px-2">
        <Pressable
          onPress={handleCompleteSetup}
          disabled={loading || !shopName.trim()}
          className={`py-4 rounded-lg ${loading || !shopName.trim() ? 'bg-gray-400' : 'bg-black'}`}
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Header */}
        <View className="bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={handleBack} hitSlop={8}>
              <Feather name="arrow-left" size={24} color="#000" />
            </Pressable>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={24} color="#000" />
            </Pressable>
          </View>

          {/* Progress Bar */}
          {renderProgressBar()}

          <View className="items-center">
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
