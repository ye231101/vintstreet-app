import { authService, sellerService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { showToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShopSettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');

  // Business Information
  const [shopName, setShopName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [displayNamePreference, setDisplayNamePreference] = useState<'shop_name' | 'personal_name'>('shop_name');
  const [taxId, setTaxId] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');

  // Contact Information
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Return Address
  const [returnAddressLine1, setReturnAddressLine1] = useState('');
  const [returnAddressLine2, setReturnAddressLine2] = useState('');
  const [returnCity, setReturnCity] = useState('');
  const [returnState, setReturnState] = useState('');
  const [returnPostalCode, setReturnPostalCode] = useState('');
  const [returnCountry, setReturnCountry] = useState('US');

  // Policies
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  useEffect(() => {
    loadShopSettings();
  }, []);

  const loadShopSettings = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) return;

      // Load user profile for full name
      const { data: profile } = await authService.getUser();
      if (profile) {
        setUserFullName(profile.full_name || '');
      }

      // Load seller profile data
      const sellerProfile = await sellerService.getSellerProfile(user.id);

      if (sellerProfile) {
        setShopName(sellerProfile.shop_name || '');
        setBusinessName(sellerProfile.business_name || '');
        setShopTagline(sellerProfile.shop_tagline || '');
        setShopDescription(sellerProfile.shop_description || '');
        setDisplayNamePreference(sellerProfile.display_name_format || 'shop_name');
        setTaxId(sellerProfile.tax_id || '');
        setBusinessLicense(sellerProfile.business_license || '');
        setContactEmail(sellerProfile.contact_email || '');
        setContactPhone(sellerProfile.contact_phone || '');
        setReturnAddressLine1(sellerProfile.return_address_line1 || '');
        setReturnAddressLine2(sellerProfile.return_address_line2 || '');
        setReturnCity(sellerProfile.return_city || '');
        setReturnState(sellerProfile.return_state || '');
        setReturnPostalCode(sellerProfile.return_postal_code || '');
        setReturnCountry(sellerProfile.return_country || 'US');
        setShippingPolicy(sellerProfile.shipping_policy || '');
        setReturnPolicy(sellerProfile.return_policy || '');
      }
    } catch (error) {
      console.error('Error loading shop settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalNamePreview = () => {
    if (!userFullName) return 'e.g., John S.';

    const nameParts = userFullName.trim().split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const surnameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${surnameInitial}.`;
    }
    return userFullName;
  };

  const getShopNamePreview = () => {
    return shopName || 'Your Shop Name';
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        showToast('User not authenticated', 'danger');
        return;
      }

      if (!shopName.trim()) {
        showToast('Shop name is required', 'danger');
        return;
      }

      const profileData = {
        business_name: businessName.trim() || undefined,
        shop_name: shopName.trim(),
        shop_tagline: shopTagline.trim() || undefined,
        shop_description: shopDescription.trim() || undefined,
        display_name_format: displayNamePreference,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        return_address_line1: returnAddressLine1.trim() || undefined,
        return_address_line2: returnAddressLine2.trim() || undefined,
        return_city: returnCity.trim() || undefined,
        return_state: returnState.trim() || undefined,
        return_postal_code: returnPostalCode.trim() || undefined,
        return_country: returnCountry,
        shipping_policy: shippingPolicy.trim() || undefined,
        return_policy: returnPolicy.trim() || undefined,
        tax_id: taxId.trim() || undefined,
        business_license: businessLicense.trim() || undefined,
        updated_at: new Date().toISOString(),
      };

      // Save seller profile using the service
      await sellerService.saveSellerProfile(user.id, profileData);

      showToast('Shop settings saved successfully!', 'success');
      router.replace('/account');
    } catch (error) {
      console.error('Error saving shop settings:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save shop settings', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleViewShop = () => {
    if (user?.id) {
      router.push(`/seller-profile/${user.id}`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Shop Settings</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your shop settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 gap-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-white">Shop Settings</Text>

        <Pressable onPress={handleViewShop} className="flex-row items-center">
          <Feather name="eye" size={16} color="#fff" />
          <Text className="ml-2 text-sm font-inter-semibold text-white">View Shop</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          className="flex-1 p-4 gap-4 bg-gray-50"
        >
          {/* Business Information */}
          <View className="p-4 gap-4 rounded-lg bg-white">
            <View className="flex-row items-center gap-2">
              <Feather name="briefcase" size={20} color="#000" />
              <Text className="text-lg font-inter-bold text-black">Business Information</Text>
            </View>

            {/* Shop Name and Business Name */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="mb-2 text-sm font-inter-semibold text-black">
                  Shop Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={shopName}
                  onChangeText={setShopName}
                  placeholder="Shop name"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                />
              </View>

              <View className="flex-1">
                <Text className="mb-2 text-sm font-inter-semibold text-black">Business Name</Text>
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Business name"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                />
              </View>
            </View>

            {/* Shop Tagline */}
            <View>
              <Text className="mb-2 text-sm font-inter-semibold text-black">Shop Tagline</Text>
              <TextInput
                value={shopTagline}
                onChangeText={setShopTagline}
                placeholder="A catchy one-liner for your shop"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
              <Text className="mt-1 text-xs font-inter-semibold text-gray-500 text-right">
                {shopTagline.length}/100 characters
              </Text>
            </View>

            {/* Shop Description */}
            <View>
              <Text className="mb-2 text-sm font-inter-semibold text-black">Shop Description</Text>
              <TextInput
                value={shopDescription}
                onChangeText={setShopDescription}
                placeholder="Tell customers about your shop..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                maxLength={1000}
                textAlignVertical="top"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                style={{ height: 100 }}
              />
              <Text className="mt-1 text-xs font-inter-semibold text-gray-500 text-right">
                {shopDescription.length}/1000 characters
              </Text>
            </View>

            {/* Display Name Preference */}
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Feather name="user" size={16} color="#000" />
                <Text className="text-sm font-inter-semibold text-black">Display Name Preference</Text>
              </View>

              <Pressable
                onPress={() => setDisplayNamePreference('shop_name')}
                className="flex-row items-center px-4 py-3 bg-white border border-gray-200 rounded-lg"
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    displayNamePreference === 'shop_name' ? 'border-black' : 'border-gray-300'
                  }`}
                >
                  {displayNamePreference === 'shop_name' && <View className="w-3 h-3 bg-black rounded-full" />}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-inter-semibold text-black">{getShopNamePreview()}</Text>
                  <Text className="text-xs font-inter text-gray-500">
                    Show shop name on product and seller pages
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setDisplayNamePreference('personal_name')}
                className="flex-row items-center px-4 py-3 bg-white border border-gray-200 rounded-lg"
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    displayNamePreference === 'personal_name' ? 'border-black' : 'border-gray-300'
                  }`}
                >
                  {displayNamePreference === 'personal_name' && <View className="w-3 h-3 bg-black rounded-full" />}
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-inter-semibold text-black">{getPersonalNamePreview()}</Text>
                  <Text className="text-xs font-inter text-gray-500">Show first name and surname initial</Text>
                </View>
              </Pressable>
            </View>

            {/* Tax ID and Business License */}
            <View className="flex-1">
              <Text className="mb-2 text-sm font-inter-semibold text-black">Tax ID (Optional)</Text>
              <TextInput
                value={taxId}
                onChangeText={setTaxId}
                placeholder="Tax identification number"
                placeholderTextColor="#9CA3AF"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm font-inter-semibold text-black">Business License (Optional)</Text>
              <TextInput
                value={businessLicense}
                onChangeText={setBusinessLicense}
                placeholder="Business license number"
                placeholderTextColor="#9CA3AF"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>
          </View>

          {/* Contact Information */}
          <View className="p-4 gap-4 rounded-lg bg-white">
            <View className="flex-row items-center gap-2">
              <Feather name="mail" size={20} color="#000" />
              <Text className="text-lg font-inter-bold text-black">Contact Information</Text>
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm font-inter-semibold text-black">Contact Email</Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="customer@yourshop.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm font-inter-semibold text-black">Contact Phone</Text>
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>
          </View>

          {/* Return Address */}
          <View className="p-4 gap-4 rounded-lg bg-white">
            <View className="flex-row items-center gap-2">
              <Feather name="map-pin" size={20} color="#000" />
              <Text className="text-lg font-inter-bold text-black">Return Address</Text>
            </View>

            <View>
              <Text className="mb-2 text-sm font-inter-semibold text-black">Address Line 1</Text>
              <TextInput
                value={returnAddressLine1}
                onChangeText={setReturnAddressLine1}
                placeholder="Street address"
                placeholderTextColor="#9CA3AF"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-inter-semibold text-black">Address Line 2 (Optional)</Text>
              <TextInput
                value={returnAddressLine2}
                onChangeText={setReturnAddressLine2}
                placeholder="Apartment, suite, etc."
                placeholderTextColor="#9CA3AF"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-2 text-sm font-inter-semibold text-black">City</Text>
                <TextInput
                  value={returnCity}
                  onChangeText={setReturnCity}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                />
              </View>

              <View className="flex-1">
                <Text className="mb-2 text-sm font-inter-semibold text-black">State</Text>
                <TextInput
                  value={returnState}
                  onChangeText={setReturnState}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                />
              </View>

              <View className="flex-1">
                <Text className="mb-2 text-sm font-inter-semibold text-black">ZIP Code</Text>
                <TextInput
                  value={returnPostalCode}
                  onChangeText={setReturnPostalCode}
                  placeholder="ZIP code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                />
              </View>
            </View>
          </View>

          {/* Policies */}
          <View className="p-4 gap-4 rounded-lg bg-white">
            <View className="flex-row items-center gap-2">
              <Feather name="file-text" size={20} color="#000" />
              <Text className="text-lg font-inter-bold text-black">Policies</Text>
            </View>

            <View>
              <Text className="mb-2 text-sm font-inter-semibold text-black">Shipping Policy</Text>
              <TextInput
                value={shippingPolicy}
                onChangeText={setShippingPolicy}
                placeholder="Describe your shipping policies, delivery times, costs..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
                style={{ height: 100 }}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-inter-semibold text-black">Return Policy</Text>
              <TextInput
                value={returnPolicy}
                onChangeText={setReturnPolicy}
                placeholder="Describe your return and refund policies..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="px-4 py-3 text-base font-inter text-black bg-white border border-gray-200 rounded-lg"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Save Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <Pressable
          onPress={handleSaveProfile}
          disabled={loading}
          className={`py-4 rounded-xl ${loading ? 'bg-gray-400' : 'bg-black'}`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center justify-center">
              <Feather name="save" size={20} color="#fff" />
              <Text className="ml-2 text-base font-inter-bold text-white">Save Profile</Text>
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
