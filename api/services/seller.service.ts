import { supabase } from '../config/supabase';

export interface DashboardReports {
  summary: {
    totalSales: number;
    formattedTotalSales: string;
    totalOrders: number;
    pageviews: number;
    sellerBalance: number;
    formattedSellerBalance: string;
    processingOrders: number;
    completedOrders: number;
    onHoldOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    refundedOrders: number;
  };
}

export interface RecentOrder {
  id: string;
  number: string;
  status: string;
  total: number;
  formattedTotal: string;
  dateCreated: string;
  buyer_name?: string;
}

export interface TopSellingProduct {
  id: string;
  title: string;
  soldQty: number;
  formattedSoldQty: string;
  revenue: number;
  formattedRevenue: string;
}

export interface SellerSettings {
  storeName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    fullAddress: string;
  };
  gravatar: string;
  trusted: boolean;
  rating: {
    rating: number;
    count: number;
  };
}

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
   * Get recent orders for a seller
   * @param sellerId - The seller's user ID
   * @param limit - Number of orders to return
   */
  async getRecentOrders(sellerId: string, limit: number = 5): Promise<RecentOrder[]> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('order_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent orders: ${error.message}`);
      }

      // Get buyer profiles for the orders
      const buyerIds = [...new Set((orders || []).map((o: any) => o.buyer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username')
        .in('user_id', buyerIds);

      const profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return (orders || []).map((order: any) => {
        const buyerProfile = profilesMap.get(order.buyer_id);
        return {
          id: order.id,
          number: `#${order.order_number || order.id.slice(-6)}`,
          status: order.status,
          total: parseFloat(order.order_amount) || 0,
          formattedTotal: this.formatCurrency(parseFloat(order.order_amount) || 0),
          dateCreated: order.order_date,
          buyer_name: buyerProfile?.full_name || buyerProfile?.username || 'Unknown',
        };
      });
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  }

  /**
   * Get top selling products for a seller
   * @param sellerId - The seller's user ID
   * @param period - Time period for analysis
   * @param limit - Number of products to return
   */
  async getTopSellingProducts(
    sellerId: string,
    period: string = 'week',
    limit: number = 5
  ): Promise<TopSellingProduct[]> {
    try {
      const dateRange = this.getDateRange(period);

      // Try to get order items if the table exists
      try {
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(
            `
            listing_id,
            quantity,
            price,
            orders!inner(seller_id, order_date, status)
          `
          )
          .eq('orders.seller_id', sellerId)
          .gte('orders.order_date', dateRange.start)
          .lte('orders.order_date', dateRange.end)
          .in('orders.status', ['completed', 'processing']);

        if (!error && orderItems && orderItems.length > 0) {
          // Aggregate by product
          const productStats = new Map<string, { quantity: number; revenue: number; listingId: string }>();

          orderItems.forEach((item: any) => {
            const listingId = item.listing_id;
            const existing = productStats.get(listingId) || {
              quantity: 0,
              revenue: 0,
              listingId,
            };
            existing.quantity += item.quantity || 1;
            existing.revenue += (parseFloat(item.price) || 0) * (item.quantity || 1);
            productStats.set(listingId, existing);
          });

          // Get product details
          const listingIds = Array.from(productStats.keys());
          if (listingIds.length > 0) {
            const { data: listings } = await supabase.from('listings').select('id, product_name').in('id', listingIds);

            const listingsMap = new Map((listings || []).map((l: any) => [l.id, l]));

            // Combine and sort
            const topProducts = Array.from(productStats.entries())
              .map(([listingId, stats]) => {
                const listing = listingsMap.get(listingId);
                return {
                  id: listingId,
                  title: listing?.product_name || 'Unknown Product',
                  soldQty: stats.quantity,
                  formattedSoldQty: stats.quantity.toString(),
                  revenue: stats.revenue,
                  formattedRevenue: this.formatCurrency(stats.revenue),
                };
              })
              .sort((a, b) => b.soldQty - a.soldQty)
              .slice(0, limit);

            return topProducts;
          }
        }
      } catch (orderItemsError) {
        console.warn('order_items table not available, using fallback:', orderItemsError);
      }

      // Fallback: Get seller's listings sorted by stock sold (if tracked) or creation date
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, product_name, starting_price, stock_quantity')
        .eq('seller_id', sellerId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (listingsError) {
        throw new Error(`Failed to fetch listings: ${listingsError.message}`);
      }

      // Return listings as placeholder top products
      return (listings || []).map((listing: any, index: number) => ({
        id: listing.id,
        title: listing.product_name,
        soldQty: 0, // No sales data available
        formattedSoldQty: '0',
        revenue: 0,
        formattedRevenue: this.formatCurrency(0),
      }));
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      // Return empty array on error instead of throwing
      return [];
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

      // Parse full name
      const fullName = (profile?.full_name || '').split(' ');
      const firstName = fullName[0] || '';
      const lastName = fullName.slice(1).join(' ') || '';

      return {
        storeName: (sellerInfo as any)?.store_name || 'My Store',
        firstName,
        lastName,
        email: profile?.email || '',
        phone: profile?.phone || '',
        address: {
          fullAddress: (sellerInfo as any)?.address || '',
        },
        gravatar: profile?.avatar_url || '',
        trusted: (sellerInfo as any)?.is_verified || false,
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
