import { supabase } from '../config/supabase';
import { Offer } from '../types';
import { notificationsService } from './notifications.service';

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

      const offers = (data as unknown as Offer[]) || [];

      // Fetch listing details for all offers that have a listing_id
      const listingIds = offers.map((offer) => offer.listing_id).filter((id): id is string => !!id);

      let listingsMap = new Map<string, any>();

      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from('listings')
          .select('id, product_name, seller_id, product_image, starting_price, discounted_price')
          .in('id', listingIds);

        listingsMap = new Map((listings || []).map((listing: any) => [listing.id, listing]));
      }

      // Fetch buyer profiles (for sellers viewing offers)
      let buyerProfilesMap = new Map<string, any>();
      let sellerProfilesMap = new Map<string, any>();

      if (userType === 'seller') {
        const buyerIds = offers.map((offer) => offer.buyer_id).filter((id): id is string => !!id);

        if (buyerIds.length > 0) {
          // Fetch buyer profile data
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username')
            .in('user_id', buyerIds);
          buyerProfilesMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));
        }
      } else {
        // Fetch seller profiles (for buyers viewing offers)
        const sellerIds = offers.map((offer) => offer.seller_id).filter((id): id is string => !!id);

        if (sellerIds.length > 0) {
          // Fetch seller profile data
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username')
            .in('user_id', sellerIds);
          sellerProfilesMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));
        }
      }

      // Merge offers with their listing data and buyer/seller info
      const offersWithData = offers.map((offer) => ({
        ...offer,
        listings: offer.listing_id ? listingsMap.get(offer.listing_id) : undefined,
        buyer_profile: offer.buyer_id ? buyerProfilesMap.get(offer.buyer_id) : undefined,
        seller_profile: offer.seller_id ? sellerProfilesMap.get(offer.seller_id) : undefined,
      }));

      // Transform API data to match the UI interface
      return this.transformOffersData(offersWithData);
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
   * Create a new offer or update existing one (upsert)
   */
  async createOffer(params: {
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    offer_amount: number;
    message?: string;
    expires_at?: string;
  }): Promise<Offer | null> {
    try {
      // Check if an offer already exists for this buyer and listing
      const { data: existingOfferData, error: fetchError } = await supabase
        .from('offers')
        .select('*')
        .eq('listing_id', params.listing_id)
        .eq('buyer_id', params.buyer_id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to check existing offer: ${fetchError.message}`);
      }

      const existingOffer = existingOfferData as any;

      if (existingOffer && existingOffer.id) {
        // Update existing offer
        const { data, error } = await supabase
          .from('offers')
          .update({
            offer_amount: params.offer_amount,
            message: params.message ?? null,
            status: 'pending', // Reset to pending when re-offering
            expires_at: params.expires_at ?? null,
            created_at: new Date().toISOString(), // Update timestamp
          })
          .eq('id', existingOffer.id)
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to update offer: ${error.message}`);
        }

        const updatedOffer = (data as unknown as Offer) ?? null;

        // Create notification for seller about updated/re-submitted offer
        if (updatedOffer) {
          // Fetch buyer and listing info for notification
          Promise.all([
            supabase.from('profiles').select('full_name, username').eq('user_id', params.buyer_id).single(),
            supabase.from('listings').select('product_name').eq('id', params.listing_id).single(),
          ])
            .then(([buyerProfile, listing]) => {
              const buyerName =
                (buyerProfile.data as unknown as { full_name?: string; username?: string })?.full_name ||
                (buyerProfile.data as unknown as { full_name?: string; username?: string })?.username ||
                'A buyer';
              const productName = (listing.data as unknown as { product_name?: string })?.product_name || 'your item';

              notificationsService
                .notifyNewOffer(params.seller_id, buyerName, productName, params.offer_amount, {
                  offer_id: updatedOffer.id,
                  listing_id: params.listing_id,
                } as unknown as { offer_id?: string; listing_id?: string })
                .catch((err) => console.error('Error creating offer notification:', err));
            })
            .catch((err) => console.error('Error fetching offer notification data:', err));
        }

        return updatedOffer;
      } else {
        // Create new offer
        const { data, error } = await supabase
          .from('offers')
          .insert({
            listing_id: params.listing_id,
            buyer_id: params.buyer_id,
            seller_id: params.seller_id,
            offer_amount: params.offer_amount,
            message: params.message ?? null,
            status: 'pending',
            expires_at: params.expires_at ?? null,
          })
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to create offer: ${error.message}`);
        }

        const newOffer = (data as unknown as Offer) ?? null;

        // Create notification for seller about new offer
        if (newOffer) {
          // Fetch buyer and listing info for notification
          Promise.all([
            supabase.from('profiles').select('full_name, username').eq('user_id', params.buyer_id).single(),
            supabase.from('listings').select('product_name').eq('id', params.listing_id).single(),
          ])
            .then(([buyerProfile, listing]) => {
              const buyerName =
                (buyerProfile.data as unknown as { full_name?: string; username?: string })?.full_name ||
                (buyerProfile.data as unknown as { full_name?: string; username?: string })?.username ||
                'A buyer';
              const productName = (listing.data as unknown as { product_name?: string })?.product_name || 'your item';

              notificationsService
                .notifyNewOffer(params.seller_id, buyerName, productName, params.offer_amount, {
                  offer_id: newOffer.id,
                  listing_id: params.listing_id,
                } as unknown as { offer_id?: string; listing_id?: string })
                .catch((err) => console.error('Error creating offer notification:', err));
            })
            .catch((err) => console.error('Error fetching offer notification data:', err));
        }

        return newOffer;
      }
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
      // First fetch the offer to get buyer/seller info
      const { data: offerData, error: fetchError } = await supabase
        .from('offers')
        .select('buyer_id, seller_id, offer_amount, listing_id')
        .eq('id', offerId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch offer: ${fetchError.message}`);
      }

      const { error } = await supabase.from('offers').update({ status }).eq('id', offerId);

      if (error) {
        throw new Error(`Failed to update offer status: ${error.message}`);
      }

      // Create notification for buyer about offer response
      if (offerData && (offerData as any).buyer_id) {
        Promise.all([
          supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', (offerData as unknown as { seller_id?: string })?.seller_id)
            .single(),
          supabase
            .from('listings')
            .select('product_name')
            .eq('id', (offerData as unknown as { listing_id?: string })?.listing_id)
            .single(),
        ])
          .then(([sellerProfile, listing]) => {
            const sellerName =
              (sellerProfile.data as unknown as { full_name?: string; username?: string })?.full_name ||
              (sellerProfile.data as unknown as { full_name?: string; username?: string })?.username ||
              'The seller';
            const productName = (listing.data as unknown as { product_name?: string })?.product_name || 'your offer';

            if (status === 'accepted') {
              notificationsService
                .notifyOfferAccepted(
                  (offerData as unknown as { buyer_id?: string })?.buyer_id as string,
                  sellerName,
                  productName,
                  (offerData as unknown as { offer_amount?: number })?.offer_amount as number,
                  {
                    offer_id: offerId,
                    listing_id: (offerData as unknown as Offer)?.listing_id,
                  } as unknown as { offer_id?: string; listing_id?: string }
                )
                .catch((err) => console.error('Error creating offer accepted notification:', err));
            } else if (status === 'declined') {
              notificationsService
                .notifyOfferDeclined(
                  (offerData as unknown as { buyer_id?: string })?.buyer_id as string,
                  sellerName,
                  productName,
                  (offerData as unknown as { offer_amount?: number })?.offer_amount as number,
                  {
                    offer_id: offerId,
                    listing_id: (offerData as unknown as Offer)?.listing_id,
                  } as unknown as { offer_id?: string; listing_id?: string }
                )
                .catch((err) => console.error('Error creating offer declined notification:', err));
            }
          })
          .catch((err) => console.error('Error fetching offer reply notification data:', err));
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
   * Get status configuration for display
   * @param status - Offer status
   */
  private getStatusConfig(status: string): { status: string; color: number } {
    const statusMap: Record<string, { status: string; color: number }> = {
      pending: { status: 'Pending', color: 0xffcc00 },
      accepted: { status: 'Accepted', color: 0x34c759 },
      declined: { status: 'Declined', color: 0xff4444 },
    };

    return statusMap[status] || { status: status, color: 0x999999 };
  }

  /**
   * Transform API data to match UI interface
   * @param offers - Raw offers data from API
   */
  private transformOffersData(offers: Offer[]): Offer[] {
    return offers.map((offer) => {
      const statusConfig = this.getStatusConfig(offer.status);

      return {
        id: offer.id,
        offer_amount: offer.offer_amount,
        message: offer.message || undefined,
        status: offer.status,
        status_color: statusConfig.color,
        created_at: offer.created_at,
        expires_at: offer.expires_at,
        listings: offer.listings,
        buyer_profile: offer.buyer_profile,
      };
    });
  }
}

export const offersService = new OffersService();
