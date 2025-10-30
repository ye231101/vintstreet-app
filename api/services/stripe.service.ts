import { Linking } from 'react-native';
import { supabase } from '../config/supabase';

class StripeService {
  /**
   * Get Stripe Connect account record for seller
   */
  async getConnectedAccount(sellerId: string) {
    const { data, error } = await supabase
      .from('stripe_connected_accounts')
      .select('*')
      .eq('seller_id', sellerId)
      .maybeSingle();
    // If no rows, return null instead of throwing to avoid PGRST116
    if (error) {
      // Gracefully handle the common "no rows" error
      if ((error as any)?.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return (data as any) ?? null;
  }

  /**
   * Create a Stripe Connect onboarding link (Edge Function)
   */
  async createConnectAccount() {
    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: { platform: 'mobile' },
    });
    if (error) throw error;
    return data as { url?: string };
  }

  /**
   * Get seller balance via Edge Function
   */
  async getSellerBalance() {
    const { data, error } = await supabase.functions.invoke('get-seller-balance');
    if (error) throw error;
    return data as any;
  }

  /**
   * Create payout via Edge Function
   */
  async createPayout(params: { amount: number; currency: string }) {
    const { error } = await supabase.functions.invoke('create-payout', { body: params });
    if (error) throw error;
    return { success: true } as const;
  }

  /**
   * List Stripe transactions for seller
   */
  async getTransactions(sellerId: string) {
    const { data, error } = await supabase
      .from('stripe_transactions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as any[];
  }

  /**
   * List Stripe payouts for seller
   */
  async getPayouts(sellerId: string) {
    const { data, error } = await supabase
      .from('stripe_payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('requested_at', { ascending: false });
    if (error) throw error;
    return (data || []) as any[];
  }
  /**
   * Create Stripe checkout session using Supabase Edge Function
   * @param orderData - Order data including orders and shipping cost
   */
  async createCheckoutSession(orderData: {
    orders: Array<{
      id: string;
      seller_id: string;
      product_name: string;
      seller_name: string;
      price: number;
      quantity: number;
    }>;
    shippingCost: number;
  }) {
    try {
      console.log('[STRIPE] Creating checkout session for orders:', orderData.orders.length);

      // Validate order data
      if (!orderData.orders || orderData.orders.length === 0) {
        throw new Error('No orders provided');
      }

      // Validate each order has required fields
      for (const order of orderData.orders) {
        if (!order.id || !order.seller_id || !order.product_name || !order.seller_name) {
          console.error('[STRIPE] Invalid order data:', order);
          throw new Error('Invalid order data: missing required fields');
        }
        if (order.price <= 0 || order.quantity <= 0) {
          console.error('[STRIPE] Invalid order pricing:', order);
          throw new Error('Invalid order data: price and quantity must be positive');
        }
      }

      console.log('[STRIPE] Order data validated successfully');
      console.log('[STRIPE] Sending data to edge function:', JSON.stringify(orderData, null, 2));

      // Check authentication status
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[STRIPE] Authentication error:', authError);
        throw new Error('User not authenticated');
      }
      console.log('[STRIPE] User authenticated:', user.id);

      const { data, error } = await supabase.functions.invoke('create-checkout-split', {
        body: {
          platform: 'mobile',
          orders: orderData.orders,
          shippingCost: orderData.shippingCost,
        },
      });

      console.log('[STRIPE] Edge function response:', { data, error });

      if (error) {
        console.error('[STRIPE] Edge function error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          context: error.context,
        });

        // Try to get more specific error information
        if (error.message.includes('non-2xx status code')) {
          throw new Error(
            `Edge function failed with status error. Check server logs for details. Original error: ${error.message}`
          );
        }

        throw new Error(`Failed to create checkout session: ${error.message}`);
      }

      if (!data?.url) {
        console.error('[STRIPE] No URL in response data:', data);
        throw new Error('No checkout URL returned from server');
      }

      console.log('[STRIPE] Checkout session created successfully');
      return data;
    } catch (error) {
      console.error('[STRIPE] Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Open Stripe checkout in browser
   * @param checkoutUrl - The Stripe checkout URL
   */
  async openCheckout(checkoutUrl: string) {
    try {
      const supported = await Linking.canOpenURL(checkoutUrl);

      if (!supported) {
        throw new Error('Cannot open checkout URL');
      }

      await Linking.openURL(checkoutUrl);
      return { success: true };
    } catch (error) {
      console.error('[STRIPE] Error opening checkout:', error);
      throw error;
    }
  }

  /**
   * Complete the checkout process with Stripe
   * @param orderData - Order data
   */
  async processPayment(orderData: {
    orders: Array<{
      id: string;
      seller_id: string;
      product_name: string;
      seller_name: string;
      price: number;
      quantity: number;
    }>;
    shippingCost: number;
  }) {
    try {
      // Create checkout session
      const checkoutData = await this.createCheckoutSession(orderData);

      // Open checkout in browser
      await this.openCheckout(checkoutData.url);

      return { success: true, checkoutUrl: checkoutData.url };
    } catch (error) {
      console.error('[STRIPE] Error processing payment:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
