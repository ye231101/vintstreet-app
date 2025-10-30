import { supabase } from '../config/supabase';
import { Order } from '../types';

class OrdersService {
  /**
   * Get orders for the current user (buyer or seller)
   * @param userId - The user ID to fetch orders for
   * @param userType - 'buyer' or 'seller' to determine which orders to fetch
   */
  async getOrders(userId: string, userType: 'buyer' | 'seller' = 'buyer'): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*').order('order_date', { ascending: false });

      // Apply RLS policy based on user type
      if (userType === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else {
        query = query.eq('seller_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      const orders = (data as unknown as Order[]) || [];

      // Fetch listing details for all orders that have a listing_id
      const listingIds = orders.map((order) => order.listing_id).filter((id): id is string => !!id);

      let listingsMap = new Map<string, any>();

      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from('listings')
          .select('id, product_name, product_image, starting_price, discounted_price')
          .in('id', listingIds);

        listingsMap = new Map((listings || []).map((listing: any) => [listing.id, listing]));
      }

      // Fetch buyer profiles if seller is viewing
      let buyerProfilesMap = new Map<string, any>();
      let buyerDetailsMap = new Map<string, any>();

      if (userType === 'seller') {
        const buyerIds = orders.map((order) => order.buyer_id).filter((id): id is string => !!id);

        if (buyerIds.length > 0) {
          // Fetch buyer profile data
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username')
            .in('user_id', buyerIds);
          buyerProfilesMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));

          // Fetch buyer details (shipping info)
          const { data: buyerDetails } = await supabase.from('buyer_profiles').select('*').in('user_id', buyerIds);
          buyerDetailsMap = new Map((buyerDetails || []).map((detail: any) => [detail.user_id, detail]));
        }
      }

      // Merge orders with their listing data and buyer info
      const ordersWithListings = orders.map((order) => ({
        ...order,
        listings: order.listing_id ? listingsMap.get(order.listing_id) : undefined,
        buyer_profile: order.buyer_id ? buyerProfilesMap.get(order.buyer_id) : undefined,
        buyer_details: order.buyer_id ? buyerDetailsMap.get(order.buyer_id) : undefined,
      }));

      // Transform API data to match the UI interface
      return this.transformOrdersData(ordersWithListings);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Get orders by status
   * @param userId - The user ID
   * @param deliveryStatus - Order delivery status to filter by
   * @param userType - 'buyer' or 'seller'
   */
  async getOrdersByStatus(
    userId: string,
    deliveryStatus: string,
    userType: 'buyer' | 'seller' = 'buyer'
  ): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('delivery_status', deliveryStatus)
        .order('order_date', { ascending: false });

      // Apply RLS policy based on user type
      if (userType === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else {
        query = query.eq('seller_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch orders by status: ${error.message}`);
      }

      const orders = (data as unknown as Order[]) || [];

      // Fetch listing details for all orders that have a listing_id
      const listingIds = orders.map((order) => order.listing_id).filter((id): id is string => !!id);

      let listingsMap = new Map<string, any>();

      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from('listings')
          .select('id, product_name, product_image, starting_price, discounted_price')
          .in('id', listingIds);

        listingsMap = new Map((listings || []).map((listing: any) => [listing.id, listing]));
      }

      // Fetch buyer profiles if seller is viewing
      let buyerProfilesMap = new Map<string, any>();
      let buyerDetailsMap = new Map<string, any>();

      if (userType === 'seller') {
        const buyerIds = orders.map((order) => order.buyer_id).filter((id): id is string => !!id);

        if (buyerIds.length > 0) {
          // Fetch buyer profile data
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username')
            .in('user_id', buyerIds);

          buyerProfilesMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));

          // Fetch buyer details (shipping info)
          const { data: buyerDetails } = await supabase.from('buyer_profiles').select('*').in('user_id', buyerIds);

          buyerDetailsMap = new Map((buyerDetails || []).map((detail: any) => [detail.user_id, detail]));
        }
      }

      // Merge orders with their listing data and buyer info
      const ordersWithListings = orders.map((order) => ({
        ...order,
        listings: order.listing_id ? listingsMap.get(order.listing_id) : undefined,
        buyer_profile: order.buyer_id ? buyerProfilesMap.get(order.buyer_id) : undefined,
        buyer_details: order.buyer_id ? buyerDetailsMap.get(order.buyer_id) : undefined,
      }));

      return this.transformOrdersData(ordersWithListings);
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  }

  /**
   * Update order delivery_status
   * @param orderId - The order ID to update
   * @param delivery_status - New delivery_status
   */
  async updateOrderStatus(orderId: string, delivery_status: string): Promise<void> {
    try {
      const { error } = await supabase.from('orders').update({ delivery_status }).eq('id', orderId);

      if (error) {
        throw new Error(`Failed to update order status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Update order tracking number
   * @param orderId - The order ID to update
   * @param trackingNumber - Tracking number
   */
  async updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void> {
    try {
      const { error } = await supabase.from('orders').update({ tracking_number: trackingNumber }).eq('id', orderId);

      if (error) {
        throw new Error(`Failed to update tracking number: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating tracking number:', error);
      throw error;
    }
  }

  /**
   * Create a new order from checkout
   * @param orderData - Order creation data
   */
  async createOrder(orderData: {
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    stream_id: string;
    order_amount: number;
    quantity: number;
    status: string;
    delivery_status: string;
  }): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          listing_id: orderData.listing_id,
          buyer_id: orderData.buyer_id,
          seller_id: orderData.seller_id,
          stream_id: orderData.stream_id,
          order_amount: orderData.order_amount,
          quantity: orderData.quantity,
          status: orderData.status,
          delivery_status: orderData.delivery_status,
          order_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create order: ${error.message}`);
      }

      return data as unknown as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param orders - Raw orders data from API
   */
  private transformOrdersData(orders: Order[]): Order[] {
    return orders.map((order: Order) => {
      const statusConfig = this.getStatusConfig(order.delivery_status);

      return {
        id: order.id,
        order_number: `ORD-${order.id.slice(-8).toUpperCase()}`,
        order_amount: order.order_amount,
        quantity: order.quantity,
        order_date: order.order_date,
        status: order.status,
        delivery_status: order.delivery_status,
        status_color: statusConfig.color,
        tracking_number: order.tracking_number,
        amount_gbp: order.amount_gbp,
        display_currency: order.display_currency,
        display_amount: order.display_amount,
        exchange_rate_used: order.exchange_rate_used,
        funds_available_at: order.funds_available_at,
        funds_released: order.funds_released,
        buyer_confirmed: order.buyer_confirmed,
        issue_reported: order.issue_reported,
        payout_status: order.payout_status,
        listings: order.listings,
        buyer_profile: order.buyer_profile,
        buyer_details: order.buyer_details,
      };
    });
  }

  /**
   * Get status configuration for display
   * @param status - Order status
   */
  private getStatusConfig(delivery_status: string): { delivery_status: string; color: number } {
    const statusMap: Record<string, { delivery_status: string; color: number }> = {
      processing: { delivery_status: 'Processing', color: 0x007aff },
      shipped: { delivery_status: 'Shipped', color: 0x34c759 },
      delivered: { delivery_status: 'Delivered', color: 0x34c759 },
      completed: { delivery_status: 'Completed', color: 0x34c759 },
      cancelled: { delivery_status: 'Cancelled', color: 0xff4444 },
    };

    return statusMap[delivery_status] || { delivery_status: delivery_status, color: 0x999999 };
  }
}

export const ordersService = new OrdersService();
