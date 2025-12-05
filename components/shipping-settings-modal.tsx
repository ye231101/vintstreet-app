import { shippingService } from '@/api/services';
import { ShippingAddress, ShippingProvider } from '@/api/types';
import { DropdownComponent, InputComponent } from '@/components/common';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ShippingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const ShippingSettingsModal: React.FC<ShippingSettingsModalProps> = ({ isOpen, onClose, userId }) => {
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [deliveryTimeframe, setDeliveryTimeframe] = useState({
    min: '',
    max: '',
  });
  const [addressData, setAddressData] = useState<ShippingAddress>({
    return_city: '',
    return_postal_code: '',
    return_country: 'GB',
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [countryValue, setCountryValue] = useState('GB');

  useEffect(() => {
    if (isOpen) {
      loadShippingData();
    }
  }, [isOpen]);

  const loadShippingData = async () => {
    if (!userId) {
      showErrorToast('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Load shipping providers
      const providersData = await shippingService.getShippingProviders();
      setProviders(providersData);

      // Load existing shipping options
      const existingOptions = await shippingService.getSellerShippingOptions(userId);
      if (existingOptions.length > 0) {
        const providerIds = new Set(existingOptions.map((opt) => opt.provider_id));
        setSelectedProviders(providerIds);

        // Use the first option's timeframe (since they should all be the same)
        const firstOption = existingOptions[0];
        setDeliveryTimeframe({
          min: firstOption.estimated_days_min?.toString() || '',
          max: firstOption.estimated_days_max?.toString() || '',
        });
      }

      // Load shipping address
      const addressData = await shippingService.getSellerShippingAddress(userId);
      if (addressData) {
        setAddressData({
          return_city: addressData.return_city || '',
          return_postal_code: addressData.return_postal_code || '',
          return_country: addressData.return_country || 'GB',
        });
      }
    } catch (error) {
      logger.error('Error loading shipping data:', error);
      showErrorToast('Failed to load shipping settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProvider = (providerId: string) => {
    setSelectedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const handleSaveAddress = async () => {
    if (!userId) {
      showErrorToast('User not authenticated');
      return;
    }

    if (!addressData.return_city || !addressData.return_postal_code || !addressData.return_country) {
      showErrorToast('Please fill in all required address fields');
      return;
    }

    setIsSavingAddress(true);
    try {
      await shippingService.updateSellerShippingAddress(userId, addressData);
      showSuccessToast('Shipping address updated');
      setIsEditingAddress(false);
    } catch (error) {
      logger.error('Error saving address:', error);
      showErrorToast('Failed to save shipping address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) {
      showErrorToast('User not authenticated');
      return;
    }

    if (selectedProviders.size === 0) {
      showErrorToast('Please select at least one shipping provider');
      return;
    }

    if (!deliveryTimeframe.min || !deliveryTimeframe.max) {
      showErrorToast('Please enter delivery timeframe');
      return;
    }

    setIsSavingSettings(true);
    try {
      await shippingService.saveSellerShippingSettings(userId, Array.from(selectedProviders), providers, {
        min: parseInt(deliveryTimeframe.min),
        max: parseInt(deliveryTimeframe.max),
      });
      showSuccessToast('Shipping settings saved');
      onClose();
    } catch (error) {
      logger.error('Error saving settings:', error);
      showErrorToast('Failed to save shipping settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleClose = () => {
    setSelectedProviders(new Set());
    setDeliveryTimeframe({ min: '', max: '' });
    setAddressData({ return_city: '', return_postal_code: '', return_country: 'GB' });
    setIsEditingAddress(false);
    setCountryValue('GB');
    setIsSavingAddress(false);
    setIsSavingSettings(false);
    onClose();
  };

  const COUNTRY_OPTIONS = [
    { label: 'United Kingdom', value: 'GB' },
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' },
    { label: 'Australia', value: 'AU' },
  ];

  // Sync country value with address data
  useEffect(() => {
    setCountryValue(addressData.return_country);
  }, [addressData.return_country]);

  // Create data array for FlatList
  const renderContent = () => {
    if (!userId) {
      return (
        <View className="flex-1 items-center justify-center p-12">
          <Feather name="user-x" size={48} color="#EF4444" />
          <Text className="text-gray-900 text-lg font-inter-semibold mt-4 mb-2">Authentication Required</Text>
          <Text className="text-gray-600 text-sm font-inter-semibold text-center">
            Please sign in to manage your shipping settings.
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center p-12">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading...</Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        {/* Shipping Address Section */}
        <View className="bg-white rounded-xl border border-gray-200 mb-6">
          {!isEditingAddress ? (
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-lg font-inter-semibold text-gray-900 mr-3">Shipping From:</Text>
                  {addressData.return_city ? (
                    <Text className="text-sm font-inter-semibold text-gray-600">
                      {addressData.return_city}, {addressData.return_postal_code}, {addressData.return_country}
                    </Text>
                  ) : (
                    <Text className="text-sm font-inter-semibold text-gray-600">Not set</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setIsEditingAddress(true)}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  <Text className="text-sm font-inter-semibold text-gray-800">Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-lg font-inter-semibold text-gray-900">Shipping From</Text>

              <View className="flex-col gap-4">
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <InputComponent
                      value={addressData.return_city}
                      label="City"
                      size="small"
                      required={true}
                      placeholder="City"
                      onChangeText={(text) => setAddressData((prev) => ({ ...prev, return_city: text }))}
                    />
                  </View>
                  <View className="flex-1">
                    <InputComponent
                      value={addressData.return_postal_code}
                      label="Postal Code"
                      size="small"
                      required={true}
                      placeholder="Postal Code"
                      onChangeText={(text) => setAddressData((prev) => ({ ...prev, return_postal_code: text }))}
                    />
                  </View>
                </View>

                <View>
                  <DropdownComponent
                    data={COUNTRY_OPTIONS}
                    label="Country"
                    size="small"
                    required={true}
                    placeholder="Select a country"
                    value={countryValue}
                    onChange={(item) => setAddressData((prev) => ({ ...prev, return_country: item.value }))}
                  />
                </View>

                <View className="flex-row gap-3 justify-end">
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingAddress(false);
                    }}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <Text className="text-sm font-inter-semibold text-gray-800">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveAddress}
                    disabled={isSavingAddress}
                    className={`rounded-lg px-4 py-2 ${isSavingAddress ? 'bg-gray-400' : 'bg-black'}`}
                  >
                    <Text className="text-sm font-inter-semibold text-white">
                      {isSavingAddress ? 'Saving...' : 'Save Address'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Shipping Providers Section */}
        <View>
          <Text className="text-lg font-inter-semibold text-gray-900 mb-2">Shipping Providers</Text>
          <Text className="text-sm font-inter-semibold text-gray-600 mb-4">
            Select providers and set delivery timeframe
          </Text>

          {/* Provider Cards */}
          <View className="flex-col gap-3 mb-8">
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                onPress={() => toggleProvider(provider.id)}
                className={`flex-1 border rounded-lg p-4 ${
                  selectedProviders.has(provider.id) ? 'border-black bg-gray-50' : 'border-gray-300'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-inter-semibold text-gray-900 mb-1">{provider.name}</Text>
                    <Text className="text-xs font-inter-semibold text-gray-600">{provider.description}</Text>
                  </View>
                  <View
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ml-2 ${
                      selectedProviders.has(provider.id) ? 'bg-black border-black' : 'border-gray-400'
                    }`}
                  >
                    {selectedProviders.has(provider.id) && <Feather name="check" size={12} color="white" />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Delivery Timeframe */}
          <View className="bg-white rounded-xl border border-gray-200 p-4">
            <Text className="text-base font-inter-semibold text-gray-900 mb-2">Delivery Timeframe</Text>
            <Text className="text-sm font-inter-semibold text-gray-600 mb-4">
              Set your estimated delivery time (applies to all providers)
            </Text>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <InputComponent
                  value={deliveryTimeframe.min}
                  label="Minimum Days"
                  size="small"
                  placeholder="1"
                  onChangeText={(text) => setDeliveryTimeframe((prev) => ({ ...prev, min: text }))}
                />
              </View>
              <View className="flex-1">
                <InputComponent
                  value={deliveryTimeframe.max}
                  label="Maximum Days"
                  size="small"
                  placeholder="10"
                  onChangeText={(text) => setDeliveryTimeframe((prev) => ({ ...prev, max: text }))}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const data = [{ id: 'content' }];

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <View className="gap-1">
              <Text className="text-xl font-inter-bold text-gray-900">Shipping Settings</Text>
              <Text className="text-sm font-inter-semibold text-gray-600">
                Manage your shipping address and delivery options
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Feather name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}

          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={() => <View className="flex-1 p-4">{renderContent()}</View>}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          />

          {/* Fixed Footer */}
          <View className="p-4 border-t border-gray-200">
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={handleClose} className="flex-1 border border-gray-300 rounded-lg p-4">
                <Text className="text-center text-sm font-inter-semibold text-gray-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSettings}
                disabled={
                  !userId ||
                  isSavingSettings ||
                  selectedProviders.size === 0 ||
                  !deliveryTimeframe.min ||
                  !deliveryTimeframe.max
                }
                className={`flex-1 rounded-lg p-4 ${
                  !userId ||
                  isSavingSettings ||
                  selectedProviders.size === 0 ||
                  !deliveryTimeframe.min ||
                  !deliveryTimeframe.max
                    ? 'bg-gray-400'
                    : 'bg-black'
                }`}
              >
                <Text className="text-center text-sm font-inter-semibold text-white">
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};
