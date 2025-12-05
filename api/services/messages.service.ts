import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { Conversation, Message } from '../types';

class MessagesService {
  /**
   * Get conversations for a user
   * @param userId - The user ID to fetch conversations for
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get messages where user is either sender or recipient
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      // Group messages by thread (same subject and participants)
      const threadMap = new Map<string, Conversation>();

      for (const msg of (data as unknown as Message[]) || []) {
        const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const threadKey = `${msg.subject}-${otherUserId}`;

        if (!threadMap.has(threadKey)) {
          // Fetch other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', otherUserId)
            .single();

          threadMap.set(threadKey, {
            id: threadKey,
            subject: msg.subject,
            other_user_id: otherUserId,
            other_user_name:
              (profile as unknown as { full_name: string; username: string })?.full_name ||
              (profile as unknown as { username: string })?.username ||
              'Unknown User',
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            messages: [],
          });
        }

        const thread = threadMap.get(threadKey)!;
        thread.messages.push(msg);

        // Update last message and time if this message is more recent
        if (new Date(msg.created_at) > new Date(thread.last_message_time)) {
          thread.last_message = msg.message;
          thread.last_message_time = msg.created_at;
        }

        // Count unread messages
        if (msg.recipient_id === userId && msg.status === 'unread') {
          thread.unread_count++;
        }
      }

      // Sort threads by last message time (most recent first)
      const sortedThreads = Array.from(threadMap.values()).sort(
        (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      return sortedThreads;
    } catch (error) {
      logger.error('Error fetching conversations', error);
      throw error;
    }
  }

  /**
   * Get received messages for a user (where user is the recipient)
   * @param userId - The user ID to fetch received messages for
   */
  async getReceivedMessages(userId: string): Promise<Conversation[]> {
    try {
      // Get messages where user is the recipient only
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .is('parent_message_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch received messages: ${error.message}`);
      }

      // Group messages by thread (same subject and sender)
      const threadMap = new Map<string, Conversation>();

      for (const msg of (data as unknown as Message[]) || []) {
        const senderId = msg.sender_id;
        const threadKey = `${msg.subject}-${senderId}`;

        if (!threadMap.has(threadKey)) {
          // Fetch sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', senderId)
            .single();

          threadMap.set(threadKey, {
            id: threadKey,
            subject: msg.subject,
            other_user_id: senderId,
            other_user_name:
              (profile as unknown as { full_name: string; username: string })?.full_name ||
              (profile as unknown as { username: string })?.username ||
              'Unknown User',
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            messages: [],
          });
        }

        const thread = threadMap.get(threadKey)!;
        thread.messages.push(msg);

        // Update last message and time if this message is more recent
        if (new Date(msg.created_at) > new Date(thread.last_message_time)) {
          thread.last_message = msg.message;
          thread.last_message_time = msg.created_at;
        }

        // Count unread messages
        if (msg.status === 'unread') {
          thread.unread_count++;
        }
      }

      // Sort threads by last message time (most recent first)
      const sortedThreads = Array.from(threadMap.values()).sort(
        (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      return sortedThreads;
    } catch (error) {
      logger.error('Error fetching received messages', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   * @param conversationId - The conversation ID
   * @param userId - The current user ID
   */
  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
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

      return (data as unknown as Message[]) || [];
    } catch (error) {
      logger.error('Error fetching messages', error);
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
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            ...messageData,
            status: 'unread',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      // Create notification for the recipient
      // Fetch sender's profile for notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', messageData.sender_id)
        .single();

      const senderName = (senderProfile as unknown)?.full_name || (senderProfile as unknown)?.username || 'Someone';

      // Create notification asynchronously (don't await to avoid blocking)
      // notificationsService
      //   .notifyNewMessage(
      //     messageData.recipient_id,
      //     senderName,
      //     messageData.message.length > 100 ? messageData.message.substring(0, 100) + '...' : messageData.message,
      //     {
      //       message_id: (data as unknown as Message)?.id,
      //       conversation_id: messageData.parent_message_id || messageData.subject,
      //     }
      //   )
      //   .catch((err) => logger.error('Error creating message notification', err));
    } catch (error) {
      logger.error('Error sending message', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param messageIds - Array of message IDs to mark as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      if (messageIds.length === 0) return;

      const { error } = await supabase
        .from('messages')
        .update({
          status: 'read',
          updated_at: new Date().toISOString(),
        })
        .in('id', messageIds);

      if (error) {
        throw new Error(`Failed to mark messages as read: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error marking messages as read', error);
      throw error;
    }
  }

  /**
   * Report a message
   * @param messageId - The message ID to report
   * @param reportedBy - The user ID reporting the message
   * @param reason - The reason for reporting
   */
  async reportMessage(messageId: string, reportedBy: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_flagged: true,
          reported_by: reportedBy,
          reported_at: new Date().toISOString(),
          report_reason: reason,
        })
        .eq('id', messageId);

      if (error) {
        throw new Error(`Failed to report message: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error reporting message', error);
      throw error;
    }
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
          hour12: true,
        });
      } else {
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
  }
}

export const messagesService = new MessagesService();
