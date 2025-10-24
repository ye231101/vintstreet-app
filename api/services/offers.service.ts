import { supabase } from '../config/supabase';

export interface Offer {
  id: string;
  buyerName: string;
  productName: string;
  offerAmount: number;
  originalPrice: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
  message?: string;
}

export interface ApiOffer {
  id: string;
  offer_amount: number;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  listing_id?: string;
  buyer_id?: string;
  seller_id?: string;
  created_at?: string;
  expires_at?: string;
}

class OffersService {
  /**
   * Get offers for the current user (buyer or seller)
   * @param userId - The user ID to fetch offers for
   * @param userType - 'buyer' or 'seller' to determine which offers to fetch
   * @param status - Optional status filter
   */
  async getOffers(
    userId: string,
    userType: 'buyer' | 'seller' = 'seller',
    status?: 'pending' | 'accepted' | 'declined'
  ): Promise<Offer[]> {
    try {
      let query = supabase.from('offers').select('*').order('created_at', { ascending: false });

      // Apply RLS policy based on user type
      if (userType === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else {
        query = query.eq('seller_id', userId);
      }

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to fetch offers: ${error.message}`);
      }

      // Transform API data to match the UI interface
      return this.transformOffersData((data as unknown as ApiOffer[]) || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  }

  /**
   * Get pending offers for seller
   * @param userId - The seller's user ID
   */
  async getPendingOffers(userId: string): Promise<Offer[]> {
    return this.getOffers(userId, 'seller', 'pending');
  }

  /**
   * Get completed offers for seller (accepted or declined)
   * @param userId - The seller's user ID
   */
  async getCompletedOffers(userId: string): Promise<Offer[]> {
    try {
      const acceptedOffers = await this.getOffers(userId, 'seller', 'accepted');
      const declinedOffers = await this.getOffers(userId, 'seller', 'declined');
      return [...acceptedOffers, ...declinedOffers];
    } catch (error) {
      console.error('Error fetching completed offers:', error);
      throw error;
    }
  }

  /**
   * Create a new offer
   */
  async createOffer(params: {
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    offer_amount: number;
    message?: string;
    expires_at?: string;
  }): Promise<ApiOffer | null> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .insert({
          listing_id: params.listing_id,
          buyer_id: params.buyer_id,
          seller_id: params.seller_id,
          offer_amount: params.offer_amount,
          message: params.message ?? null,
          expires_at: params.expires_at ?? null,
          status: 'pending',
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create offer: ${error.message}`);
      }

      return (data as unknown as ApiOffer) ?? null;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Update offer status
   * @param offerId - The offer ID to update
   * @param status - New status ('accepted' or 'declined')
   */
  async updateOfferStatus(offerId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      const { error } = await supabase.from('offers').update({ status }).eq('id', offerId);

      if (error) {
        throw new Error(`Failed to update offer status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      throw error;
    }
  }

  /**
   * Delete an offer
   * @param offerId - The offer ID to delete
   */
  async deleteOffer(offerId: string): Promise<void> {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', offerId);

      if (error) {
        throw new Error(`Failed to delete offer: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param apiOffers - Raw offers data from API
   */
  private transformOffersData(apiOffers: ApiOffer[]): Offer[] {
    return apiOffers.map((apiOffer) => {
      // Map API status to UI status
      const statusMap: Record<string, 'pending' | 'accepted' | 'declined'> = {
        pending: 'pending',
        accepted: 'accepted',
        declined: 'declined',
      };

      return {
        id: apiOffer.id,
        buyerName: `Buyer #${apiOffer.id.slice(-6)}`, // Fallback name - would need to fetch from user data
        productName: `Product #${apiOffer.id.slice(-6)}`, // Fallback name - would need to fetch from product data
        offerAmount: apiOffer.offer_amount,
        originalPrice: apiOffer.offer_amount * 1.2, // Mock original price - would need to fetch from product data
        status: statusMap[apiOffer.status] || 'pending',
        createdAt: apiOffer.created_at ?? new Date().toISOString(),
        expiresAt: apiOffer.expires_at ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        message: apiOffer.message || undefined,
      };
    });
  }
}

export const offersService = new OffersService();
