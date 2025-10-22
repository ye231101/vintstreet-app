import { useAuth } from '@/hooks/use-auth';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { logout, user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
  };

  const showLogoutConfirmation = () => {
    setShowLogoutModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Profile Header Section */}
        <View className="flex-row items-center px-4">
          {/* Profile Avatar */}
          <View className="w-24 h-24 bg-gray-200 rounded-xl justify-center items-center mr-4">
            <Image
              source={user?.avatar_url ? { uri: user.avatar_url } : require('@/assets/images/default_user_icon.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* User Info */}
          <View className="flex-1">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-inter-bold text-black">{user?.full_name || 'Guest User'}</Text>
              <TouchableOpacity onPress={() => router.push('/cart')} className="p-2">
                <Feather name="shopping-bag" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm font-inter text-black">{user?.email || 'Not signed in'}</Text>
            <Pressable className="mt-1">
              <Text className="text-sm font-inter text-blue-500">Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800 my-4" />

        {/* Seller Hub Section */}
        <View className="px-2">
          <Text className="text-xs font-inter-bold text-black ml-4 mb-2 uppercase">SELLER HUB</Text>

          <Pressable onPress={() => router.push('/seller/dashboard')} className="flex-row items-center py-3 px-4">
            <Feather name="shopping-cart" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Seller Dashboard</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/seller/listings')} className="flex-row items-center py-3 px-4">
            <Feather name="grid" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">My Listings</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/seller/orders')} className="flex-row items-center py-3 px-4">
            <Feather name="shopping-bag" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Orders</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/seller/offers')} className="flex-row items-center py-3 px-4">
            <Feather name="tag" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Offers</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/seller/reviews')} className="flex-row items-center py-3 px-4">
            <Feather name="star" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Reviews</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/payment-setup')} className="flex-row items-center py-3 px-4">
            <Feather name="credit-card" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Payment Setup</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800 my-4" />

        {/* Shopping Section */}
        <View className="px-2">
          <Text className="text-xs font-inter-bold text-black ml-4 mb-2 uppercase">SHOPPING</Text>

          <Pressable onPress={() => router.push('/other/orders')} className="flex-row items-center py-3 px-4">
            <Feather name="shopping-cart" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">My Orders</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/offers')} className="flex-row items-center py-3 px-4">
            <Feather name="tag" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">My Offers</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/wishlist')} className="flex-row items-center py-3 px-4">
            <Feather name="heart" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">My Wishlist</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/payment-methods')} className="flex-row items-center py-3 px-4">
            <Feather name="credit-card" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Payment Methods</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/addresses')} className="flex-row items-center py-3 px-4">
            <Feather name="map-pin" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Addresses</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800 my-4" />

        {/* Support Section */}
        <View className="px-2">
          <Text className="text-xs font-inter-bold text-black ml-4 mb-2 uppercase">SUPPORT</Text>

          <Pressable onPress={() => router.push('/other/help-center')} className="flex-row items-center py-3 px-4">
            <Feather name="help-circle" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Help Center</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/contact-support')} className="flex-row items-center py-3 px-4">
            <Feather name="message-circle" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Contact Support</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800 my-4" />

        {/* Settings Section */}
        <View className="px-2">
          <Text className="text-xs font-inter-bold text-black ml-4 mb-2 uppercase">SETTINGS</Text>

          <Pressable onPress={() => router.push('/other/app-settings')} className="flex-row items-center py-3 px-4">
            <Feather name="settings" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">App Settings</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/privacy-security')} className="flex-row items-center py-3 px-4">
            <Feather name="shield" size={24} color="#000" />
            <Text className="text-base font-inter text-black ml-4 flex-1">Privacy & Security</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={showLogoutConfirmation} className="flex-row items-center py-3 px-4">
            <Feather name="log-out" size={24} color="#ff4444" />
            <Text className="text-base font-inter text-red-500 ml-4 flex-1">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-80 shadow-lg">
            <Text className="text-xl font-inter-bold text-black mb-4 text-center">Logout</Text>

            <Text className="text-base font-inter text-black mb-6 text-center leading-6">
              Are you sure you want to logout?
            </Text>

            <View className="flex-row justify-end gap-3">
              <Pressable onPress={() => setShowLogoutModal(false)} className="py-3 px-5">
                <Text className="text-base font-inter text-black">Cancel</Text>
              </Pressable>

              <Pressable onPress={handleLogout} className="py-3 px-5">
                <Text className="text-base font-inter-semibold text-red-500">Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
