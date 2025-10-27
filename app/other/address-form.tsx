import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/api/config/supabase';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

// InputField component moved outside to prevent re-creation on each render
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  keyboardType = 'default',
  autoCapitalize = 'words',
  multiline = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  editable?: boolean;
}) => (
  <View className="mb-4">
    <Text className="text-gray-900 text-sm font-inter-semibold mb-2">
      {label}
      {required && <Text className="text-red-500"> *</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      className={`bg-white border border-gray-300 rounded-lg px-4 ${
        multiline ? 'py-3 min-h-[80px]' : 'py-3'
      } text-gray-900 text-base font-inter`}
      editable={editable}
    />
  </View>
);

export default function AddressFormScreen() {
  const { type, edit, id } = useLocalSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [phone, setPhone] = useState('');

  const isShipping = type === 'shipping';
  const isEditing = edit === 'true';

  useEffect(() => {
    if (isEditing && id) {
      loadAddress();
    } else if (user?.id) {
      loadExistingProfile();
    }
  }, []);

  const loadExistingProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const profile = data as any;
        // Load existing address data if available
        if (isShipping) {
          setFirstName(profile.shipping_first_name || '');
          setLastName(profile.shipping_last_name || '');
          setAddressLine1(profile.shipping_address_line1 || '');
          setAddressLine2(profile.shipping_address_line2 || '');
          setCity(profile.shipping_city || '');
          setState(profile.shipping_state || '');
          setPostalCode(profile.shipping_postal_code || '');
          setCountry(profile.shipping_country || 'US');
          setPhone(profile.shipping_phone || '');
        } else {
          setFirstName(profile.billing_first_name || '');
          setLastName(profile.billing_last_name || '');
          setAddressLine1(profile.billing_address_line1 || '');
          setAddressLine2(profile.billing_address_line2 || '');
          setCity(profile.billing_city || '');
          setState(profile.billing_state || '');
          setPostalCode(profile.billing_postal_code || '');
          setCountry(profile.billing_country || 'US');
          setPhone(profile.billing_phone || '');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddress = async () => {
    // This function would load a specific address if editing
    // For now, we'll use the loadExistingProfile
    loadExistingProfile();
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      showErrorToast('Please enter first name');
      return false;
    }
    if (!lastName.trim()) {
      showErrorToast('Please enter last name');
      return false;
    }
    if (!addressLine1.trim()) {
      showErrorToast('Please enter address');
      return false;
    }
    if (!city.trim()) {
      showErrorToast('Please enter city');
      return false;
    }
    if (!postalCode.trim()) {
      showErrorToast('Please enter postal code');
      return false;
    }
    if (!country.trim()) {
      showErrorToast('Please enter country');
      return false;
    }
    return true;
  };

  const saveAddress = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      showErrorToast('User not found');
      return;
    }

    setIsSaving(true);

    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let updateData: any = {};

      if (isShipping) {
        updateData = {
          shipping_first_name: firstName,
          shipping_last_name: lastName,
          shipping_address_line1: addressLine1,
          shipping_address_line2: addressLine2 || null,
          shipping_city: city,
          shipping_state: state || null,
          shipping_postal_code: postalCode,
          shipping_country: country,
          shipping_phone: phone || null,
        };
      } else {
        updateData = {
          billing_first_name: firstName,
          billing_last_name: lastName,
          billing_address_line1: addressLine1,
          billing_address_line2: addressLine2 || null,
          billing_city: city,
          billing_state: state || null,
          billing_postal_code: postalCode,
          billing_country: country,
          billing_phone: phone || null,
        };
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('buyer_profiles')
          .update(updateData)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase.from('buyer_profiles').insert({
          user_id: user.id,
          ...updateData,
        });

        if (insertError) throw insertError;
      }

      showSuccessToast(`${isShipping ? 'Shipping' : 'Billing'} address saved successfully`);
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error: any) {
      console.error('Error saving address:', error);
      showErrorToast(error.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={isLoading}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">
            {isEditing ? 'Edit' : 'Add'} {isShipping ? 'Shipping' : 'Billing'} Address
          </Text>
        </View>

        <View className="flex-1 bg-gray-50 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={isSaving}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">
          {isEditing ? 'Edit' : 'Add'} {isShipping ? 'Shipping' : 'Billing'} Address
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-4 bg-gray-50">
            {/* Info Banner */}
            <View className="bg-blue-500/10 rounded-lg p-4 mb-6 flex-row items-start">
              <Feather name="info" color="#007AFF" size={20} style={{ marginTop: 2, marginRight: 12 }} />
              <Text className="flex-1 text-blue-700 text-sm font-inter-semibold">
                {isShipping
                  ? 'This address will be used for shipping your orders'
                  : 'This address will be used for billing and invoices'}
              </Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-gray-900 text-lg font-inter-bold mb-4">Personal Information</Text>

              <View className="flex-row -mx-2">
                <View className="flex-1 px-2">
                  <InputField
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="John"
                    required
                    editable={!isSaving}
                  />
                </View>
                <View className="flex-1 px-2">
                  <InputField
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    required
                    editable={!isSaving}
                  />
                </View>
              </View>

              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
                editable={!isSaving}
              />
            </View>

            {/* Address Details */}
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-gray-900 text-lg font-inter-bold mb-4">Address Details</Text>

              <InputField
                label="Address Line 1"
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="123 Main Street"
                required
                editable={!isSaving}
              />

              <InputField
                label="Address Line 2"
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
                editable={!isSaving}
              />

              <InputField
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="New York"
                required
                editable={!isSaving}
              />

              <View className="flex-row -mx-2">
                <View className="flex-1 px-2">
                  <InputField
                    label="State"
                    value={state}
                    onChangeText={setState}
                    placeholder="NY"
                    editable={!isSaving}
                  />
                </View>
                <View className="flex-1 px-2">
                  <InputField
                    label="Postal Code"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="10001"
                    required
                    editable={!isSaving}
                  />
                </View>
              </View>

              <InputField
                label="Country"
                value={country}
                onChangeText={setCountry}
                placeholder="US"
                autoCapitalize="characters"
                required
                editable={!isSaving}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveAddress}
              disabled={isSaving}
              className={`rounded-lg py-4 px-6 items-center shadow-sm ${isSaving ? 'bg-gray-400' : 'bg-blue-500'}`}
            >
              {isSaving ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="ml-2 text-white text-base font-inter-bold">Saving...</Text>
                </View>
              ) : (
                <Text className="text-white text-base font-inter-bold">
                  {isEditing ? 'Update' : 'Save'} Address
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

