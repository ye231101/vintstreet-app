import { DropdownComponent } from '@/components/common';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const CATEGORY_OPTIONS = [
    { label: 'Order Issue', value: 'Order Issue' },
    { label: 'Payment Problem', value: 'Payment Problem' },
    { label: 'Account Access', value: 'Account Access' },
    { label: 'Technical Issue', value: 'Technical Issue' },
    { label: 'Product Question', value: 'Product Question' },
    { label: 'Other', value: 'Other' },
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
        <Text className={`text-sm font-inter-semibold ${isTappable ? 'text-blue-500 underline' : 'text-gray-900'}`}>
          {value}
        </Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4 bg-gray-50">
          {/* Support Categories */}
          <View className="mb-4">
            <Text className="text-gray-900 text-base font-inter-bold mb-2">What can we help you with?</Text>
            <DropdownComponent
              data={CATEGORY_OPTIONS}
              value={selectedCategory}
              placeholder="Select a category"
              onChange={(item) => setSelectedCategory(item.value)}
            />
          </View>

          {/* Message Field */}
          <View className="mb-6">
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
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Quick Email Button */}
          <TouchableOpacity
            onPress={handleQuickEmail}
            className="border border-black rounded-xl py-4 items-center mb-4"
          >
            <Text className="text-black text-base font-inter-bold">Send Quick Email</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitRequest}
            disabled={isSubmitting}
            className={`rounded-xl py-4 items-center mb-6 ${isSubmitting ? 'bg-gray-400' : 'bg-black'}`}
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
              <Feather name="info" size={20} color="#000" />
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
    </SafeAreaView>
  );
}
