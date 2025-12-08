import { InputComponent } from '@/components/common/input';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const segments = useSegments();
  const { isAuthenticated, user, logout, changePassword, deleteAccount } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount();
      if (result?.type === 'auth/deleteAccount/fulfilled') {
        setShowDeleteAccountModal(false);
        Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
      } else {
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
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
        const rejectedResult = result as unknown;
        const errorMessage = rejectedResult.error?.message || 'Failed to change password';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="items-center mb-8">
              <View className="w-24 h-24 items-center justify-center mb-6 rounded-full bg-gray-100">
                <Feather name="user" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-base font-inter-semibold text-gray-500 text-center max-w-sm">
                Please sign in to access your account and manage your profile
              </Text>
            </View>

            <View className="w-full max-w-sm gap-4">
              <Pressable
                onPress={() => {
                  const currentPath = '/' + segments.join('/');
                  router.push(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
                }}
                className="w-full h-14 items-center justify-center rounded-lg bg-black"
              >
                <Text className="text-base font-inter-bold text-white">Sign In</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(auth)/register')}
                className="w-full h-14 items-center justify-center rounded-lg border-2 border-gray-300 bg-white"
              >
                <Text className="text-base font-inter-bold text-black">Create Account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 mb-14 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Profile Header Section */}
        <View className="flex-row items-center gap-4 p-4">
          {/* Profile Avatar */}
          <View className="items-center justify-center w-24 h-24 overflow-hidden rounded-full bg-gray-200">
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
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-lg font-inter-bold text-black">{user?.full_name || 'Unknown User'}</Text>
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
        <View className="h-px bg-gray-200" />

        {/* Seller Hub Section */}
        <View className="px-2 py-4">
          <Text className="px-4 mb-2 text-xs font-inter-bold text-black uppercase">SELLER HUB</Text>

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
            </>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200" />

        {/* Shopping Section */}
        <View className="px-2 py-4">
          <Text className="px-4 mb-2 text-xs font-inter-bold text-black uppercase">SHOPPING</Text>

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

          <Pressable onPress={() => router.push('/cart')} className="flex-row items-center px-4 py-3">
            <Feather name="shopping-cart" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Cart</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/wishlist')} className="flex-row items-center px-4 py-3">
            <Feather name="heart" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">My Wishlist</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={() => router.push('/other/addresses')} className="flex-row items-center px-4 py-3">
            <Feather name="map-pin" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Addresses</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-200" />

        {/* Support Section */}
        <View className="px-2 py-4">
          <Text className="px-4 mb-2 text-xs font-inter-bold text-black uppercase">SUPPORT</Text>

          <Pressable onPress={handleChangePassword} className="flex-row items-center px-4 py-3">
            <Feather name="lock" size={24} color="#000" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-black">Change Password</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </Pressable>

          <Pressable onPress={showLogoutConfirmation} className="flex-row items-center px-4 py-3">
            <Feather name="log-out" size={24} color="#ff4444" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-red-500">Logout</Text>
          </Pressable>

          <Pressable onPress={() => setShowDeleteAccountModal(true)} className="flex-row items-center px-4 py-3">
            <Feather name="trash-2" size={24} color="#ff4444" />
            <Text className="flex-1 ml-4 text-base font-inter-semibold text-red-500">Delete Account</Text>
            <Feather name="chevron-right" size={16} color="#ff4444" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePasswordModal}
      >
        <View className="flex-1 items-center justify-center p-4 bg-black/50">
          <View className="w-full max-w-lg gap-4 p-6 rounded-lg bg-white shadow-lg">
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
            <InputComponent
              value={currentPassword}
              label="Current Password"
              icon="shield"
              placeholder="Enter current password"
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
            />

            {/* New Password Field */}
            <InputComponent
              value={newPassword}
              label="New Password"
              icon="shield"
              placeholder="Enter new password"
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setShowNewPassword(!showNewPassword)}
            />

            {/* Confirm Password Field */}
            <InputComponent
              value={confirmPassword}
              label="Confirm New Password"
              icon="shield"
              placeholder="Confirm new password"
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleClosePasswordModal}
                disabled={isChangingPassword}
                className="flex-1 py-3.5 px-4 rounded-lg border-2 border-gray-200 bg-white"
              >
                <Text className="text-base font-inter-bold text-gray-700 text-center">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmChangePassword}
                disabled={isChangingPassword}
                className={`flex-1 py-3.5 px-4 rounded-lg shadow-lg ${isChangingPassword ? 'bg-gray-400' : 'bg-black'}`}
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

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
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

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-xl p-5 w-full max-w-sm shadow-lg">
            <View className="items-center mb-4">
              <View className="bg-red-100 rounded-full p-3 mb-3">
                <Feather name="alert-triangle" size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-inter-bold text-black text-center">Delete Account</Text>
            </View>

            <Text className="mb-2 text-center text-base font-inter-semibold text-black leading-6">
              Are you sure you want to delete your account?
            </Text>

            <Text className="mb-6 text-center text-sm font-inter text-gray-500 leading-5">
              This action is permanent and cannot be undone. All your data, including your profile, listings, and order
              history will be permanently deleted.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
              >
                <Text className="text-base font-inter-semibold text-black text-center">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
                className={`flex-1 px-4 py-3 rounded-lg ${isDeletingAccount ? 'bg-gray-400' : 'bg-red-500'}`}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-inter-semibold text-white text-center">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
