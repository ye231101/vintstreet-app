import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppSettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  const languages = ['English', 'Spanish', 'French', 'German', 'Italian'];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  const handleClearData = () => {
    Alert.alert('Success', 'App data has been cleared successfully.');
    setShowClearDataModal(false);
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
          <Text className="text-white text-base font-inter-bold mb-1">{title}</Text>
          <Text className="text-gray-400 text-sm font-inter">{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#333', true: '#007AFF' }}
          thumbColor={value ? '#fff' : '#999'}
        />
      </View>
    </View>
  );

  const SettingsDropdown = ({ title, value, onPress }: { title: string; value: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="px-4 py-4 flex-row items-center justify-between">
      <Text className="text-white text-base font-inter-bold">{title}</Text>
      <View className="flex-row items-center">
        <Text className="text-gray-400 text-sm font-inter mr-2">{value}</Text>
        <Feather name="chevron-down" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const InfoTile = ({ title, value }: { title: string; value: string }) => (
    <View className="px-4 py-4 border-b border-gray-700 flex-row items-center justify-between">
      <Text className="text-white text-base font-inter-bold">{title}</Text>
      <Text className="text-gray-400 text-sm font-inter">{value}</Text>
    </View>
  );

  const InlineDropdown = ({
    items,
    selectedValue,
    onSelect,
    visible,
    onClose,
    topPosition = 200,
  }: {
    items: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    visible: boolean;
    onClose: () => void;
    topPosition?: number;
  }) => {
    if (!visible) return null;

    return (
      <View className="absolute inset-0 z-50">
        <TouchableOpacity className="flex-1 bg-black/30" onPress={onClose} activeOpacity={1} />
        {/* Dropdown positioned to the right */}
        <View className="absolute right-4 bg-gray-800 rounded-lg min-w-30 shadow-2xl" style={{ top: topPosition }}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              className={`px-4 py-3 flex-row items-center justify-between ${
                index < items.length - 1 ? 'border-b border-gray-600' : ''
              }`}
            >
              <Text className={`text-sm font-inter ${selectedValue === item ? 'text-blue-500' : 'text-white'}`}>
                {item}
              </Text>
              {selectedValue === item && <Feather name="check" size={16} color="#007AFF" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-white">App Settings</Text>
      </View>

      <View className="flex-1 relative">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Notifications Section */}
          <View className="mt-4">
            <Text className="text-gray-400 text-xs font-inter-bold ml-4 mb-2 uppercase">NOTIFICATIONS</Text>

            <SettingsSwitch
              title="Push Notifications"
              subtitle="Receive push notifications for updates"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />

            <SettingsSwitch
              title="Email Notifications"
              subtitle="Receive email updates and newsletters"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-700 mx-4 my-4" />

          {/* Appearance Section */}
          <View>
            <Text className="text-gray-400 text-xs font-inter-bold ml-4 mb-2 uppercase">APPEARANCE</Text>

            <SettingsSwitch
              title="Dark Mode"
              subtitle="Use dark theme throughout the app"
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-700 mx-4 my-4" />

          {/* Language & Region Section */}
          <View>
            <Text className="text-gray-400 text-xs font-inter-bold ml-4 mb-2 uppercase">LANGUAGE & REGION</Text>

            <SettingsDropdown
              title="Language"
              value={selectedLanguage}
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            />

            <SettingsDropdown
              title="Currency"
              value={selectedCurrency}
              onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            />
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-700 mx-4 my-4" />

          {/* App Info Section */}
          <View>
            <Text className="text-gray-400 text-xs font-inter-bold ml-4 mb-2 uppercase">APP INFO</Text>

            <InfoTile title="Version" value="1.0.0 (Build 123)" />

            <InfoTile title="Device ID" value="VS-12345-ABCD" />
          </View>

          {/* Clear Data Button */}
          <View className="p-4">
            <TouchableOpacity
              onPress={() => setShowClearDataModal(true)}
              className="bg-red-500 py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-white text-base font-inter-bold">Clear App Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Inline Language Dropdown */}
        <InlineDropdown
          items={languages}
          selectedValue={selectedLanguage}
          onSelect={setSelectedLanguage}
          visible={showLanguageDropdown}
          onClose={() => setShowLanguageDropdown(false)}
          topPosition={200}
        />

        {/* Inline Currency Dropdown */}
        <InlineDropdown
          items={currencies}
          selectedValue={selectedCurrency}
          onSelect={setSelectedCurrency}
          visible={showCurrencyDropdown}
          onClose={() => setShowCurrencyDropdown(false)}
          topPosition={250}
        />
      </View>

      {/* Clear Data Confirmation Modal */}
      <Modal
        visible={showClearDataModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClearDataModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-gray-900 rounded-xl p-5 m-5 w-11/12">
            <Text className="text-white text-lg font-inter-bold mb-3">Clear App Data</Text>
            <Text className="text-gray-400 text-sm font-inter mb-5">
              This will clear all app data including saved preferences. This action cannot be undone.
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setShowClearDataModal(false)} className="mr-4">
                <Text className="text-gray-400 text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearData}>
                <Text className="text-red-500 text-base">Clear Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
