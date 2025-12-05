import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { InfiniteQueryResult, ListingsFilters, Product } from '../types';

class ListingsService {
  /**
   * Get listings with infinite scroll support and optimized seller fetching
   * @param pageParam - Current page offset
   * @param pageSize - Number of products per page
   * @param filters - Filter options for listings
   */
  async getListingsInfinite(
    pageParam: number = 0,
    pageSize: number = 20,
    filters: ListingsFilters = {}
  ): Promise<InfiniteQueryResult> {
    try {
      // Build the count query with the same filters
      let countQuery = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('product_type', 'shop')
        .eq('status', 'published');

      // Apply search filter to count query
      if (filters.searchKeyword && filters.searchKeyword.trim()) {
        const escaped = filters.searchKeyword.trim().replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
        const searchPattern = `%${escaped}%`;
        countQuery = countQuery.or(
          `product_name.ilike."${searchPattern}",product_description.ilike."${searchPattern}"`
        );
      }

      // Apply server-side filters to count query
      if (filters.activeCategory) {
        countQuery = countQuery.eq('category_id', filters.activeCategory);
      }
      if (filters.activeSubcategory) {
        countQuery = countQuery.eq('subcategory_id', filters.activeSubcategory);
      }
      if (filters.activeSubSubcategory) {
        countQuery = countQuery.eq('sub_subcategory_id', filters.activeSubSubcategory);
      }
      if (filters.activeSubSubSubcategory) {
        countQuery = countQuery.eq('sub_sub_subcategory_id', filters.activeSubSubSubcategory);
      }
      if (filters.selectedBrands && filters.selectedBrands.size > 0) {
        countQuery = countQuery.in('brand_id', Array.from(filters.selectedBrands));
      }

      // Get total count
      const { count } = await countQuery;

      // Build the data query
      let query = supabase
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
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('product_type', 'shop')
        .eq('status', 'published');

      // Apply search filter
      if (filters.searchKeyword && filters.searchKeyword.trim()) {
        const escaped = filters.searchKeyword.trim().replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
        const searchPattern = `%${escaped}%`;
        query = query.or(`product_name.ilike."${searchPattern}",product_description.ilike."${searchPattern}"`);
      }

      // Apply server-side filters
      if (filters.activeCategory) {
        query = query.eq('category_id', filters.activeCategory);
      }
      if (filters.activeSubcategory) {
        query = query.eq('subcategory_id', filters.activeSubcategory);
      }
      if (filters.activeSubSubcategory) {
        query = query.eq('sub_subcategory_id', filters.activeSubSubcategory);
      }
      if (filters.activeSubSubSubcategory) {
        query = query.eq('sub_sub_subcategory_id', filters.activeSubSubSubcategory);
      }
      if (filters.selectedBrands && filters.selectedBrands.size > 0) {
        query = query.in('brand_id', Array.from(filters.selectedBrands));
      }

      query = query.order('created_at', { ascending: false }).range(pageParam, pageParam + pageSize - 1);

      const { data, error } = await query;
      if (error) throw error;

      // Optimized: Fetch seller info using the new view (single query instead of 2)
      const sellerIds = [...new Set((data || []).map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));

      const productsWithSellers = (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];

      return {
        products: productsWithSellers,
        nextPage: data && data.length === pageSize ? pageParam + pageSize : undefined,
        total: count || 0,
      };
    } catch (error) {
      logger.error('Error fetching listings infinite:', error);
      throw error;
    }
  }

  /**
   * Get listings for a specific stream
   */
  async getListings(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
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
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch listings: ${error.message}`);
      }

      // Optimized: Fetch seller info using the new view (single query instead of 2)
      const sellerIds = [...new Set((data || []).map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));

      const productsWithSellers = (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];

      return productsWithSellers;
    } catch (error) {
      logger.error('Error fetching listings:', error);
      throw error;
    }
  }

  /**
   * Get listings filtered by category using either slug or id columns.
   * This method tries multiple possible foreign key columns and skips missing-column errors.
   */
  async getListingsByCategory(
    categoryId: string,
    sort?: string,
    priceFilter?: string,
    brandFilter?: string
  ): Promise<Product[]> {
    const tryQuery = async (column: string, value: string | number) => {
      try {
        let query = (supabase as unknown)
          .from('listings')
          .select('*')
          .eq(column as unknown, value)
          .eq('product_type', 'shop')
          .eq('status', 'published');

        // Apply price filter if provided
        if (priceFilter && priceFilter !== 'All Prices') {
          const priceRange = this.getPriceRange(priceFilter);
          if (priceRange) {
            if (priceRange.min !== undefined) {
              query = query.gte('starting_price', priceRange.min);
            }
            if (priceRange.max !== undefined) {
              query = query.lte('starting_price', priceRange.max);
            }
          }
        }

        // Apply brand filter if provided
        if (brandFilter && brandFilter !== 'All Brands') {
          query = query.eq('brand_id', brandFilter);
        }

        const { data, error } = await query;
        if (error) {
          // Skip unknown column or other errors silently; we'll try the next option
          return [] as unknown[];
        }
        return (data as unknown[]) || [];
      } catch (_) {
        return [] as unknown[];
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
                (a: unknown, b: unknown) => (a.current_bid || a.starting_price || 0) - (b.current_bid || b.starting_price || 0)
              );
              break;
            case 'price:desc':
              items.sort(
                (a: unknown, b: unknown) => (b.current_bid || b.starting_price || 0) - (a.current_bid || a.starting_price || 0)
              );
              break;
            default:
              break;
          }
        }
        return this.transformListingsData(items);
      }
    }

    // No results from unknown attempt
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
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch seller listings: ${error.message}`);
      }

      // Optimized: Fetch seller info using the new view (single query instead of 2)
      const { data: seller } = await supabase.from('seller_info_view').select('*').eq('user_id', sellerId).single();

      const productsWithSeller = (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: seller || null,
      })) as Product[];

      return productsWithSeller;
    } catch (error) {
      logger.error('Error fetching seller listings:', error);
      throw error;
    }
  }

  /**
   * Get paginated listings for a seller with infinite scroll support
   * @param sellerId - The seller's user ID
   * @param pageParam - Current page offset
   * @param pageSize - Number of products per page
   */
  async getSellerListingsInfinite(
    sellerId: string,
    pageParam: number = 0,
    pageSize: number = 20
  ): Promise<InfiniteQueryResult> {
    try {
      // Build the count query
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'published');

      // Build the data query
      const { data, error } = await supabase
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
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('seller_id', sellerId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) {
        throw new Error(`Failed to fetch seller listings: ${error.message}`);
      }

      // Optimized: Fetch seller info using the new view (single query instead of 2)
      const { data: seller } = await supabase.from('seller_info_view').select('*').eq('user_id', sellerId).single();

      const productsWithSeller = (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: seller || null,
      })) as Product[];

      return {
        products: productsWithSeller,
        nextPage: data && data.length === pageSize ? pageParam + pageSize : undefined,
        total: count || 0,
      };
    } catch (error) {
      logger.error('Error fetching seller listings infinite:', error);
      throw error;
    }
  }

  /**
   * Get a single listing by id
   */
  async getListingById(listingId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
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
          auction_type,
          status,
          created_at,
          stock_quantity,
          product_categories(id, name),
          product_subcategories(id, name),
          product_sub_subcategories(id, name),
          product_sub_sub_subcategories(id, name),
          brands(id, name)
        `
        )
        .eq('id', listingId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch listing: ${error.message}`);
      }

      if (!data) return null;

      // Optimized: Fetch seller info using the new view
      const { data: seller } = await supabase
        .from('seller_info_view')
        .select('*')
        .eq('user_id', (data as unknown).seller_id)
        .single();

      const productWithSeller = {
        ...(data as unknown),
        seller_info_view: seller || null,
      } as Product;

      return productWithSeller;
    } catch (error) {
      logger.error('Error fetching listing by id:', error);
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
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (status === 'published') {
        query = query.eq('status', 'published');
      } else if (status === 'draft') {
        query = query.eq('status', 'draft');
      } else if (status === 'private') {
        query = query.eq('status', 'private');
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch listings by status: ${error.message}`);
      }

      // Optimized: Fetch seller info using the new view (single query instead of 2)
      const { data: seller } = await supabase.from('seller_info_view').select('*').eq('user_id', sellerId).single();

      const productsWithSeller = (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: seller || null,
      })) as Product[];

      return productsWithSeller;
    } catch (error) {
      logger.error('Error fetching listings by status:', error);
      throw error;
    }
  }

  /**
   * Update listing status
   * @param listingId - The listing ID to update
   * @param status - New status
   */
  async updateListingStatus(listingId: string, status: 'published' | 'draft' | 'private'): Promise<void> {
    try {
      const { error } = await supabase.from('listings').update({ status }).eq('id', listingId);

      if (error) {
        throw new Error(`Failed to update listing status: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error updating listing status:', error);
      throw error;
    }
  }

  /**
   * Search listings by product name and description
   * @param searchTerm - The search term to look for
   * @param priceFilter - Optional price filter
   * @param brandFilter - Optional brand filter
   */
  async searchListings(searchTerm: string, priceFilter?: string, brandFilter?: string): Promise<Product[]> {
    try {
      let query = supabase
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
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .or(`product_name.ilike."%${searchTerm.trim()}%",product_description.ilike."%${searchTerm.trim()}%"`);

      // Apply price filter if provided
      if (priceFilter && priceFilter !== 'All Prices') {
        const priceRange = this.getPriceRange(priceFilter);
        if (priceRange) {
          if (priceRange.min !== undefined) {
            query = query.gte('starting_price', priceRange.min);
          }
          if (priceRange.max !== undefined) {
            query = query.lte('starting_price', priceRange.max);
          }
        }
      }

      // Apply brand filter if provided
      if (brandFilter && brandFilter !== 'All Brands') {
        query = query.eq('brand_id', brandFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search listings: ${error.message}`);
      }

      // Optimized: Fetch seller info using the new view (single query instead of 2)
      const sellerIds = [...new Set((data || []).map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));

      const productsWithSellers = (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];

      return productsWithSellers;
    } catch (error) {
      logger.error('Error searching listings:', error);
      throw error;
    }
  }

  /**
   * Create a new product listing
   * @param productData - The product data to create
   */
  async createProduct(productData: {
    seller_id: string;
    product_name: string;
    product_description?: string | null;
    starting_price?: number | null;
    discounted_price?: number | null;
    product_image?: string | null;
    product_images?: string[];
    offers_enabled?: boolean;
    product_type?: string;
    stream_id?: string;
    category_id?: string | null;
    subcategory_id?: string | null;
    sub_subcategory_id?: string | null;
    sub_sub_subcategory_id?: string | null;
    stock_quantity?: number | null;
    auction_type?: 'marketplace' | 'timed';
    status?: 'draft' | 'published' | 'private';
    moderation_status?: string;
    moderation_reason?: string | null;
  }): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(productData)
        .select(
          `
          id,
          product_name,
          starting_price,
          discounted_price,
          product_image,
          product_description,
          seller_id,
          category_id,
          subcategory_id,
          sub_subcategory_id,
          sub_sub_subcategory_id,
          brand_id,
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to create product: ${error.message}`);
      }

      // Fetch seller info
      const { data: seller } = await supabase
        .from('seller_info_view')
        .select('*')
        .eq('user_id', (data as unknown).seller_id)
        .single();

      const productWithSeller = {
        ...(data as unknown),
        seller_info_view: seller || null,
      } as Product;

      return productWithSeller;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product listing
   * @param productId - The product ID to update
   * @param updateData - The data to update
   */
  async updateProduct(
    productId: string,
    updateData: {
      product_name?: string;
      product_description?: string | null;
      starting_price?: number | null;
      discounted_price?: number | null;
      product_image?: string | null;
      product_images?: string[];
      offers_enabled?: boolean;
      category_id?: string | null;
      subcategory_id?: string | null;
      sub_subcategory_id?: string | null;
      sub_sub_subcategory_id?: string | null;
      stock_quantity?: number | null;
      auction_type?: 'marketplace' | 'timed';
      status?: 'draft' | 'published' | 'private';
      moderation_status?: string;
      moderation_reason?: string | null;
    }
  ): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', productId)
        .select(
          `
          id,
          product_name,
          starting_price,
          discounted_price,
          product_image,
          product_description,
          seller_id,
          category_id,
          subcategory_id,
          sub_subcategory_id,
          sub_sub_subcategory_id,
          brand_id,
          stock_quantity,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to update product: ${error.message}`);
      }

      // Fetch seller info
      const { data: seller } = await supabase
        .from('seller_info_view')
        .select('*')
        .eq('user_id', (data as unknown).seller_id)
        .single();

      const productWithSeller = {
        ...(data as unknown),
        seller_info_view: seller || null,
      } as Product;

      return productWithSeller;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product listing
   * @param productId - The product ID to delete
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase.from('listings').delete().eq('id', productId);

      if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Get product categories with display order
   */
  async getProductCategories(): Promise<Array<{ id: string; name: string; slug?: string; display_order?: number }>> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, slug, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch product categories: ${error.message}`);
      }

      return (data as unknown) || [];
    } catch (error) {
      logger.error('Error fetching product categories:', error);
      throw error;
    }
  }

  /**
   * Get subcategories for a category
   * @param categoryId - The parent category ID
   */
  async getSubcategories(categoryId: string): Promise<Array<{ id: string; name: string; category_id: string }>> {
    try {
      const { data, error } = await supabase
        .from('product_subcategories')
        .select('id, name, category_id')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch subcategories: ${error.message}`);
      }

      return (data as unknown) || [];
    } catch (error) {
      logger.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  /**
   * Get sub-subcategories for a subcategory
   * @param subcategoryId - The parent subcategory ID
   */
  async getSubSubcategories(
    subcategoryId: string
  ): Promise<Array<{ id: string; name: string; subcategory_id: string }>> {
    try {
      const { data, error } = await supabase
        .from('product_sub_subcategories')
        .select('id, name, subcategory_id')
        .eq('subcategory_id', subcategoryId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch sub-subcategories: ${error.message}`);
      }

      return (data as unknown) || [];
    } catch (error) {
      logger.error('Error fetching sub-subcategories:', error);
      throw error;
    }
  }

  /**
   * Get sub-sub-subcategories for a sub-subcategory
   * @param subSubcategoryId - The parent sub-subcategory ID
   */
  async getSubSubSubcategories(
    subSubcategoryId: string
  ): Promise<Array<{ id: string; name: string; sub_subcategory_id: string }>> {
    try {
      const { data, error } = await supabase
        .from('product_sub_sub_subcategories')
        .select('id, name, sub_subcategory_id')
        .eq('sub_subcategory_id', subSubcategoryId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch sub-sub-subcategories: ${error.message}`);
      }

      return (data as unknown) || [];
    } catch (error) {
      logger.error('Error fetching sub-sub-subcategories:', error);
      throw error;
    }
  }

  /**
   * Get price range from filter string
   * @param priceFilter - The price filter string
   */
  private getPriceRange(priceFilter: string): { min?: number; max?: number } | null {
    switch (priceFilter) {
      case 'Under £50.00':
        return { max: 50 };
      case '£50.00 - £100.00':
        return { min: 50, max: 100 };
      case '£100.00 - £200.00':
        return { min: 100, max: 200 };
      case 'Over £200.00':
        return { min: 200 };
      default:
        return null;
    }
  }

  /**
   * Get available brands for a specific category with product counts
   * @param categoryId - The category ID to get brands for
   */
  async getAvailableBrandsForCategory(
    categoryId?: string
  ): Promise<Array<{ id: string; name: string; count: number }>> {
    try {
      let query = supabase
        .from('listings')
        .select('brand_id, brands(id, name)')
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .not('brand_id', 'is', null);

      // If category is provided, filter by it
      if (categoryId) {
        // Try to match against all category level columns
        query = query.or(
          `category_id.eq.${categoryId},subcategory_id.eq.${categoryId},sub_subcategory_id.eq.${categoryId},sub_sub_subcategory_id.eq.${categoryId}`
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching available brands:', error);
        return [];
      }

      // Extract unique brands and count products per brand
      const brandsMap = new Map<string, { id: string; name: string; count: number }>();
      (data || []).forEach((item: unknown) => {
        if (item.brands && item.brands.id && item.brands.name) {
          const brandId = item.brands.id;
          if (brandsMap.has(brandId)) {
            // Increment count for existing brand
            const existing = brandsMap.get(brandId)!;
            existing.count += 1;
          } else {
            // Add new brand with count of 1
            brandsMap.set(brandId, { id: item.brands.id, name: item.brands.name, count: 1 });
          }
        }
      });

      // Return sorted by name
      return Array.from(brandsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      logger.error('Error fetching available brands:', error);
      return [];
    }
  }

  /**
   * Get product counts by price range for a specific category
   * @param categoryId - The category ID to get price counts for
   */
  async getPriceRangeCounts(categoryId?: string): Promise<{
    'Under £50.00': number;
    '£50.00 - £100.00': number;
    '£100.00 - £200.00': number;
    'Over £200.00': number;
  }> {
    try {
      let query = supabase
        .from('listings')
        .select('starting_price')
        .eq('product_type', 'shop')
        .eq('status', 'published');

      // If category is provided, filter by it
      if (categoryId) {
        query = query.or(
          `category_id.eq.${categoryId},subcategory_id.eq.${categoryId},sub_subcategory_id.eq.${categoryId},sub_sub_subcategory_id.eq.${categoryId}`
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching price range counts:', error);
        return {
          'Under £50.00': 0,
          '£50.00 - £100.00': 0,
          '£100.00 - £200.00': 0,
          'Over £200.00': 0,
        };
      }

      // Count products in each price range
      const counts = {
        'Under £50.00': 0,
        '£50.00 - £100.00': 0,
        '£100.00 - £200.00': 0,
        'Over £200.00': 0,
      };

      (data || []).forEach((item: unknown) => {
        const price = item.starting_price || 0;
        if (price < 50) {
          counts['Under £50.00'] += 1;
        } else if (price >= 50 && price <= 100) {
          counts['£50.00 - £100.00'] += 1;
        } else if (price >= 100 && price <= 200) {
          counts['£100.00 - £200.00'] += 1;
        } else if (price > 200) {
          counts['Over £200.00'] += 1;
        }
      });

      return counts;
    } catch (error) {
      logger.error('Error fetching price range counts:', error);
      return {
        'Under £50.00': 0,
        '£50.00 - £100.00': 0,
        '£100.00 - £200.00': 0,
        'Over £200.00': 0,
      };
    }
  }

  /**
   * Get product counts by size for a specific category
   * @param categoryId - The category ID to get size counts for
   * @param sizeAttributeId - The attribute ID for sizes
   */
  async getSizeCounts(categoryId?: string, sizeAttributeId?: string): Promise<Map<string, number>> {
    try {
      if (!sizeAttributeId) {
        return new Map<string, number>();
      }

      // First, get all product IDs in this category
      let productsQuery = supabase.from('listings').select('id').eq('product_type', 'shop').eq('status', 'published');

      if (categoryId) {
        productsQuery = productsQuery.or(
          `category_id.eq.${categoryId},subcategory_id.eq.${categoryId},sub_subcategory_id.eq.${categoryId},sub_sub_subcategory_id.eq.${categoryId}`
        );
      }

      const { data: products, error: productsError } = await productsQuery;

      if (productsError || !products || products.length === 0) {
        return new Map<string, number>();
      }

      const productIds = products.map((p: unknown) => p.id);

      // Query product_attribute_values for size attribute
      const { data: attributeValues, error: attributeError } = await supabase
        .from('product_attribute_values')
        .select('value_text')
        .eq('attribute_id', sizeAttributeId)
        .in('product_id', productIds);

      if (attributeError) {
        logger.error('Error fetching attribute values:', attributeError);
        return new Map<string, number>();
      }

      // Count occurrences of each size
      const sizeCounts = new Map<string, number>();

      (attributeValues || []).forEach((item: unknown) => {
        // Handle multi-select values (stored as JSON array in value_text)
        if (item.value_text) {
          try {
            const parsed = JSON.parse(item.value_text);
            if (Array.isArray(parsed)) {
              // Multi-select: each value is a size option ID
              parsed.forEach((optionId: string) => {
                sizeCounts.set(optionId, (sizeCounts.get(optionId) || 0) + 1);
              });
            } else {
              // Single value (option ID)
              sizeCounts.set(item.value_text, (sizeCounts.get(item.value_text) || 0) + 1);
            }
          } catch {
            // If not JSON, treat as single value (option ID)
            sizeCounts.set(item.value_text, (sizeCounts.get(item.value_text) || 0) + 1);
          }
        }
      });

      return sizeCounts;
    } catch (error) {
      logger.error('Error fetching size counts:', error);
      return new Map<string, number>();
    }
  }

  /**
   * Get product IDs that have specific size values
   * @param sizeOptionIds - Array of size option IDs to filter by
   * @param sizeAttributeId - The attribute ID for sizes
   */
  async getProductIdsBySizes(sizeOptionIds: string[], sizeAttributeId: string): Promise<string[]> {
    try {
      if (!sizeOptionIds || sizeOptionIds.length === 0 || !sizeAttributeId) {
        return [];
      }

      const { data, error } = await supabase
        .from('product_attribute_values')
        .select('product_id, value_text')
        .eq('attribute_id', sizeAttributeId);

      if (error) {
        logger.error('Error fetching products by sizes:', error);
        return [];
      }

      const productIds = new Set<string>();

      (data || []).forEach((item: unknown) => {
        if (item.value_text) {
          try {
            const parsed = JSON.parse(item.value_text);
            if (Array.isArray(parsed)) {
              // Multi-select: check if unknown selected size matches
              if (parsed.some((v: string) => sizeOptionIds.includes(v))) {
                productIds.add(item.product_id);
              }
            } else {
              // Single value
              if (sizeOptionIds.includes(item.value_text)) {
                productIds.add(item.product_id);
              }
            }
          } catch {
            // If not JSON, treat as single value
            if (sizeOptionIds.includes(item.value_text)) {
              productIds.add(item.product_id);
            }
          }
        }
      });

      return Array.from(productIds);
    } catch (error) {
      logger.error('Error getting products by sizes:', error);
      return [];
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
        (apiListing as unknown).product_image ||
        ((apiListing as unknown).product_images && (apiListing as unknown).product_images.length > 0
          ? (apiListing as unknown).product_images[0]
          : undefined);

      return {
        id: apiListing.id,
        product_name: apiListing.product_name,
        starting_price: apiListing.starting_price,
        discounted_price: apiListing.discounted_price,
        product_image: apiListing.product_image,
        product_images: apiListing.product_images,
        product_description: apiListing.product_description,
        seller_id: apiListing.seller_id,
        category_id: apiListing.category_id,
        subcategory_id: apiListing.subcategory_id,
        sub_subcategory_id: apiListing.sub_subcategory_id,
        sub_sub_subcategory_id: apiListing.sub_sub_subcategory_id,
        brand_id: apiListing.brand_id,
        stock_quantity: apiListing.stock_quantity,
        auction_type: apiListing.auction_type,
        status: apiListing.status as 'draft' | 'published' | 'private',
        created_at: apiListing.created_at,
        product_categories: apiListing.product_categories,
        seller_info_view: apiListing.seller_info_view,
      };
    });
  }

  /**
   * Get search suggestions based on partial search term
   * @param searchTerm - The partial search term to get suggestions for
   * @param limit - Maximum number of suggestions to return (default: 10)
   */
  async getSearchSuggestions(
    searchTerm: string,
    limit: number = 10
  ): Promise<Array<{ type: 'product' | 'brand'; value: string; id?: string }>> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const suggestions: Array<{ type: 'product' | 'brand'; value: string; id?: string }> = [];

      // Get product name suggestions
      const { data: products, error: productsError } = await supabase
        .from('listings')
        .select('id, product_name')
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .ilike('product_name', `%${searchTerm.trim()}%`)
        .limit(limit);

      if (!productsError && products) {
        // Get unique product names
        const uniqueNames = new Set<string>();
        products.forEach((p: unknown) => {
          if (p.product_name && !uniqueNames.has(p.product_name.toLowerCase())) {
            uniqueNames.add(p.product_name.toLowerCase());
            suggestions.push({
              type: 'product',
              value: p.product_name,
              id: p.id,
            });
          }
        });
      }

      // Get brand name suggestions
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name')
        .eq('is_active', true)
        .ilike('name', `%${searchTerm.trim()}%`)
        .limit(Math.floor(limit / 2));

      if (!brandsError && brands) {
        brands.forEach((b: unknown) => {
          suggestions.push({
            type: 'brand',
            value: b.name,
            id: b.id,
          });
        });
      }

      // Sort suggestions by relevance (starts with search term first)
      const searchLower = searchTerm.trim().toLowerCase();
      suggestions.sort((a, b) => {
        const aStarts = a.value.toLowerCase().startsWith(searchLower);
        const bStarts = b.value.toLowerCase().startsWith(searchLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.value.localeCompare(b.value);
      });

      return suggestions.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching search suggestions:', error);
      return [];
    }
  }

  /**
   * Get related products from the same category
   * @param productId - The product ID to exclude from results
   * @param limit - Maximum number of related products to return
   */
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    try {
      // First, get the product to retrieve its category_id
      const product = await this.getListingById(productId);

      if (!product || !product.category_id) {
        return [];
      }

      const categoryId = product.category_id;

      // Fetch related products from the same category
      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          id,
          product_name,
          starting_price,
          discounted_price,
          product_image,
          product_images,
          seller_id,
          category_id,
          auction_type,
          product_categories(id, name)
        `
        )
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .neq('id', productId)
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch seller info for all related products
      const sellerIds = [...new Set(data.map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));

      const productsWithSellers = data.map((p: unknown) => ({
        ...p,
        seller_info_view: sellersMap.get(p.seller_id) || null,
      })) as Product[];

      return productsWithSellers;
    } catch (error) {
      logger.error('Error fetching related products:', error);
      throw new Error('Failed to fetch related products');
    }
  }

  /**
   * Get products by their IDs
   * @param productIds - Array of product IDs
   * @returns Array of products
   */
  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    try {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
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
          stock_quantity,
          auction_type,
          product_categories(id, name)
        `
        )
        .in('id', productIds)
        .eq('status', 'published');

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch seller info for all products
      const sellerIds = [...new Set((data || []).map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));

      return (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];
    } catch (error) {
      logger.error('Error fetching products by IDs:', error);
      return [];
    }
  }

  /**
   * Get recommended products based on recently viewed items
   * @param recentlyViewedProducts - Array of recently viewed products
   * @param limit - Maximum number of recommended products to return
   * @returns Array of recommended products
   */
  async getRecommendedProducts(recentlyViewedProducts: Product[], limit: number = 8): Promise<Product[]> {
    try {
      if (recentlyViewedProducts.length === 0) return [];

      // Extract unique brands, categories, and price ranges from recently viewed
      const brandIds = [...new Set(recentlyViewedProducts.map((p) => p.brand_id).filter(Boolean))];
      const categoryIds = [...new Set(recentlyViewedProducts.map((p) => p.sub_sub_subcategory_id).filter(Boolean))];
      const viewedProductIds = recentlyViewedProducts.map((p) => p.id);

      // Calculate average price
      const avgPrice =
        recentlyViewedProducts.reduce((sum, p) => sum + (p.discounted_price || p.starting_price), 0) /
        recentlyViewedProducts.length;

      const minPrice = avgPrice * 0.5;
      const maxPrice = avgPrice * 1.5;

      // Get non-suspended sellers
      const { data: nonSuspendedSellers } = await supabase
        .from('seller_profiles')
        .select('user_id')
        .eq('is_suspended', false);

      const nonSuspendedSellerIds = nonSuspendedSellers?.map((s: unknown) => s.user_id) || [];

      // Build query for similar products
      let query = supabase
        .from('listings')
        .select(
          `
          id,
          product_name,
          starting_price,
          discounted_price,
          product_image,
          product_images,
          seller_id,
          category_id,
          subcategory_id,
          sub_subcategory_id,
          sub_sub_subcategory_id,
          brand_id,
          auction_type,
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('status', 'published')
        .in('seller_id', nonSuspendedSellerIds)
        .not('id', 'in', `(${viewedProductIds.join(',')})`)
        .gte('starting_price', minPrice)
        .lte('starting_price', maxPrice);

      // Add brand or category filters
      if (brandIds.length > 0 || categoryIds.length > 0) {
        const conditions = [];
        if (brandIds.length > 0) {
          conditions.push(`brand_id.in.(${brandIds.join(',')})`);
        }
        if (categoryIds.length > 0) {
          conditions.push(`sub_sub_subcategory_id.in.(${categoryIds.join(',')})`);
        }
        query = query.or(conditions.join(','));
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch seller info for recommended products
      const sellerIds = [...new Set((data || []).map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: unknown) => [s.user_id, s]));

      return (data || []).map((product: unknown) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];
    } catch (error) {
      logger.error('Error fetching recommended products:', error);
      return [];
    }
  }

  /**
   * Bulk create product listings
   * @param sellerId - The seller's user ID
   * @param items - Array of product rows to insert
   * @returns Number of products created
   */
  async bulkCreateProducts(
    sellerId: string,
    items: Array<{
      product_name: string;
      product_description?: string | null;
      starting_price?: number | null;
      discounted_price?: number | null;
      product_image?: string | null;
      product_images?: string[];
      offers_enabled?: boolean;
      category_id?: string | null;
      subcategory_id?: string | null;
      sub_subcategory_id?: string | null;
      sub_sub_subcategory_id?: string | null;
      brand_id?: string | null;
      stock_quantity?: number | null;
      auction_type?: 'marketplace' | 'timed';
      status?: 'draft' | 'published' | 'private';
    }>
  ): Promise<number> {
    try {
      if (!sellerId) {
        throw new Error('Missing sellerId');
      }

      const rows = items
        .filter((row) => !!(row.product_name && row.product_name.trim().length > 0))
        .map((row) => {
          const sp = row.starting_price;
          const dp = row.discounted_price;
          const qty = row.stock_quantity;

          const startingPrice = sp !== undefined && sp !== null && !Number.isNaN(sp) ? Number(sp) : 0;
          const discountedPrice = dp !== undefined && dp !== null && !Number.isNaN(dp) ? Number(dp) : null;
          const stockQty = qty !== undefined && qty !== null && !Number.isNaN(qty as unknown) ? Number(qty) : null;

          return {
            seller_id: sellerId,
            product_type: 'shop',
            stream_id: 'master-catalog',
            status: row.status || 'draft',
            product_name: row.product_name.trim(),
            product_description: row.product_description ?? null,
            starting_price: startingPrice,
            discounted_price: discountedPrice,
            product_image: row.product_image ?? null,
            product_images: row.product_images ?? null,
            offers_enabled: row.offers_enabled ?? true,
            category_id: row.category_id ?? null,
            subcategory_id: row.subcategory_id ?? null,
            sub_subcategory_id: row.sub_subcategory_id ?? null,
            sub_sub_subcategory_id: row.sub_sub_subcategory_id ?? null,
            brand_id: row.brand_id ?? null,
            stock_quantity: stockQty,
            auction_type: row.auction_type ?? 'marketplace',
          };
        });

      if (rows.length === 0) {
        return 0;
      }

      const { data, error } = await supabase.from('listings').insert(rows).select('id');

      if (error) {
        throw new Error(`Failed to bulk create products: ${error.message}`);
      }

      return (data?.length as number) || 0;
    } catch (error) {
      logger.error('Error in bulkCreateProducts:', error);
      throw error;
    }
  }

  /**
   * Get auction listings with pagination and sorting
   * @param page - Current page number (0-indexed)
   * @param pageSize - Number of products per page
   * @param sortBy - Sort option: 'ending_soon' | 'newest' | 'price_low' | 'price_high'
   * @returns Object with products, total count, and pagination info
   */
  async getAuctions(
    page: number = 0,
    pageSize: number = 20,
    sortBy: 'ending_soon' | 'newest' | 'price_low' | 'price_high' = 'ending_soon'
  ): Promise<{ products: unknown[]; total: number }> {
    try {
      let query = supabase
        .from('listings')
        .select(
          `
            id,
            slug,
            product_name,
            starting_price,
            product_image,
            product_description,
            seller_id,
            status,
            created_at,
            auction_type,
            auctions!inner(
              id,
              current_bid,
              starting_bid,
              end_time,
              status,
              bid_count,
              reserve_price,
              reserve_met
            )
          `,
          { count: 'exact' }
        )
        .eq('auction_type', 'timed')
        .eq('status', 'published')
        .eq('product_type', 'shop')
        .eq('archived', false)
        .eq('auctions.status', 'active');

      // Apply sorting
      if (sortBy === 'ending_soon') {
        query = query.order('end_time', { foreignTable: 'auctions', ascending: true });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_low') {
        query = query.order('starting_price', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('starting_price', { ascending: false });
      }

      const {
        data: productsData,
        error: productsError,
        count,
      } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

      if (productsError) throw productsError;

      // Fetch seller information separately
      const sellerIds = [...new Set((productsData || []).map((p: unknown) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map(sellers?.map((s: unknown) => [s.user_id, s]));

      const productsWithSellers = (productsData || []).map((product: unknown) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      }));

      return {
        products: productsWithSellers,
        total: count || 0,
      };
    } catch (error) {
      logger.error('Error fetching auctions:', error);
      throw error;
    }
  }

  /**
   * Create an auction listing for a stream
   * @param auctionData - Auction listing data
   * @returns Created listing
   */
  async createAuctionListing(auctionData: {
    seller_id: string;
    stream_id: string;
    product_name: string;
    product_description: string;
    starting_price: number;
    current_bid: number;
    auction_end_time: string;
  }): Promise<unknown> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: auctionData.seller_id,
          stream_id: auctionData.stream_id,
          product_name: auctionData.product_name,
          product_description: auctionData.product_description,
          starting_price: auctionData.starting_price,
          current_bid: auctionData.current_bid,
          is_active: true,
          auction_end_time: auctionData.auction_end_time,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating auction listing:', error);
      throw error;
    }
  }

  /**
   * End an auction by updating the listing
   * @param listingId - The listing ID to update
   */
  async endAuction(listingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          is_active: false,
          auction_end_time: null,
        })
        .eq('id', listingId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error ending auction:', error);
      throw error;
    }
  }

  /**
   * Get auction data for a specific listing
   * @param listingId - The listing ID
   * @returns Auction data or null if not found
   */
  async getAuctionByListingId(listingId: string): Promise<unknown | null> {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('listing_id', listingId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is okay
        throw error;
      }

      return data ? (data as unknown) : null;
    } catch (error) {
      logger.error('Error fetching auction:', error);
      throw error;
    }
  }

  /**
   * Get bids for an auction
   * @param auctionId - The auction ID
   * @returns Array of bids
   */
  async getBidsForAuction(auctionId: string): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown[]) || [];
    } catch (error) {
      logger.error('Error fetching bids:', error);
      throw error;
    }
  }

  /**
   * Place a proxy bid on an auction
   * @param auctionId - The auction ID
   * @param maxBidAmount - Maximum bid amount
   * @returns Result with success status, current bid, and if user is leading
   */
  async placeProxyBid(
    auctionId: string,
    maxBidAmount: number
  ): Promise<{
    success: boolean;
    currentBid: number;
    isLeading: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('place-proxy-bid', {
        body: {
          auctionId: auctionId,
          maxBidAmount: maxBidAmount,
        },
      });

      if (error) throw error;

      if (data && data.success) {
        return {
          success: true,
          currentBid: data.currentBid,
          isLeading: data.isLeading,
        };
      } else {
        return {
          success: false,
          currentBid: 0,
          isLeading: false,
          error: (data && data.error) || 'Failed to place bid',
        };
      }
    } catch (error) {
      logger.error('Error placing proxy bid:', error);
      return {
        success: false,
        currentBid: 0,
        isLeading: false,
        error: error instanceof Error ? error.message : 'Failed to place bid',
      };
    }
  }
}

export const listingsService = new ListingsService();
