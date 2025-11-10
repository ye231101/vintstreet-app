import { clearAgoraRTMConfigCache, getAgoraRTMConfig } from '@/api/config/agora';
import { useAuth } from '@/hooks/use-auth';
import { Feather } from '@expo/vector-icons';
// import { RtmClient } from 'agora-react-native-rtm';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'gift' | 'join' | 'purchase';
  avatar?: string;
  color?: string;
}

// Helper function to generate random ID
const makeid = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Helper function to generate random color
const randomColor = (): string => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8B88B',
    '#82E0AA',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

interface LiveChatProps {
  streamId: string;
  onClose?: () => void;
}

const LiveChat = ({ streamId, onClose }: LiveChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // RTM related refs and state
  const [agoraRTMConfig, setAgoraRTMConfig] = useState<any>(null);
  const clientRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const userColorRef = useRef<string>(randomColor());
  const userIdRef = useRef<string>(makeid(5));
  const currentUserRef = useRef<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('Loading Agora RTM configuration...');
        const config = await getAgoraRTMConfig({
          channelName: streamId,
          uid: userIdRef.current,
        });
        console.log('Agora RTM config loaded:', { appId: config.appId, hasToken: !!config.token });

        // Validate App ID format on frontend
        if (!config.appId || !/^[a-f0-9]{32}$/i.test(config.appId)) {
          throw new Error(`Invalid App ID format: ${config.appId}. Expected 32 hexadecimal characters.`);
        }

        setAgoraRTMConfig(config);
      } catch (error) {
        console.error('Failed to load Agora RTM config:', error);
        setIsLoading(false);
        setIsConnected(false);
      }
    };

    loadConfig();

    // Clear config cache on unmount
    return () => {
      clearAgoraRTMConfigCache();
    };
  }, [streamId]);

  // Initialize RTM client and join channel
  // useEffect(() => {
  //   const initRtm = async () => {
  //     if (!agoraRTMConfig || !streamId) return;

  //     setIsLoading(true);
  //     try {
  //       // Generate username based on user info or random
  //       const username = user?.email?.split('@')[0] || `User_${userIdRef.current}`;
  //       currentUserRef.current = username;

  //       // Create RTM client with App ID using agora-react-native-rtm
  //       const client = new RtmClient(agoraRTMConfig.appId, userIdRef.current);
  //       clientRef.current = client;

  //       // Login to RTM
  //       await client.login({ token: agoraRTMConfig.token || undefined });

  //       // Create stream channel and join
  //       const channel = client.createStreamChannel(streamId);
  //       channelRef.current = channel;
  //       await channel.join();

  //       // Set user attributes using storage API
  //       try {
  //         await client.storage.setUserMetadata([
  //           { key: 'name', value: username },
  //           { key: 'color', value: userColorRef.current },
  //         ]);
  //       } catch (attrError) {
  //         console.warn('Failed to set user attributes:', attrError);
  //       }

  //       // Join a default topic for messaging (stream channels use topics)
  //       const topicName = 'messages';
  //       try {
  //         await channel.joinTopic(topicName);
  //       } catch (topicError) {
  //         console.warn('Failed to join topic, messages may not work:', topicError);
  //       }

  //       // Listen for channel messages
  //       client.on('message', async (event: any) => {
  //         try {
  //           // Only process messages from our channel
  //           if (event.channelName !== streamId) return;

  //           const publisherId = event.publisher;
  //           let userAttributes: any = {};

  //           // Get user attributes
  //           try {
  //             const metadata = await client.storage.getUserMetadata(publisherId);
  //             if (metadata && metadata.items) {
  //               metadata.items.forEach((item: any) => {
  //                 userAttributes[item.key] = item.value;
  //               });
  //             }
  //           } catch (attrError) {
  //             console.warn('Failed to get user attributes:', attrError);
  //           }

  //           const messageText = typeof event.message === 'string'
  //             ? event.message
  //             : event.messageType === 'BINARY'
  //             ? '[Binary message]'
  //             : String(event.message);

  //           const newMessage: ChatMessage = {
  //             id: Date.now().toString() + publisherId,
  //             username: userAttributes.name || `User_${publisherId}`,
  //             message: messageText,
  //             timestamp: new Date(event.publishTime || Date.now()),
  //             type: 'message',
  //             color: userAttributes.color || randomColor(),
  //           };
  //           setMessages((prev) => [...prev, newMessage]);
  //         } catch (error) {
  //           console.error('Error processing channel message:', error);
  //           // Fallback message without user attributes
  //           const eventAny = event as any;
  //           const publisherId = eventAny.publisher || 'unknown';
  //           const messageText = typeof eventAny.message === 'string'
  //             ? eventAny.message
  //             : String(eventAny.message || '');

  //           const newMessage: ChatMessage = {
  //             id: Date.now().toString() + publisherId,
  //             username: `User_${publisherId}`,
  //             message: messageText,
  //             timestamp: new Date(),
  //             type: 'message',
  //             color: randomColor(),
  //           };
  //           setMessages((prev) => [...prev, newMessage]);
  //         }
  //       });

  //       setIsConnected(true);
  //       setIsLoading(false);
  //       console.log('RTM initialized successfully for channel:', streamId);
  //     } catch (error) {
  //       console.error('Failed to initialize RTM:', error);
  //       setIsLoading(false);
  //       setIsConnected(false);
  //     }
  //   };

  //   if (streamId && agoraRTMConfig) {
  //     initRtm();
  //   } else {
  //     setIsLoading(false);
  //     setIsConnected(false);
  //   }

  //   // Cleanup on unmount
  //   return () => {
  //     setIsLoading(false);
  //     setIsConnected(false);
  //     if (channelRef.current) {
  //       try {
  //         // Leave channel if method exists
  //         if (typeof channelRef.current.leave === 'function') {
  //           channelRef.current.leave();
  //         }
  //       } catch (error) {
  //         console.error('Error during RTM channel cleanup:', error);
  //       }
  //     }
  //     if (clientRef.current) {
  //       try {
  //         // Logout RTM client
  //         if (typeof clientRef.current.logout === 'function') {
  //           clientRef.current.logout();
  //         }
  //       } catch (error) {
  //         console.error('Error during RTM client cleanup:', error);
  //       }
  //     }
  //   };
  // }, [streamId, user, agoraRTMConfig]);

  const sendMessage = async () => {
    if (newMessage.trim() && isConnected && !isLoading && channelRef.current) {
      try {
        // Send message through RTM channel
        await channelRef.current.sendMessage({ text: newMessage });

        // Add message to local state for immediate feedback
        const message: ChatMessage = {
          id: Date.now().toString(),
          username: currentUserRef.current,
          message: newMessage,
          timestamp: new Date(),
          type: 'message',
          color: userColorRef.current,
        };
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
        // Still add message locally even if RTM send fails
        const message: ChatMessage = {
          id: Date.now().toString(),
          username: currentUserRef.current,
          message: newMessage,
          timestamp: new Date(),
          type: 'message',
          color: userColorRef.current,
        };
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'gift':
        return <Feather name="gift" size={14} color="#ef4444" />;
      case 'purchase':
        return <Feather name="heart" size={14} color="#ef4444" />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-inter-bold text-gray-900">Live Chat</Text>
          <View
            className={`w-2.5 h-2.5 rounded-full ${
              isLoading ? 'bg-yellow-500' : isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={isLoading ? { opacity: 0.5 } : {}}
          />
          {/* Status text */}
          <Text className="text-xs text-gray-500">
            {isLoading ? 'Connecting...' : isConnected ? `${messages.length} messages` : 'Disconnected'}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} className="p-2 rounded-lg active:bg-gray-100">
            <Feather name="x" size={22} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length > 0 ? (
          <View className="gap-3">
            {messages.map((msg) => (
              <View key={msg.id} className="flex-row items-start gap-2">
                {msg.avatar && (
                  <View className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                    {/* Avatar image would go here */}
                  </View>
                )}
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text
                      className="text-xs font-inter-semibold"
                      style={{
                        color: msg.color || (msg.username === currentUserRef.current ? userColorRef.current : '#666'),
                      }}
                    >
                      {msg.username}
                    </Text>
                    {getMessageIcon(msg.type)}
                    <Text className="text-xs text-gray-400">{formatTime(msg.timestamp)}</Text>
                  </View>
                  <Text
                    className={`text-sm ${
                      msg.type === 'purchase'
                        ? 'text-red-500 font-inter-semibold'
                        : msg.type === 'gift'
                        ? 'text-red-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {msg.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 items-center justify-center rounded-full bg-gray-100">
              <Feather name="message-circle" size={28} color="#9ca3af" />
            </View>
            <Text className="mt-4 text-gray-600 text-base font-inter-semibold">No messages yet</Text>
            <Text className="mt-1 text-gray-400 text-sm">Be the first to chat!</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View className="p-4 border-t border-gray-200">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={isLoading ? 'Connecting...' : isConnected ? 'Type a message...' : 'Disconnected'}
            placeholderTextColor="#9CA3AF"
            editable={!isLoading && isConnected}
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 p-3 rounded-xl"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={isLoading || !isConnected || !newMessage.trim()}
            className={`p-3 rounded-xl ${isLoading || !isConnected || !newMessage.trim() ? 'bg-gray-200' : 'bg-black'}`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather
                name="send"
                size={18}
                color={isLoading || !isConnected || !newMessage.trim() ? '#9ca3af' : '#fff'}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LiveChat;
