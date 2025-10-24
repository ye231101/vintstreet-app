import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Order Issue');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const supportCategories = [
    'Order Issue',
    'Payment Problem',
    'Account Access',
    'Technical Issue',
    'Product Question',
    'Other',
  ];

  const handleSubmitRequest = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details');
      return;
    }

    setIsSubmitting(true);

    try {
      const subject = `Support Request: ${selectedCategory}`;
      const body = `Hello Vint Street Support Team,

I need assistance with the following issue:

Category: ${selectedCategory}

Description:
${message.trim()}

Please get back to me as soon as possible.

Thank you,
[Your Name]`;

      const emailUri = `mailto:support@vintstreet.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`;

      const canOpen = await Linking.canOpenURL(emailUri);
      if (canOpen) {
        await Linking.openURL(emailUri);

        Alert.alert(
          'Email App Launched',
          'Your default email app has been opened with a pre-filled message to our support team. Please review and send the email.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Email App Not Found',
          'No email app was found on your device. Please manually send an email to support@vintstreet.com with your support request.'
        );
      }
    } catch (error) {
      Alert.alert('Error', `An error occurred while trying to open your email app: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickEmail = async () => {
    try {
      const emailUri = `mailto:support@vintstreet.com?subject=${encodeURIComponent(
        'Support Request'
      )}&body=${encodeURIComponent(`Hello Vint Street Support Team,

I need assistance with an issue.

Please get back to me as soon as possible.

Thank you,
[Your Name]`)}`;

      const canOpen = await Linking.canOpenURL(emailUri);
      if (canOpen) {
        await Linking.openURL(emailUri);
      } else {
        Alert.alert('Error', 'No email app found on your device');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open email app: ${error}`);
    }
  };

  const handleEmailContact = async () => {
    try {
      const emailUri = `mailto:support@vintstreet.com?subject=${encodeURIComponent(
        'Support Request'
      )}&body=${encodeURIComponent(`Hello Vint Street Support Team,

I need assistance with an issue.

Please get back to me as soon as possible.

Thank you,
[Your Name]`)}`;

      const canOpen = await Linking.canOpenURL(emailUri);
      if (canOpen) {
        await Linking.openURL(emailUri);
      } else {
        Alert.alert('Error', 'No email app found on your device');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open email app: ${error}`);
    }
  };

  const handlePhoneContact = async () => {
    try {
      const phoneUri = 'tel:1-800-VINT-STREET';
      const canOpen = await Linking.canOpenURL(phoneUri);
      if (canOpen) {
        await Linking.openURL(phoneUri);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open phone app: ${error}`);
    }
  };

  const CategoryDropdown = () => {
    if (!showCategoryDropdown) return null;

    return (
      <View className="absolute inset-0 z-50">
        <TouchableOpacity
          className="flex-1 bg-black/30"
          onPress={() => setShowCategoryDropdown(false)}
          activeOpacity={1}
        />
        <View className="absolute top-25 left-4 right-4 bg-white rounded-lg shadow-2xl">
          {supportCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSelectedCategory(category);
                setShowCategoryDropdown(false);
              }}
              className={`px-4 py-3 flex-row items-center justify-between ${
                index < supportCategories.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <Text
                className={`text-sm font-inter-semibold ${selectedCategory === category ? 'text-blue-500' : 'text-gray-900'}`}
              >
                {category}
              </Text>
              {selectedCategory === category && <Feather name="check" size={16} color="#007AFF" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const ContactMethod = ({
    icon,
    title,
    value,
    isTappable = false,
    onPress,
  }: {
    icon: string;
    title: string;
    value: string;
    isTappable?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={isTappable ? onPress : undefined}
      disabled={!isTappable}
      className="flex-row items-center py-1"
    >
      <Feather name={icon as any} color="#666" size={20} />
      <View className="ml-3 flex-1">
        <Text className="text-gray-600 text-xs font-inter">{title}</Text>
        <Text className={`text-sm font-inter-semibold ${isTappable ? 'text-blue-500 underline' : 'text-gray-900'}`}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Contact Support</Text>
      </View>

      <View className="flex-1 bg-gray-50">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="p-4">
          {/* Support Categories */}
          <Text className="text-gray-900 text-base font-inter-bold mb-2">What can we help you with?</Text>

          <TouchableOpacity
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="bg-white rounded-xl px-3 py-4 flex-row items-center justify-between shadow-sm"
          >
            <Text className="text-gray-900 text-base font-inter">{selectedCategory}</Text>
            <Feather name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          <View className="h-6" />

          {/* Message Field */}
          <Text className="text-gray-900 text-base font-inter-bold mb-2">Describe your issue</Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            className="bg-white rounded-xl p-4 text-gray-900 text-base font-inter-semibold min-h-30 shadow-sm"
            placeholder="Please provide as much detail as possible..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <View className="h-6" />

          {/* Quick Email Button */}
          <TouchableOpacity
            onPress={handleQuickEmail}
            className="border border-blue-500 rounded-xl py-4 items-center mb-4"
          >
            <Text className="text-blue-500 text-base font-inter-bold">Send Quick Email</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitRequest}
            disabled={isSubmitting}
            className={`rounded-xl py-4 items-center mb-6 ${isSubmitting ? 'bg-gray-400' : 'bg-blue-500'}`}
          >
            {isSubmitting ? (
              <Text className="text-white text-base font-inter-bold">Submitting...</Text>
            ) : (
              <Text className="text-white text-base font-inter-bold">Submit Request</Text>
            )}
          </TouchableOpacity>

          {/* Contact Info Card */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <Feather name="info" size={20} color="#007AFF" />
              <Text className="text-gray-900 text-base font-inter-bold ml-2">Other Ways to Contact Us</Text>
            </View>

            <ContactMethod
              icon="mail"
              title="Email"
              value="support@vintstreet.com"
              isTappable
              onPress={handleEmailContact}
            />

            <View className="h-2" />

            <ContactMethod
              icon="phone"
              title="Phone"
              value="1-800-VINT-STREET"
              isTappable
              onPress={handlePhoneContact}
            />

            <View className="h-2" />

            <ContactMethod icon="clock" title="Hours" value="Mon-Fri, 9:00 AM - 6:00 PM EST" />
          </View>
        </View>
        </ScrollView>

        {/* Category Dropdown */}
        <CategoryDropdown />
      </View>
    </SafeAreaView>
  );
}
