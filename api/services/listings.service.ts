import { supabase } from '../config/supabase';

export interface Product {
  id: string;
  title: string;
  price: number;
  status: 'published' | 'draft';
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
  status: 'published' | 'draft';
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
        .eq('stream_id', streamId);

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
   * Get listings filtered by a category slug
   * Tries common schema patterns: category_slug (eq) or category_slugs (array contains)
   */
  async getListingsByCategorySlug(categorySlug: string, sort?: string): Promise<Product[]> {
    try {
      // Only try category_slug. We won't attempt category_slugs to avoid column errors.
      const { data, error } = await (supabase as any)
        .from('listings')
        .select('*')
        .eq('category_slug' as any, categorySlug);

      if (error) throw new Error(`Failed to fetch listings by category: ${error.message}`);

      // Optional sorting
      // We perform client-side sort to avoid depending on DB columns that may not exist
      const items = ((data as unknown as ApiListing[]) || []).slice();
      if (sort) {
        switch (sort) {
          case 'price:asc':
            items.sort((a: any, b: any) => (a.current_bid || a.starting_price || 0) - (b.current_bid || b.starting_price || 0));
            break;
          case 'price:desc':
            items.sort((a: any, b: any) => (b.current_bid || b.starting_price || 0) - (a.current_bid || a.starting_price || 0));
            break;
          default:
            break;
        }
      }

      return this.transformListingsData(items);
    } catch (error) {
      console.error('Error fetching listings by category:', error);
      throw error;
    }
  }

  /**
   * Get listings filtered by category using either slug or id columns.
   * This method tries multiple possible foreign key columns and skips missing-column errors.
   */
  async getListingsByCategory(categoryId: string, sort?: string): Promise<Product[]> {
    const tryQuery = async (column: string, value: string | number) => {
      try {
        const { data, error } = await (supabase as any)
          .from('listings')
          .select('*')
          .eq(column as any, value);
        if (error) {
          // Skip unknown column or other errors silently; we'll try the next option
          return [] as any[];
        }
        return (data as any[]) || [];
      } catch (_) {
        return [] as any[];
      }
    };

    // Try in priority order
    const attempts: Array<[string, string | number]> = [
      ['category_id', categoryId],
      ['subcategory_id', categoryId],
      ['sub_subcategory_id', categoryId],
      ['sub_sub_subcategory_id', categoryId],
    ];

    for (const [column, value] of attempts) {
      const rows = await tryQuery(column, value);
      if (rows && rows.length > 0) {
        const items = (rows as unknown as ApiListing[]).slice();
        if (sort) {
          switch (sort) {
            case 'price:asc':
              items.sort((a: any, b: any) => (a.current_bid || a.starting_price || 0) - (b.current_bid || b.starting_price || 0));
              break;
            case 'price:desc':
              items.sort((a: any, b: any) => (b.current_bid || b.starting_price || 0) - (a.current_bid || a.starting_price || 0));
              break;
            default:
              break;
          }
        }
        return this.transformListingsData(items);
      }
    }

    // No results from any attempt
    return [];
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
   * Get a single listing by id
   */
  async getListingById(listingId: string): Promise<ApiListing | null> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch listing: ${error.message}`);
      }

      return (data as unknown as ApiListing) || null;
    } catch (error) {
      console.error('Error fetching listing by id:', error);
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
      if (status === 'published') {
        query = query.eq('status', 'published');
      } else if (status === 'draft') {
        query = query.eq('status', 'draft');
      } else {
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
      // Prefer primary image, fall back to first in product_images
      const primaryImage: string | undefined =
        (apiListing as any).product_image ||
        (((apiListing as any).product_images && (apiListing as any).product_images.length > 0)
          ? (apiListing as any).product_images[0]
          : undefined);

      return {
        id: apiListing.id,
        title: apiListing.product_name,
        price: apiListing.current_bid || apiListing.starting_price,
        status: apiListing.status as 'published' | 'draft',
        imageUrl: primaryImage,
        dateCreated: new Date().toISOString(), // Mock date - would need to fetch from API
        views: Math.floor(Math.random() * 100), // Mock views - would need to fetch from analytics
        likes: Math.floor(Math.random() * 50) // Mock likes - would need to fetch from analytics
      };
    });
  }
}

export const listingsService = new ListingsService();