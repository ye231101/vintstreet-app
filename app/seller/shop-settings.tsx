import { authService, sellerService } from '@/api';
import { InputComponent } from '@/components/common/input';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
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
  TouchableOpacity,
  View
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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">Shop Settings</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your shop settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">Shop Settings</Text>

        <Pressable onPress={handleViewShop} className="flex-row items-center">
          <Feather name="eye" size={16} color="#000" />
          <Text className="ml-2 text-sm font-inter-semibold text-black">View Shop</Text>
        </Pressable>
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
          <View className="gap-4 p-4">
            {/* Business Information */}
            <View className="gap-2 p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-row items-center gap-2">
                <Feather name="briefcase" size={20} color="#000" />
                <Text className="text-lg font-inter-bold text-black">Business Information</Text>
              </View>

              {/* Shop Name and Business Name */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <InputComponent
                    value={shopName}
                    label="Shop Name"
                    size="small"
                    required={true}
                    placeholder="Enter shop name"
                    onChangeText={(text) => setShopName(text)}
                  />
                </View>

                <View className="flex-1">
                  <InputComponent
                    value={businessName}
                    label="Business Name"
                    size="small"
                    placeholder="Enter business name"
                    onChangeText={(text) => setBusinessName(text)}
                  />
                </View>
              </View>

              {/* Shop Tagline */}
              <InputComponent
                value={shopTagline}
                label="Shop Tagline"
                size="small"
                placeholder="A catchy one-liner for your shop"
                onChangeText={(text) => setShopTagline(text)}
                maxLength={100}
              />

              {/* Shop Description */}
              <InputComponent
                value={shopDescription}
                label="Shop Description"
                size="small"
                placeholder="Tell customers about your shop..."
                onChangeText={(text) => setShopDescription(text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                height={100}
                maxLength={1000}
              />

              {/* Display Name Preference */}
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Feather name="user" size={16} color="#000" />
                  <Text className="text-sm font-inter-semibold text-black">Display Name Preference</Text>
                </View>

                <Pressable
                  onPress={() => setDisplayNamePreference('shop_name')}
                  className="flex-row items-center gap-3 p-3 rounded bg-white border border-gray-200"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      displayNamePreference === 'shop_name' ? 'border-black' : 'border-gray-300'
                    }`}
                  >
                    {displayNamePreference === 'shop_name' && <View className="w-3 h-3 bg-black rounded-full" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-inter-semibold text-black">{getShopNamePreview()}</Text>
                    <Text className="text-xs font-inter text-gray-500">Show shop name on product and seller pages</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setDisplayNamePreference('personal_name')}
                  className="flex-row items-center gap-3 p-3 rounded bg-white border border-gray-200"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      displayNamePreference === 'personal_name' ? 'border-black' : 'border-gray-300'
                    }`}
                  >
                    {displayNamePreference === 'personal_name' && <View className="w-3 h-3 bg-black rounded-full" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-inter-semibold text-black">{getPersonalNamePreview()}</Text>
                    <Text className="text-xs font-inter text-gray-500">Show first name and surname initial</Text>
                  </View>
                </Pressable>
              </View>

              {/* Tax ID and Business License */}
              <InputComponent
                value={taxId}
                label="Tax ID (Optional)"
                size="small"
                placeholder="Tax identification number"
                onChangeText={(text) => setTaxId(text)}
              />

              <InputComponent
                value={businessLicense}
                label="Business License (Optional)"
                size="small"
                placeholder="Business license number"
                onChangeText={(text) => setBusinessLicense(text)}
              />
            </View>

            {/* Contact Information */}
            <View className="gap-2 p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-row items-center gap-2">
                <Feather name="mail" size={20} color="#000" />
                <Text className="text-lg font-inter-bold text-black">Contact Information</Text>
              </View>

              <InputComponent
                value={contactEmail}
                label="Contact Email"
                size="small"
                placeholder="customer@yourshop.com"
                onChangeText={(text) => setContactEmail(text)}
                keyboardType="email-address"
              />

              <InputComponent
                value={contactPhone}
                label="Contact Phone"
                size="small"
                placeholder="+1 (555) 123-4567"
                onChangeText={(text) => setContactPhone(text)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Return Address */}
            <View className="gap-2 p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-row items-center gap-2">
                <Feather name="map-pin" size={20} color="#000" />
                <Text className="text-lg font-inter-bold text-black">Return Address</Text>
              </View>

              <InputComponent
                value={returnAddressLine1}
                label="Address Line 1"
                size="small"
                placeholder="Street address"
                onChangeText={(text) => setReturnAddressLine1(text)}
              />

              <InputComponent
                value={returnAddressLine2}
                label="Address Line 2 (Optional)"
                size="small"
                placeholder="Apartment, suite, etc."
                onChangeText={(text) => setReturnAddressLine2(text)}
              />

              <InputComponent
                value={returnCity}
                label="City"
                size="small"
                placeholder="City"
                onChangeText={(text) => setReturnCity(text)}
              />

              <InputComponent
                value={returnState}
                label="State"
                size="small"
                placeholder="State"
                onChangeText={(text) => setReturnState(text)}
              />

              <InputComponent
                value={returnPostalCode}
                label="ZIP Code"
                size="small"
                placeholder="ZIP code"
                onChangeText={(text) => setReturnPostalCode(text)}
              />
            </View>

            {/* Policies */}
            <View className="gap-2 p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-row items-center gap-2">
                <Feather name="file-text" size={20} color="#000" />
                <Text className="text-lg font-inter-bold text-black">Policies</Text>
              </View>

              <InputComponent
                value={shippingPolicy}
                label="Shipping Policy"
                size="small"
                placeholder="Describe your shipping policies, delivery times, costs..."
                onChangeText={(text) => setShippingPolicy(text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                height={100}
              />

              <InputComponent
                value={returnPolicy}
                label="Return Policy"
                size="small"
                placeholder="Describe your return and refund policies..."
                onChangeText={(text) => setReturnPolicy(text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                height={100}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View className="p-4">
        <Pressable
          onPress={handleSaveProfile}
          disabled={loading}
          className={`py-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-black'}`}
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
