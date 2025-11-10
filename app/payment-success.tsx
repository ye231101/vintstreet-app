import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    console.log('[PAYMENT_SUCCESS] Component mounted with session_id:', session_id);

    // In a real implementation, you would verify the payment status
    // with your backend or Stripe webhook
    if (session_id) {
      console.log('[PAYMENT_SUCCESS] Processing payment verification for session:', session_id);
      // Simulate payment verification
      setTimeout(() => {
        console.log('[PAYMENT_SUCCESS] Payment verification completed - success');
        setPaymentStatus('success');
        setLoading(false);
      }, 2000);
    } else {
      console.log('[PAYMENT_SUCCESS] No session_id provided - showing failed state');
      setPaymentStatus('failed');
      setLoading(false);
    }
  }, [session_id]);

  // Hardware back: send users to cart
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/cart');
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleContinueShopping = () => {
    router.replace('/(tabs)');
  };

  const handleViewOrders = () => {
    router.replace('/other/orders');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-lg font-inter-semibold text-gray-800 mt-4">Verifying Payment...</Text>
        <Text className="text-sm font-inter-regular text-gray-600 mt-2 text-center px-8">
          Please wait while we confirm your payment
        </Text>
      </SafeAreaView>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-green-100 rounded-full p-6 mb-6">
            <Feather name="check" size={48} color="#10B981" />
          </View>

          <Text className="text-2xl font-inter-bold text-gray-800 mb-2 text-center">Payment Successful!</Text>

          <Text className="text-base font-inter-regular text-gray-600 mb-8 text-center leading-6">
            Your order has been confirmed and payment processed successfully. You will receive a confirmation email
            shortly.
          </Text>

          <View className="w-full gap-4">
            <TouchableOpacity onPress={handleViewOrders} className="bg-black border border-black rounded-lg py-4 px-6">
              <Text className="text-white text-center font-inter-semibold text-base">View My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinueShopping}
              className="bg-white border border-gray-300 rounded-lg py-4 px-6"
            >
              <Text className="text-gray-800 text-center font-inter-semibold text-base">Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-red-100 rounded-full p-6 mb-6">
          <Feather name="x" size={48} color="#EF4444" />
        </View>

        <Text className="text-2xl font-inter-bold text-gray-800 mb-2 text-center">Payment Failed</Text>

        <Text className="text-base font-inter-regular text-gray-600 mb-8 text-center leading-6">
          There was an issue processing your payment. Please try again or contact support if the problem persists.
        </Text>

        <View className="w-full gap-4">
          <TouchableOpacity onPress={handleViewOrders} className="bg-black border border-black rounded-lg py-4 px-6">
            <Text className="text-white text-center font-inter-semibold text-base">View My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinueShopping}
            className="bg-white border border-gray-300 rounded-lg py-4 px-6"
          >
            <Text className="text-gray-800 text-center font-inter-semibold text-base">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
