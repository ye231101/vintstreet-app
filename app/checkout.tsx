import { useCart } from '@/hooks/use-cart';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CheckoutItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  lineTotal: number;
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
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  country: string;
  zipCode: string;
}

interface CardDetailsErrors {
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
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

const InputField = memo(
  ({
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
      <Text className="text-sm font-inter-bold text-gray-800 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <View
        className={`flex-row items-center bg-white rounded-lg border px-3 ${
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
      {error && <Text className="text-red-400 text-xs mt-1 font-inter">{error}</Text>}
    </View>
  )
);

export default function CheckoutScreen() {
  const { cart, isLoading, isEmpty } = useCart();
  const { items: itemsParam } = useLocalSearchParams();
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [total, setTotal] = useState(0);
  const [checkoutTitle, setCheckoutTitle] = useState('Checkout All Items');

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
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    country: 'United Kingdom',
    zipCode: '',
  });

  // Error states
  const [shippingAddressErrors, setShippingAddressErrors] = useState<ShippingAddressErrors>({});
  const [billingAddressErrors, setBillingAddressErrors] = useState<BillingAddressErrors>({});
  const [cardDetailsErrors, setCardDetailsErrors] = useState<CardDetailsErrors>({});

  useEffect(() => {
    if (isEmpty) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before checking out.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }
    loadCheckoutData();
  }, [cart, itemsParam]);

  useEffect(() => {
    updateStepCompletion();
  }, [shippingAddress, billingAddress, cardDetails, isBillingDifferent]);

  const loadCheckoutData = () => {
    // Filter cart items based on query parameter
    let filteredItems = cart.items;
    
    if (itemsParam) {
      const itemIds = Array.isArray(itemsParam) ? itemsParam : [itemsParam];
      filteredItems = cart.items.filter((item) => itemIds.includes(item.product.id));
      
      // Update checkout title for single item checkout
      if (filteredItems.length === 1) {
        setCheckoutTitle(`Checkout with ${filteredItems[0].product.product_name}`);
      } else if (filteredItems.length > 1) {
        setCheckoutTitle(`Checkout ${filteredItems.length} Items`);
      }
    } else {
      setCheckoutTitle('Checkout All Items');
    }

    // Transform cart items to checkout items
    const items: CheckoutItem[] = filteredItems.map((item) => ({
      id: item.product.id,
      name: item.product.product_name,
      brand: item.product.product_categories?.name || 'Unknown Brand',
      price: item.product.starting_price,
      quantity: item.quantity,
      image: item.product.product_image || '',
      lineTotal: item.subtotal,
    }));

    // Calculate total for filtered items
    const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    setCheckoutItems(items);
    setTotal(itemsTotal);
  };

  // Update functions that clear errors when typing
  const updateShippingAddress = useCallback((field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (shippingAddressErrors[field as keyof ShippingAddressErrors]) {
      setShippingAddressErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [shippingAddressErrors]);

  const updateBillingAddress = useCallback((field: keyof BillingAddress, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (billingAddressErrors[field as keyof BillingAddressErrors]) {
      setBillingAddressErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [billingAddressErrors]);

  const updateCardDetails = useCallback((field: keyof typeof cardDetails, value: string) => {
    setCardDetails((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (cardDetailsErrors[field as keyof CardDetailsErrors]) {
      setCardDetailsErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [cardDetailsErrors]);

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
      cardDetails.cardholderName.trim() !== '' &&
      cardDetails.cardNumber.trim() !== '' &&
      cardDetails.expiryDate.trim() !== '' &&
      cardDetails.cvc.trim() !== '' &&
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

  const OrderSummaryCard = () => (
    <View className="bg-white rounded-xl m-4">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-gray-50 rounded-t-xl">
        <Feather name="shopping-bag" color="#666" size={20} />
        <Text className="text-base font-inter-bold text-gray-800 ml-2 flex-1">Order Summary</Text>
        <Text className="text-sm font-inter text-gray-600">
          {checkoutItems.length} item{checkoutItems.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Items */}
      {checkoutItems.map((item) => (
        <View key={item.id} className="flex-row p-4 items-center">
          <Image
            source={item.image}
            contentFit="cover"
            placeholder={{ blurhash }}
            transition={1000}
            style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }}
          />

          <View className="flex-1">
            <Text className="text-sm font-inter-bold text-gray-800 mb-1" numberOfLines={2}>
              {item.name}
            </Text>
            <Text className="text-xs font-inter text-gray-600 mb-1">{item.brand}</Text>
            <Text className="text-xs font-inter text-gray-600">Qty: {item.quantity}</Text>
          </View>

          <Text className="text-sm font-inter-bold text-gray-800">£{item.lineTotal.toFixed(2)}</Text>
        </View>
      ))}

      {/* Totals */}
      <View className="p-4 bg-gray-50 rounded-b-xl">
        <View className="flex-row justify-between">
          <Text className="text-base font-inter-bold text-gray-800">Total</Text>
          <Text className="text-lg font-inter-bold text-gray-800">£{total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  const ProgressIndicator = () => {
    const completedSteps = stepCompleted.filter((step) => step).length;
    const totalSteps = stepCompleted.length;
    const progress = completedSteps / totalSteps;

    return (
      <View className="bg-white rounded-xl p-5 m-4">
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
    );
  };

  const ShippingAddressSection = () => (
    <View className="bg-white rounded-2xl m-4">
      {/* Section Header */}
      <View className="flex-row items-center bg-gray-50 px-5 py-4 rounded-t-2xl border-b border-gray-200">
        <View
          className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${
            stepCompleted[0] ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          {stepCompleted[0] ? (
            <Feather name="check" color="#fff" size={20} />
          ) : (
            <Feather name="map-pin" color="#666" size={20} />
          )}
        </View>

        <Text className="text-base font-inter-bold text-gray-800 flex-1">Shipping Address</Text>

        {stepCompleted[0] && (
          <View className="bg-green-500 rounded-xl px-2 py-1">
            <Text className="text-white text-xs font-inter-bold">✓</Text>
          </View>
        )}
      </View>

      {/* Section Content */}
      <View className="p-5">
        <InputField
          label="Enter Shipping Address"
          value=""
          onChangeText={() => {}}
          placeholder="Search for your address..."
          autoCapitalize="none"
          icon="search"
        />

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
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
          <View className="flex-1 ml-2">
            <InputField
              label="Last Name"
              value={shippingAddress.lastName}
              onChangeText={(text) => updateShippingAddress('lastName', text)}
              placeholder="Last Name"
              autoCapitalize="none"
              required
              error={shippingAddressErrors.lastName}
            />
          </View>
        </View>

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
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
          <View className="flex-1 ml-2">
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
  );

  const BillingDetailsSection = () => (
    <View className="bg-white rounded-2xl m-4">
      {/* Section Header */}
      <View className="flex-row items-center p-5 border-b border-gray-100">
        <View
          className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${
            stepCompleted[1] ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          {stepCompleted[1] ? (
            <Feather name="check" color="#fff" size={20} />
          ) : (
            <Feather name="home" color="#666" size={20} />
          )}
        </View>

        <Text className="text-base font-inter-bold text-gray-800 flex-1">Billing Details</Text>

        {stepCompleted[1] && (
          <View className="bg-green-500 rounded-xl px-2 py-1">
            <Text className="text-white text-xs font-inter-bold">✓</Text>
          </View>
        )}
      </View>

      {/* Section Content */}
      <View className="p-5">
        <View className="flex-row items-center mb-4">
          <Feather name="arrow-right-circle" color="#666" size={20} />
          <Text className="text-base font-inter-bold text-gray-800 ml-2 flex-1">
            Is billing address different from shipping address?
          </Text>
          <Switch
            value={isBillingDifferent}
            onValueChange={setIsBillingDifferent}
            trackColor={{ false: '#e5e5e5', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>

        <Text className="text-sm font-inter text-gray-600 mb-4">
          {isBillingDifferent
            ? 'Please enter your billing address below'
            : 'Billing address will be the same as shipping address'}
        </Text>

        {isBillingDifferent && (
          <>
            <Text className="text-base font-inter-bold text-gray-800 mb-4">Billing Address</Text>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
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
              <View className="flex-1 ml-2">
                <InputField
                  label="Last Name"
                  value={billingAddress.lastName}
                  onChangeText={(text) => updateBillingAddress('lastName', text)}
                  placeholder="Last Name"
                  autoCapitalize="none"
                  required
                  error={billingAddressErrors.lastName}
                />
              </View>
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
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
              <View className="flex-1 ml-2">
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

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <InputField
                  label="State/Country"
                  value={billingAddress.state}
                  onChangeText={(text) => updateBillingAddress('state', text)}
                  placeholder="State/Country"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-1 ml-2">
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
  );

  const PaymentInformationSection = () => (
    <View className="bg-white rounded-2xl m-4">
      {/* Section Header */}
      <View className="flex-row items-center p-5 border-b border-gray-100">
        <View
          className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${
            stepCompleted[2] ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          {stepCompleted[2] ? (
            <Feather name="check" color="#fff" size={20} />
          ) : (
            <Feather name="credit-card" color="#666" size={20} />
          )}
        </View>

        <Text className="text-base font-inter-bold text-gray-800 flex-1">Payment Information</Text>

        {stepCompleted[2] && (
          <View className="bg-green-500 rounded-xl px-2 py-1">
            <Text className="text-white text-xs font-inter-bold">✓</Text>
          </View>
        )}
      </View>

      {/* Section Content */}
      <View className="p-5">
        <Text className="text-base font-inter-bold text-gray-800 mb-4">Payment Method</Text>

        {/* Credit/Debit Card Option */}
        <TouchableOpacity
          onPress={() => setPaymentMethod('card')}
          className={`rounded-lg p-4 border mb-3 flex-row items-center ${
            paymentMethod === 'card' ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200'
          }`}
        >
          <Feather name="credit-card" color={paymentMethod === 'card' ? '#1976d2' : '#666'} size={20} />
          <View className="flex-1 ml-3">
            <Text
              className={`text-base font-inter-bold ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-800'}`}
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
          className={`rounded-lg p-4 border mb-4 flex-row items-center ${
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
            <Text className={`text-sm font-inter ${paymentMethod === 'googlepay' ? 'text-blue-600' : 'text-gray-600'}`}>
              Google Pay (availability will be checked at payment)
            </Text>
          </View>
          {paymentMethod === 'googlepay' && <Feather name="check" color="#1976d2" size={20} />}
        </TouchableOpacity>

        {paymentMethod === 'card' && (
          <>
            <Text className="text-base font-inter-bold text-gray-800 mb-4">Card Details</Text>

            <InputField
              label="Cardholder Name"
              value={cardDetails.cardholderName}
              onChangeText={(text) => updateCardDetails('cardholderName', text)}
              placeholder="Cardholder Name"
              icon="user"
              required
              error={cardDetailsErrors.cardholderName}
            />

            <Text className="text-base font-inter-bold text-gray-800 mb-4">Card Information</Text>

            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <InputField
                label="Card Number"
                value={cardDetails.cardNumber}
                onChangeText={(text) => updateCardDetails('cardNumber', text)}
                placeholder="Card number"
                keyboardType="numeric"
                autoCapitalize="none"
                required
                error={cardDetailsErrors.cardNumber}
              />

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
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
                <View className="flex-1 ml-2">
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
            </View>
          </>
        )}

        <View className="bg-blue-50 rounded-lg p-3 flex-row items-center">
          <Feather name="shield" color="#1976d2" size={16} />
          <Text className="text-sm font-inter text-blue-600 ml-2 flex-1">
            Your payment information is securely processed by Stripe and never stored on our servers.
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">{checkoutTitle}</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-white">{checkoutTitle}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-gray-50">
        {/* Order Summary */}
        <OrderSummaryCard />

        {/* Progress Indicator */}
        <ProgressIndicator />

        {/* Shipping Address */}
        <ShippingAddressSection />

        {/* Billing Details */}
        <BillingDetailsSection />

        {/* Payment Information */}
        <PaymentInformationSection />
      </ScrollView>

      {/* Bottom Action Button */}
      <View className="bg-white p-5 border-t border-gray-200">
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
