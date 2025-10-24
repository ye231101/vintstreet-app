import SearchBar from '@/components/search-bar';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Conversation, messagesService } from '../../api/services/messages.service';
import { useAuth } from '../../hooks/use-auth';
// import { format } from 'date-fns';

// Interfaces are now imported from the messages service

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

  const loadConversations = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch conversations from the API
      const fetchedConversations = await messagesService.getConversations(user.id);
      setConversations(fetchedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Error loading conversations');
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
    
    return userName.includes(searchLower) || 
           subject.includes(searchLower) || 
           lastMessage.includes(searchLower);
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Search */}
      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Messages Content */}
      <View className="flex-1 bg-white">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-base font-inter-semibold text-gray-600">Loading conversations...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-8">
            <Feather name="alert-circle" size={64} color="#ff4444" />
            <Text className="text-lg font-inter-bold text-gray-600 mt-4 mb-2">Error loading conversations</Text>
            <Text className="text-sm font-inter-semibold text-gray-400 text-center mb-4">{error}</Text>
            <TouchableOpacity onPress={loadConversations} className="bg-black rounded-lg py-3 px-6">
              <Text className="text-white text-base font-inter-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Feather name="message-circle" size={64} color="#ccc" />
            <Text className="text-lg font-inter-bold text-gray-600 mt-4 mb-2">No conversations yet</Text>
            <Text className="text-sm font-inter-semibold text-gray-400 text-center">Start a conversation with a seller</Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Feather name="search" size={64} color="#ccc" />
            <Text className="text-lg font-inter-bold text-gray-600 mt-4 mb-2">No results found</Text>
            <Text className="text-sm font-inter-semibold text-gray-400 text-center">Try searching with different keywords</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000']} tintColor="#000" />
            }
          >
            {filteredConversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => router.push(`/message/${conversation.id}`)}
                className="flex-row items-center px-4 py-3 border-b border-gray-100"
              >
                {/* Avatar */}
                <View className="w-12 h-12 rounded-full bg-black justify-center items-center mr-3">
                  <Text className="text-white text-lg font-inter-bold">
                    {conversation.other_user_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>

                {/* Content */}
                <View className="flex-1">
                  {/* Name and Unread Badge */}
                  <View className="flex-row items-center mb-1">
                    <Text className="text-base font-inter-bold text-black flex-1">
                      {conversation.other_user_name || 'Unknown User'}
                    </Text>
                    {conversation.unread_count > 0 && (
                      <View className="bg-red-500 rounded-full px-2 py-1 min-w-[20px] items-center">
                        <Text className="text-white text-xs font-inter-bold">{conversation.unread_count}</Text>
                      </View>
                    )}
                  </View>

                  {/* Subject */}
                  <Text className="text-sm font-inter-semibold text-gray-600 mb-0.5">
                    {conversation.subject || 'No subject'}
                  </Text>

                  {/* Last Message */}
                  <Text className="text-xs font-inter-semibold text-gray-400 max-w-4/5" numberOfLines={1}>
                    {conversation.last_message || 'No messages yet'}
                  </Text>
                </View>

                {/* Time */}
                <Text className="text-xs font-inter-semibold text-gray-400">{formatTime(conversation.last_message_time)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
