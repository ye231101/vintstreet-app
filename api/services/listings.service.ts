import { supabase } from '../config/supabase';

export interface Product {
  id: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  product_image: string | null;
  product_images: string[];
  product_description: string | null;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  brand_id: string | null;
  stock_quantity: number | null;
  status: 'draft' | 'published' | 'private';
  created_at: string;
  product_categories: {
    id: string;
    name: string;
  } | null;
  product_subcategories?: {
    id: string;
    name: string;
  } | null;
  product_sub_subcategories?: {
    id: string;
    name: string;
  } | null;
  product_sub_sub_subcategories?: {
    id: string;
    name: string;
  } | null;
  brands?: {
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

export interface InfiniteQueryResult {
  products: Product[];
  nextPage: number | undefined;
  total?: number;
}

export interface ListingsFilters {
  searchKeyword?: string;
  activeCategory?: string;
  activeSubcategory?: string;
  activeSubSubcategory?: string;
  activeSubSubSubcategory?: string;
  selectedBrands?: Set<string>;
  selectedColors?: Set<string>;
}

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
    filters: ListingsFilters = {},
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
        countQuery = countQuery.or(`product_name.ilike.%${filters.searchKeyword}%,product_description.ilike.%${filters.searchKeyword}%`);
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
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('product_type', 'shop')
        .eq('status', 'published');

      // Apply search filter
      if (filters.searchKeyword && filters.searchKeyword.trim()) {
        query = query.or(`product_name.ilike.%${filters.searchKeyword}%,product_description.ilike.%${filters.searchKeyword}%`);
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
      const sellerIds = [...new Set((data || []).map((p: any) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: any) => [s.user_id, s]));

      const productsWithSellers = (data || []).map((product: any) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];

      return {
        products: productsWithSellers,
        nextPage: data && data.length === pageSize ? pageParam + pageSize : undefined,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching listings infinite:', error);
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
      const sellerIds = [...new Set((data || []).map((p: any) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: any) => [s.user_id, s]));

      const productsWithSellers = (data || []).map((product: any) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];

      return productsWithSellers;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  /**
   * Get listings filtered by category using either slug or id columns.
   * This method tries multiple possible foreign key columns and skips missing-column errors.
   */
  async getListingsByCategory(categoryId: string, sort?: string, priceFilter?: string, brandFilter?: string): Promise<Product[]> {
    const tryQuery = async (column: string, value: string | number) => {
      try {
        let query = (supabase as any)
          .from('listings')
          .select('*')
          .eq(column as any, value)
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

      const productsWithSeller = (data || []).map((product: any) => ({
        ...product,
        seller_info_view: seller || null,
      })) as Product[];

      return productsWithSeller;
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
        .eq('user_id', (data as any).seller_id)
        .single();

      const productWithSeller = {
        ...(data as any),
        seller_info_view: seller || null,
      } as Product;

      return productWithSeller;
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

      const productsWithSeller = (data || []).map((product: any) => ({
        ...product,
        seller_info_view: seller || null,
      })) as Product[];

      return productsWithSeller;
    } catch (error) {
      console.error('Error fetching listings by status:', error);
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
      console.error('Error updating listing status:', error);
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
          status,
          created_at,
          product_categories(id, name)
        `
        )
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .or(`product_name.ilike.%${searchTerm}%,product_description.ilike.%${searchTerm}%`);

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
      const sellerIds = [...new Set((data || []).map((p: any) => p.seller_id))];
      const { data: sellers } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

      const sellersMap = new Map((sellers || []).map((s: any) => [s.user_id, s]));

      const productsWithSellers = (data || []).map((product: any) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as Product[];

      return productsWithSellers;
    } catch (error) {
      console.error('Error searching listings:', error);
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
        .eq('user_id', (data as any).seller_id)
        .single();

      const productWithSeller = {
        ...(data as any),
        seller_info_view: seller || null,
      } as Product;

      return productWithSeller;
    } catch (error) {
      console.error('Error creating product:', error);
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
        .eq('user_id', (data as any).seller_id)
        .single();

      const productWithSeller = {
        ...(data as any),
        seller_info_view: seller || null,
      } as Product;

      return productWithSeller;
    } catch (error) {
      console.error('Error updating product:', error);
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
      console.error('Error deleting product:', error);
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

      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching product categories:', error);
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

      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
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

      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching sub-subcategories:', error);
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

      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching sub-sub-subcategories:', error);
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
  async getAvailableBrandsForCategory(categoryId?: string): Promise<Array<{ id: string; name: string; count: number }>> {
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
        query = query.or(`category_id.eq.${categoryId},subcategory_id.eq.${categoryId},sub_subcategory_id.eq.${categoryId},sub_sub_subcategory_id.eq.${categoryId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching available brands:', error);
        return [];
      }

      // Extract unique brands and count products per brand
      const brandsMap = new Map<string, { id: string; name: string; count: number }>();
      (data || []).forEach((item: any) => {
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
      console.error('Error fetching available brands:', error);
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
        query = query.or(`category_id.eq.${categoryId},subcategory_id.eq.${categoryId},sub_subcategory_id.eq.${categoryId},sub_sub_subcategory_id.eq.${categoryId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching price range counts:', error);
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

      (data || []).forEach((item: any) => {
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
      console.error('Error fetching price range counts:', error);
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
      let productsQuery = supabase
        .from('listings')
        .select('id')
        .eq('product_type', 'shop')
        .eq('status', 'published');

      if (categoryId) {
        productsQuery = productsQuery.or(
          `category_id.eq.${categoryId},subcategory_id.eq.${categoryId},sub_subcategory_id.eq.${categoryId},sub_sub_subcategory_id.eq.${categoryId}`
        );
      }

      const { data: products, error: productsError } = await productsQuery;

      if (productsError || !products || products.length === 0) {
        return new Map<string, number>();
      }

      const productIds = products.map((p: any) => p.id);

      // Query product_attribute_values for size attribute
      const { data: attributeValues, error: attributeError } = await supabase
        .from('product_attribute_values')
        .select('value_text')
        .eq('attribute_id', sizeAttributeId)
        .in('product_id', productIds);

      if (attributeError) {
        console.error('Error fetching attribute values:', attributeError);
        return new Map<string, number>();
      }

      // Count occurrences of each size
      const sizeCounts = new Map<string, number>();

      (attributeValues || []).forEach((item: any) => {
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
      console.error('Error fetching size counts:', error);
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
        console.error('Error fetching products by sizes:', error);
        return [];
      }

      const productIds = new Set<string>();

      (data || []).forEach((item: any) => {
        if (item.value_text) {
          try {
            const parsed = JSON.parse(item.value_text);
            if (Array.isArray(parsed)) {
              // Multi-select: check if any selected size matches
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
      console.error('Error getting products by sizes:', error);
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
        product_images: apiListing.product_images,
        product_description: apiListing.product_description,
        seller_id: apiListing.seller_id,
        category_id: apiListing.category_id,
        subcategory_id: apiListing.subcategory_id,
        sub_subcategory_id: apiListing.sub_subcategory_id,
        sub_sub_subcategory_id: apiListing.sub_sub_subcategory_id,
        brand_id: apiListing.brand_id,
        stock_quantity: apiListing.stock_quantity,
        status: apiListing.status as 'draft' | 'published' | 'private',
        created_at: apiListing.created_at,
        product_categories: apiListing.product_categories,
        seller_info_view: apiListing.seller_info_view,
      };
    });
  }
}

export const listingsService = new ListingsService();
