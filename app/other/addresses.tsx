import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Address {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  phone?: string;
  type: 'shipping' | 'billing';
}

export default function AddressesScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      setShippingAddress(null);
      setBillingAddress(null);
    } catch (err) {
      setError('Error loading addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const addAddress = (type: 'shipping' | 'billing') => {
    router.push(`/other/address-form?type=${type}` as any);
  };

  const editAddress = (type: 'shipping' | 'billing') => {
    const address = type === 'shipping' ? shippingAddress : billingAddress;
    if (address) {
      router.push(`/other/address-form?type=${type}&edit=true&id=${address.id}` as any);
    }
  };

  const deleteAddress = (type: 'shipping' | 'billing') => {
    Alert.alert(`Delete ${type} Address`, `Are you sure you want to delete your ${type} address?`, [
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

            if (type === 'shipping') {
              setShippingAddress(null);
            } else {
              setBillingAddress(null);
            }

            Alert.alert('Success', `${type} address deleted`);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const AddressSection = ({
    title,
    subtitle,
    icon,
    address,
    addressType,
    onAdd,
    onEdit,
    onDelete,
  }: {
    title: string;
    subtitle: string;
    icon: string;
    address: Address | null;
    addressType: 'shipping' | 'billing';
    onAdd: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      {/* Section Header */}
      <View className="flex-row items-center mb-4">
        <View className="bg-blue-500/10 rounded-lg p-2 mr-3">
          <Feather name={icon as any} color="#007AFF" size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-lg font-inter-bold mb-1">{title}</Text>
          <Text className="text-gray-600 text-sm font-inter">{subtitle}</Text>
        </View>
      </View>

      {/* Address Content */}
      {address ? (
        <AddressCard
          name={address.name}
          address={`${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${
            address.city
          }, ${address.state ? `${address.state}, ` : ''}${address.postcode}, ${address.country}`}
          phone={address.phone || ''}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <View className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <View className="items-center">
            <Feather name={icon as any} color="#666" size={32} />
            <Text className="text-gray-600 text-base font-inter-medium mt-3 mb-2">
              No {addressType} address saved
            </Text>
            <Text className="text-gray-500 text-sm font-inter-semibold text-center mb-4">
              Add your {addressType} address to continue
            </Text>
            <TouchableOpacity onPress={onAdd} className="bg-blue-500 rounded-lg py-3 px-6 w-full items-center">
              <Text className="text-white text-base font-inter-bold">Add {addressType} Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const AddressCard = ({
    name,
    address,
    phone,
    onEdit,
    onDelete,
  }: {
    name: string;
    address: string;
    phone: string;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <View className="bg-gray-50 rounded-lg p-4 border border-blue-500/30">
      <Text className="text-gray-900 text-sm font-inter-semibold mb-1">{name}</Text>
      <Text className="text-gray-600 text-sm font-inter-semibold mb-1">{address}</Text>
      {phone && <Text className="text-gray-600 text-sm font-inter-semibold mb-4">{phone}</Text>}
      <View className="flex-row justify-end">
        <TouchableOpacity onPress={onEdit} className="mr-2 p-2">
          <Feather name="edit" color="#007AFF" size={20} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="p-2">
          <Feather name="trash-2" color="#ff4444" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">Addresses</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">Addresses</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={48} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading addresses</Text>
          <Text className="text-gray-600 text-sm font-inter-semibold text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadAddresses} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">Addresses</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="p-4">
          {/* Shipping Address Section */}
          <AddressSection
            title="Shipping Address"
            subtitle="Where your orders will be delivered"
            icon="truck"
            address={shippingAddress}
            addressType="shipping"
            onAdd={() => addAddress('shipping')}
            onEdit={() => editAddress('shipping')}
            onDelete={() => deleteAddress('shipping')}
          />

          {/* Billing Address Section */}
          <AddressSection
            title="Billing Address"
            subtitle="Address for payment and invoices"
            icon="credit-card"
            address={billingAddress}
            addressType="billing"
            onAdd={() => addAddress('billing')}
            onEdit={() => editAddress('billing')}
            onDelete={() => deleteAddress('billing')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
