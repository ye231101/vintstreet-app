import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacySecurityScreen() {
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  // Modal states
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDownloadDataModal, setShowDownloadDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTwoFactorToggle = (value: boolean) => {
    setTwoFactorAuth(value);
    if (value) {
      setShowTwoFactorModal(true);
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleDownloadData = () => {
    setShowDownloadDataModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmChangePassword = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    Alert.alert('Success', 'Password changed successfully');
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const confirmDownloadData = () => {
    Alert.alert('Success', "Data download request submitted. You'll receive an email within 48 hours.");
    setShowDownloadDataModal(false);
  };

  const confirmDeleteAccount = () => {
    Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    setShowDeleteAccountModal(false);
    // Navigate back to login or home
    router.replace('/(auth)');
  };

  const SettingsSwitch = ({
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-gray-900 text-base font-inter-bold mb-1">{title}</Text>
          <Text className="text-gray-600 text-sm font-inter">{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E5E7EB', true: '#007AFF' }}
          thumbColor={value ? '#fff' : '#999'}
        />
      </View>
    </View>
  );

  const SettingsItem = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="px-4 py-4 flex-row items-center justify-between">
      <Text className="text-gray-900 text-base font-inter-bold">{title}</Text>
      <Feather name="chevron-right" size={16} color="#666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">Privacy & Security</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* Security Section */}
        <View className="mt-4 bg-white">
          <Text className="text-gray-500 text-xs font-inter-bold px-4 pt-4 uppercase">SECURITY</Text>

          <SettingsSwitch
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security to your account"
            value={twoFactorAuth}
            onValueChange={handleTwoFactorToggle}
          />

          <SettingsSwitch
            title="Biometric Login"
            subtitle="Use fingerprint or face recognition to log in"
            value={biometricLogin}
            onValueChange={setBiometricLogin}
          />

          <SettingsItem title="Change Password" onPress={handleChangePassword} />
        </View>

        {/* Privacy Section */}
        <View className="mt-4 bg-white">
          <Text className="text-gray-500 text-xs font-inter-bold px-4 pt-4 uppercase">PRIVACY</Text>

          <SettingsSwitch
            title="Location Services"
            subtitle="Allow app to access your location"
            value={locationServices}
            onValueChange={setLocationServices}
          />

          <SettingsSwitch
            title="Activity Status"
            subtitle="Show when you're active on the app"
            value={activityStatus}
            onValueChange={setActivityStatus}
          />

          <SettingsSwitch
            title="Profile Visibility"
            subtitle="Make your profile visible to other users"
            value={profileVisibility}
            onValueChange={setProfileVisibility}
          />
        </View>

        {/* Data & Privacy Section */}
        <View className="mt-4 bg-white">
          <Text className="text-gray-500 text-xs font-inter-bold px-4 pt-4 uppercase">DATA & PRIVACY</Text>

          <SettingsItem
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content')}
          />

          <SettingsItem
            title="Terms of Service"
            onPress={() => Alert.alert('Terms of Service', 'Terms of service content')}
          />

          <SettingsItem title="Download My Data" onPress={handleDownloadData} />
        </View>

        {/* Delete Account Button */}
        <View className="p-4">
          <TouchableOpacity onPress={handleDeleteAccount} className="bg-red-500 py-4 px-6 rounded-xl items-center">
            <Text className="text-white text-base font-inter-bold">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Two-Factor Authentication Modal */}
      <Modal
        visible={showTwoFactorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTwoFactorModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl p-5 m-5 w-11/12">
            <Text className="text-gray-900 text-lg font-inter-bold mb-3">Set Up Two-Factor Authentication</Text>
            <Text className="text-gray-600 text-sm font-inter mb-5">
              We'll send you a verification code via SMS when you log in from a new device.
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => {
                  setTwoFactorAuth(false);
                  setShowTwoFactorModal(false);
                }}
                className="mr-4"
              >
                <Text className="text-gray-600 text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTwoFactorModal(false)}>
                <Text className="text-blue-500 text-base">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl p-5 m-5 w-11/12">
            <Text className="text-gray-900 text-lg font-inter-bold mb-5">Change Password</Text>

            <TextInput
              className="bg-gray-100 rounded-lg p-3 text-gray-900 mb-3 font-inter border border-gray-200"
              placeholder="Current Password"
              placeholderTextColor="#999"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <TextInput
              className="bg-gray-100 rounded-lg p-3 text-gray-900 mb-3 font-inter border border-gray-200"
              placeholder="New Password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              className="bg-gray-100 rounded-lg p-3 text-gray-900 mb-5 font-inter border border-gray-200"
              placeholder="Confirm New Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)} className="mr-4">
                <Text className="text-gray-600 text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmChangePassword}>
                <Text className="text-blue-500 text-base">Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download Data Modal */}
      <Modal
        visible={showDownloadDataModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDownloadDataModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl p-5 m-5 w-11/12">
            <Text className="text-gray-900 text-lg font-inter-bold mb-3">Download My Data</Text>
            <Text className="text-gray-600 text-sm font-inter mb-5">
              We'll prepare your data and send it to your registered email address. This may take up to 48 hours.
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setShowDownloadDataModal(false)} className="mr-4">
                <Text className="text-gray-600 text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDownloadData}>
                <Text className="text-blue-500 text-base">Request Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl p-5 m-5 w-11/12">
            <Text className="text-gray-900 text-lg font-inter-bold mb-3">Delete Account</Text>
            <Text className="text-gray-600 text-sm font-inter mb-5">
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setShowDeleteAccountModal(false)} className="mr-4">
                <Text className="text-gray-600 text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteAccount}>
                <Text className="text-red-500 text-base">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
