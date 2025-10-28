import { supabase } from '../config/supabase';
import { AddressData, BuyerProfile } from '../types';

class BuyerService {
  /**
   * Get buyer profile by user ID
   * @param userId - The user ID
   */
  async getBuyerProfile(userId: string): Promise<BuyerProfile | null> {
    try {
      const { data, error } = await supabase.from('buyer_profiles').select('*').eq('user_id', userId).single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as unknown as BuyerProfile | null;
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
      throw new Error('Failed to fetch buyer profile');
    }
  }

  /**
   * Create or update buyer profile
   * @param userId - The user ID
   * @param profileData - The profile data to save
   */
  async saveBuyerProfile(userId: string, profileData: Partial<BuyerProfile>): Promise<BuyerProfile> {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('buyer_profiles')
          .update(profileData)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;
        return data as unknown as BuyerProfile;
      } else {
        // Create new profile
        const { data, error: insertError } = await supabase
          .from('buyer_profiles')
          .insert({
            user_id: userId,
            ...profileData,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return data as unknown as BuyerProfile;
      }
    } catch (error) {
      console.error('Error saving buyer profile:', error);
      throw new Error('Failed to save buyer profile');
    }
  }

  /**
   * Save shipping address
   * @param userId - The user ID
   * @param addressData - The address data
   */
  async saveShippingAddress(userId: string, addressData: AddressData): Promise<void> {
    try {
      const profileData: Partial<BuyerProfile> = {
        shipping_first_name: addressData.firstName,
        shipping_last_name: addressData.lastName,
        shipping_address_line1: addressData.addressLine1,
        shipping_address_line2: addressData.addressLine2 || undefined,
        shipping_city: addressData.city,
        shipping_state: addressData.state || undefined,
        shipping_postal_code: addressData.postalCode,
        shipping_country: addressData.country,
        shipping_phone: addressData.phone || undefined,
      };

      await this.saveBuyerProfile(userId, profileData);
    } catch (error) {
      console.error('Error saving shipping address:', error);
      throw new Error('Failed to save shipping address');
    }
  }

  /**
   * Save billing address
   * @param userId - The user ID
   * @param addressData - The address data
   */
  async saveBillingAddress(userId: string, addressData: AddressData): Promise<void> {
    try {
      const profileData: Partial<BuyerProfile> = {
        billing_first_name: addressData.firstName,
        billing_last_name: addressData.lastName,
        billing_address_line1: addressData.addressLine1,
        billing_address_line2: addressData.addressLine2 || undefined,
        billing_city: addressData.city,
        billing_state: addressData.state || undefined,
        billing_postal_code: addressData.postalCode,
        billing_country: addressData.country,
        billing_phone: addressData.phone || undefined,
      };

      await this.saveBuyerProfile(userId, profileData);
    } catch (error) {
      console.error('Error saving billing address:', error);
      throw new Error('Failed to save billing address');
    }
  }

  /**
   * Get shipping address from profile
   * @param profile - The buyer profile
   */
  getShippingAddress(profile: BuyerProfile): AddressData | null {
    if (!profile.shipping_first_name || !profile.shipping_address_line1) {
      return null;
    }

    return {
      firstName: profile.shipping_first_name,
      lastName: profile.shipping_last_name || '',
      addressLine1: profile.shipping_address_line1,
      addressLine2: profile.shipping_address_line2 || undefined,
      city: profile.shipping_city || '',
      state: profile.shipping_state || undefined,
      postalCode: profile.shipping_postal_code || '',
      country: profile.shipping_country || 'US',
      phone: profile.shipping_phone || undefined,
    };
  }

  /**
   * Get billing address from profile
   * @param profile - The buyer profile
   */
  getBillingAddress(profile: BuyerProfile): AddressData | null {
    if (!profile.billing_first_name || !profile.billing_address_line1) {
      return null;
    }

    return {
      firstName: profile.billing_first_name,
      lastName: profile.billing_last_name || '',
      addressLine1: profile.billing_address_line1,
      addressLine2: profile.billing_address_line2 || undefined,
      city: profile.billing_city || '',
      state: profile.billing_state || undefined,
      postalCode: profile.billing_postal_code || '',
      country: profile.billing_country || 'US',
      phone: profile.billing_phone || undefined,
    };
  }

  /**
   * Delete shipping address
   * @param userId - The user ID
   */
  async deleteShippingAddress(userId: string): Promise<void> {
    try {
      const profileData: Partial<BuyerProfile> = {
        shipping_first_name: undefined,
        shipping_last_name: undefined,
        shipping_address_line1: undefined,
        shipping_address_line2: undefined,
        shipping_city: undefined,
        shipping_state: undefined,
        shipping_postal_code: undefined,
        shipping_country: undefined,
        shipping_phone: undefined,
      };

      await this.saveBuyerProfile(userId, profileData);
    } catch (error) {
      console.error('Error deleting shipping address:', error);
      throw new Error('Failed to delete shipping address');
    }
  }

  /**
   * Delete billing address
   * @param userId - The user ID
   */
  async deleteBillingAddress(userId: string): Promise<void> {
    try {
      const profileData: Partial<BuyerProfile> = {
        billing_first_name: undefined,
        billing_last_name: undefined,
        billing_address_line1: undefined,
        billing_address_line2: undefined,
        billing_city: undefined,
        billing_state: undefined,
        billing_postal_code: undefined,
        billing_country: undefined,
        billing_phone: undefined,
      };

      await this.saveBuyerProfile(userId, profileData);
    } catch (error) {
      console.error('Error deleting billing address:', error);
      throw new Error('Failed to delete billing address');
    }
  }
}

export const buyerService = new BuyerService();
