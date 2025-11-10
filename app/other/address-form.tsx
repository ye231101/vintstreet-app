import { savedAddressesService } from '@/api';
import { InputComponent } from '@/components/common/input';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// Address Autocomplete Field with Mapbox
const AddressAutocompleteField = ({
  label,
  value,
  onChangeText,
  onSelectAddress,
  placeholder,
  required = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (place: any) => void;
  placeholder: string;
  required?: boolean;
  editable?: boolean;
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchPlaces = async (text: string) => {
    onChangeText(text);

    if (text.length < 3) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${
          process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&autocomplete=true&limit=10&types=address,place,postcode`
      );

      // Sort results to prioritize address types first
      const sortedResults = res.data.features.sort((a: any, b: any) => {
        const typeOrder: any = { address: 0, place: 1, postcode: 2, region: 3 };
        const aType = a.place_type?.[0] || 'other';
        const bType = b.place_type?.[0] || 'other';
        return (typeOrder[aType] ?? 999) - (typeOrder[bType] ?? 999);
      });

      setResults(sortedResults.slice(0, 5));
    } catch (error) {
      console.error('Error fetching places:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    onSelectAddress(place);
    setResults([]);
  };

  return (
    <View className="mb-4">
      <Text className="text-gray-900 text-sm font-inter-semibold mb-2">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <View>
        <TextInput
          value={value}
          onChangeText={fetchPlaces}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base font-inter"
          editable={editable}
        />
        {isSearching && (
          <View className="absolute right-3 top-3">
            <ActivityIndicator size="small" color="#9CA3AF" />
          </View>
        )}
      </View>

      {results.length > 0 && (
        <View className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {results.map((item) => {
              const placeType = item.place_type?.[0] || '';
              const icon = placeType === 'address' ? '📍' : placeType === 'place' ? '🏙️' : '📮';

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectPlace(item)}
                  className="px-4 py-3 border-b border-gray-200"
                >
                  <View className="flex-row items-start">
                    <Text className="mr-2">{icon}</Text>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-sm font-inter">{item.place_name}</Text>
                      <Text className="text-gray-500 text-xs font-inter mt-1 capitalize">
                        {placeType || 'location'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing && id) {
      loadAddress();
    }
  }, []);

  const loadAddress = async () => {
    if (!user?.id || !id) return;

    try {
      setIsLoading(true);
      const data = await savedAddressesService.getById(String(id), user.id);

      if (data) {
        const addressData = data as any;
        setLabel(addressData.label || '');
        setFirstName(addressData.first_name);
        setLastName(addressData.last_name);
        setAddressLine1(addressData.address_line1);
        setAddressLine2(addressData.address_line2 || '');
        setCity(addressData.city);
        setState(addressData.state || '');
        setPostalCode(addressData.postal_code);
        setCountry(addressData.country);
        setPhone(addressData.phone || '');
        setIsDefault(addressData.is_default);
      }
    } catch (error: any) {
      console.error('Error loading address:', error);
      showErrorToast(error.message || 'Failed to load address');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (place: any) => {
    const context = place.context || [];
    const placeType = place.place_type?.[0] || '';

    const placeNameParts = place.place_name.split(',').map((p: string) => p.trim());

    let addressLine1Value = '';

    if (placeType === 'address' && placeNameParts.length > 0) {
      // For address type, ALWAYS use the first part (complete street address)
      addressLine1Value = placeNameParts[0];
    } else if (placeType === 'postcode' || placeType === 'place') {
      addressLine1Value = '';
    } else if (place.address && place.text) {
      addressLine1Value = `${place.address} ${place.text}`;
    } else if (place.text && placeType === 'address') {
      addressLine1Value = place.text;
    }

    // Parse context for city, state, postal code, and country
    let cityValue = '';
    let stateValue = '';
    let postalCodeValue = '';
    let countryValue = '';

    // Special handling for postcode type - the text field IS the postal code
    if (placeType === 'postcode') {
      postalCodeValue = place.text || placeNameParts[0];
    }

    // Try to get postal code from properties
    if (place.properties?.postcode && !postalCodeValue) {
      postalCodeValue = place.properties.postcode;
    }

    // Parse the context array for all other info
    context.forEach((item: any) => {
      if (item.id.includes('place')) {
        cityValue = item.text;
      } else if (item.id.includes('locality') && !cityValue) {
        // Some results use locality instead of place
        cityValue = item.text;
      } else if (item.id.includes('region')) {
        // Extract state/region code or full name
        if (item.short_code) {
          const parts = item.short_code.split('-');
          stateValue = parts.length > 1 ? parts[1] : parts[0];
        } else {
          stateValue = item.text;
        }
      } else if (item.id.includes('postcode') && !postalCodeValue) {
        // Only set if we don't already have it
        postalCodeValue = item.text;
      } else if (item.id.includes('country')) {
        // Extract country code (e.g., "US", "AU", "CL", "UK")
        countryValue = item.short_code || item.text;
      }
    });

    // Fallback: Extract city from place_name if not found in context
    if (!cityValue) {
      if (placeType === 'postcode' && placeNameParts.length > 1) {
        // For postcode: "5480000, Puerto Montt, Los Lagos, Chile"
        cityValue = placeNameParts[1];
      } else if (placeType === 'place') {
        // For place: "Puerto Montt, Los Lagos, Chile"
        cityValue = placeNameParts[0];
      } else if (placeNameParts.length > 1) {
        // Generic: second part is usually the city
        cityValue = placeNameParts[1];
      }
    }

    // Fallback: Extract state/region from place_name if not found in context
    if (!stateValue) {
      let statePart = '';

      if (placeType === 'postcode' && placeNameParts.length > 2) {
        // For postcode: third part is state/region
        statePart = placeNameParts[2];
      } else if (placeType === 'place' && placeNameParts.length > 1) {
        // For place: second part is state/region
        statePart = placeNameParts[1];
      } else if (placeNameParts.length > 2) {
        // Generic: third part
        statePart = placeNameParts[2];
      }

      if (statePart) {
        // Try to extract state code (2-3 uppercase letters)
        const stateMatch = statePart.match(/\b[A-Z]{2,3}\b/);
        if (stateMatch) {
          stateValue = stateMatch[0];
        } else {
          // Use full text, remove any postal codes
          stateValue = statePart.replace(/\d+/g, '').trim();
        }
      }
    }

    // Fallback: Extract postal code from place_name if still not found
    if (!postalCodeValue) {
      const postalCodePattern = /\b\d{4,7}(-\d{4})?\b/;
      for (const part of placeNameParts) {
        const postalMatch = part.match(postalCodePattern);
        if (postalMatch) {
          postalCodeValue = postalMatch[0];
          break;
        }
      }
    }

    // Fallback: Extract country from place_name if not found in context
    if (!countryValue) {
      // Country is usually the last part
      const lastPart = placeNameParts[placeNameParts.length - 1];
      // Check if it looks like a country (not a number, not empty)
      if (lastPart && !/^\d+$/.test(lastPart) && lastPart.length > 1) {
        countryValue = lastPart;
      }
    }

    // Update all fields
    setAddressLine1(addressLine1Value);
    setCity(cityValue);
    setState(stateValue);
    setPostalCode(postalCodeValue);
    setCountry(countryValue.toUpperCase());
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
      // If setting this as default, first unset all other defaults for this user
      if (isDefault) {
        await savedAddressesService.unsetDefaultForUser(user.id, isEditing ? String(id) : undefined);
      }

      const addressData = {
        user_id: user.id,
        label: label.trim() || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim() || '',
        postal_code: postalCode.trim(),
        country: country.trim().toUpperCase(), // Convert to uppercase
        phone: phone.trim(),
        is_default: isDefault,
      };

      if (isEditing && id) {
        await savedAddressesService.update(String(id), user.id, addressData);
        showSuccessToast('Address updated successfully');
      } else {
        await savedAddressesService.create(addressData);
        showSuccessToast('Address added successfully');
      }

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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={isLoading}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-inter-bold text-black">{isEditing ? 'Edit' : 'Add'} Address</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={isSaving}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">{isEditing ? 'Edit' : 'Add'} Address</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-4">
            {/* Info Banner */}
            <View className="bg-blue-500/10 rounded-lg p-4 mb-6 flex-row items-start">
              <Feather name="info" color="#007AFF" size={18} />
              <Text className="flex-1 text-blue-700 text-sm font-inter-semibold ml-3">
                {isEditing ? 'Update your saved address details' : 'Add a new shipping address to your account'}
              </Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-lg p-4 mb-4 shadow-lg">
              <InputComponent
                value={label}
                label="Address Label (Optional)"
                size="small"
                required={true}
                placeholder="e.g., Home, Work, Mom's House"
                onChangeText={(text) => setLabel(text)}
              />
            </View>

            <View className="bg-white rounded-lg gap-4 p-4 mb-4 shadow-lg">
              <Text className="text-lg font-inter-bold text-black">Personal Information</Text>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <InputComponent
                    value={firstName}
                    label="First Name"
                    size="small"
                    required={true}
                    placeholder="John"
                    onChangeText={(text) => setFirstName(text)}
                  />
                </View>

                <View className="flex-1">
                  <InputComponent
                    value={lastName}
                    label="Last Name"
                    size="small"
                    required={true}
                    placeholder="Doe"
                    onChangeText={(text) => setLastName(text)}
                  />
                </View>
              </View>

              <InputComponent
                value={phone}
                label="Phone Number"
                size="small"
                required={true}
                placeholder="+1 (555) 123-4567"
                onChangeText={(text) => setPhone(text)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Address Details */}
            <View className="bg-white rounded-lg gap-4 p-4 mb-4 shadow-lg">
              <Text className="text-lg font-inter-bold text-black">Address Details</Text>

              <InputComponent
                value={addressLine1}
                label="Address Line 1"
                size="small"
                required={true}
                placeholder="Start typing your address..."
                onChangeText={(text) => setAddressLine1(text)}
              />

              <InputComponent
                value={addressLine2}
                label="Address Line 2"
                size="small"
                required={false}
                placeholder="Apt, suite, etc. (optional)"
                onChangeText={(text) => setAddressLine2(text)}
              />

              <InputComponent
                value={city}
                label="City"
                size="small"
                required={true}
                placeholder="New York"
                onChangeText={(text) => setCity(text)}
              />

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <InputComponent
                    value={state}
                    label="State"
                    size="small"
                    required={true}
                    placeholder="NY"
                    onChangeText={(text) => setState(text)}
                  />
                </View>

                <View className="flex-1">
                  <InputComponent
                    value={postalCode}
                    label="Postal Code"
                    size="small"
                    required={true}
                    placeholder="10001"
                    onChangeText={(text) => setPostalCode(text)}
                  />
                </View>
              </View>

              <InputComponent
                value={country}
                label="Country"
                size="small"
                required={true}
                placeholder="US"
                onChangeText={(text) => setCountry(text.toUpperCase())}
              />
            </View>

            {/* Default Address Toggle */}
            <View className="bg-white rounded-lg p-4 mb-4 shadow-lg">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-gray-900 text-base font-inter-bold mb-1">Set as default address</Text>
                  <Text className="text-gray-600 text-sm font-inter">
                    Use this address as your primary shipping address
                  </Text>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  disabled={isSaving}
                  trackColor={{ false: '#D1D5DB', true: '#000' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveAddress}
              disabled={isSaving}
              className={`rounded-lg py-4 px-6 items-center shadow-sm ${isSaving ? 'bg-gray-400' : 'bg-black'}`}
            >
              {isSaving ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="ml-2 text-white text-base font-inter-bold">Saving...</Text>
                </View>
              ) : (
                <Text className="text-white text-base font-inter-bold">{isEditing ? 'Update' : 'Save'} Address</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
