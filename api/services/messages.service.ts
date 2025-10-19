import { supabase } from '../config/supabase';

export interface Conversation {
  id: number;
  subject: string;
  lastMessageContent: string;
  lastMessageDate: string;
  unreadCount: number;
  recipients: number[];
  otherParticipantName: string;
}

export interface ApiMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  order_id?: string;
  listing_id?: string;
  parent_message_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

class MessagesService {
  /**
   * Get conversations for a user
   * @param userId - The user ID to fetch conversations for
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    console.log('getConversations', userId);
    try {
      // Get messages where user is either sender or recipient
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      console.log('messages data', data);
      if (error) {
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      // Transform API data to match the UI interface
      return this.transformConversationsData((data as unknown as ApiMessage[]) || [], userId);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   * @param conversationId - The conversation ID
   * @param userId - The current user ID
   */
  async getMessages(conversationId: string, userId: string): Promise<ApiMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', conversationId)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return (data as unknown as ApiMessage[]) || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a new message
   * @param messageData - The message data to send
   */
  async sendMessage(messageData: {
    sender_id: string;
    recipient_id: string;
    subject: string;
    message: string;
    order_id?: string;
    listing_id?: string;
    parent_message_id?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          ...messageData,
          status: 'unread',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   * @param messageId - The message ID to mark as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        throw new Error(`Failed to mark message as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param apiMessages - Raw messages data from API
   * @param userId - Current user ID
   */
  private transformConversationsData(apiMessages: ApiMessage[], userId: string): Conversation[] {
    // Group messages by conversation (subject + participants)
    const conversationMap = new Map<string, {
      messages: ApiMessage[];
      otherParticipantId: string;
    }>();

    apiMessages.forEach(message => {
      const otherParticipantId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      const conversationKey = `${message.subject}_${otherParticipantId}`;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          messages: [],
          otherParticipantId
        });
      }
      
      conversationMap.get(conversationKey)!.messages.push(message);
    });

    // Convert to conversations
    const conversations: Conversation[] = [];
    let conversationId = 1;

    conversationMap.forEach((conversation, key) => {
      const latestMessage = conversation.messages[0]; // Already sorted by created_at desc
      const unreadCount = conversation.messages.filter(msg => 
        msg.status === 'unread' && msg.recipient_id === userId
      ).length;

      conversations.push({
        id: conversationId++,
        subject: latestMessage.subject,
        lastMessageContent: latestMessage.message,
        lastMessageDate: this.formatDate(latestMessage.created_at),
        unreadCount,
        recipients: [parseInt(conversation.otherParticipantId)],
        otherParticipantName: `User ${conversation.otherParticipantId.slice(-6)}` // Fallback name
      });
    });

    return conversations;
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (e) {
      return dateString;
    }
  }
}

export const messagesService = new MessagesService();
