import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { DashboardReports, SellerProfile, SellerSettings } from '../types';

class SellerService {
  /**
   * Get dashboard reports for a seller
   * @param sellerId - The seller's user ID
   * @param period - Time period for reports ('today', 'week', 'month', 'year', 'custom')
   * @param customDateRange - Optional custom date range for 'custom' period
   */
  async getDashboardReports(
    sellerId: string,
    period: string = 'week',
    customDateRange?: { start: Date; end: Date }
  ): Promise<DashboardReports> {
    try {
      // Calculate date range based on period
      const dateRange = customDateRange
        ? {
            start: customDateRange.start.toISOString(),
            end: customDateRange.end.toISOString(),
          }
        : this.getDateRange(period);

      // Get orders within the date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('order_date', dateRange.start)
        .lte('order_date', dateRange.end);

      if (ordersError) {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      // Calculate statistics
      const ordersList = orders || [];
      const totalOrders = ordersList.length;

      // Calculate total sales
      const totalSales = ordersList
        .filter((o: unknown) => o.status === 'completed')
        .reduce((sum, order: unknown) => {
          // Assuming 10% platform fee
          const orderTotal = parseFloat(order.order_amount) || 0;
          return sum + orderTotal;
        }, 0);

      // Count orders by status
      const processingOrders = ordersList.filter((o: unknown) => o.status === 'processing').length;
      const completedOrders = ordersList.filter((o: unknown) => o.status === 'completed').length;
      const onHoldOrders = ordersList.filter((o: unknown) => o.status === 'on-hold').length;
      const pendingOrders = ordersList.filter((o: unknown) => o.status === 'pending').length;
      const cancelledOrders = ordersList.filter((o: unknown) => o.status === 'cancelled').length;
      const refundedOrders = ordersList.filter((o: unknown) => o.status === 'refunded').length;

      const sellerBalance = ordersList
        .filter((o: unknown) => o.status === 'completed')
        .reduce((sum, order: unknown) => {
          const orderTotal = parseFloat(order.order_amount) || 0;
          return 0;
        }, 0);

      let pageviews = 0;
      try {
        const { data: listings } = await supabase
          .from('listings')
          .select('id')
          .eq('seller_id', sellerId)
          .eq('status', 'published');

        pageviews = (listings?.length || 0) * 50; // Rough estimate
      } catch (e) {
        logger.warn('Could not fetch pageviews:', e);
      }

      return {
        summary: {
          totalSales,
          formattedTotalSales: this.formatCurrency(totalSales),
          totalOrders,
          pageviews,
          sellerBalance,
          formattedSellerBalance: this.formatCurrency(sellerBalance),
          processingOrders,
          completedOrders,
          onHoldOrders,
          pendingOrders,
          cancelledOrders,
          refundedOrders,
        },
      };
    } catch (error) {
      logger.error('Error fetching dashboard reports:', error);
      throw error;
    }
  }

  /**
   * Get seller settings/profile
   * @param sellerId - The seller's user ID
   */
  async getSellerSettings(sellerId: string): Promise<SellerSettings> {
    try {
      // Fetch from seller_info_view which has all the seller data
      const { data: sellerInfo, error } = await supabase
        .from('seller_info_view')
        .select('*')
        .eq('user_id', sellerId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch seller settings: ${error.message}`);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, bio, created_at')
        .eq('user_id', sellerId)
        .single();
      // Get review stats
      const { data: reviews } = await supabase.from('reviews').select('rating').eq('seller_id', sellerId);

      const reviewCount = reviews?.length || 0;
      const averageRating = reviewCount > 0 ? reviews!.reduce((sum, r: unknown) => sum + r.rating, 0) / reviewCount : 0;

      const fullName = (profile as unknown)?.full_name || '';

      // Fetch canonical seller profile for display preference (more reliable than view)
      const { data: sellerCore } = await supabase
        .from('seller_profiles')
        .select('shop_name, display_name_format')
        .eq('user_id', sellerId)
        .single();

      const displayNameFormat: 'shop_name' | 'personal_name' =
        ((sellerCore as unknown)?.display_name_format as unknown) ||
        ((sellerInfo as unknown)?.display_name_format as unknown) ||
        'shop_name';
      const shopName: string = (sellerCore as unknown)?.shop_name || (sellerInfo as unknown)?.shop_name || 'My Store';

      const toPersonalName = (name: string) => {
        const trimmed = (name || '').trim();
        if (!trimmed) return '';
        const parts = trimmed.split(' ').filter(Boolean);
        if (parts.length === 0) return '';
        const first = parts[0];
        if (parts.length === 1) return first;
        const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
        return `${first} ${lastInitial}.`;
      };

      const personalName = toPersonalName(fullName);
      const displayName =
        displayNameFormat === 'personal_name' ? personalName || fullName || shopName : shopName || fullName;

      return {
        storeName: shopName,
        fullName,
        displayName,
        displayNameFormat,
        rating: {
          rating: Math.round(averageRating * 10) / 10,
          count: reviewCount,
        },
      };
    } catch (error) {
      logger.error('Error fetching seller settings:', error);
      throw error;
    }
  }

  /**
   * Helper method to get date range based on period
   */
  private getDateRange(period: string): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString();
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      start: start.toISOString(),
      end,
    };
  }

  /**
   * Get seller profile by user ID
   * @param userId - The user ID
   */
  async getSellerProfile(userId: string): Promise<SellerProfile | null> {
    try {
      const { data, error } = await supabase.from('seller_profiles').select('*').eq('user_id', userId).single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as unknown as SellerProfile | null;
    } catch (error) {
      logger.error('Error fetching seller profile:', error);
      throw new Error('Failed to fetch seller profile');
    }
  }

  /**
   * Create or update seller profile
   * @param userId - The user ID
   * @param profileData - The profile data to save
   */
  async saveSellerProfile(userId: string, profileData: Partial<SellerProfile>): Promise<SellerProfile> {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('seller_profiles')
          .update(profileData)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;
        return data as unknown as SellerProfile;
      } else {
        // Create new profile
        const { data, error: insertError } = await supabase
          .from('seller_profiles')
          .insert({
            user_id: userId,
            ...profileData,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return data as unknown as SellerProfile;
      }
    } catch (error) {
      logger.error('Error saving seller profile:', error);
      throw new Error('Failed to save seller profile');
    }
  }

  /**
   * Get complete seller profile with user profile data
   * @param userId - The user ID
   */
  async getCompleteSellerProfile(userId: string): Promise<{
    sellerProfile: SellerProfile | null;
    userProfile: {
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      bio: string | null;
      created_at: string | null;
    } | null;
  }> {
    try {
      // Get seller profile
      const sellerProfile = await this.getSellerProfile(userId);

      // Get user profile data
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, bio, created_at')
        .eq('user_id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        logger.error('Error fetching user profile:', userError);
      }

      return {
        sellerProfile,
        userProfile: userProfile ? (userProfile as unknown) : null,
      };
    } catch (error) {
      logger.error('Error fetching complete seller profile:', error);
      throw new Error('Failed to fetch complete seller profile');
    }
  }

  /**
   * Helper method to format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  }
}

export const sellerService = new SellerService();
