import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { CartItem } from '../types';

/**
 * Cart Service
 * Handles all cart operations with Supabase
 */
class CartService {
  /**
   * Get all cart items for a user with listing details
   * @param userId - The user's ID
   * @returns Array of cart items with product details
   */
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      // First, get cart items
      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select('id, user_id, listing_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (cartError) {
        logger.error('Error fetching cart', cartError);
        throw new Error(`Failed to fetch cart: ${cartError.message}`);
      }

      if (!cartData || cartData.length === 0) {
        return [];
      }

      // Get all listing IDs
      const listingIds = cartData.map((item: unknown) => item.listing_id);

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
        logger.error('Error fetching listings', listingsError);
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

      // Transform the data to include product info and calculate subtotal
      return cartData
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
        .filter(Boolean) as CartItem[];
    } catch (error) {
      logger.error('Error in getCart', error);
      throw error;
    }
  }

  /**
   * Add an item to cart
   * @param userId - The user's ID
   * @param listingId - The listing ID to add
   * @returns The created or updated cart item
   */
  async addToCart(userId: string, listingId: string): Promise<void> {
    try {
      // Check if item already exists in cart
      const { data: existing } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();

      if (existing) {
        return; // Already in wishlist
      }

      const { error } = await supabase.from('cart').insert({
        user_id: userId,
        listing_id: listingId,
      });

      if (error) {
        throw new Error(`Failed to add item to cart: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in addToCart', error);
      throw error;
    }
  }

  /**
   * Remove an item from cart
   * @param userId - The user's ID
   * @param listingId - The listing ID to remove
   */
  async removeFromCart(userId: string, listingId: string): Promise<void> {
    try {
      const { error } = await supabase.from('cart').delete().eq('user_id', userId).eq('listing_id', listingId);

      if (error) {
        throw new Error(`Failed to remove item from cart: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in removeFromCart', error);
      throw error;
    }
  }

  /**
   * Clear all cart items for a user
   * @param userId - The user's ID
   */
  async clearCart(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('cart').delete().eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to clear cart: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error in clearCart', error);
      throw error;
    }
  }
}

export const cartService = new CartService();
