import {
  BuyerProfile,
  buyerService,
  CartItem,
  ordersService,
  ShippingOption,
  shippingService,
  stripeService,
} from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ShippingInformation {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
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
  postalCode?: string;
  country?: string;
  phone?: string;
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
  const { productId, sellerId, productIds } = useLocalSearchParams();

  const { cart, isLoading, refreshCart, removeItem } = useCart();
  const { user } = useAuth();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
    postalCode: '',
    country: 'GB',
    phone: '',
  });
  const [shippingInformationErrors, setShippingInformationErrors] = useState<ShippingInformationErrors>({});

  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [shippingMethods, setShippingMethods] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
  }, [productId, sellerId, productIds]);

  useEffect(() => {
    if (sellerId) {
      fetchShippingOptions();
    }
  }, [sellerId]);

  useEffect(() => {
    if (user?.id) {
      fetchBuyerProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    updateStepCompletion();
  }, [shippingInformation, selectedShippingMethod, shippingMethods]);

  const loadCheckoutData = () => {
    if (sellerId && productIds) {
      // Seller-based checkout with multiple products
      const productIdArray = (productIds as string).split(',');
      const cartItems = cart.items.filter(
        (item) => productIdArray.includes(item.product?.id || '') && item.product?.seller_id === sellerId
      );

      setCheckoutItems(cartItems);

      // Set seller info from the first item
      if (cartItems.length > 0 && cartItems[0].product?.seller_info_view) {
        setSellerInfo(cartItems[0].product.seller_info_view);
      }
    } else if (productId) {
      // Single product checkout (legacy support)
      const cartItem = cart.items.filter((item) => productId === item.product?.id);

      setCheckoutItems(cartItem);
      if (cartItem[0]?.product?.seller_info_view) {
        setSellerInfo(cartItem[0]?.product.seller_info_view);
      }
    }
  };

  const fetchShippingOptions = async () => {
    if (!sellerId || Array.isArray(sellerId)) return;

    setShippingLoading(true);
    try {
      const options = await shippingService.getSellerShippingOptionsForBuyer(sellerId);
      setShippingMethods(options);

      // Auto-select the first option if available
      if (options.length > 0) {
        setSelectedShippingMethod(options[0].id);
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      setShippingMethods([]);
    } finally {
      setShippingLoading(false);
    }
  };

  const fetchBuyerProfile = async () => {
    if (!user?.id) return;

    setProfileLoading(true);
    try {
      const profile = await buyerService.getBuyerProfile(user.id);
      setBuyerProfile(profile);

      // Pre-fill shipping information if available
      if (profile) {
        const shippingAddress = buyerService.getShippingAddress(profile);
        if (shippingAddress) {
          setShippingInformation({
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address1: shippingAddress.addressLine1,
            address2: shippingAddress.addressLine2 || '',
            city: shippingAddress.city,
            state: shippingAddress.state || '',
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
    } finally {
      setProfileLoading(false);
    }
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

  const validateShippingInformation = () => {
    const errors: ShippingInformationErrors = {};

    if (!shippingInformation.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!shippingInformation.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!shippingInformation.address1.trim()) {
      errors.address1 = 'Address is required';
    }
    if (!shippingInformation.city.trim()) {
      errors.city = 'City is required';
    }
    if (!shippingInformation.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    if (!shippingInformation.country.trim()) {
      errors.country = 'Country is required';
    }

    setShippingInformationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateStepCompletion = () => {
    const shippingComplete =
      shippingInformation.firstName.trim() !== '' &&
      shippingInformation.lastName.trim() !== '' &&
      shippingInformation.address1.trim() !== '' &&
      shippingInformation.city.trim() !== '' &&
      shippingInformation.postalCode.trim() !== '' &&
      shippingInformation.country.trim() !== '';

    const shippingMethodComplete = selectedShippingMethod.trim() !== '' && shippingMethods.length > 0;

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

  const processCheckout = async () => {
    if (!canProceedToCheckout()) {
      showWarningToast(getValidationMessage());
      return;
    }

    // Validate shipping information
    if (!validateShippingInformation()) {
      showErrorToast('Please fill in all required fields correctly.');
      return;
    }

    if (!user?.id) {
      showErrorToast('You must be logged in to complete checkout.');
      return;
    }

    setCheckoutLoading(true);

    try {
      // Get the selected shipping method
      const selectedShipping = shippingMethods.find((method) => method.id === selectedShippingMethod);
      if (!selectedShipping) {
        throw new Error('Selected shipping method not found');
      }

      // Calculate total order amount
      const subtotal = checkoutItems.reduce((total, item) => {
        const price =
          item.product?.discounted_price !== null
            ? item.product?.discounted_price || 0
            : item.product?.starting_price || 0;
        return total + price;
      }, 0);

      const totalAmount = subtotal + selectedShipping.price;

      // Create orders for each item (since each item might have different sellers)
      const orderPromises = checkoutItems.map(async (item) => {
        if (!item.product?.id || !item.product?.seller_id) {
          throw new Error('Invalid product data');
        }

        return ordersService.createOrder({
          listing_id: item.product.id,
          buyer_id: user.id,
          seller_id: item.product.seller_id,
          stream_id: 'marketplace-order',
          order_amount:
            (item.product.discounted_price !== null ? item.product.discounted_price : item.product.starting_price) +
            selectedShipping.price / checkoutItems.length,
          quantity: 1,
          status: 'pending',
          delivery_status: 'processing',
        });
      });

      // Wait for all orders to be created
      const orders = await Promise.all(orderPromises);

      // Prepare order data for Stripe checkout (matching web implementation)
      const createdOrders = orders.map((order) => {
        const cartItem = checkoutItems.find((item) => item.product?.id === order.listing_id);
        const product = cartItem?.product;

        return {
          id: order.id,
          seller_id: order.seller_id ?? '',
          product_name: product?.product_name ?? 'Product',
          seller_name:
            product?.seller_info_view?.shop_name ?? product?.seller_info_view?.display_name_format ?? 'Seller',
          price: order.order_amount ?? 0,
          quantity: order.quantity ?? 1,
        };
      });

      // Process payment with Stripe using StripeService
      const paymentResult = await stripeService.processPayment({
        orders: createdOrders,
        shippingCost: selectedShipping.price,
      });

      if (paymentResult.success) {
        // Remove only the items included in this checkout
        const listingIdsToRemove = checkoutItems
          .map((item) => item.product?.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);

        if (listingIdsToRemove.length > 0) {
          await Promise.all(listingIdsToRemove.map((listingId) => removeItem(listingId)));
          // Refresh cart state in the app
          await refreshCart();
        }

        // Show success message
        showSuccessToast('Your order is created. Redirecting to Stripe to complete payment.');
      } else {
        // Payment initiation failed
        showErrorToast('Failed to set up payment. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showErrorToast(
        error instanceof Error ? error.message : 'An error occurred while processing your order. Please try again.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text numberOfLines={1} className="flex-1 ml-4 text-lg font-inter-bold text-white">
            {sellerId && checkoutItems.length > 1
              ? `Checkout with ${sellerInfo?.shop_name || 'Seller'} (${checkoutItems.length} items)`
              : checkoutItems[0]?.product?.product_name || 'Checkout'}
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
          {sellerId && checkoutItems.length > 1
            ? `Checkout with ${sellerInfo?.shop_name || 'Seller'} (${checkoutItems.length} items)`
            : checkoutItems[0]?.product?.product_name || 'Checkout'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="gap-4 p-4 bg-gray-50">
            {/* Shipping Information */}
            <View className="bg-white rounded-xl">
              {/* Section Header */}
              <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
                <Feather name="box" color="#666" size={20} />
                <Text className="flex-1 ml-2 text-base font-inter-bold text-gray-800">Shipping Information</Text>
                {profileLoading && <ActivityIndicator size="small" color="#666" />}
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
                      value={shippingInformation.postalCode}
                      onChangeText={(text) => updateShippingAddress('postalCode', text)}
                      placeholder="Postal Code"
                      autoCapitalize="none"
                      required
                      error={shippingInformationErrors.postalCode}
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
                <Text className="mb-4 text-sm font-inter-semibold text-gray-600">
                  Shipping for {checkoutItems.length} item{checkoutItems.length !== 1 ? 's' : ''}
                </Text>

                {shippingLoading ? (
                  <View className="flex-row items-center justify-center py-4">
                    <ActivityIndicator size="small" color="#000" />
                    <Text className="ml-2 text-sm text-gray-600">Loading shipping options...</Text>
                  </View>
                ) : shippingMethods.length > 0 ? (
                  <View className="gap-2">
                    {shippingMethods.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => setSelectedShippingMethod(option.id)}
                        className={`flex-row items-center justify-between p-3 border rounded-lg ${
                          selectedShippingMethod === option.id ? 'border-black bg-black/10' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className={`w-4 h-4 rounded-full border-2 ${
                              selectedShippingMethod === option.id ? 'border-black bg-black' : 'border-gray-300'
                            }`}
                          >
                            {selectedShippingMethod === option.id && (
                              <View className="w-2 h-2 rounded-full bg-white m-0.5" />
                            )}
                          </View>
                          <View>
                            <Text className="text-sm font-inter-semibold text-gray-800">{option.name}</Text>
                            {option.estimated_days_min && option.estimated_days_max && (
                              <Text className="text-xs text-gray-600">
                                Estimated delivery: {option.estimated_days_min}-{option.estimated_days_max} days
                              </Text>
                            )}
                          </View>
                        </View>
                        <Text className="text-sm font-inter-bold text-gray-800">
                          {option.price === 0
                            ? 'Free'
                            : `£${option.price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
                    <Text className="text-sm font-inter-semibold text-yellow-700">No shipping options available</Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      The seller has not configured shipping options yet
                    </Text>
                  </View>
                )}
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

            {/* Order Summary */}
            <View className="bg-white rounded-xl">
              {/* Header */}
              <View className="p-4 rounded-t-xl bg-white border-b border-gray-200">
                <Text className="text-lg font-inter-bold text-gray-800">Order Summary</Text>
              </View>

              {/* Products List */}
              <View className="p-4">
                {checkoutItems.map((item, index) => (
                  <View key={item.product?.id || index} className="flex-row items-center justify-between py-2">
                    <Text className="text-sm font-inter-semibold text-gray-800 flex-1">
                      {item.product?.product_name} x1
                    </Text>
                    <Text className="text-sm font-inter-semibold text-gray-800">
                      £
                      {item.product?.discounted_price !== null
                        ? item.product?.discounted_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : item.product?.starting_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Separator */}
              <View className="h-px bg-gray-200 mx-4" />

              {/* Subtotal and Shipping */}
              <View className="p-4">
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm font-inter-semibold text-gray-800">Subtotal</Text>
                  <Text className="text-sm font-inter-semibold text-gray-800">
                    £
                    {checkoutItems
                      .reduce((total, item) => {
                        const price =
                          item.product?.discounted_price !== null
                            ? item.product?.discounted_price || 0
                            : item.product?.starting_price || 0;
                        return total + price;
                      }, 0)
                      .toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm font-inter-semibold text-gray-800">Shipping</Text>
                  <Text className="text-sm font-inter-semibold text-gray-800">
                    {shippingMethods.find((option) => option.id === selectedShippingMethod)?.price === 0
                      ? 'Free'
                      : `£${shippingMethods
                          .find((option) => option.id === selectedShippingMethod)
                          ?.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </Text>
                </View>
              </View>

              {/* Separator */}
              <View className="h-px bg-gray-200 mx-4" />

              {/* Total */}
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-inter-bold text-gray-800">Total</Text>
                  <Text className="text-base font-inter-bold text-gray-800">
                    £
                    {(
                      checkoutItems.reduce((total, item) => {
                        const price =
                          item.product?.discounted_price !== null
                            ? item.product?.discounted_price || 0
                            : item.product?.starting_price || 0;
                        return total + price;
                      }, 0) + (shippingMethods.find((option) => option.id === selectedShippingMethod)?.price || 0)
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={processCheckout}
            disabled={checkoutLoading || !canProceedToCheckout()}
            className={`rounded-2xl py-4 items-center ${
              canProceedToCheckout() && !checkoutLoading ? 'bg-black' : 'bg-orange-500'
            } ${checkoutLoading ? 'opacity-70' : ''}`}
          >
            {checkoutLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white text-base font-inter-bold ml-2">Processing Order...</Text>
              </View>
            ) : (
              <>
                <Text className="text-white text-base font-inter-bold">
                  {canProceedToCheckout() ? 'Complete Order' : 'Complete Required Fields'}
                </Text>
                {!canProceedToCheckout() && (
                  <Text className="text-white text-xs font-inter-semibold mt-1 text-center">
                    {getValidationMessage()}
                  </Text>
                )}
              </>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
