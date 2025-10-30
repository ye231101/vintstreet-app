import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { logout, user, changePassword, loading } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states for Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
  };

  const showLogoutConfirmation = () => {
    setShowLogoutModal(true);
  };

  const handleChangePassword = () => {
    // Reset form when opening modal
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowChangePasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    // Reset form when closing modal
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const confirmChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    // Change password
    setIsChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.type === 'auth/updatePassword/fulfilled') {
        Alert.alert('Success', 'Password changed successfully!');
        handleClosePasswordModal();
      } else if (result.type === 'auth/updatePassword/rejected') {
        // Extract error message from rejected action
        const rejectedResult = result as any;
        const errorMessage = rejectedResult.error?.message || 'Failed to change password';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 mb-50 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-50">
        {/* Profile Header Section */}
        <View className="flex-row items-center p-4">
          {/* Profile Avatar */}
          <View className="items-center justify-center w-24 h-24 mr-4 overflow-hidden rounded-full bg-gray-200">
            <Image
              source={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&length=1`}
              contentFit="cover"
              placeholder={blurhash}
              transition={1000}
              style={{ width: '100%', height: '100%' }}
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
              onPress={() => router.push('/seller/seller-setup')}
              className="flex-row items-center px-4 py-3 mx-2 bg-blue-50 rounded-xl"
            >
              <View className="p-2 mr-3 bg-blue-100 rounded-lg">
                <Feather name="briefcase" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-inter-bold text-blue-600">Set up Seller Account</Text>
                <Text className="text-xs font-inter text-gray-600">Start selling your vintage items</Text>
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

              <Pressable
                onPress={() => router.push('/seller/shop-settings')}
                className="flex-row items-center px-4 py-3"
              >
                <Feather name="settings" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Shop Settings</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/listings')} className="flex-row items-center px-4 py-3">
                <Feather name="grid" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Listings</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/streams')} className="flex-row items-center px-4 py-3">
                <Feather name="video" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Streams</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </Pressable>

              <Pressable onPress={() => router.push('/seller/messages')} className="flex-row items-center px-4 py-3">
                <Feather name="mail" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Messages</Text>
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

              <Pressable onPress={() => router.push('/seller/finances')} className="flex-row items-center px-4 py-3">
                <Feather name="dollar-sign" size={24} color="#000" />
                <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Finance</Text>
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

          <Pressable onPress={handleChangePassword} className="flex-row items-center px-4 py-3">
            <Feather name="lock" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Change Password</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

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

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePasswordModal}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-96 shadow-2xl">
            {/* Header Section */}
            <View className="items-center mb-6">
              <View className="bg-blue-100 rounded-full p-4 mb-3">
                <Feather name="lock" size={32} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-inter-bold text-gray-900 mb-2">Change Password</Text>
              <Text className="text-sm font-inter-regular text-gray-500 text-center">
                Please enter your current password and choose a new secure password
              </Text>
            </View>

            {/* Current Password Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-gray-700 mb-2">Current Password</Text>
              <View className="relative">
                <View className="absolute left-3 top-3.5 z-10">
                  <Feather name="shield" size={20} color="#999" />
                </View>
                <TextInput
                  className="bg-gray-50 rounded-xl pl-11 pr-12 py-3.5 text-gray-900 font-inter-medium border-2 border-gray-200 focus:border-blue-500"
                  placeholder="Enter current password"
                  placeholderTextColor="#999"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3.5"
                  hitSlop={8}
                >
                  <Feather name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-gray-700 mb-2">New Password</Text>
              <View className="relative">
                <View className="absolute left-3 top-3.5 z-10">
                  <Feather name="key" size={20} color="#999" />
                </View>
                <TextInput
                  className="bg-gray-50 rounded-xl pl-11 pr-12 py-3.5 text-gray-900 font-inter-medium border-2 border-gray-200 focus:border-blue-500"
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5"
                  hitSlop={8}
                >
                  <Feather name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <Text className="text-xs font-inter-regular text-gray-500 mt-1.5 ml-1">
                Must be at least 6 characters
              </Text>
            </View>

            {/* Confirm Password Field */}
            <View className="mb-6">
              <Text className="text-sm font-inter-semibold text-gray-700 mb-2">Confirm New Password</Text>
              <View className="relative">
                <View className="absolute left-3 top-3.5 z-10">
                  <Feather name="check-circle" size={20} color="#999" />
                </View>
                <TextInput
                  className="bg-gray-50 rounded-xl pl-11 pr-12 py-3.5 text-gray-900 font-inter-medium border-2 border-gray-200 focus:border-blue-500"
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5"
                  hitSlop={8}
                >
                  <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleClosePasswordModal}
                disabled={isChangingPassword}
                className="flex-1 py-3.5 px-4 rounded-xl border-2 border-gray-200 bg-white"
              >
                <Text className="text-base font-inter-bold text-gray-700 text-center">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmChangePassword}
                disabled={isChangingPassword}
                className={`flex-1 py-3.5 px-4 rounded-xl shadow-lg ${
                  isChangingPassword ? 'bg-blue-300' : 'bg-blue-500'
                }`}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-inter-bold text-white text-center">Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
