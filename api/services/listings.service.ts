import { supabase } from '../config/supabase';

export interface Product {
  id: string;
  title: string;
  price: number;
  status: 'live' | 'private' | 'sold' | 'draft';
  imageUrl?: string;
  dateCreated: string;
  views?: number;
  likes?: number;
}

export interface ApiListing {
  id: string;
  product_name: string;
  starting_price: number;
  current_bid: number;
  is_active: boolean;
}

class ListingsService {
  /**
   * Get listings for a specific stream
   * @param streamId - The stream ID to fetch listings for
   */
  async getListings(streamId: string): Promise<Product[]> {
    console.log('getListings', streamId);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true);

      console.log('listings data', data);
      if (error) {
        throw new Error(`Failed to fetch listings: ${error.message}`);
      }

      // Transform API data to match the UI interface
      return this.transformListingsData((data as unknown as ApiListing[]) || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  /**
   * Get all listings for a seller (across all streams)
   * @param sellerId - The seller's user ID
   */
  async getSellerListings(sellerId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch seller listings: ${error.message}`);
      }

      return this.transformListingsData((data as unknown as ApiListing[]) || []);
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      throw error;
    }
  }

  /**
   * Get listings by status
   * @param sellerId - The seller's user ID
   * @param status - Listing status to filter by
   */
  async getListingsByStatus(sellerId: string, status: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (status === 'live') {
        query = query.eq('is_active', true);
      } else if (status === 'private') {
        query = query.eq('is_active', false);
      } else if (status === 'sold') {
        // This would need additional logic to determine sold status
        // For now, we'll filter by is_active = false as a placeholder
        query = query.eq('is_active', false);
      } else if (status === 'draft') {
        // This would need additional logic to determine draft status
        // For now, we'll return all listings
        query = query;
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch listings by status: ${error.message}`);
      }

      return this.transformListingsData((data as unknown as ApiListing[]) || []);
    } catch (error) {
      console.error('Error fetching listings by status:', error);
      throw error;
    }
  }

  /**
   * Update listing status
   * @param listingId - The listing ID to update
   * @param isActive - New active status
   */
  async updateListingStatus(listingId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_active: isActive })
        .eq('id', listingId);

      if (error) {
        throw new Error(`Failed to update listing status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param apiListings - Raw listings data from API
   */
  private transformListingsData(apiListings: ApiListing[]): Product[] {
    return apiListings.map((apiListing) => {
      // Map API status to UI status
      const statusMap: Record<string, 'live' | 'private' | 'sold' | 'draft'> = {
        'true': 'live',
        'false': 'private'
      };

      return {
        id: apiListing.id,
        title: apiListing.product_name,
        price: apiListing.current_bid || apiListing.starting_price,
        status: statusMap[apiListing.is_active.toString()] || 'draft',
        imageUrl: undefined, // Would need to fetch from product data
        dateCreated: new Date().toISOString(), // Mock date - would need to fetch from API
        views: Math.floor(Math.random() * 100), // Mock views - would need to fetch from analytics
        likes: Math.floor(Math.random() * 50) // Mock likes - would need to fetch from analytics
      };
    });
  }
}

export const listingsService = new ListingsService();