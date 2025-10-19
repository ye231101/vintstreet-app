import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PaymentMethod {
  id: string;
  cardType: string;
  lastFour: string;
  expiryDate: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savePaymentInfo, setSavePaymentInfo] = useState(true);
  const [quickCheckout, setQuickCheckout] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      setPaymentMethods([]);
    } catch (err) {
      setError('Error loading payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const addPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This would open the payment method form');
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setPaymentMethods((prev) =>
        prev.map((method) => ({
          ...method,
          isDefault: method.id === id,
        }))
      );

      Alert.alert('Success', 'Default payment method updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const deletePaymentMethod = (id: string) => {
    Alert.alert('Delete Payment Method', 'Are you sure you want to delete this payment method?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
            Alert.alert('Success', 'Payment method deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete payment method');
          }
        },
      },
    ]);
  };

  const SavedCard = ({
    cardType,
    lastFour,
    expiryDate,
    isDefault,
    onSetDefault,
    onDelete,
  }: {
    cardType: string;
    lastFour: string;
    expiryDate: string;
    isDefault: boolean;
    onSetDefault: () => void;
    onDelete: () => void;
  }) => (
    <View className="bg-gray-700 rounded-xl p-4 mb-3">
      <View className="flex-row items-center mb-4">
        <Feather name="credit-card" color="#fff" size={24} />
        <View className="ml-3 flex-1">
          <Text className="text-white text-base font-poppins-bold mb-1">
            {cardType} •••• {lastFour}
          </Text>
          <Text className="text-gray-400 text-sm font-poppins">Expires {expiryDate}</Text>
        </View>
        {isDefault && (
          <View className="bg-blue-500/20 rounded px-2 py-1">
            <Text className="text-blue-500 text-xs font-poppins-bold">Default</Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-end">
        {!isDefault && (
          <TouchableOpacity onPress={onSetDefault} className="mr-4 py-2">
            <Text className="text-blue-500 text-sm font-poppins">Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} className="py-2">
          <Text className="text-red-500 text-sm font-poppins">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center py-3">
      <Feather name={icon as any} color="#fff" size={24} />
      <View className="ml-4 flex-1">
        <Text className="text-white text-base font-poppins-bold mb-1">{title}</Text>
        <Text className="text-gray-400 text-sm font-poppins">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#007AFF' }}
        thumbColor={value ? '#fff' : '#999'}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Payment Methods</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Payment Methods</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={48} />
          <Text className="text-white text-lg font-poppins-bold mt-4 mb-2">Error loading payment methods</Text>
          <Text className="text-gray-400 text-sm font-poppins text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadPaymentMethods} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-poppins-bold">Retry</Text>
          </TouchableOpacity>
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

        <Text className="flex-1 text-lg font-poppins-bold text-white">Payment Methods</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Add New Payment Method */}
          <View className="bg-gray-700 rounded-xl p-4 mb-6">
            <Text className="text-gray-400 text-sm font-poppins mb-4">Add a new payment method</Text>
            <TouchableOpacity onPress={addPaymentMethod} className="bg-blue-500 rounded-lg py-3 items-center">
              <Text className="text-white text-base font-poppins-bold">Add Payment Method</Text>
            </TouchableOpacity>
          </View>

          {/* Saved Cards Section */}
          {paymentMethods.length > 0 ? (
            <>
              <Text className="text-white text-2xl font-poppins-bold mb-4">Saved Cards</Text>

              {paymentMethods.map((method) => (
                <SavedCard
                  key={method.id}
                  cardType={method.cardType}
                  lastFour={method.lastFour}
                  expiryDate={method.expiryDate}
                  isDefault={method.isDefault}
                  onSetDefault={() => setDefaultPaymentMethod(method.id)}
                  onDelete={() => deletePaymentMethod(method.id)}
                />
              ))}
            </>
          ) : (
            <View className="bg-gray-700 rounded-xl p-5 border border-gray-600 items-center mb-6">
              <Feather name="credit-card" color="#666" size={32} />
              <Text className="text-gray-400 text-base font-poppins-medium mt-3 mb-2">No payment methods saved</Text>
              <Text className="text-gray-500 text-sm font-poppins text-center">Add a payment method to continue</Text>
            </View>
          )}

          {/* Payment Settings */}
          <Text className="text-white text-2xl font-poppins-bold mb-4">Payment Settings</Text>

          <View className="bg-gray-700 rounded-xl p-4">
            <SettingsItem
              icon="lock"
              title="Save Payment Info"
              subtitle="Securely save cards for faster checkout"
              value={savePaymentInfo}
              onValueChange={setSavePaymentInfo}
            />

            <View className="h-px bg-gray-600 my-4" />

            <SettingsItem
              icon="credit-card"
              title="Quick Checkout"
              subtitle="Use default card for faster purchases"
              value={quickCheckout}
              onValueChange={setQuickCheckout}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
