import { supabase } from '../config/supabase';
import { SavedAddress } from '../types';

export type UpsertSavedAddress = Omit<SavedAddress, 'id' | 'created_at' | 'updated_at'>;

class SavedAddressesService {
  async list(userId: string): Promise<SavedAddress[]> {
    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as unknown as SavedAddress[]) || [];
  }

  async getById(id: string, userId?: string): Promise<SavedAddress | null> {
    let query = supabase.from('saved_addresses').select('*').eq('id', id).single();
    if (userId) {
      query = supabase.from('saved_addresses').select('*').eq('id', id).eq('user_id', userId).single();
    }
    const { data, error } = await query;
    if (error) return null;
    return data as unknown as SavedAddress;
  }

  async create(address: UpsertSavedAddress): Promise<void> {
    const { error } = await supabase.from('saved_addresses').insert(address);
    if (error) throw new Error(error.message);
  }

  async update(id: string, userId: string, address: Partial<UpsertSavedAddress>): Promise<void> {
    const { error } = await supabase.from('saved_addresses').update(address).eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('saved_addresses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async unsetDefaultForUser(userId: string, excludeId?: string): Promise<void> {
    let query = supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', userId);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { error } = await query;
    if (error) throw new Error(error.message);
  }
}

export const savedAddressesService = new SavedAddressesService();
