import { supabase } from '../config/supabase';
import { Brand, BrandFilters } from '../types';

class BrandsService {
  /**
   * Get all brands with optional filtering
   * @param filters - Optional filters for brands
   */
  async getBrands(filters: BrandFilters = {}): Promise<Brand[]> {
    try {
      let query = supabase
        .from('brands')
        .select('id, name, logo_url, description, is_popular, is_active, created_at, updated_at')
        .order('name');

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.is_popular !== undefined) {
        query = query.eq('is_popular', filters.is_popular);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch brands: ${error.message}`);
      }

      return (data as unknown as Brand[]) || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Get popular brands only
   */
  async getPopularBrands(): Promise<Brand[]> {
    try {
      return await this.getBrands({ is_active: true, is_popular: true });
    } catch (error) {
      console.error('Error fetching popular brands:', error);
      throw error;
    }
  }

  /**
   * Get active brands only
   */
  async getActiveBrands(): Promise<Brand[]> {
    try {
      return await this.getBrands({ is_active: true });
    } catch (error) {
      console.error('Error fetching active brands:', error);
      throw error;
    }
  }

  /**
   * Search brands by name
   * @param searchTerm - The search term to look for
   */
  async searchBrands(searchTerm: string): Promise<Brand[]> {
    try {
      return await this.getBrands({ is_active: true, search: searchTerm });
    } catch (error) {
      console.error('Error searching brands:', error);
      throw error;
    }
  }

  /**
   * Get a single brand by ID
   * @param brandId - The brand ID to fetch
   */
  async getBrandById(brandId: string): Promise<Brand | null> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url, description, is_popular, is_active, created_at, updated_at')
        .eq('id', brandId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch brand: ${error.message}`);
      }

      return data as unknown as Brand;
    } catch (error) {
      console.error('Error fetching brand by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new brand
   * @param brandData - The brand data to create
   */
  async createBrand(brandData: {
    name: string;
    logo_url?: string;
    description?: string;
    is_popular?: boolean;
    is_active?: boolean;
  }): Promise<Brand> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert(brandData)
        .select('id, name, logo_url, description, is_popular, is_active, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(`Failed to create brand: ${error.message}`);
      }

      return data as unknown as Brand;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  }

  /**
   * Update an existing brand
   * @param brandId - The brand ID to update
   * @param updateData - The data to update
   */
  async updateBrand(
    brandId: string,
    updateData: {
      name?: string;
      logo_url?: string;
      description?: string;
      is_popular?: boolean;
      is_active?: boolean;
    }
  ): Promise<Brand> {
    try {
      const { data, error } = await supabase
        .from('brands')
        .update(updateData)
        .eq('id', brandId)
        .select('id, name, logo_url, description, is_popular, is_active, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(`Failed to update brand: ${error.message}`);
      }

      return data as unknown as Brand;
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  }

  /**
   * Delete a brand
   * @param brandId - The brand ID to delete
   */
  async deleteBrand(brandId: string): Promise<void> {
    try {
      const { error } = await supabase.from('brands').delete().eq('id', brandId);

      if (error) {
        throw new Error(`Failed to delete brand: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  }

  /**
   * Toggle brand popularity
   * @param brandId - The brand ID to toggle
   * @param isPopular - Whether the brand should be popular
   */
  async toggleBrandPopularity(brandId: string, isPopular: boolean): Promise<Brand> {
    try {
      return await this.updateBrand(brandId, { is_popular: isPopular });
    } catch (error) {
      console.error('Error toggling brand popularity:', error);
      throw error;
    }
  }

  /**
   * Toggle brand active status
   * @param brandId - The brand ID to toggle
   * @param isActive - Whether the brand should be active
   */
  async toggleBrandActiveStatus(brandId: string, isActive: boolean): Promise<Brand> {
    try {
      return await this.updateBrand(brandId, { is_active: isActive });
    } catch (error) {
      console.error('Error toggling brand active status:', error);
      throw error;
    }
  }
}

export const brandsService = new BrandsService();
