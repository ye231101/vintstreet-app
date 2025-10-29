import { supabase } from '../config/supabase';
import { SellerShippingOptions, ShippingAddress, ShippingOption, ShippingProvider } from '../types';

class ShippingService {
  /**
   * Get all active shipping providers
   */
  async getShippingProviders(): Promise<ShippingProvider[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_providers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return (data as unknown as ShippingProvider[]) || [];
    } catch (error) {
      console.error('Error fetching shipping providers:', error);
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
      console.error('Error fetching seller shipping address:', error);
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
      console.error('Error updating shipping address:', error);
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
      console.error('Error fetching seller shipping options:', error);
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
      console.error('Error saving shipping settings:', error);
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
        .select(
          `
          *,
          shipping_providers (
            name,
            description
          )
        `
        )
        .eq('seller_id', sellerId)
        .eq('is_active', true);

      if (error) throw error;
      return (data as unknown as ShippingOption[]) || [];
    } catch (error) {
      console.error('Error fetching seller shipping options for buyer:', error);
      throw new Error('Failed to fetch shipping options');
    }
  }
}

export const shippingService = new ShippingService();
