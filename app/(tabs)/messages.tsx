import SearchBar from '@/components/search-bar';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Conversation {
  id: number;
  subject: string;
  lastMessageContent: string;
  lastMessageDate: string;
  unreadCount: number;
  recipients: number[];
  otherParticipantName: string;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data based on the image
  const mockConversations: Conversation[] = [
    {
      id: 1,
      subject: 'About Tommy Hilfiger Jeans',
      lastMessageContent: 'About Tommy Hilfiger Jeans, hthththththth',
      lastMessageDate: 'Oct 17, 5:50 AM',
      unreadCount: 0,
      recipients: [2],
      otherParticipantName: 'Matt Scott',
    },
    {
      id: 2,
      subject: 'Hello',
      lastMessageContent: 'Hello 65456',
      lastMessageDate: 'Oct 17, 5:50 AM',
      unreadCount: 0,
      recipients: [2],
      otherParticipantName: 'Matt Scott',
    },
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setConversations(mockConversations);
      setIsLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    return dateString;
  };

  const renderConversationItem = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      onPress={() => router.push(`/message/${conversation.id}`)}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-black justify-center items-center mr-3">
        <Text className="text-white text-lg font-inter-bold">{conversation.otherParticipantName.charAt(0)}</Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        {/* Name */}
        <Text className="text-base font-inter-bold text-black mb-1">{conversation.otherParticipantName}</Text>

        {/* Subject */}
        <Text className="text-sm font-inter text-gray-600 mb-0.5">{conversation.subject}</Text>

        {/* Last Message */}
        <Text className="text-xs font-inter text-gray-400 max-w-4/5" numberOfLines={1}>
          {conversation.lastMessageContent}
        </Text>
      </View>

      {/* Time */}
      <Text className="text-xs font-inter text-gray-400">{formatTime(conversation.lastMessageDate)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Search */}
      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Messages Content */}
      <View className="flex-1 bg-white">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-base font-inter text-gray-600">Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Feather name="message-circle" size={64} color="#ccc" />
            <Text className="text-lg font-inter-bold text-gray-600 mt-4 mb-2">No conversations yet</Text>
            <Text className="text-sm font-inter text-gray-400 text-center">Start a conversation with a seller</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000']} tintColor="#000" />
            }
          >
            {conversations.map(renderConversationItem)}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
