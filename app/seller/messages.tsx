import { Conversation, messagesService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadConversations();
      }
      return undefined;
    }, [user?.id])
  );

  const loadConversations = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch received messages only (where user is the recipient)
      const fetchedConversations = await messagesService.getReceivedMessages(user.id);
      setConversations(fetchedConversations);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Error loading messages');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Check if it's today
      if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else {
        // Show date and time for older messages
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch (e) {
      return dateString;
    }
  };

  // Filter conversations based on search text
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchText.trim()) return true;

    const searchLower = searchText.toLowerCase();
    const userName = conversation.other_user_name?.toLowerCase() || '';
    const subject = conversation.subject?.toLowerCase() || '';
    const lastMessage = conversation.last_message?.toLowerCase() || '';

    return userName.includes(searchLower) || subject.includes(searchLower) || lastMessage.includes(searchLower);
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-inter-bold text-black">My Messages</Text>
      </View>

      {/* Messages Content */}
      <View className="flex-1">
        {/* Search Bar */}
        <View className="px-4 py-2 bg-white border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1">
            <Feather name="search" size={20} color="#666" />
            <TextInput
              className="flex-1 ml-2 bg-transparent text-base font-inter text-black"
              placeholder="Search messages..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading messages...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading messages</Text>
            <TouchableOpacity onPress={loadConversations} className="bg-black rounded-lg py-3 px-6">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="inbox" size={64} color="#ccc" />
            <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-600">No messages yet</Text>
            <Text className="text-sm font-inter-semibold text-center text-gray-400">
              You haven't received any messages yet
            </Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="search" size={64} color="#ccc" />
            <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-600">No results found</Text>
            <Text className="text-sm font-inter-semibold text-center text-gray-400">
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Table Header */}
            <View className="flex-row items-center py-3 px-4 bg-gray-100 border-b border-gray-200">
              <View className="flex-1">
                <Text className="text-sm font-inter-bold text-gray-700 uppercase">From</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-inter-bold text-gray-700 uppercase">Subject</Text>
              </View>
              <View className="w-24">
                <Text className="text-sm font-inter-bold text-gray-700 uppercase text-right">Status</Text>
              </View>
            </View>

            {/* Messages List */}
            {filteredConversations.map((conversation, index) => (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => router.push(`/message/${conversation.id}`)}
                className={`flex-row items-center py-4 px-4 border-b border-gray-100 ${
                  conversation.unread_count > 0 ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                {/* Avatar + Name */}
                <View className="flex-row items-center flex-1">
                  <View className="items-center justify-center w-10 h-10 mr-3 rounded-full bg-black">
                    <Text className="text-white text-sm font-inter-bold">
                      {conversation.other_user_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-inter-bold text-black" numberOfLines={1}>
                      {conversation.other_user_name || 'Unknown User'}
                    </Text>
                    <Text className="text-xs font-inter text-gray-500" numberOfLines={1}>
                      {conversation.last_message || 'No messages yet'}
                    </Text>
                  </View>
                </View>

                {/* Subject */}
                <View className="flex-1 px-2">
                  <Text className="text-sm font-inter-semibold text-gray-700" numberOfLines={1}>
                    {conversation.subject || 'No subject'}
                  </Text>
                  <Text className="text-xs font-inter text-gray-500">{formatTime(conversation.last_message_time)}</Text>
                </View>

                {/* Status */}
                <View className="w-24 items-end">
                  {conversation.unread_count > 0 ? (
                    <View className="bg-blue-500 rounded-full px-3 py-1">
                      <Text className="text-white text-xs font-inter-bold">UNREAD</Text>
                    </View>
                  ) : (
                    <View className="bg-gray-200 rounded-full px-3 py-1">
                      <Text className="text-gray-600 text-xs font-inter-bold">READ</Text>
                    </View>
                  )}
                  <Feather name="chevron-right" size={16} color="#999" className="mt-1" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
