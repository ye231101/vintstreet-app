import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';

interface ShopBanner {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
  category_id?: string;
  display_order?: number;
  is_active: boolean;
}

class BannersService {
  /**
   * Get active shop banners
   * @param limit - Maximum number of banners to return (default: 10)
   * @returns Array of shop banners
   */
  async getShopBanners(limit: number = 10): Promise<ShopBanner[]> {
    try {
      const { data, error } = await supabase
        .from('shop_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Error fetching shop banners:', error);
        // If table doesn't exist, return empty array
        return [];
      }

      return (data || []) as unknown as ShopBanner[];
    } catch (error) {
      logger.error('Error fetching shop banners:', error);
      return [];
    }
  }
}

export const bannersService = new BannersService();
