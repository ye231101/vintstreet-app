import { messagesService } from '@/api/services';
import { Conversation } from '@/api/types';
import SearchBar from '@/components/search-bar';
import { useAuth } from '@/hooks/use-auth';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagesScreen() {
  const { isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
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
      // Fetch conversations from the API
      const fetchedConversations = await messagesService.getConversations(user.id);
      setConversations(fetchedConversations);
    } catch (err) {
      logger.error('Error loading conversations:', err);
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

    return userName.includes(searchLower) || subject.includes(searchLower) || lastMessage.includes(searchLower);
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="items-center mb-8">
              <View className="w-24 h-24 items-center justify-center mb-6 rounded-full bg-gray-100">
                <Feather name="message-circle" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-base font-inter-semibold text-gray-500 text-center max-w-sm">
                Please sign in to view and send messages
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
      {/* Header with Search */}
      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Messages Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading conversations...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading conversations</Text>
          <TouchableOpacity onPress={loadConversations} className="px-6 py-3 rounded-lg bg-black">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Feather name="message-circle" size={64} color="#ccc" />
          <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-600">No conversations yet</Text>
          <Text className="text-sm font-inter-semibold text-center text-gray-400">
            Start a conversation with a seller
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
          {filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              onPress={() => router.push(`/message/${conversation.id}`)}
              className="flex-row items-center gap-3 py-3 px-4 border-b border-gray-100"
            >
              {/* Avatar */}
              <View className="items-center justify-center w-12 h-12 rounded-full bg-black">
                <Text className="text-white text-lg font-inter-bold">
                  {conversation.other_user_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>

              {/* Content */}
              <View className="flex-1">
                {/* Name */}
                <Text className="mb-1 text-base font-inter-bold text-black">
                  {conversation.other_user_name || 'Unknown User'}
                </Text>

                {/* Subject */}
                <Text className="mb-0.5 text-sm font-inter-semibold text-gray-600">
                  {conversation.subject || 'No subject'}
                </Text>

                {/* Last Message */}
                <Text className="text-xs font-inter-semibold text-gray-400" numberOfLines={1}>
                  {conversation.last_message || 'No messages yet'}
                </Text>
              </View>

              {/* Time */}
              <View className="items-end gap-2">
                {conversation.unread_count > 0 && (
                  <View className="min-w-[20px] items-center bg-red-500 rounded-full py-1 px-2">
                    <Text className="text-white text-xs font-inter-bold">{conversation.unread_count}</Text>
                  </View>
                )}
                <Text className="text-xs font-inter-semibold text-right text-gray-400">
                  {formatTime(conversation.last_message_time)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
