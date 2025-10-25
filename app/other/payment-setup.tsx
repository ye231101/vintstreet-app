import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SellerSettings {
  storeName: string;
  email: string;
  phone: string;
  address: {
    fullAddress: string;
  };
  payment: {
    paypal: {
      email: string;
    };
    bank: {
      acName: string;
      acType: string;
      acNumber: string;
      bankName: string;
      bankAddr: string;
      routingNumber: string;
      iban: string;
      swift: string;
    };
  };
}

export default function PaymentSetupScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerSettings, setSellerSettings] = useState<SellerSettings | null>(null);

  // Form state
  const [paypalEmail, setPaypalEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');

  useEffect(() => {
    loadSellerSettings();
  }, []);

  const loadSellerSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      const mockSettings: SellerSettings = {
        storeName: 'My Store',
        email: 'store@example.com',
        phone: '+1234567890',
        address: {
          fullAddress: '123 Main St, City, State 12345',
        },
        payment: {
          paypal: {
            email: 'paypal@example.com',
          },
          bank: {
            acName: 'John Doe',
            acType: 'Checking',
            acNumber: '1234567890',
            bankName: 'Example Bank',
            bankAddr: '123 Bank St, City, State',
            routingNumber: '123456789',
            iban: 'GB29NWBK60161331926819',
            swift: 'NWBKGB2L',
          },
        },
      };

      setSellerSettings(mockSettings);

      // Populate form with existing data
      setPaypalEmail(mockSettings.payment.paypal.email);
      setAccountName(mockSettings.payment.bank.acName);
      setAccountType(mockSettings.payment.bank.acType);
      setAccountNumber(mockSettings.payment.bank.acNumber);
      setBankName(mockSettings.payment.bank.bankName);
      setBankAddress(mockSettings.payment.bank.bankAddr);
      setRoutingNumber(mockSettings.payment.bank.routingNumber);
      setIban(mockSettings.payment.bank.iban);
      setSwift(mockSettings.payment.bank.swift);
    } catch (err) {
      setError('Error loading payment settings');
    } finally {
      setIsLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    if (!sellerSettings) return;

    setIsSaving(true);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update seller settings with new payment data
      const updatedSettings: SellerSettings = {
        ...sellerSettings,
        payment: {
          paypal: {
            email: paypalEmail.trim(),
          },
          bank: {
            acName: accountName.trim(),
            acType: accountType.trim(),
            acNumber: accountNumber.trim(),
            bankName: bankName.trim(),
            bankAddr: bankAddress.trim(),
            routingNumber: routingNumber.trim(),
            iban: iban.trim(),
            swift: swift.trim(),
          },
        },
      };

      setSellerSettings(updatedSettings);
      Alert.alert('Success', 'Payment settings updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'numeric';
    multiline?: boolean;
  }) => (
    <View className="mb-4">
      <Text className="text-gray-900 text-base font-inter-bold mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        className={`bg-white rounded-lg px-3 py-3 text-gray-900 text-base font-inter-semibold border border-gray-200 shadow-sm ${
          multiline ? 'min-h-20' : 'min-h-12'
        }`}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  const SummaryItem = ({
    label,
    value,
    isHighlighted = false,
  }: {
    label: string;
    value: string;
    isHighlighted?: boolean;
  }) => (
    <View className="flex-row mb-4">
      <View className="flex-1">
        <Text className="text-gray-600 text-sm font-inter">{label}</Text>
      </View>
      <View className="flex-1 items-end">
        <Text
          className={`${
            isHighlighted ? 'text-gray-900 text-base font-inter-bold' : 'text-gray-900 text-sm font-inter'
          } text-right`}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Payment Setup</Text>
        </View>

        <View className="flex-1 bg-gray-50">
          <View className="flex-1 justify-center items-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading payment settings...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Payment Setup</Text>
        </View>

        <View className="flex-1 bg-gray-50">
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading payment settings</Text>
            <TouchableOpacity onPress={loadSellerSettings} className="bg-black rounded-lg py-3 px-6">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Payment Setup</Text>

        {!isLoading && sellerSettings && (
          <TouchableOpacity
            onPress={savePaymentSettings}
            disabled={isSaving}
            className={`rounded-lg py-2 px-4 ${isSaving ? 'bg-gray-400' : 'bg-blue-500'}`}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-base font-inter-bold">Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4 bg-gray-50">
          {/* PayPal Section */}
          <Text className="text-gray-900 text-2xl font-inter-bold mb-4">PayPal Account</Text>

          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <FormField
              label="PayPal Email Address"
              value={paypalEmail}
              onChangeText={setPaypalEmail}
              placeholder="Enter PayPal email address"
              keyboardType="email-address"
            />
          </View>

          {/* Bank Account Section */}
          <Text className="text-gray-900 text-2xl font-inter-bold mb-4">Bank Account</Text>

          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <FormField
              label="Account Name"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Account holder name"
            />

            <FormField
              label="Account Type"
              value={accountType}
              onChangeText={setAccountType}
              placeholder="e.g., Checking, Savings"
            />

            <FormField
              label="Account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Bank account number"
              keyboardType="numeric"
            />

            <FormField label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="Name of your bank" />

            <FormField
              label="Bank Address"
              value={bankAddress}
              onChangeText={setBankAddress}
              placeholder="Bank branch address"
              multiline
            />

            <FormField
              label="Routing Number"
              value={routingNumber}
              onChangeText={setRoutingNumber}
              placeholder="Bank routing number"
              keyboardType="numeric"
            />

            <FormField
              label="IBAN"
              value={iban}
              onChangeText={setIban}
              placeholder="International Bank Account Number"
            />

            <FormField label="SWIFT Code" value={swift} onChangeText={setSwift} placeholder="Bank SWIFT/BIC code" />
          </View>

          {/* Store Information */}
          {sellerSettings && (
            <>
              <Text className="text-gray-900 text-xl font-inter-bold mb-4">Store Information</Text>

              <View className="bg-white rounded-xl p-4 shadow-sm">
                <SummaryItem label="Store Name" value={sellerSettings.storeName} isHighlighted />

                <SummaryItem label="Email" value={sellerSettings.email} />

                <SummaryItem label="Phone" value={sellerSettings.phone || 'Not provided'} />

                <SummaryItem label="Address" value={sellerSettings.address.fullAddress || 'Not provided'} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
