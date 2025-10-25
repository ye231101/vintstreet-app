import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpCenterScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const popularTopics = [
    {
      icon: 'truck',
      title: 'Orders & Shipping',
      subtitle: 'Track orders, shipping info, returns',
      onPress: () => {
        Alert.alert('Orders & Shipping', 'Navigate to Orders & Shipping help section');
      },
    },
    {
      icon: 'credit-card',
      title: 'Payments & Refunds',
      subtitle: 'Payment methods, refund process',
      onPress: () => {
        Alert.alert('Payments & Refunds', 'Navigate to Payments & Refunds help section');
      },
    },
    {
      icon: 'user',
      title: 'Account & Profile',
      subtitle: 'Account settings, profile management',
      onPress: () => {
        Alert.alert('Account & Profile', 'Navigate to Account & Profile help section');
      },
    },
  ];

  const faqItems = [
    {
      question: 'How do I return an item?',
      answer:
        "You can initiate a return within 14 days of delivery. Go to Orders, select the item, and click 'Return Item' to start the process.",
    },
    {
      question: 'When will I receive my refund?',
      answer: 'Refunds are typically processed within 5-7 business days after we receive your return.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'You can track your order in the Orders section of your account. Click on the specific order to view its current status and tracking information.',
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  const handleContactSupport = () => {
    router.push('/other/contact-support' as any);
  };

  const toggleFAQ = (question: string) => {
    setExpandedFAQ(expandedFAQ === question ? null : question);
  };

  const HelpTopic = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center py-3 px-4">
      <Feather name={icon as any} color="#333" size={24} />
      <View className="ml-4 flex-1">
        <Text className="text-gray-900 text-base font-inter-bold mb-1">{title}</Text>
        <Text className="text-gray-600 text-sm font-inter">{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={16} color="#666" />
    </TouchableOpacity>
  );

  const FAQItem = ({
    question,
    answer,
    isExpanded,
    onToggle,
  }: {
    question: string;
    answer: string;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <View>
      <TouchableOpacity onPress={onToggle} className="flex-row items-center py-3 px-4">
        <Text className="text-gray-900 text-base font-inter-semibold flex-1">{question}</Text>
        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
      </TouchableOpacity>
      {isExpanded && (
        <View className="px-4 pb-3">
          <Text className="text-gray-600 text-sm font-inter-semibold leading-5">{answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Help Center</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4 bg-gray-50">
          {/* Search Bar */}
          <View className="bg-white rounded-xl flex-row items-center px-3 mb-6 shadow-sm">
            <Feather name="search" size={20} color="#666" />
            <TextInput
              className="flex-1 text-gray-900 text-base font-inter-semibold py-4 px-3"
              placeholder="Search help articles..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          {/* Popular Topics Section */}
          <Text className="text-gray-500 text-xs font-inter-bold mb-3 uppercase">POPULAR TOPICS</Text>

          {popularTopics.map((topic, index) => (
            <HelpTopic
              key={index}
              icon={topic.icon}
              title={topic.title}
              subtitle={topic.subtitle}
              onPress={topic.onPress}
            />
          ))}

          {/* Divider */}
          <View className="h-px bg-gray-200 my-6" />

          {/* FAQ Section */}
          <Text className="text-gray-500 text-xs font-inter-bold mb-3 uppercase">FREQUENTLY ASKED QUESTIONS</Text>

          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isExpanded={expandedFAQ === item.question}
              onToggle={() => toggleFAQ(item.question)}
            />
          ))}

          {/* Divider */}
          <View className="h-px bg-gray-200 my-6" />
        </View>
      </ScrollView>

      {/* Contact Support Button */}
      <View className="p-4 bg-gray-50 border-t border-gray-200">
        <TouchableOpacity onPress={handleContactSupport} className="bg-blue-500 rounded-xl py-4 items-center">
          <Text className="text-white text-base font-inter-bold">Contact Support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
