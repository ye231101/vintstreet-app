import { Product } from '@/api/services/listings.service';
import { useCart } from '@/hooks/use-cart';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CheckoutItem {
  product?: Product;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface ShippingAddressErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface BillingAddressErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardholderName: string;
  country: string;
  zipCode: string;
}

interface CardDetailsErrors {
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
  cardholderName?: string;
  country?: string;
  zipCode?: string;
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
    {error && <Text className="mt-1 text-xs font-inter text-red-400">{error}</Text>}
  </View>
);

export default function CheckoutScreen() {
  const { productId } = useLocalSearchParams();

  const { cart, isLoading } = useCart();
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem>();

  // Step completion tracking
  const [stepCompleted, setStepCompleted] = useState([false, false, false]);

  // Form states
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'United Kingdom',
  });

  const [isBillingDifferent, setIsBillingDifferent] = useState(false);
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'United Kingdom',
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    country: 'United Kingdom',
    zipCode: '',
  });

  // Error states
  const [shippingAddressErrors, setShippingAddressErrors] = useState<ShippingAddressErrors>({});
  const [billingAddressErrors, setBillingAddressErrors] = useState<BillingAddressErrors>({});
  const [cardDetailsErrors, setCardDetailsErrors] = useState<CardDetailsErrors>({});

  // Address search state
  const [addressSearch, setAddressSearch] = useState('');

  // Progress values for inline Progress Indicator
  const completedSteps = stepCompleted.filter((step) => step).length;
  const totalSteps = stepCompleted.length;
  const progress = totalSteps === 0 ? 0 : completedSteps / totalSteps;

  useEffect(() => {
    loadCheckoutData();
  }, [productId]);

  useEffect(() => {
    updateStepCompletion();
  }, [shippingAddress, isBillingDifferent, billingAddress, cardDetails]);

  const loadCheckoutData = () => {
    const cartItem = cart.items.filter((item) => productId === item.product?.id);

    const item: CheckoutItem = {
      product: cartItem[0]?.product,
    };

    setCheckoutItem(item);
  };

  // Update functions that clear errors when typing
  const updateShippingAddress = useCallback((field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setShippingAddressErrors((prev) => {
      if (prev[field as keyof ShippingAddressErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  const updateBillingAddress = useCallback((field: keyof BillingAddress, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setBillingAddressErrors((prev) => {
      if (prev[field as keyof BillingAddressErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  const updateCardDetails = useCallback((field: keyof CardDetails, value: string) => {
    setCardDetails((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setCardDetailsErrors((prev) => {
      if (prev[field as keyof CardDetailsErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  const updateStepCompletion = () => {
    const shippingComplete =
      shippingAddress.firstName.trim() !== '' &&
      shippingAddress.lastName.trim() !== '' &&
      shippingAddress.email.trim() !== '' &&
      shippingAddress.phone.trim() !== '' &&
      shippingAddress.address1.trim() !== '' &&
      shippingAddress.city.trim() !== '' &&
      shippingAddress.state.trim() !== '' &&
      shippingAddress.postcode.trim() !== '';

    const billingComplete = isBillingDifferent
      ? billingAddress.firstName.trim() !== '' &&
        billingAddress.lastName.trim() !== '' &&
        billingAddress.email.trim() !== '' &&
        billingAddress.phone.trim() !== '' &&
        billingAddress.address1.trim() !== '' &&
        billingAddress.city.trim() !== '' &&
        billingAddress.state.trim() !== '' &&
        billingAddress.postcode.trim() !== ''
      : shippingComplete;

    const paymentComplete =
      cardDetails.cardNumber.trim() !== '' &&
      cardDetails.expiryDate.trim() !== '' &&
      cardDetails.cvc.trim() !== '' &&
      cardDetails.cardholderName.trim() !== '' &&
      cardDetails.country.trim() !== '' &&
      cardDetails.zipCode.trim() !== '';

    setStepCompleted([shippingComplete, billingComplete, paymentComplete]);
  };

  const canProceedToCheckout = () => {
    return stepCompleted.every((step) => step);
  };

  const getValidationMessage = () => {
    const missingFields = [];

    if (!stepCompleted[0]) missingFields.push('Shipping address');
    if (!stepCompleted[1]) missingFields.push('Billing details');
    if (!stepCompleted[2]) missingFields.push('Payment method');

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

    Alert.alert('Checkout', 'This would process the payment and create the order');
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
        className="p-4 bg-gray-50"
      >
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
              <Text className="mb-1 text-sm font-inter-bold text-gray-800">{checkoutItem?.product?.product_name}</Text>
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

        {/* Progress Indicator */}
        <View className="bg-white rounded-xl p-5">
          <View className="flex-row items-center mb-3">
            <Feather name="check-square" color="#007AFF" size={20} />
            <Text className="text-base font-inter-bold text-gray-800 ml-2 flex-1">Checkout Progress</Text>
            <Text className="text-sm font-inter text-gray-600">
              {completedSteps} of {totalSteps} completed
            </Text>
          </View>

          <View className="h-2 bg-gray-300 rounded mb-2">
            <View
              className={`h-2 rounded ${progress === 1 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </View>

          <Text className={`text-xs ${progress === 1 ? 'font-inter-bold text-green-500' : 'font-inter text-gray-600'}`}>
            {progress === 1
              ? 'All steps completed! You can now place your order.'
              : 'Complete all steps to place your order.'}
          </Text>
        </View>

        {/* Shipping Address */}
        <View className="bg-white rounded-xl">
          {/* Section Header */}
          <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
            <View
              className={`w-10 h-10 mr-4 rounded-full justify-center items-center ${
                stepCompleted[0] ? 'bg-green-500' : 'bg-gray-100'
              }`}
            >
              {stepCompleted[0] ? (
                <Feather name="check" color="#fff" size={20} />
              ) : (
                <Feather name="map-pin" color="#666" size={20} />
              )}
            </View>

            <Text className="flex-1 text-base font-inter-bold text-gray-800">Shipping Address</Text>
          </View>

          {/* Section Content */}
          <View className="p-5">
            <InputField
              label="Enter Shipping Address"
              value={addressSearch}
              onChangeText={setAddressSearch}
              placeholder="Search for your address..."
              autoCapitalize="none"
              icon="search"
            />

            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <InputField
                  label="First Name"
                  value={shippingAddress.firstName}
                  onChangeText={(text) => updateShippingAddress('firstName', text)}
                  placeholder="First Name"
                  autoCapitalize="none"
                  icon="user"
                  required
                  error={shippingAddressErrors.firstName}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="Last Name"
                  value={shippingAddress.lastName}
                  onChangeText={(text) => updateShippingAddress('lastName', text)}
                  placeholder="Last Name"
                  autoCapitalize="none"
                  icon="user"
                  required
                  error={shippingAddressErrors.lastName}
                />
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <InputField
                  label="Email"
                  value={shippingAddress.email}
                  onChangeText={(text) => updateShippingAddress('email', text)}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail"
                  required
                  error={shippingAddressErrors.email}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="Phone"
                  value={shippingAddress.phone}
                  onChangeText={(text) => updateShippingAddress('phone', text)}
                  placeholder="Phone"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  icon="phone"
                  required
                  error={shippingAddressErrors.phone}
                />
              </View>
            </View>

            <InputField
              label="Address Line 1"
              value={shippingAddress.address1}
              onChangeText={(text) => updateShippingAddress('address1', text)}
              placeholder="Address Line 1"
              autoCapitalize="none"
              icon="home"
              required
              error={shippingAddressErrors.address1}
            />

            <InputField
              label="Address Line 2 (Optional)"
              value={shippingAddress.address2 || ''}
              onChangeText={(text) => updateShippingAddress('address2', text)}
              placeholder="Address Line 2 (Optional)"
              autoCapitalize="none"
              icon="home"
            />

            <InputField
              label="City"
              value={shippingAddress.city}
              onChangeText={(text) => updateShippingAddress('city', text)}
              placeholder="City"
              autoCapitalize="none"
              required
              error={shippingAddressErrors.city}
            />

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <InputField
                  label="State/Country"
                  value={shippingAddress.state}
                  onChangeText={(text) => updateShippingAddress('state', text)}
                  placeholder="State/Country"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-1 ml-2">
                <InputField
                  label="Postcode"
                  value={shippingAddress.postcode}
                  onChangeText={(text) => updateShippingAddress('postcode', text)}
                  placeholder="Postcode"
                  autoCapitalize="none"
                  required
                  error={shippingAddressErrors.postcode}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Billing Details */}
        <View className="bg-white rounded-xl">
          {/* Section Header */}
          <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
            <View
              className={`w-10 h-10 mr-4 rounded-full justify-center items-center ${
                stepCompleted[1] ? 'bg-green-500' : 'bg-gray-100'
              }`}
            >
              {stepCompleted[1] ? (
                <Feather name="check" color="#fff" size={20} />
              ) : (
                <Feather name="home" color="#666" size={20} />
              )}
            </View>

            <Text className="flex-1 text-base font-inter-bold text-gray-800">Billing Details</Text>
          </View>

          {/* Section Content */}
          <View className="p-5">
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 ml-2 text-base font-inter-bold text-gray-800">
                Is billing address different from shipping address?
              </Text>
              <Switch
                value={isBillingDifferent}
                onValueChange={setIsBillingDifferent}
                trackColor={{ false: '#e5e5e5', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            <Text className="my-4 text-sm font-inter text-gray-600">
              {isBillingDifferent
                ? 'Please enter your billing address below'
                : 'Billing address will be the same as shipping address'}
            </Text>

            {isBillingDifferent && (
              <>
                <Text className="my-4 text-base font-inter-bold text-gray-800">Billing Address</Text>

                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <InputField
                      label="First Name"
                      value={billingAddress.firstName}
                      onChangeText={(text) => updateBillingAddress('firstName', text)}
                      placeholder="First Name"
                      autoCapitalize="none"
                      icon="user"
                      required
                      error={billingAddressErrors.firstName}
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Last Name"
                      value={billingAddress.lastName}
                      onChangeText={(text) => updateBillingAddress('lastName', text)}
                      placeholder="Last Name"
                      autoCapitalize="none"
                      icon="user"
                      required
                      error={billingAddressErrors.lastName}
                    />
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <InputField
                      label="Email"
                      value={billingAddress.email}
                      onChangeText={(text) => updateBillingAddress('email', text)}
                      placeholder="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      icon="mail"
                      required
                      error={billingAddressErrors.email}
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Phone"
                      value={billingAddress.phone}
                      onChangeText={(text) => updateBillingAddress('phone', text)}
                      placeholder="Phone"
                      keyboardType="numeric"
                      autoCapitalize="none"
                      icon="phone"
                      required
                      error={billingAddressErrors.phone}
                    />
                  </View>
                </View>

                <InputField
                  label="Address Line 1"
                  value={billingAddress.address1}
                  onChangeText={(text) => updateBillingAddress('address1', text)}
                  placeholder="Address Line 1"
                  autoCapitalize="none"
                  icon="home"
                  required
                  error={billingAddressErrors.address1}
                />

                <InputField
                  label="Address Line 2 (Optional)"
                  value={billingAddress.address2 || ''}
                  onChangeText={(text) => updateBillingAddress('address2', text)}
                  placeholder="Address Line 2 (Optional)"
                  autoCapitalize="none"
                  icon="home"
                />

                <InputField
                  label="City"
                  value={billingAddress.city}
                  onChangeText={(text) => updateBillingAddress('city', text)}
                  placeholder="City"
                  autoCapitalize="none"
                  required
                  error={billingAddressErrors.city}
                />

                <View className="flex-row items-center gap-2">
                  <View className="flex-1 mr-2">
                    <InputField
                      label="State/Country"
                      value={billingAddress.state}
                      onChangeText={(text) => updateBillingAddress('state', text)}
                      placeholder="State/Country"
                      autoCapitalize="none"
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="Postcode"
                      value={billingAddress.postcode}
                      onChangeText={(text) => updateBillingAddress('postcode', text)}
                      placeholder="Postcode"
                      autoCapitalize="none"
                      required
                      error={billingAddressErrors.postcode}
                    />
                  </View>
                </View>
              </>
            )}

            <View className="bg-blue-50 rounded-lg p-3 flex-row items-center">
              <Feather name="shield" color="#1976d2" size={16} />
              <Text className="text-sm font-inter text-blue-600 ml-2 flex-1">
                Your billing information is securely stored and only used for order processing.
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View className="bg-white rounded-xl">
          {/* Section Header */}
          <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
            <View
              className={`w-10 h-10 mr-4 rounded-full justify-center items-center ${
                stepCompleted[2] ? 'bg-green-500' : 'bg-gray-100'
              }`}
            >
              {stepCompleted[2] ? (
                <Feather name="check" color="#fff" size={20} />
              ) : (
                <Feather name="credit-card" color="#666" size={20} />
              )}
            </View>

            <Text className="flex-1 text-base font-inter-bold text-gray-800">Payment Information</Text>
          </View>

          {/* Section Content */}
          <View className="p-5">
            <Text className="text-base font-inter-bold text-gray-800 mb-4">Payment Method</Text>

            {/* Credit/Debit Card Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('card')}
              className={`flex-row items-center mb-3 p-4 rounded-lg border ${
                paymentMethod === 'card' ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Feather name="credit-card" color={paymentMethod === 'card' ? '#1976d2' : '#666'} size={20} />
              <View className="flex-1 ml-3">
                <Text
                  className={`text-base font-inter-bold ${
                    paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-800'
                  }`}
                >
                  Credit/Debit Card
                </Text>
                <Text className={`text-sm font-inter ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Visa, Mastercard, American Express
                </Text>
              </View>
              {paymentMethod === 'card' && <Feather name="check" color="#1976d2" size={20} />}
            </TouchableOpacity>

            {/* Google Pay Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('googlepay')}
              className={`flex-row items-center mb-3 p-4 rounded-lg border ${
                paymentMethod === 'googlepay' ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Feather name="smartphone" color={paymentMethod === 'googlepay' ? '#1976d2' : '#666'} size={20} />
              <View className="flex-1 ml-3">
                <Text
                  className={`text-base font-inter-bold ${
                    paymentMethod === 'googlepay' ? 'text-blue-600' : 'text-gray-800'
                  }`}
                >
                  Google Pay
                </Text>
                <Text
                  className={`text-sm font-inter ${paymentMethod === 'googlepay' ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  Google Pay (availability will be checked at payment)
                </Text>
              </View>
              {paymentMethod === 'googlepay' && <Feather name="check" color="#1976d2" size={20} />}
            </TouchableOpacity>

            {paymentMethod === 'card' && (
              <>
                <Text className="my-4 text-base font-inter-bold text-gray-800">Card Details</Text>

                <InputField
                  label="Card Number"
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => updateCardDetails('cardNumber', text)}
                  placeholder="Card number"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  required
                  // error={cardDetailsErrors.cardNumber}
                />

                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <InputField
                      label="Expiry Date"
                      value={cardDetails.expiryDate}
                      onChangeText={(text) => updateCardDetails('expiryDate', text)}
                      placeholder="MM/YY"
                      keyboardType="numeric"
                      autoCapitalize="none"
                      required
                      error={cardDetailsErrors.expiryDate}
                    />
                  </View>
                  <View className="flex-1">
                    <InputField
                      label="CVC"
                      value={cardDetails.cvc}
                      onChangeText={(text) => updateCardDetails('cvc', text)}
                      placeholder="CVC"
                      keyboardType="numeric"
                      autoCapitalize="none"
                      required
                      error={cardDetailsErrors.cvc}
                    />
                  </View>
                </View>

                <InputField
                  label="Cardholder Name"
                  value={cardDetails.cardholderName}
                  onChangeText={(text) => updateCardDetails('cardholderName', text)}
                  placeholder="Cardholder Name"
                  icon="user"
                  required
                  error={cardDetailsErrors.cardholderName}
                />

                <InputField
                  label="Country"
                  value={cardDetails.country}
                  onChangeText={(text) => updateCardDetails('country', text)}
                  placeholder="Country"
                  autoCapitalize="none"
                />

                <InputField
                  label="ZIP Code"
                  value={cardDetails.zipCode}
                  onChangeText={(text) => updateCardDetails('zipCode', text)}
                  placeholder="ZIP Code"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  error={cardDetailsErrors.zipCode}
                />
              </>
            )}

            <View className="flex-row items-center p-3 rounded-lg bg-blue-50">
              <Feather name="shield" color="#1976d2" size={16} />
              <Text className="text-sm font-inter text-blue-600 ml-2 flex-1">
                Your payment information is securely processed by Stripe and never stored on our servers.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View className="p-5 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={processCheckout}
          className={`rounded-2xl py-4 items-center ${canProceedToCheckout() ? 'bg-black' : 'bg-orange-500'}`}
        >
          <Text className="text-white text-base font-inter-bold">
            {canProceedToCheckout() ? 'Complete Order' : 'Complete Required Fields'}
          </Text>
          {!canProceedToCheckout() && (
            <Text className="text-white text-xs font-inter mt-1 text-center">{getValidationMessage()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
