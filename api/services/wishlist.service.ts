import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { WishlistItem } from '../types';

/**
 * Wishlist Service
 * Handles all wishlist operations with Supabase
 */
class WishlistService {
  /**
   * Get all wishlist items for a user
   * @param userId - The user's ID
   * @returns Array of wishlist items with listing details
   */
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      // First, get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('id, user_id, listing_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (wishlistError) {
        logger.error('Error fetching wishlist:', wishlistError);
        throw new Error(`Failed to fetch wishlist: ${wishlistError.message}`);
      }

      if (!wishlistData || wishlistData.length === 0) {
        return [];
      }

      // Get all listing IDs
      const listingIds = wishlistData.map((item: unknown) => item.listing_id);

      // Fetch listings with their details
      const { data: listingsData, error: listingsError } = await supabase
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

      if (listingsError) {
        logger.error('Error fetching listings:', listingsError);
        throw new Error(`Failed to fetch listings: ${listingsError.message}`);
      }

      // Create a map of listings by ID
      const listingsMap = new Map((listingsData || []).map((listing: unknown) => [listing.id, listing]));

      // Fetch seller info for all listings
      const sellerIds = [...new Set((listingsData || []).map((listing: unknown) => listing.seller_id))];

      let sellersMap = new Map();
      if (sellerIds.length > 0) {
        const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);
        sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));
      }

      // Transform the data to include product info
      return wishlistData
        .filter((item: unknown) => listingsMap.has(item.listing_id)) // Only include items with valid listings
        .map((item: unknown) => {
          const listing = listingsMap.get(item.listing_id);
          if (!listing) return null;

          return {
            id: item.id,
            user_id: item.user_id,
            listing_id: item.listing_id,
            created_at: item.created_at,
            product: {
              ...listing,
              seller_info_view: sellersMap.get(listing.seller_id) || null,
            },
          };
        })
        .filter(Boolean) as WishlistItem[];
    } catch (error) {
      logger.error('Error in getWishlist:', error);
      throw error;
    }
  }

  /**
   * Add item to wishlist
   * @param userId - The user's ID
   * @param listingId - The listing ID to add
   * @returns The created or updated wishlist item
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

      const { error } = await supabase.from('wishlist').insert({
        user_id: userId,
        listing_id: listingId,
      });

      if (error) {
        throw new Error(`Failed to add item to wishlist: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in addToWishlist:', error);
      throw error;
    }
  }

  /**
   * Remove item from wishlist
   * @param userId - The user's ID
   * @param listingId - The listing ID to remove
   */
  async removeFromWishlist(userId: string, listingId: string): Promise<void> {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', userId).eq('listing_id', listingId);

      if (error) {
        throw new Error(`Failed to remove item from wishlist: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in removeFromWishlist:', error);
      throw error;
    }
  }

  /**
   * Clear all wishlist items for a user
   * @param userId - The user's ID
   */
  async clearWishlist(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to clear wishlist: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in clearWishlist:', error);
      throw error;
    }
  }
}

export const wishlistService = new WishlistService();
