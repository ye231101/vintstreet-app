import { supabase } from '../config/supabase';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderTotals {
  total: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: string;
  displayStatus: string;
  statusColor: number;
  items: OrderItem[];
  totals: OrderTotals;
}

export interface ApiOrder {
  id: string;
  order_amount: number;
  status: string;
  order_date: string;
  quantity: number;
}

class OrdersService {
  /**
   * Get orders for the current user (buyer or seller)
   * @param userId - The user ID to fetch orders for
   * @param userType - 'buyer' or 'seller' to determine which orders to fetch
   */
  async getOrders(userId: string, userType: 'buyer' | 'seller' = 'buyer'): Promise<Order[]> {
    console.log('getOrders', userId, userType);
    try {
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      // Apply RLS policy based on user type
      if (userType === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else {
        query = query.eq('seller_id', userId);
      }

      const { data, error } = await query;

      console.log('data', data);
      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      // Transform API data to match the UI interface
      return this.transformOrdersData((data as unknown as ApiOrder[]) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Get orders by status
   * @param userId - The user ID
   * @param status - Order status to filter by
   * @param userType - 'buyer' or 'seller'
   */
  async getOrdersByStatus(
    userId: string, 
    status: string, 
    userType: 'buyer' | 'seller' = 'buyer'
  ): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('status', status)
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

      return this.transformOrdersData((data as unknown as ApiOrder[]) || []);
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  }

  /**
   * Update order status
   * @param orderId - The order ID to update
   * @param status - New status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        throw new Error(`Failed to update order status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param apiOrders - Raw orders data from API
   */
  private transformOrdersData(apiOrders: ApiOrder[]): Order[] {
    return apiOrders.map((apiOrder) => {
      const statusConfig = this.getStatusConfig(apiOrder.status);
      
      return {
        id: apiOrder.id,
        createdAt: apiOrder.order_date,
        status: apiOrder.status,
        displayStatus: statusConfig.displayStatus,
        statusColor: statusConfig.color,
        items: [
          {
            id: apiOrder.id,
            name: `Order #${apiOrder.id.slice(-6)}`, // Fallback name
            price: apiOrder.order_amount,
            quantity: apiOrder.quantity,
            imageUrl: undefined, // This would need to be fetched from product data
          }
        ],
        totals: {
          total: apiOrder.order_amount
        }
      };
    });
  }

  /**
   * Get status configuration for display
   * @param status - Order status
   */
  private getStatusConfig(status: string): { displayStatus: string; color: number } {
    const statusMap: Record<string, { displayStatus: string; color: number }> = {
      'pending': { displayStatus: 'Pending', color: 0xffcc00 },
      'processing': { displayStatus: 'Processing', color: 0x007aff },
      'shipped': { displayStatus: 'Shipped', color: 0x34c759 },
      'delivered': { displayStatus: 'Delivered', color: 0x34c759 },
      'completed': { displayStatus: 'Completed', color: 0x34c759 },
      'cancelled': { displayStatus: 'Cancelled', color: 0xff4444 },
    };

    return statusMap[status] || { displayStatus: status, color: 0x999999 };
  }
}

export const ordersService = new OrdersService();
