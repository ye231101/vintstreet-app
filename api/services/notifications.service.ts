import { supabase } from '../config/supabase';

export type NotificationType = 'message' | 'offer_created' | 'offer_accepted' | 'offer_declined';

interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title?: string;
  body: string;
  metadata?: Record<string, any>;
}

class NotificationsService {
  /**
   * Create a notification record
   * This will trigger the push notification webhook
   */
  async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert([
        {
          user_id: params.user_id,
          type: params.type,
          title: params.title || this.getDefaultTitle(params.type),
          body: params.body,
          metadata: params.metadata || {},
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Error creating notification:', error);
        // Don't throw - we don't want notification failures to break the main flow
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw - we don't want notification failures to break the main flow
    }
  }

  /**
   * Get default title based on notification type
   */
  private getDefaultTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      message: 'New Message',
      offer_created: 'New Offer',
      offer_accepted: 'Offer Accepted',
      offer_declined: 'Offer Declined',
    };
    return titles[type] || 'Notification';
  }

  /**
   * Create a notification for a new message
   */
  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    metadata?: { message_id?: string; conversation_id?: string }
  ): Promise<void> {
    await this.createNotification({
      user_id: recipientId,
      type: 'message',
      title: `New message from ${senderName}`,
      body: messagePreview,
      metadata,
    });
  }

  /**
   * Create a notification for a new offer (seller receives this)
   */
  async notifyNewOffer(
    sellerId: string,
    buyerName: string,
    productName: string,
    offerAmount: number,
    metadata?: { offer_id?: string; listing_id?: string }
  ): Promise<void> {
    await this.createNotification({
      user_id: sellerId,
      type: 'offer_created',
      title: 'New Offer Received',
      body: `${buyerName} made an offer of $${offerAmount.toFixed(2)} on ${productName}`,
      metadata,
    });
  }

  /**
   * Create a notification for an accepted offer (buyer receives this)
   */
  async notifyOfferAccepted(
    buyerId: string,
    sellerName: string,
    productName: string,
    offerAmount: number,
    metadata?: { offer_id?: string; listing_id?: string }
  ): Promise<void> {
    await this.createNotification({
      user_id: buyerId,
      type: 'offer_accepted',
      title: 'Offer Accepted! 🎉',
      body: `${sellerName} accepted your $${offerAmount.toFixed(2)} offer on ${productName}`,
      metadata,
    });
  }

  /**
   * Create a notification for a declined offer (buyer receives this)
   */
  async notifyOfferDeclined(
    buyerId: string,
    sellerName: string,
    productName: string,
    offerAmount: number,
    metadata?: { offer_id?: string; listing_id?: string }
  ): Promise<void> {
    await this.createNotification({
      user_id: buyerId,
      type: 'offer_declined',
      title: 'Offer Declined',
      body: `${sellerName} declined your $${offerAmount.toFixed(2)} offer on ${productName}`,
      metadata,
    });
  }
}

export const notificationsService = new NotificationsService();
