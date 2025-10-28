import { supabase } from '../config/supabase';
import { DashboardReports, SellerSettings } from '../types';

class SellerService {
  /**
   * Get dashboard reports for a seller
   * @param sellerId - The seller's user ID
   * @param period - Time period for reports ('today', 'week', 'month', 'year')
   */
  async getDashboardReports(sellerId: string, period: string = 'week'): Promise<DashboardReports> {
    try {
      // Calculate date range based on period
      const dateRange = this.getDateRange(period);

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
        .filter((o: any) => o.status === 'completed')
        .reduce((sum, order: any) => {
          // Assuming 10% platform fee
          const orderTotal = parseFloat(order.order_amount) || 0;
          return sum + orderTotal;
        }, 0);

      // Count orders by status
      const processingOrders = ordersList.filter((o: any) => o.status === 'processing').length;
      const completedOrders = ordersList.filter((o: any) => o.status === 'completed').length;
      const onHoldOrders = ordersList.filter((o: any) => o.status === 'on-hold').length;
      const pendingOrders = ordersList.filter((o: any) => o.status === 'pending').length;
      const cancelledOrders = ordersList.filter((o: any) => o.status === 'cancelled').length;
      const refundedOrders = ordersList.filter((o: any) => o.status === 'refunded').length;

      const sellerBalance = ordersList
        .filter((o: any) => o.status === 'completed')
        .reduce((sum, order: any) => {
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
        console.warn('Could not fetch pageviews:', e);
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
      console.error('Error fetching dashboard reports:', error);
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
        .select('full_name, email, phone, avatar_url')
        .eq('user_id', sellerId)
        .single();

      // Get review stats
      const { data: reviews } = await supabase.from('reviews').select('rating').eq('seller_id', sellerId);

      const reviewCount = reviews?.length || 0;
      const averageRating = reviewCount > 0 ? reviews!.reduce((sum, r: any) => sum + r.rating, 0) / reviewCount : 0;

      const fullName = (profile as any)?.full_name || '';
      return {
        storeName: (sellerInfo as any)?.shop_name || 'My Store',
        fullName,
        rating: {
          rating: Math.round(averageRating * 10) / 10,
          count: reviewCount,
        },
      };
    } catch (error) {
      console.error('Error fetching seller settings:', error);
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
