import { Product } from '@/api';
import { useCart } from '@/hooks/use-cart';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CheckoutItem {
  product?: Product;
}

interface ShippingInformation {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

interface ShippingInformationErrors {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

interface ShippingMethod {
  carrier: string;
  deliveryTime: string;
  cost: string;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  required?: boolean;
  error?: string;
}

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  required = false,
  error,
}: InputFieldProps) => (
  <View className="mb-4">
    <Text className="mb-2 text-sm font-inter-bold text-gray-800">
      {label} {required && <Text className="text-red-500">*</Text>}
    </Text>
    <View
      className={`flex-row items-center px-3 rounded-lg bg-white border ${
        error ? 'border-red-400' : 'border-gray-200'
      }`}
    >
      {icon && <Feather name={icon as any} color={error ? '#f87171' : '#666'} size={16} className="mr-2" />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        className="flex-1 py-3 text-base font-inter"
      />
    </View>
    {error && <Text className="mt-1 text-xs font-inter-semibold text-red-400">{error}</Text>}
  </View>
);

export default function CheckoutScreen() {
  const { productId } = useLocalSearchParams();

  const { cart, isLoading } = useCart();
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem>();

  // Step completion tracking
  const [stepCompleted, setStepCompleted] = useState([false, false]);

  // Form states
  const [shippingInformation, setShippingInformation] = useState<ShippingInformation>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'GB',
    phone: '',
  });
  const [shippingInformationErrors, setShippingInformationErrors] = useState<ShippingInformationErrors>({});

  const [selectedShippingMethod, setSelectedShippingMethod] = useState('DPD');
  const [shippingMethods] = useState<ShippingMethod[]>([
    { carrier: 'DPD', deliveryTime: '1-10 business days', cost: 'Free' },
    { carrier: 'Yodel', deliveryTime: '1-10 business days', cost: 'Free' },
    { carrier: 'Evri', deliveryTime: '1-10 business days', cost: 'Free' },
  ]);

  const [countries] = useState([
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'IE', name: 'Ireland' },
    { code: 'DK', name: 'Denmark' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'PT', name: 'Portugal' },
  ]);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Filter countries based on search
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    loadCheckoutData();
  }, [productId]);

  useEffect(() => {
    updateStepCompletion();
  }, [shippingInformation, selectedShippingMethod]);

  const loadCheckoutData = () => {
    const cartItem = cart.items.filter((item) => productId === item.product?.id);

    const item: CheckoutItem = {
      product: cartItem[0]?.product,
    };

    setCheckoutItem(item);
  };

  // Update functions that clear errors when typing
  const updateShippingAddress = useCallback((field: keyof ShippingInformation, value: string) => {
    setShippingInformation((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setShippingInformationErrors((prev) => {
      if (prev[field as keyof ShippingInformationErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  const updateStepCompletion = () => {
    const shippingComplete =
      shippingInformation.firstName.trim() !== '' &&
      shippingInformation.lastName.trim() !== '' &&
      shippingInformation.address1.trim() !== '' &&
      shippingInformation.city.trim() !== '' &&
      shippingInformation.country.trim() !== '';

    const shippingMethodComplete = selectedShippingMethod.trim() !== '';

    setStepCompleted([shippingComplete, shippingMethodComplete]);
  };

  const canProceedToCheckout = () => {
    return stepCompleted.every((step) => step);
  };

  const getValidationMessage = () => {
    const missingFields = [];

    if (!stepCompleted[0]) missingFields.push('Shipping information');
    if (!stepCompleted[1]) missingFields.push('Shipping method');

    if (missingFields.length === 0) return 'All fields are complete!';
    if (missingFields.length === 1) return `Please complete: ${missingFields[0]}`;
    if (missingFields.length === 2) return `Please complete: ${missingFields[0]} and ${missingFields[1]}`;
    return `Please complete: ${missingFields.slice(0, -1).join(', ')}, and ${missingFields[missingFields.length - 1]}`;
  };

  const processCheckout = () => {
    if (!canProceedToCheckout()) {
      Alert.alert('Complete Required Fields', getValidationMessage());
      return;
    }

    Alert.alert('Checkout', 'This would create the order');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text numberOfLines={1} className="flex-1 ml-4 text-lg font-inter-bold text-white">
            {checkoutItem?.product?.product_name}
          </Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text numberOfLines={1} className="flex-1 ml-4 text-lg font-inter-bold text-white">
          {checkoutItem?.product?.product_name}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="gap-4 p-4 bg-gray-50">
          {/* Order Summary */}
          <View className="bg-white rounded-xl">
            {/* Header */}
            <View className="flex-row items-center p-4 rounded-t-xl bg-white border-b border-gray-200">
              <Feather name="shopping-bag" color="#666" size={20} />
              <Text className="flex-1 ml-2 text-base font-inter-bold text-gray-800">Order Summary</Text>
            </View>

            <View className="flex-row items-center gap-3 p-4">
              <Image
                source={checkoutItem?.product?.product_image}
                contentFit="cover"
                placeholder={{ blurhash }}
                transition={1000}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />

              <View className="flex-1 gap-2">
                <Text className="mb-1 text-sm font-inter-bold text-gray-800">
                  {checkoutItem?.product?.product_name}
                </Text>
                <View className="self-start items-center justify-center px-4 py-1 rounded-full bg-gray-200">
                  <Text className="text-xs font-inter-semibold text-gray-600">
                    {checkoutItem?.product?.product_categories?.name}
                  </Text>
                </View>
              </View>

              <Text className="text-base font-inter-bold text-gray-800">
                £
                {checkoutItem?.product?.discounted_price !== null
                  ? checkoutItem?.product?.discounted_price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : checkoutItem?.product?.starting_price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </Text>
            </View>
          </View>

          {/* Shipping Information */}
          <View className="bg-white rounded-xl">
            {/* Section Header */}
            <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
              <Feather name="box" color="#666" size={20} />
              <Text className="flex-1 ml-2 text-base font-inter-bold text-gray-800">Shipping Information</Text>
            </View>

            {/* Section Content */}
            <View className="p-4">
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <InputField
                    label="First Name"
                    value={shippingInformation.firstName}
                    onChangeText={(text) => updateShippingAddress('firstName', text)}
                    placeholder="First Name"
                    autoCapitalize="none"
                    required
                    error={shippingInformationErrors.firstName}
                  />
                </View>
                <View className="flex-1">
                  <InputField
                    label="Last Name"
                    value={shippingInformation.lastName}
                    onChangeText={(text) => updateShippingAddress('lastName', text)}
                    placeholder="Last Name"
                    autoCapitalize="none"
                    required
                    error={shippingInformationErrors.lastName}
                  />
                </View>
              </View>

              <InputField
                label="Address Line 1"
                value={shippingInformation.address1}
                onChangeText={(text) => updateShippingAddress('address1', text)}
                placeholder="Address Line 1"
                autoCapitalize="none"
                required
                error={shippingInformationErrors.address1}
              />

              <InputField
                label="Address Line 2"
                value={shippingInformation.address2 || ''}
                onChangeText={(text) => updateShippingAddress('address2', text)}
                placeholder="Address Line 2"
                autoCapitalize="none"
              />

              <InputField
                label="City"
                value={shippingInformation.city}
                onChangeText={(text) => updateShippingAddress('city', text)}
                placeholder="City"
                autoCapitalize="none"
                required
                error={shippingInformationErrors.city}
              />

              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <InputField
                    label="State/County"
                    value={shippingInformation.state}
                    onChangeText={(text) => updateShippingAddress('state', text)}
                    placeholder="State/County"
                    autoCapitalize="none"
                  />
                </View>
                <View className="flex-1">
                  <InputField
                    label="Postal Code"
                    value={shippingInformation.postcode}
                    onChangeText={(text) => updateShippingAddress('postcode', text)}
                    placeholder="Postal Code"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="mb-2 text-sm font-inter-bold text-gray-800">
                  Country <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCountryPicker(true)}
                  className="flex-row items-center px-3 py-3 rounded-lg bg-white border border-gray-200"
                >
                  <Text className="flex-1 text-base font-inter-semibold text-gray-800">
                    {countries.find((c) => c.code === shippingInformation.country)?.name || 'Select Country'}
                  </Text>
                  <Feather name="chevron-down" color="#666" size={20} />
                </TouchableOpacity>
                <Text className="mt-1 text-xs font-inter-semibold text-gray-600">
                  Changing country may affect shipping costs.
                </Text>
              </View>

              <InputField
                label="Phone"
                value={shippingInformation.phone}
                onChangeText={(text) => updateShippingAddress('phone', text)}
                placeholder="Phone"
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Shipping Method */}
          <View className="bg-white rounded-xl">
            {/* Section Header */}
            <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
              <Feather name="truck" color="#666" size={20} />
              <Text className="flex-1 ml-2 text-base font-inter-bold text-gray-800">Shipping Method</Text>
            </View>

            {/* Section Content */}
            <View className="p-4">
              <Text className="mb-4 text-sm font-inter-semibold text-gray-600">Shipping for 1 item(s)</Text>

              {shippingMethods.map((method, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedShippingMethod(method.carrier)}
                  className={`flex-row items-center mb-3 p-4 rounded-lg border ${
                    selectedShippingMethod === method.carrier
                      ? 'bg-blue-50 border-blue-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      selectedShippingMethod === method.carrier ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {selectedShippingMethod === method.carrier && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-inter-bold ${
                        selectedShippingMethod === method.carrier ? 'text-blue-600' : 'text-gray-800'
                      }`}
                    >
                      {method.carrier}
                    </Text>
                    <Text
                      className={`text-sm font-inter-semibold ${
                        selectedShippingMethod === method.carrier ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {method.deliveryTime}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-inter-bold ${
                      selectedShippingMethod === method.carrier ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {method.cost}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment */}
          <View className="bg-white rounded-xl">
            {/* Section Header */}
            <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
              <Feather name="credit-card" color="#666" size={20} />
              <Text className="flex-1 ml-2 text-base font-inter-bold text-gray-800">Payment</Text>
            </View>

            {/* Section Content */}
            <View className="p-4">
              <Text className="text-base font-inter-bold text-gray-800 mb-2">Secure Payment via Stripe</Text>
              <Text className="text-sm font-inter-semibold text-gray-600">
                You'll be redirected to Stripe's secure checkout to complete your payment. Your card details are never
                stored on our servers.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={processCheckout}
          className={`rounded-2xl py-4 items-center ${canProceedToCheckout() ? 'bg-black' : 'bg-orange-500'}`}
        >
          <Text className="text-white text-base font-inter-bold">
            {canProceedToCheckout() ? 'Complete Order' : 'Complete Required Fields'}
          </Text>
          {!canProceedToCheckout() && (
            <Text className="text-white text-xs font-inter-semibold mt-1 text-center">{getValidationMessage()}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-96">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-inter-bold text-gray-800">Select Country</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCountryPicker(false);
                  setCountrySearch('');
                }}
              >
                <Feather name="x" color="#666" size={24} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-4 py-3 border-b border-gray-200">
              <View className="flex-row items-center px-3 rounded-lg bg-gray-100">
                <Feather name="search" color="#666" size={16} />
                <TextInput
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Search countries..."
                  className="flex-1 py-2 px-2 text-base font-inter"
                  autoCapitalize="none"
                />
                {countrySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCountrySearch('')}>
                    <Feather name="x" color="#666" size={16} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView className="max-h-80">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      updateShippingAddress('country', country.code);
                      setShowCountryPicker(false);
                      setCountrySearch('');
                    }}
                    className={`p-4 border-b border-gray-100 ${
                      shippingInformation.country === country.code ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text
                          className={`text-base font-inter-semibold ${
                            shippingInformation.country === country.code
                              ? 'text-blue-600 font-inter-bold'
                              : 'text-gray-800'
                          }`}
                        >
                          {country.name}
                        </Text>
                        <Text
                          className={`text-sm font-inter-semibold ${
                            shippingInformation.country === country.code ? 'text-blue-500' : 'text-gray-500'
                          }`}
                        >
                          {country.code}
                        </Text>
                      </View>
                      {shippingInformation.country === country.code && (
                        <Feather name="check" color="#007AFF" size={20} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="p-8 items-center">
                  <Feather name="search" color="#999" size={32} />
                  <Text className="text-gray-500 font-inter-semibold mt-2">No countries found</Text>
                  <Text className="text-gray-400 font-inter-semibold text-sm mt-1">Try a different search term</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
