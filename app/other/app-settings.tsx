import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppSettingsScreen() {
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currencies = [
    { code: 'GBP', symbol: '£', name: 'GBP' },
    { code: 'USD', symbol: '$', name: 'USD' },
    { code: 'EUR', symbol: '€', name: 'EUR' },
    { code: 'CAD', symbol: 'C$', name: 'CAD' },
    { code: 'AUD', symbol: 'A$', name: 'AUD' },
    { code: 'JPY', symbol: '¥', name: 'JPY' },
  ];

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    setShowDeleteModal(false);
    // Add actual delete logic here
  };

  const selectedCurrencyData = currencies.find((c) => c.code === selectedCurrency) || currencies[0];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Account Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4 gap-4 bg-gray-50">
          {/* Preferred Currency Section */}
          <View className="p-4 rounded-lg bg-white shadow-sm">
            <Text className="mb-2 text-sm font-inter-semibold text-black">Preferred Currency</Text>
            <Text className="mb-3 text-xs font-inter-regular text-gray-500">
              Choose your preferred currency for displaying prices
            </Text>

            {/* Currency Dropdown */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex-row items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg"
              >
                <Text className="text-base font-inter-regular text-black">
                  {selectedCurrencyData.symbol} {selectedCurrencyData.name}
                </Text>
                <Feather name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Currency Dropdown List */}
              {showCurrencyDropdown && (
                <View className="absolute top-14 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  {currencies.map((currency, index) => (
                    <TouchableOpacity
                      key={currency.code}
                      onPress={() => {
                        setSelectedCurrency(currency.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        index < currencies.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <Text
                        className={`text-base font-inter-regular ${
                          selectedCurrency === currency.code ? 'text-black font-inter-semibold' : 'text-gray-700'
                        }`}
                      >
                        {currency.symbol} {currency.name}
                      </Text>
                      {selectedCurrency === currency.code && <Feather name="check" size={20} color="#000" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Email Notifications Section */}
          <View className="p-4 rounded-lg bg-white shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="mb-1 text-sm font-inter-semibold text-black">Email Notifications</Text>
                <Text className="text-xs font-inter-regular text-gray-500">
                  Receive notifications about orders and updates
                </Text>
              </View>
              <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <Text className="text-sm font-inter-semibold text-black">Manage</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Settings Section */}
          <View className="p-4 rounded-lg bg-white shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="mb-1 text-sm font-inter-semibold text-black">Privacy Settings</Text>
                <Text className="text-xs font-inter-regular text-gray-500">
                  Control who can see your profile and activity
                </Text>
              </View>
              <TouchableOpacity className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <Text className="text-sm font-inter-semibold text-black">Manage</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete Account Section */}
          <View className="p-4 rounded-lg bg-white shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="mb-1 text-sm font-inter-semibold text-black">Delete Account</Text>
                <Text className="text-xs font-inter-regular text-gray-500">
                  Permanently delete your account and all data
                </Text>
              </View>
              <TouchableOpacity onPress={handleDeleteAccount} className="px-4 py-2 rounded-lg bg-red-500">
                <Text className="text-sm font-inter-semibold text-white">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-xl font-inter-bold text-black mb-3">Delete Account</Text>
            <Text className="text-sm font-inter-regular text-gray-600 mb-6">
              Are you sure you want to permanently delete your account? This action cannot be undone and all your data
              will be lost.
            </Text>
            <View className="gap-3">
              <TouchableOpacity onPress={confirmDeleteAccount} className="py-3 px-6 bg-red-500 rounded-lg items-center">
                <Text className="text-base font-inter-semibold text-white">Yes, Delete My Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="py-3 px-6 bg-gray-200 rounded-lg items-center"
              >
                <Text className="text-base font-inter-semibold text-black">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
