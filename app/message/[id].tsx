import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: number;
  content: string;
  senderId: number;
  dateSent: string;
  isSent: boolean;
}

interface DateHeader {
  type: 'date';
  date: string;
  displayText: string;
}

type MessageItem = Message | DateHeader;

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock data based on the image
  const mockMessages: Message[] = [
    {
      id: 1,
      content: 'Do you like my shop',
      senderId: 2,
      dateSent: '2025-09-24T14:38:00Z',
      isSent: false,
    },
    {
      id: 2,
      content: 'It will be open soon',
      senderId: 2,
      dateSent: '2025-09-24T14:39:00Z',
      isSent: false,
    },
    {
      id: 3,
      content: '2132',
      senderId: 1,
      dateSent: '2025-09-24T19:39:00Z',
      isSent: true,
    },
    {
      id: 4,
      content: '65456',
      senderId: 1,
      dateSent: '2025-09-24T19:39:00Z',
      isSent: true,
    },
  ];

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMessages(mockMessages);
      setIsLoading(false);
    }, 1000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]): MessageItem[] => {
    const grouped: MessageItem[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = formatDate(message.dateSent);

      if (messageDate !== currentDate) {
        grouped.push({
          type: 'date',
          date: messageDate,
          displayText: messageDate,
        });
        currentDate = messageDate;
      }

      grouped.push(message);
    });

    return grouped;
  };

  const sendMessage = () => {
    if (messageText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now(),
      content: messageText.trim(),
      senderId: 1,
      dateSent: new Date().toISOString(),
      isSent: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderDateHeader = (item: DateHeader) => (
    <View key={`date-${item.date}`} className="items-center my-4">
      <View className="bg-gray-100 px-3 py-1 rounded-xl">
        <Text className="text-xs font-poppins text-gray-600">{item.displayText}</Text>
      </View>
    </View>
  );

  const renderMessage = (message: Message) => (
    <View key={message.id} className={`${message.isSent ? 'items-end' : 'items-start'} my-1 mx-2`}>
      <View className={`max-w-3/4 py-2 px-3 rounded-2xl shadow-sm ${message.isSent ? 'bg-black' : 'bg-gray-100'}`}>
        <Text className={`${message.isSent ? 'text-white' : 'text-black'} text-sm font-poppins`}>
          {message.content}
        </Text>
      </View>

      <Text className={`text-xs font-poppins text-gray-400 mt-1 ${message.isSent ? 'mr-3' : 'ml-3'}`}>
        {formatTime(message.dateSent)}
      </Text>
    </View>
  );

  const messageItems = groupMessagesByDate(messages);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <SafeAreaView className="bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Hello</Text>

          <TouchableOpacity onPress={() => Alert.alert('Refresh', 'Refreshing messages...')} className="ml-4">
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Messages Area */}
      <View className="flex-1 bg-white">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 bg-white py-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {isLoading ? (
            <View className="flex-1 justify-center items-center py-12">
              <Text className="text-base font-poppins text-gray-600">Loading messages...</Text>
            </View>
          ) : (
            messageItems.map((item: MessageItem) => {
              if ('type' in item && item.type === 'date') {
                return renderDateHeader(item as DateHeader);
              } else {
                return renderMessage(item as Message);
              }
            })
          )}
        </ScrollView>
      </View>

      {/* Message Input - Fixed at bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View className="flex-row items-center bg-white px-4 pt-3 border-t border-gray-200 min-h-15">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-3 min-h-10">
            <TextInput
              className="flex-1 text-sm font-poppins text-black max-h-25 min-h-6"
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              textAlignVertical="center"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onBlur={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            className="bg-black w-10 h-10 rounded-full justify-center items-center shadow-lg"
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
