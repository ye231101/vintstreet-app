import { supabase } from '../config/supabase';
import { Product, WishlistItem } from '../types';

class WishlistService {
  /**
   * Get all wishlist items for a user
   * @param userId - The user's ID
   */
  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    try {
      // First fetch wishlist items
      const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlist')
        .select('id, listing_id, user_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (wishlistError) throw wishlistError;
      if (!wishlist || wishlist.length === 0) return [];

      // Fetch listings for wishlist items
      const listingIds = wishlist.map((item: any) => item.listing_id);
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select(
          `
          id,
          product_name,
          starting_price,
          discounted_price,
          product_image,
          product_images,
          product_description,
          seller_id,
          category_id,
          subcategory_id,
          sub_subcategory_id,
          sub_sub_subcategory_id,
          brand_id,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .in('id', listingIds);

      if (listingsError) throw listingsError;

      // Fetch seller profiles
      const sellerIds = [...new Set((listings || []).map((item: any) => item.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map(sellers?.map((s: any) => [s.user_id, s]) || []);
      const listingsMap = new Map((listings || []).map((l: any) => [l.id, l]));

      return wishlist
        .map((item: any) => {
          const listing = listingsMap.get(item.listing_id);
          if (!listing) return null;

          return {
            id: item.id,
            listing_id: item.listing_id,
            user_id: item.user_id,
            created_at: item.created_at,
            listings: {
              ...listing,
              seller_info_view: sellersMap.get(listing.seller_id) || null,
            } as Product,
          };
        })
        .filter(Boolean) as WishlistItem[];
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      throw error;
    }
  }

  /**
   * Add item to wishlist
   * @param userId - The user's ID
   * @param listingId - The listing ID to add
   */
  async addToWishlist(userId: string, listingId: string): Promise<void> {
    try {
      // Check if item already exists in wishlist
      const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();

      if (existing) {
        return; // Already in wishlist
      }

      const { error } = await supabase.from('wishlist').insert([{ user_id: userId, listing_id: listingId }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove item from wishlist
   * @param wishlistId - The wishlist item ID to remove
   */
  async removeFromWishlist(wishlistId: string): Promise<void> {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('id', wishlistId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  /**
   * Remove item from wishlist by listing ID
   * @param userId - The user's ID
   * @param listingId - The listing ID to remove
   */
  async removeFromWishlistByListingId(userId: string, listingId: string): Promise<void> {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', userId).eq('listing_id', listingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  /**
   * Check if item is in wishlist
   * @param userId - The user's ID
   * @param listingId - The listing ID to check
   */
  async isInWishlist(userId: string, listingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }

  /**
   * Clear all wishlist items for a user
   * @param userId - The user's ID
   */
  async clearWishlist(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  }
}

export const wishlistService = new WishlistService();
