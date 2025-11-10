import { SavedAddress, savedAddressesService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressesScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [user?.id])
  );

  const loadAddresses = async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      const data = await savedAddressesService.list(user.id);
      setAddresses(data as SavedAddress[] || []);
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      showErrorToast(err.message || 'Error loading addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const addAddress = () => {
    router.push('/other/address-form' as any);
  };

  const editAddress = (addressId: string) => {
    router.push(`/other/address-form?id=${addressId}` as any);
  };

  const deleteAddress = (address: SavedAddress) => {
    Alert.alert('Delete Address', `Are you sure you want to delete ${address.label || 'this address'}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await savedAddressesService.remove(address.id);
            showSuccessToast('Address deleted successfully');
            loadAddresses();
          } catch (err: any) {
            console.error('Error deleting address:', err);
            showErrorToast(err.message || 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const AddressCard = ({ address }: { address: SavedAddress }) => (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-lg">
      {/* Header with Label and Default Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-blue-500/10 rounded-lg p-2 mr-3">
            <Feather name="home" color="#007AFF" size={20} />
          </View>
          <Text className="text-gray-900 text-lg font-inter-bold flex-1">{address.label || 'Address'}</Text>
        </View>
        {address.is_default && (
          <View className="bg-black rounded-lg px-3 py-1">
            <Text className="text-white text-xs font-inter-bold">Default</Text>
          </View>
        )}
      </View>

      {/* Address Details */}
      <View className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
        <Text className="text-gray-900 text-sm font-inter-semibold mb-2">
          {address.first_name} {address.last_name}
        </Text>
        <Text className="text-gray-600 text-sm font-inter mb-1">{address.address_line1}</Text>
        {address.address_line2 && (
          <Text className="text-gray-600 text-sm font-inter mb-1">{address.address_line2}</Text>
        )}
        <Text className="text-gray-600 text-sm font-inter mb-1">
          {address.city}, {address.state} {address.postal_code}
        </Text>
        <Text className="text-gray-600 text-sm font-inter mb-1">{address.country}</Text>
        <Text className="text-gray-600 text-sm font-inter">{address.phone}</Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => editAddress(address.id)}
          className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-lg py-3"
        >
          <Feather name="edit" color="#007AFF" size={18} />
          <Text className="text-blue-600 text-sm font-inter-bold ml-2">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteAddress(address)}
          className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-lg py-3"
        >
          <Feather name="trash-2" color="#ff4444" size={18} />
          <Text className="text-red-500 text-sm font-inter-bold ml-2">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">My Addresses</Text>
        </View>

        <View className="flex-1">
          <View className="flex-1 items-center justify-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading addresses...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-inter-bold text-black">My Addresses</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4">
          {/* Info Text */}
          <Text className="text-gray-600 text-sm font-inter mb-4">Manage your saved shipping addresses</Text>

          {/* Address List */}
          {addresses.length === 0 ? (
            <View className="bg-white rounded-lg p-8 shadow-lg items-center">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Feather name="home" color="#666" size={48} />
              </View>
              <Text className="text-gray-900 text-xl font-inter-bold mb-2">No saved addresses</Text>
              <Text className="text-gray-600 text-sm font-inter text-center mb-6">
                Add your first address to make checkout faster
              </Text>
              <TouchableOpacity onPress={addAddress} className="bg-black rounded-lg py-3 px-6 flex-row items-center">
                <Feather name="plus" size={18} color="#fff" />
                <Text className="ml-2 text-white text-base font-inter-bold">Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {addresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}

              {/* Add New Address Button */}
              <TouchableOpacity
                onPress={addAddress}
                className="bg-black rounded-lg p-4 shadow-lg flex-row items-center justify-center"
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text className="ml-2 text-white text-base font-inter-bold">Add New Address</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
