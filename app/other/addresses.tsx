import { buyerService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  type: 'shipping' | 'billing';
}

export default function AddressesScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [user?.id])
  );

  const loadAddresses = async () => {
    if (!user?.id) {
      setError('User not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await buyerService.getBuyerProfile(user.id);

      if (profile) {
        // Parse shipping address
        const shippingAddress = buyerService.getShippingAddress(profile);
        if (shippingAddress) {
          setShippingAddress({
            id: 'shipping',
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            addressLine1: shippingAddress.addressLine1,
            addressLine2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            type: 'shipping',
          });
        } else {
          setShippingAddress(null);
        }

        // Parse billing address
        const billingAddress = buyerService.getBillingAddress(profile);
        if (billingAddress) {
          setBillingAddress({
            id: 'billing',
            firstName: billingAddress.firstName,
            lastName: billingAddress.lastName,
            addressLine1: billingAddress.addressLine1,
            addressLine2: billingAddress.addressLine2,
            city: billingAddress.city,
            state: billingAddress.state,
            postalCode: billingAddress.postalCode,
            country: billingAddress.country,
            phone: billingAddress.phone,
            type: 'billing',
          });
        } else {
          setBillingAddress(null);
        }
      } else {
        setShippingAddress(null);
        setBillingAddress(null);
      }
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      setError(err.message || 'Error loading addresses');
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
          if (!user?.id) {
            showErrorToast('User not found');
            return;
          }

          try {
            if (type === 'shipping') {
              await buyerService.deleteShippingAddress(user.id);
              setShippingAddress(null);
            } else {
              await buyerService.deleteBillingAddress(user.id);
              setBillingAddress(null);
            }

            showSuccessToast(`${type} address deleted successfully`);
          } catch (err: any) {
            console.error('Error deleting address:', err);
            showErrorToast(err.message || 'Failed to delete address');
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
          firstName={address.firstName}
          lastName={address.lastName}
          address={`${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${
            address.city
          }, ${address.state ? `${address.state}, ` : ''}${address.postalCode}, ${address.country}`}
          phone={address.phone || ''}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <View className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <View className="items-center">
            <Feather name={icon as any} color="#666" size={32} />
            <Text className="text-gray-600 text-base font-inter-medium mt-3 mb-2">No {addressType} address saved</Text>
            <Text className="text-gray-500 text-sm font-inter-semibold text-center mb-4">
              Add your {addressType} address to continue
            </Text>
            <TouchableOpacity onPress={onAdd} className="bg-black rounded-lg py-3 px-6 w-full items-center">
              <Text className="text-white text-base font-inter-bold">Add {addressType} Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const AddressCard = ({
    firstName,
    lastName,
    address,
    phone,
    onEdit,
    onDelete,
  }: {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <View className="bg-gray-50 rounded-lg p-4 border border-blue-500/30">
      <Text className="text-gray-900 text-sm font-inter-semibold mb-1">
        {firstName} {lastName}
      </Text>
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
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Addresses</Text>
        </View>

        <View className="flex-1 bg-gray-50">
          <View className="flex-1 justify-center items-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading addresses...</Text>
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

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Addresses</Text>
        </View>

        <View className="flex-1 bg-gray-50">
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading addresses</Text>
            <TouchableOpacity onPress={loadAddresses} className="bg-black rounded-lg py-3 px-6">
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

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Addresses</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4 bg-gray-50">
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
