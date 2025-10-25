import { useAuth } from '@/hooks/use-auth';
import { Feather } from '@expo/vector-icons';
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
    <SafeAreaView className="flex-1 mb-50 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50">
        {/* Profile Header Section */}
        <View className="flex-row items-center p-4">
          {/* Profile Avatar */}
          <View className="items-center justify-center w-24 h-24 mr-4 rounded-xl bg-gray-200">
            <Image
              source={{
                uri: user?.avatar_url
                  ? user.avatar_url
                  : `https://ui-avatars.com/api/?name=${user?.full_name}&length=1`,
              }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%', borderRadius: 12 }}
            />
          </View>

          {/* User Info */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-inter-bold text-black">{user?.full_name || 'Guest User'}</Text>
              <TouchableOpacity onPress={() => router.push('/cart')} className="p-2">
                <Feather name="shopping-bag" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm font-inter-semibold text-black">{user?.email || 'Not signed in'}</Text>
            <Pressable onPress={() => router.push('/other/edit-profile')} className="mt-1">
              <Text className="text-sm font-inter-semibold text-blue-500">Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800" />

        {/* Seller Hub Section */}
        <View className="px-2 py-4">
          <Text className="mb-2 ml-4 text-xs font-inter-bold text-black uppercase">SELLER HUB</Text>

          {user?.user_type === 'buyer' ? (
            // Show "Set up Seller Account" for buyers only
            <Pressable
              onPress={() => router.push('/other/seller-setup')}
              className="flex-row items-center px-4 py-3 mx-2 bg-blue-50 rounded-xl"
            >
              <View className="p-2 mr-3 bg-blue-100 rounded-lg">
                <Feather name="briefcase" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-inter-bold text-blue-600">Set up Seller Account</Text>
                <Text className="text-xs font-inter-regular text-gray-600">Start selling your vintage items</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#3B82F6" />
            </Pressable>
          ) : (
            // Show full seller menu for sellers and both
            <>
              <Pressable onPress={() => router.push('/seller/dashboard')} className="flex-row items-center px-4 py-3">
                <Feather name="shopping-cart" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Seller Dashboard</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/listings')} className="flex-row items-center px-4 py-3">
                <Feather name="grid" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Listings</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/orders')} className="flex-row items-center py-3 px-4">
                <Feather name="shopping-bag" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Orders</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/offers')} className="flex-row items-center px-4 py-3">
                <Feather name="tag" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Offers</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/reviews')} className="flex-row items-center px-4 py-3">
                <Feather name="star" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Reviews</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable
                onPress={() => router.push('/other/payment-setup')}
                className="flex-row items-center px-4 py-3"
              >
                <Feather name="credit-card" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Payment Setup</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>
            </>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800" />

        {/* Shopping Section */}
        <View className="px-2 py-4">
          <Text className="mb-2 ml-4 text-xs font-inter-bold text-black uppercase">SHOPPING</Text>

          <Pressable onPress={() => router.push('/other/orders')} className="flex-row items-center px-4 py-3">
            <Feather name="shopping-cart" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Orders</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/offers')} className="flex-row items-center px-4 py-3">
            <Feather name="tag" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Offers</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/wishlist')} className="flex-row items-center px-4 py-3">
            <Feather name="heart" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Wishlist</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/payment-methods')} className="flex-row items-center px-4 py-3">
            <Feather name="credit-card" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Payment Methods</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/addresses')} className="flex-row items-center px-4 py-3">
            <Feather name="map-pin" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Addresses</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800" />

        {/* Support Section */}
        <View className="px-2 py-4">
          <Text className="mb-2 ml-4 text-xs font-inter-bold text-black uppercase">SUPPORT</Text>

          <Pressable onPress={() => router.push('/other/help-center')} className="flex-row items-center px-4 py-3">
            <Feather name="help-circle" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Help Center</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/contact-support')} className="flex-row items-center px-4 py-3">
            <Feather name="message-circle" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Contact Support</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-800" />

        {/* Settings Section */}
        <View className="px-2 py-4">
          <Text className="mb-2 ml-4 text-xs font-inter-bold text-black uppercase">SETTINGS</Text>

          <Pressable onPress={() => router.push('/other/app-settings')} className="flex-row items-center px-4 py-3">
            <Feather name="settings" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">App Settings</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/privacy-security')} className="flex-row items-center px-4 py-3">
            <Feather name="shield" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Privacy & Security</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={showLogoutConfirmation} className="flex-row items-center px-4 py-3">
            <Feather name="log-out" size={24} color="#ff4444" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-red-500">Logout</Text>
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
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-4 w-full max-w-80 shadow-lg">
            <Text className="text-xl font-inter-bold text-black mb-4 text-center">Logout</Text>

            <Text className="mb-6 text-center text-base font-inter-semibold text-black leading-6">
              Are you sure you want to logout?
            </Text>

            <View className="flex-row justify-end gap-3">
              <Pressable onPress={() => setShowLogoutModal(false)} className="px-5 py-3">
                <Text className="text-base font-inter-semibold text-black">Cancel</Text>
              </Pressable>

              <Pressable onPress={handleLogout} className="px-5 py-3 bg-red-500 rounded-lg">
                <Text className="text-base font-inter-semibold text-white">Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
