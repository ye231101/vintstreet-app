import { messagesService } from '@/api/services';
import { InputComponent } from '@/components/common/input';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  content: string;
  senderId: string;
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
  const [isSending, setIsSending] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<{
    subject: string;
    otherUserName: string;
  } | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [shouldScrollToUnread, setShouldScrollToUnread] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && id) {
      loadMessages();
    }
  }, [user?.id, id]);

  // Scroll to newest message after loading (when there are new/unread messages)
  useEffect(() => {
    if (shouldScrollToUnread && !isLoading && messages.length > 0) {
      const scrollTimeout = setTimeout(() => {
        // Scroll to the newest message (end of list) to show the latest messages
        scrollViewRef.current?.scrollToEnd({ animated: true });
        setShouldScrollToUnread(false);
      }, 600); // Delay to ensure all messages are rendered

      return () => clearTimeout(scrollTimeout);
    }
  }, [shouldScrollToUnread, isLoading, messages.length]);

  const loadMessages = async () => {
    if (!user?.id || !id) return;

    setIsLoading(true);
    try {
      // Get all conversations to find the specific thread
      const conversations = await messagesService.getConversations(user.id);
      const conversation = conversations.find((conv) => conv.id === id);

      if (conversation) {
        setConversationInfo({
          subject: conversation.subject,
          otherUserName: conversation.other_user_name,
        });

        // Convert API messages to display format
        const displayMessages: Message[] = conversation.messages
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((msg) => ({
            id: msg.id,
            content: msg.message,
            senderId: msg.sender_id,
            dateSent: msg.created_at,
            isSent: msg.sender_id === user.id,
          }));

        setMessages(displayMessages);

        // Mark messages as read and track first unread message
        const unreadMessages = conversation.messages.filter(
          (msg) => msg.recipient_id === user.id && msg.status === 'unread'
        );
        const unreadMessageIds = unreadMessages.map((msg) => msg.id);

        if (unreadMessageIds.length > 0) {
          await messagesService.markAsRead(unreadMessageIds);
        }
        // Always scroll to newest message when opening conversation
        setShouldScrollToUnread(true);
      } else {
        Alert.alert('Error', 'Conversation not found');
        router.back();
      }
    } catch (error) {
      logger.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportMessage = async () => {
    if (!reportReason.trim() || !user || !id) {
      Alert.alert('Error', 'Please provide a reason for reporting');
      return;
    }

    setIsReporting(true);

    try {
      // Get conversation info to find the first message to flag
      const conversations = await messagesService.getConversations(user.id);
      const conversation = conversations.find((conv) => conv.id === id);

      if (!conversation) {
        Alert.alert('Error', 'Conversation not found');
        return;
      }

      // Get the first message in the thread to flag
      const firstMessage = conversation.messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];

      if (!firstMessage) {
        Alert.alert('Error', 'No message found to report');
        return;
      }

      await messagesService.reportMessage(firstMessage.id, user.id, reportReason.trim());

      Alert.alert('Success', 'Message reported to administrators');
      setIsReportDialogOpen(false);
      setReportReason('');
    } catch (error) {
      logger.error('Error reporting message:', error);
      Alert.alert('Error', 'Failed to report message');
    } finally {
      setIsReporting(false);
    }
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
      // Check if it's within the last 7 days
      const diffInDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
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

  const sendMessage = async () => {
    if (messageText.trim() === '' || !user || !id) return;

    setIsSending(true);
    try {
      // Get conversation info to find the other user
      const conversations = await messagesService.getConversations(user.id);
      const conversation = conversations.find((conv) => conv.id === id);

      if (!conversation) {
        Alert.alert('Error', 'Conversation not found');
        return;
      }

      // Send the message
      await messagesService.sendMessage({
        sender_id: user.id,
        recipient_id: conversation.other_user_id,
        subject: conversation.subject,
        message: messageText.trim(),
        parent_message_id: conversation.messages[0]?.id || undefined,
      });

      // Add the message to local state immediately for better UX
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText.trim(),
        senderId: user.id,
        dateSent: new Date().toISOString(),
        isSent: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');

      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      logger.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const renderDateHeader = (item: DateHeader) => (
    <View className="items-center my-6">
      <View className="bg-gray-200 px-4 py-2 rounded-full">
        <Text className="text-sm font-inter-bold text-gray-700">{item.displayText}</Text>
      </View>
    </View>
  );

  const renderMessage = (message: Message) => (
    <View className={`${message.isSent ? 'items-end' : 'items-start'} my-1 mx-2`}>
      <View
        className={`py-2 px-3 rounded-2xl shadow-sm ${message.isSent ? 'bg-black' : 'bg-gray-100'}`}
        style={{ maxWidth: '80%', flexShrink: 1 }}
      >
        <Text className={`${message.isSent ? 'text-white' : 'text-black'} text-sm font-inter`}>{message.content}</Text>
      </View>

      <Text className={`text-xs font-inter-semibold text-gray-400 mt-1 ${message.isSent ? 'mr-3' : 'ml-3'}`}>
        {formatTime(message.dateSent)}
      </Text>
    </View>
  );

  const messageItems = groupMessagesByDate(messages);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.container}
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-lg font-inter-bold text-black">{conversationInfo?.subject || 'Loading...'}</Text>
            <Text className="text-sm font-inter-semibold text-gray-400">
              Conversation with {conversationInfo?.otherUserName || 'Loading...'}
            </Text>
          </View>

          <TouchableOpacity onPress={() => setIsReportDialogOpen(true)} hitSlop={8}>
            <Feather name="flag" size={20} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity onPress={loadMessages}>
            <Feather name="refresh-cw" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Only auto-scroll to end if we're not in the initial load phase with unread messages
            if (!shouldScrollToUnread) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 py-4">
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-base font-inter-semibold text-gray-600">Loading messages...</Text>
              </View>
            ) : (
              messageItems.map((item: MessageItem, index: number) => {
                if ('type' in item && item.type === 'date') {
                  return (
                    <React.Fragment key={`date-${item.date}-${index}`}>
                      {renderDateHeader(item as DateHeader)}
                    </React.Fragment>
                  );
                } else {
                  const message = item as Message;
                  return <React.Fragment key={message.id}>{renderMessage(message)}</React.Fragment>;
                }
              })
            )}
          </View>
        </ScrollView>

        {/* Message Input - Fixed at bottom */}

        <View className="flex-row items-center gap-3 px-4 py-3 border-t border-gray-200">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-1" style={{ maxHeight: 250 }}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              multiline
              textAlignVertical="center"
              placeholder="Type a message..."
              placeholderTextColor="#999"
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
              className="flex-1 text-sm font-inter-semibold text-black"
              style={{ maxHeight: 250 }}
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!messageText.trim() || isSending}
            className={`w-10 h-10 rounded-full items-center justify-center shadow-lg ${
              !messageText.trim() || isSending ? 'bg-gray-400' : 'bg-black'
            }`}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Report Dialog */}
      <Modal
        visible={isReportDialogOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsReportDialogOpen(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-md">
            <Text className="mb-2 text-lg font-inter-bold text-black">Report Message</Text>
            <Text className="mb-4 text-sm font-inter-semibold text-gray-600">
              This will flag the message for administrator review. Please provide a reason for reporting this
              conversation.
            </Text>

            <InputComponent
              value={reportReason}
              label="Reason for reporting"
              size="small"
              placeholder="Describe why you're reporting this message..."
              onChangeText={(text) => setReportReason(text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              height={100}
              maxLength={500}
            />

            <View className="flex-row justify-end gap-2 mt-6">
              <TouchableOpacity
                onPress={() => setIsReportDialogOpen(false)}
                disabled={isReporting}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReportMessage}
                disabled={!reportReason.trim() || isReporting}
                className={`px-4 py-2 rounded-lg ${!reportReason.trim() || isReporting ? 'bg-gray-300' : 'bg-red-500'}`}
              >
                <Text
                  className={`font-inter-bold ${!reportReason.trim() || isReporting ? 'text-gray-500' : 'text-white'}`}
                >
                  {isReporting ? 'Reporting...' : 'Report Message'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
