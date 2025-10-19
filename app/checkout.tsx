import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function CheckoutScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [protectionFee, setProtectionFee] = useState(0);
  const [total, setTotal] = useState(0);

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

  const [isBillingDifferent, setIsBillingDifferent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    country: 'United States',
    zipCode: '',
  });

  useEffect(() => {
    loadCheckoutData();
  }, []);

  useEffect(() => {
    updateStepCompletion();
  }, [shippingAddress, billingAddress, cardDetails]);

  const loadCheckoutData = async () => {
    setIsLoading(true);

    try {
      // Mock data - replace with actual data fetching
      const mockItems: CheckoutItem[] = [
        {
          id: '1',
          name: 'D&G 2003 Bomber Jacket, Black - XXL',
          brand: 'D&G',
          price: 999.0,
          quantity: 1,
          image: 'https://via.placeholder.com/50x50/000000/FFFFFF?text=D&G',
          lineTotal: 999.0,
        },
      ];

      const mockSubtotal = 999.0;
      const mockProtectionFee = 71.93;
      const mockTotal = 1070.93;

      setCheckoutItems(mockItems);
      setSubtotal(mockSubtotal);
      setProtectionFee(mockProtectionFee);
      setTotal(mockTotal);
    } catch (err) {
      Alert.alert('Error', 'Failed to load checkout data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStepCompletion = () => {
    const shippingComplete =
      shippingAddress.firstName.trim() !== '' &&
      shippingAddress.lastName.trim() !== '' &&
      shippingAddress.email.trim() !== '' &&
      shippingAddress.phone.trim() !== '' &&
      shippingAddress.address1.trim() !== '' &&
      shippingAddress.city.trim() !== '' &&
      shippingAddress.postcode.trim() !== '';

    const billingComplete = isBillingDifferent
      ? billingAddress.firstName.trim() !== '' &&
        billingAddress.lastName.trim() !== '' &&
        billingAddress.email.trim() !== '' &&
        billingAddress.phone.trim() !== '' &&
        billingAddress.address1.trim() !== '' &&
        billingAddress.city.trim() !== '' &&
        billingAddress.postcode.trim() !== ''
      : shippingComplete;

    const paymentComplete =
      cardDetails.cardholderName.trim() !== '' &&
      cardDetails.cardNumber.trim() !== '' &&
      cardDetails.expiryDate.trim() !== '' &&
      cardDetails.cvc.trim() !== '';

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
          <View className="w-12 h-12 rounded-lg bg-gray-100 mr-3" />

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
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm font-inter text-gray-600">Subtotal</Text>
          <Text className="text-sm font-inter-bold text-gray-800">£{subtotal.toFixed(2)}</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-sm font-inter text-gray-600">Protection Fee</Text>
          <Text className="text-sm font-inter-bold text-gray-800">£{protectionFee.toFixed(2)}</Text>
        </View>

        <View className="h-px bg-gray-300 my-2" />

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

        <Text
          className={`text-xs ${progress === 1 ? 'font-inter-bold text-green-500' : 'font-inter text-gray-600'}`}
        >
          {progress === 1
            ? 'All steps completed! You can now place your order.'
            : 'Complete all steps to place your order.'}
        </Text>
      </View>
    );
  };

  const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
    icon,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'numeric';
    required?: boolean;
    icon?: string;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-inter-bold text-gray-800 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
        {icon && <Feather name={icon as any} color="#666" size={16} className="mr-2" />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          className="flex-1 py-3 text-base font-inter text-gray-800"
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

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
        <FormField
          label="Enter Shipping Address"
          value=""
          onChangeText={() => {}}
          placeholder="Search for your address..."
          icon="search"
        />

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <FormField
              label="First Name"
              value={shippingAddress.firstName}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, firstName: text })}
              placeholder="First Name"
              icon="user"
              required
            />
          </View>
          <View className="flex-1 ml-2">
            <FormField
              label="Last Name"
              value={shippingAddress.lastName}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, lastName: text })}
              placeholder="Last Name"
              required
            />
          </View>
        </View>

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <FormField
              label="Email"
              value={shippingAddress.email}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, email: text })}
              placeholder="Email"
              keyboardType="email-address"
              icon="mail"
              required
            />
          </View>
          <View className="flex-1 ml-2">
            <FormField
              label="Phone"
              value={shippingAddress.phone}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, phone: text })}
              placeholder="Phone"
              keyboardType="numeric"
              icon="phone"
              required
            />
          </View>
        </View>

        <FormField
          label="Address Line 1"
          value={shippingAddress.address1}
          onChangeText={(text) => setShippingAddress({ ...shippingAddress, address1: text })}
          placeholder="Address Line 1"
          icon="home"
          required
        />

        <FormField
          label="Address Line 2 (Optional)"
          value={shippingAddress.address2 || ''}
          onChangeText={(text) => setShippingAddress({ ...shippingAddress, address2: text })}
          placeholder="Address Line 2 (Optional)"
          icon="home"
        />

        <FormField
          label="City"
          value={shippingAddress.city}
          onChangeText={(text) => setShippingAddress({ ...shippingAddress, city: text })}
          placeholder="City"
          required
        />

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <FormField
              label="State/Country"
              value={shippingAddress.state}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, state: text })}
              placeholder="State/Country"
            />
          </View>
          <View className="flex-1 ml-2">
            <FormField
              label="Postcode"
              value={shippingAddress.postcode}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, postcode: text })}
              placeholder="Postcode"
              required
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
          Billing address will be the same as shipping address
        </Text>

        {isBillingDifferent && (
          <>
            <Text className="text-base font-inter-bold text-gray-800 mb-4">Billing Address</Text>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <FormField
                  label="First Name"
                  value={billingAddress.firstName}
                  onChangeText={(text) => setBillingAddress({ ...billingAddress, firstName: text })}
                  placeholder="First Name"
                  icon="user"
                  required
                />
              </View>
              <View className="flex-1 ml-2">
                <FormField
                  label="Last Name"
                  value={billingAddress.lastName}
                  onChangeText={(text) => setBillingAddress({ ...billingAddress, lastName: text })}
                  placeholder="Last Name"
                  required
                />
              </View>
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <FormField
                  label="Email"
                  value={billingAddress.email}
                  onChangeText={(text) => setBillingAddress({ ...billingAddress, email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  icon="mail"
                  required
                />
              </View>
              <View className="flex-1 ml-2">
                <FormField
                  label="Phone"
                  value={billingAddress.phone}
                  onChangeText={(text) => setBillingAddress({ ...billingAddress, phone: text })}
                  placeholder="Phone"
                  keyboardType="numeric"
                  icon="phone"
                  required
                />
              </View>
            </View>

            <FormField
              label="Address Line 1"
              value={billingAddress.address1}
              onChangeText={(text) => setBillingAddress({ ...billingAddress, address1: text })}
              placeholder="Address Line 1"
              icon="home"
              required
            />

            <FormField
              label="Address Line 2 (Optional)"
              value={billingAddress.address2 || ''}
              onChangeText={(text) => setBillingAddress({ ...billingAddress, address2: text })}
              placeholder="Address Line 2 (Optional)"
              icon="home"
            />

            <FormField
              label="City"
              value={billingAddress.city}
              onChangeText={(text) => setBillingAddress({ ...billingAddress, city: text })}
              placeholder="City"
              required
            />

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <FormField
                  label="State/Country"
                  value={billingAddress.state}
                  onChangeText={(text) => setBillingAddress({ ...billingAddress, state: text })}
                  placeholder="State/Country"
                />
              </View>
              <View className="flex-1 ml-2">
                <FormField
                  label="Postcode"
                  value={billingAddress.postcode}
                  onChangeText={(text) => setBillingAddress({ ...billingAddress, postcode: text })}
                  placeholder="Postcode"
                  required
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
            <Text className="text-base font-inter-bold text-gray-800 mb-4">Card Details</Text>

            <FormField
              label="Cardholder Name"
              value={cardDetails.cardholderName}
              onChangeText={(text) => setCardDetails({ ...cardDetails, cardholderName: text })}
              placeholder="Cardholder Name"
              icon="user"
              required
            />

            {cardDetails.cardholderName.trim() === '' && (
              <Text className="text-xs font-inter text-gray-600 -mt-3 mb-4">Cardholder name is required</Text>
            )}

            <Text className="text-base font-inter-bold text-gray-800 mb-4">Card Information</Text>

            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <FormField
                label="Card Number"
                value={cardDetails.cardNumber}
                onChangeText={(text) => setCardDetails({ ...cardDetails, cardNumber: text })}
                placeholder="Card number"
                keyboardType="numeric"
              />

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <FormField
                    label="Expiry Date"
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails({ ...cardDetails, expiryDate: text })}
                    placeholder="MM/YY"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <FormField
                    label="CVC"
                    value={cardDetails.cvc}
                    onChangeText={(text) => setCardDetails({ ...cardDetails, cvc: text })}
                    placeholder="CVC"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <FormField
                label="Country"
                value={cardDetails.country}
                onChangeText={(text) => setCardDetails({ ...cardDetails, country: text })}
                placeholder="Country"
              />

              <FormField
                label="ZIP Code"
                value={cardDetails.zipCode}
                onChangeText={(text) => setCardDetails({ ...cardDetails, zipCode: text })}
                placeholder="ZIP Code"
                keyboardType="numeric"
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

          <Text className="flex-1 text-lg font-inter-bold text-white">Checkout All Items</Text>
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

        <Text className="flex-1 text-lg font-inter-bold text-white">Checkout All Items</Text>
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
