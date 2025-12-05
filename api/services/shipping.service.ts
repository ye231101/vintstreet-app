import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import {
  SellerShippingOptions,
  ShippingAddress,
  ShippingBand,
  ShippingOption,
  ShippingProvider,
  ShippingProviderPrice,
} from '../types';

class ShippingService {
  /**
   * Get all active shipping providers
   */
  async getShippingProviders(): Promise<ShippingProvider[]> {
    try {
      const { data, error } = await supabase.from('shipping_providers').select('*').eq('is_active', true);

      if (error) throw error;
      return (data as unknown as ShippingProvider[]) || [];
    } catch (error) {
      logger.error('Error fetching shipping providers', error);
      throw new Error('Failed to fetch shipping providers');
    }
  }

  /**
   * Get seller's shipping address
   */
  async getSellerShippingAddress(userId: string): Promise<ShippingAddress | null> {
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('return_city, return_postal_code, return_country')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as ShippingAddress | null;
    } catch (error) {
      logger.error('Error fetching seller shipping address:', error);
      throw new Error('Failed to fetch shipping address');
    }
  }

  /**
   * Update seller's shipping address
   */
  async updateSellerShippingAddress(userId: string, address: ShippingAddress): Promise<void> {
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          return_city: address.return_city.trim(),
          return_postal_code: address.return_postal_code.trim(),
          return_country: address.return_country,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating shipping address:', error);
      throw new Error('Failed to update shipping address');
    }
  }

  /**
   * Get seller's existing shipping options
   */
  async getSellerShippingOptions(userId: string): Promise<SellerShippingOptions[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_options')
        .select('provider_id, estimated_days_min, estimated_days_max')
        .eq('seller_id', userId);

      if (error) throw error;
      return (data as unknown as SellerShippingOptions[]) || [];
    } catch (error) {
      logger.error('Error fetching seller shipping options:', error);
      throw new Error('Failed to fetch shipping options');
    }
  }

  /**
   * Save seller's shipping settings
   */
  async saveSellerShippingSettings(
    userId: string,
    providerIds: string[],
    providers: ShippingProvider[],
    timeframe: { min: number; max: number }
  ): Promise<void> {
    try {
      // First, delete all existing shipping options for this seller
      const { error: deleteError } = await supabase.from('shipping_options').delete().eq('seller_id', userId);

      if (deleteError) throw deleteError;

      // Then insert new options for each selected provider
      const optionsToInsert = providerIds.map((providerId) => {
        const provider = providers.find((p) => p.id === providerId);
        return {
          seller_id: userId,
          provider_id: providerId,
          name: provider?.name || '',
          price: 0, // Price is set by admin in provider, but schema requires it
          estimated_days_min: timeframe.min,
          estimated_days_max: timeframe.max,
          is_active: true,
        };
      });

      const { error: insertError } = await supabase.from('shipping_options').insert(optionsToInsert);

      if (insertError) throw insertError;
    } catch (error) {
      logger.error('Error saving shipping settings:', error);
      throw new Error('Failed to save shipping settings');
    }
  }

  /**
   * Get shipping options for a specific seller (for buyers)
   */
  async getSellerShippingOptionsForBuyer(sellerId: string): Promise<ShippingOption[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_options')
        .select('*, shipping_providers(name, description, display_order)')
        .eq('seller_id', sellerId)
        .eq('is_active', true);

      if (error) throw error;
      return (data as unknown as ShippingOption[]) || [];
    } catch (error) {
      logger.error('Error fetching seller shipping options for buyer:', error);
      throw new Error('Failed to fetch shipping options');
    }
  }

  /**
   * Get all active shipping bands
   */
  async getShippingBands(): Promise<ShippingBand[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_bands')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return (data as unknown as ShippingBand[]) || [];
    } catch (error) {
      logger.error('Error fetching shipping bands:', error);
      throw new Error('Failed to fetch shipping bands');
    }
  }

  /**
   * Get all shipping provider prices
   */
  async getShippingProviderPrices(): Promise<ShippingProviderPrice[]> {
    try {
      const { data, error } = await supabase.from('shipping_provider_prices').select('*');

      if (error) throw error;
      return (data as unknown as ShippingProviderPrice[]) || [];
    } catch (error) {
      logger.error('Error fetching shipping provider prices:', error);
      throw new Error('Failed to fetch shipping provider prices');
    }
  }

  /**
   * Generate shipping label for an order
   * @param orderId - The order ID
   * @param shippingAddress - The shipping address data
   * @param shippingOptionId - The selected shipping option ID
   */
  async generateShippingLabel(
    orderId: string,
    shippingAddress: {
      first_name: string;
      last_name: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country: string;
      phone?: string;
      email?: string;
    },
    shippingOptionId: string
  ): Promise<{ success: boolean; labelId?: string; trackingNumber?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-shipping-label', {
        body: {
          orderId: orderId,
          shippingAddress: shippingAddress,
          shippingOptionId: shippingOptionId,
        },
      });

      if (error) {
        logger.error('Error generating shipping label:', error);
        return { success: false, error: error.message };
      }

      return { success: true, ...data };
    } catch (error) {
      logger.error('Error generating shipping label:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate shipping label',
      };
    }
  }
}

export const shippingService = new ShippingService();
