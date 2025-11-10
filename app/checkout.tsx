import {
  CartItem,
  ordersService,
  SavedAddress,
  savedAddressesService,
  ShippingOption,
  shippingService,
  stripeService,
} from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { styles } from '@/styles';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
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
  const { sellerId, productIds } = useLocalSearchParams();

  const { cart, isLoading, refreshCart, removeItem } = useCart();
  const { user } = useAuth();
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

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

  // Saved addresses
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [useSavedAddress, setUseSavedAddress] = useState<boolean>(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

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

  // Mapbox address autocomplete
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Filter countries based on search
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    loadCheckoutData();
  }, [sellerId, productIds]);

  useEffect(() => {
    if (sellerId) {
      fetchShippingOptions();
    }
  }, [sellerId]);

  useEffect(() => {
    if (user?.id) {
      loadSavedAddresses();
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

  const loadSavedAddresses = async () => {
    if (!user?.id) return;

    setAddressesLoading(true);
    try {
      const data = await savedAddressesService.list(user.id);
      const list = (data as SavedAddress[]) || [];
      setSavedAddresses(list);

      if (list.length > 0) {
        // Prefer default; else first
        const defaultAddress = list.find((a) => a.is_default) || list[0];
        setSelectedAddressId(defaultAddress.id);
        setUseSavedAddress(true);

        // Apply to form
        setShippingInformation({
          firstName: defaultAddress.first_name,
          lastName: defaultAddress.last_name,
          address1: defaultAddress.address_line1,
          address2: defaultAddress.address_line2 || '',
          city: defaultAddress.city,
          state: defaultAddress.state || '',
          postalCode: defaultAddress.postal_code,
          country: defaultAddress.country,
          phone: defaultAddress.phone || '',
        });
      } else {
        setUseSavedAddress(false);
      }
    } catch (err) {
      console.error('Error loading saved addresses:', err);
      setSavedAddresses([]);
      setUseSavedAddress(false);
    } finally {
      setAddressesLoading(false);
    }
  };

  const applySavedAddressToForm = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setShippingInformation({
      firstName: address.first_name,
      lastName: address.last_name,
      address1: address.address_line1,
      address2: address.address_line2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone || '',
    });
  };

  const clearShippingForm = () => {
    setShippingInformation({
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
    setShippingInformationErrors({});
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

  // Address autocomplete fetch
  const fetchPlaces = async (text: string) => {
    updateShippingAddress('address1', text);

    if (!text || text.length < 3) {
      setAddressResults([]);
      return;
    }

    try {
      setIsSearchingAddress(true);
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${
          process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&autocomplete=true&limit=10&types=address,place,postcode`
      );

      const sorted = (res.data?.features || []).sort((a: any, b: any) => {
        const order: any = { address: 0, place: 1, postcode: 2, region: 3 };
        const aType = a.place_type?.[0] || 'other';
        const bType = b.place_type?.[0] || 'other';
        return (order[aType] ?? 999) - (order[bType] ?? 999);
      });
      setAddressResults(sorted.slice(0, 5));
    } catch (e) {
      setAddressResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // When user selects an address suggestion, parse and populate fields
  const handleAddressSelect = (place: any) => {
    const context = place.context || [];
    const placeType = place.place_type?.[0] || '';

    const placeNameParts = (place.place_name || '').split(',').map((p: string) => p.trim());

    let addressLine1Value = '';
    if (placeType === 'address' && placeNameParts.length > 0) {
      addressLine1Value = placeNameParts[0];
    } else if (placeType === 'postcode' || placeType === 'place') {
      addressLine1Value = '';
    } else if (place.address && place.text) {
      addressLine1Value = `${place.address} ${place.text}`;
    } else if (place.text && placeType === 'address') {
      addressLine1Value = place.text;
    }

    let cityValue = '';
    let stateValue = '';
    let postalCodeValue = '';
    let countryValue = '';

    if (placeType === 'postcode') {
      postalCodeValue = place.text || placeNameParts[0] || '';
    }

    if (place.properties?.postcode && !postalCodeValue) {
      postalCodeValue = place.properties.postcode;
    }

    context.forEach((item: any) => {
      if (item.id.includes('place')) {
        cityValue = item.text;
      } else if (item.id.includes('locality') && !cityValue) {
        cityValue = item.text;
      } else if (item.id.includes('region')) {
        if (item.short_code) {
          const parts = item.short_code.split('-');
          stateValue = parts.length > 1 ? parts[1] : parts[0];
        } else {
          stateValue = item.text;
        }
      } else if (item.id.includes('postcode') && !postalCodeValue) {
        postalCodeValue = item.text;
      } else if (item.id.includes('country')) {
        countryValue = item.short_code || item.text;
      }
    });

    if (!cityValue) {
      if (placeType === 'postcode' && placeNameParts.length > 1) {
        cityValue = placeNameParts[1];
      } else if (placeType === 'place') {
        cityValue = placeNameParts[0] || '';
      } else if (placeNameParts.length > 1) {
        cityValue = placeNameParts[1];
      }
    }

    if (!stateValue) {
      let statePart = '';
      if (placeType === 'postcode' && placeNameParts.length > 2) {
        statePart = placeNameParts[2];
      } else if (placeType === 'place' && placeNameParts.length > 1) {
        statePart = placeNameParts[1];
      } else if (placeNameParts.length > 2) {
        statePart = placeNameParts[2];
      }
      if (statePart) {
        const stateMatch = statePart.match(/\b[A-Z]{2,3}\b/);
        if (stateMatch) {
          stateValue = stateMatch[0];
        } else {
          stateValue = statePart.replace(/\d+/g, '').trim();
        }
      }
    }

    if (!postalCodeValue) {
      const postalCodePattern = /\b\d{4,7}(-\d{4})?\b/;
      for (const part of placeNameParts) {
        const m = part.match(postalCodePattern);
        if (m) {
          postalCodeValue = m[0];
          break;
        }
      }
    }

    if (!countryValue) {
      const lastPart = placeNameParts[placeNameParts.length - 1];
      if (lastPart && !/^\d+$/.test(lastPart) && lastPart.length > 1) {
        countryValue = lastPart;
      }
    }

    setAddressResults([]);
    setShippingInformation((prev) => ({
      ...prev,
      address1: addressLine1Value,
      city: cityValue,
      state: stateValue,
      postalCode: postalCodeValue,
      country: (countryValue || prev.country).toUpperCase(),
    }));
  };

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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text numberOfLines={1} className="flex-1 ml-4 text-lg font-inter-bold text-black">
            {sellerId && checkoutItems.length > 1
              ? `Checkout with ${sellerInfo?.shop_name || 'Seller'} (${checkoutItems.length} items)`
              : checkoutItems[0]?.product?.product_name || 'Checkout'}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text numberOfLines={1} className="flex-1 ml-4 text-lg font-inter-bold text-black">
          {sellerId && checkoutItems.length > 1
            ? `Checkout with ${sellerInfo?.shop_name || 'Seller'} (${checkoutItems.length} items)`
            : checkoutItems[0]?.product?.product_name || 'Checkout'}
        </Text>
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
            {/* Shipping Information */}
            <View className="rounded-lg bg-white shadow-lg">
              {/* Section Header */}
              <View className="flex-row items-center px-5 py-4 rounded-t-2xl bg-white border-b border-gray-200">
                <Feather name="box" color="#666" size={20} />
                <Text className="flex-1 ml-2 text-base font-inter-bold text-black">Shipping Information</Text>
                {addressesLoading && <ActivityIndicator size="small" color="#666" />}
              </View>

              {/* Section Content */}
              <View className="p-4">
                {/* Saved addresses selector */}
                {savedAddresses.length > 0 && (
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-inter-bold text-black">Delivery Address</Text>
                    <TouchableOpacity onPress={() => router.push('/other/addresses' as any)}>
                      <Text className="text-sm font-inter-bold text-gray-800">Manage Addresses</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {addressesLoading ? (
                  <View className="flex-row items-center justify-center py-3">
                    <ActivityIndicator size="small" color="#000" />
                    <Text className="ml-2 text-sm text-gray-600">Loading saved addresses...</Text>
                  </View>
                ) : savedAddresses.length > 0 ? (
                  <View className="gap-4 mb-4">
                    <TouchableOpacity
                      onPress={() => {
                        setUseSavedAddress(true);
                        const addr =
                          savedAddresses.find((a) => a.id === selectedAddressId) ||
                          savedAddresses.find((a) => a.is_default) ||
                          savedAddresses[0];
                        if (addr) applySavedAddressToForm(addr);
                      }}
                      className="flex-row items-center mr-6"
                    >
                      <View
                        className={`w-4 h-4 rounded-full border-2 ${
                          useSavedAddress ? 'border-black bg-black' : 'border-gray-300'
                        }`}
                      >
                        {useSavedAddress && <View className="w-2 h-2 rounded-full bg-white m-0.5" />}
                      </View>
                      <Text className="ml-2 text-sm font-inter-semibold text-gray-800">Use saved address</Text>
                    </TouchableOpacity>

                    {useSavedAddress && (
                      <View className="gap-2">
                        {savedAddresses.map((addr) => (
                          <TouchableOpacity
                            key={addr.id}
                            onPress={() => {
                              setSelectedAddressId(addr.id);
                              applySavedAddressToForm(addr);
                            }}
                            className={`p-3 border rounded-lg ${
                              selectedAddressId === addr.id ? 'border-black bg-black/10' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <View className="gap-1">
                              <View className="flex-row items-center gap-3">
                                <View
                                  className={`w-4 h-4 rounded-full border-2 ${
                                    selectedAddressId === addr.id ? 'border-black bg-black' : 'border-gray-300'
                                  }`}
                                >
                                  {selectedAddressId === addr.id && (
                                    <View className="w-2 h-2 rounded-full bg-white m-0.5" />
                                  )}
                                </View>
                                <View className="flex-row items-center gap-2">
                                  {!!addr.label && (
                                    <Text className="text-sm font-inter-bold text-black">{addr.label}</Text>
                                  )}
                                  {addr.is_default && (
                                    <Text className="text-[10px] px-2 py-0.5 rounded-lg bg-black text-white font-inter-bold">
                                      Default
                                    </Text>
                                  )}
                                </View>
                              </View>

                              <View className="flex-1 ml-7">
                                <Text className="text-sm font-inter-semibold text-black">
                                  {addr.first_name} {addr.last_name}
                                </Text>
                                <Text className="text-xs text-black">{addr.address_line1}</Text>
                                {!!addr.address_line2 && (
                                  <Text className="text-xs text-black">{addr.address_line2}</Text>
                                )}
                                <Text className="text-xs text-black">
                                  {addr.city}
                                  {addr.state ? `, ${addr.state}` : ''} {addr.postal_code}, {addr.country}
                                </Text>
                                {!!addr.phone && <Text className="text-xs text-black">{addr.phone}</Text>}
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setUseSavedAddress(false);
                        clearShippingForm();
                      }}
                      className="flex-row items-center"
                    >
                      <View
                        className={`w-4 h-4 rounded-full border-2 ${
                          !useSavedAddress ? 'border-black bg-black' : 'border-gray-300'
                        }`}
                      >
                        {!useSavedAddress && <View className="w-2 h-2 rounded-full bg-white m-0.5" />}
                      </View>
                      <Text className="ml-2 text-sm font-inter-semibold text-gray-800">Use a different address</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Manual address form */}
                {savedAddresses.length === 0 || !useSavedAddress ? (
                  <>
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

                    <View className="mb-4">
                      <Text className="mb-2 text-sm font-inter-bold text-gray-800">
                        Address Line 1 <Text className="text-red-500">*</Text>
                      </Text>
                      <View className={`relative`}>
                        <View
                          className={`flex-row items-center px-3 rounded-lg bg-white border ${
                            shippingInformationErrors.address1 ? 'border-red-400' : 'border-gray-200'
                          }`}
                        >
                          <TextInput
                            value={shippingInformation.address1}
                            onChangeText={fetchPlaces}
                            placeholder="Start typing your address..."
                            autoCapitalize="words"
                            autoCorrect={false}
                            className="flex-1 py-3 text-base font-inter"
                          />
                          {isSearchingAddress && <ActivityIndicator size="small" color="#9CA3AF" />}
                        </View>
                        {shippingInformationErrors.address1 && (
                          <Text className="mt-1 text-xs font-inter-semibold text-red-400">
                            {shippingInformationErrors.address1}
                          </Text>
                        )}

                        {addressResults.length > 0 && (
                          <View className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                            <ScrollView
                              style={{ maxHeight: 200 }}
                              nestedScrollEnabled
                              keyboardShouldPersistTaps="handled"
                            >
                              {addressResults.map((item: any) => {
                                const placeType = item.place_type?.[0] || '';
                                const icon = placeType === 'address' ? '📍' : placeType === 'place' ? '🏙️' : '📮';
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleAddressSelect(item)}
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
                    </View>

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
                  </>
                ) : null}
              </View>
            </View>

            {/* Shipping Method */}
            <View className="rounded-lg bg-white shadow-lg">
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
            <View className="rounded-lg bg-white shadow-lg">
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
            <View className="rounded-lg bg-white shadow-lg">
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
        </ScrollView>

        {/* Country Picker Modal */}
        <Modal
          visible={showCountryPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-2xl max-h-96">
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
