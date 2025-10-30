import { Linking } from 'react-native';
import { supabase } from '../config/supabase';

class StripeService {
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[STRIPE] Authentication error:', authError);
        throw new Error('User not authenticated');
      }
      console.log('[STRIPE] User authenticated:', user.id);

      const { data, error } = await supabase.functions.invoke('create-checkout-split', {
        body: {
          platform: "mobile",
          orders: orderData.orders,
          shippingCost: orderData.shippingCost
        }
      });

      console.log('[STRIPE] Edge function response:', { data, error });

      if (error) {
        console.error('[STRIPE] Edge function error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          context: error.context
        });
        
        // Try to get more specific error information
        if (error.message.includes('non-2xx status code')) {
          throw new Error(`Edge function failed with status error. Check server logs for details. Original error: ${error.message}`);
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
   * Test the Edge Function with minimal data
   */
  async testEdgeFunction() {
    try {
      console.log('[STRIPE] Testing Edge Function with minimal data');
      
      const testData = {
        orders: [{
          id: 'test-order-123',
          seller_id: 'test-seller-123',
          product_name: 'Test Product',
          seller_name: 'Test Seller',
          price: 10.00,
          quantity: 1
        }],
        shippingCost: 5.00
      };

      const { data, error } = await supabase.functions.invoke('create-checkout-split', {
        body: testData
      });

      console.log('[STRIPE] Test response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('[STRIPE] Test error:', error);
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
