import { supabase } from '../config/supabase';

export interface Product {
  id: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  product_image: string | null;
  product_description: string | null;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  brand_id: string | null;
  status: 'draft' | 'published' | 'private';
  created_at: string;
  product_categories: {
    id: string;
    name: string;
  } | null;
  seller_info_view: {
    shop_name: string;
    display_name_format?: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

class ListingsService {
  /**
   * Get listings for a specific stream
   * @param streamId - The stream ID to fetch listings for
   */
  async getListings(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('product_type', 'shop')
        .eq('status', 'published');

      console.log('listings data', data);
      if (error) {
        throw new Error(`Failed to fetch listings: ${error.message}`);
      }

      // Transform API data to match the UI interface
      return this.transformListingsData((data as unknown as Product[]) || []);
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
      const items = ((data as unknown as Product[]) || []).slice();
      if (sort) {
        switch (sort) {
          case 'price:asc':
            items.sort(
              (a: any, b: any) => (a.current_bid || a.starting_price || 0) - (b.current_bid || b.starting_price || 0)
            );
            break;
          case 'price:desc':
            items.sort(
              (a: any, b: any) => (b.current_bid || b.starting_price || 0) - (a.current_bid || a.starting_price || 0)
            );
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
        const items = (rows as unknown as Product[]).slice();
        if (sort) {
          switch (sort) {
            case 'price:asc':
              items.sort(
                (a: any, b: any) => (a.current_bid || a.starting_price || 0) - (b.current_bid || b.starting_price || 0)
              );
              break;
            case 'price:desc':
              items.sort(
                (a: any, b: any) => (b.current_bid || b.starting_price || 0) - (a.current_bid || a.starting_price || 0)
              );
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

      return this.transformListingsData((data as unknown as Product[]) || []);
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      throw error;
    }
  }

  /**
   * Get a single listing by id
   */
  async getListingById(listingId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase.from('listings').select('*').eq('id', listingId).single();

      if (error) {
        throw new Error(`Failed to fetch listing: ${error.message}`);
      }

      return (data as unknown as Product) || null;
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

      return this.transformListingsData((data as unknown as Product[]) || []);
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
      const { error } = await supabase.from('listings').update({ is_active: isActive }).eq('id', listingId);

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
  private transformListingsData(apiListings: Product[]): Product[] {
    return apiListings.map((apiListing: Product) => {
      // Prefer primary image, fall back to first in product_images
      const primaryImage: string | undefined =
        (apiListing as any).product_image ||
        ((apiListing as any).product_images && (apiListing as any).product_images.length > 0
          ? (apiListing as any).product_images[0]
          : undefined);

      return {
        id: apiListing.id,
        product_name: apiListing.product_name,
        starting_price: apiListing.starting_price,
        discounted_price: apiListing.discounted_price,
        product_image: apiListing.product_image,
        product_description: apiListing.product_description,
        seller_id: apiListing.seller_id,
        category_id: apiListing.category_id,
        subcategory_id: apiListing.subcategory_id,
        sub_subcategory_id: apiListing.sub_subcategory_id,
        sub_sub_subcategory_id: apiListing.sub_sub_subcategory_id,
        brand_id: apiListing.brand_id,
        status: apiListing.status as 'draft' | 'published' | 'private',
        created_at: apiListing.created_at,
        product_categories: apiListing.product_categories,
        seller_info_view: apiListing.seller_info_view,
      };
    });
  }
}

export const listingsService = new ListingsService();
