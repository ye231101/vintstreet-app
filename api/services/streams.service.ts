import { supabase } from '../config/supabase';
import { CreateStreamData, Stream, UpdateStreamData } from '../types';

class StreamsService {
  /**
   * Get all streams for a seller
   */
  async getSellerStreams(sellerId: string): Promise<Stream[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('seller_id', sellerId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as unknown as unknown as Stream[];
    } catch (error) {
      console.error('Error fetching seller streams:', error);
      throw error;
    }
  }

  /**
   * Get a single stream by ID
   */
  async getStream(streamId: string): Promise<Stream | null> {
    try {
      const { data, error } = await supabase.from('streams').select('*').eq('id', streamId).single();

      if (error) throw error;
      return data as unknown as unknown as Stream | null;
    } catch (error) {
      console.error('Error fetching stream:', error);
      throw error;
    }
  }

  /**
   * Get all live streams
   */
  async getLiveStreams(): Promise<Stream[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'live')
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as unknown as unknown as Stream[];
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  }

  /**
   * Get upcoming streams
   */
  async getUpcomingStreams(limit?: number): Promise<Stream[]> {
    try {
      let query = supabase
        .from('streams')
        .select('*')
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as unknown as Stream[];
    } catch (error) {
      console.error('Error fetching upcoming streams:', error);
      throw error;
    }
  }

  /**
   * Create a new stream
   */
  async createStream(sellerId: string, streamData: CreateStreamData): Promise<Stream> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .insert({
          seller_id: sellerId,
          ...streamData,
          status: 'scheduled',
          viewer_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as unknown as Stream;
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  }

  /**
   * Update a stream
   */
  async updateStream(streamId: string, updates: UpdateStreamData): Promise<Stream> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streamId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as unknown as Stream;
    } catch (error) {
      console.error('Error updating stream:', error);
      throw error;
    }
  }

  /**
   * Start a stream (change status to live)
   */
  async startStream(streamId: string): Promise<Stream> {
    try {
      return await this.updateStream(streamId, {
        status: 'live',
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  /**
   * End a stream
   */
  async endStream(streamId: string): Promise<Stream> {
    try {
      return await this.updateStream(streamId, {
        status: 'ended',
        end_time: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error ending stream:', error);
      throw error;
    }
  }

  /**
   * Cancel a stream
   */
  async cancelStream(streamId: string): Promise<Stream> {
    try {
      return await this.updateStream(streamId, {
        status: 'cancelled',
      });
    } catch (error) {
      console.error('Error cancelling stream:', error);
      throw error;
    }
  }

  /**
   * Delete a stream
   */
  async deleteStream(streamId: string): Promise<void> {
    try {
      const { error } = await supabase.from('streams').delete().eq('id', streamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting stream:', error);
      throw error;
    }
  }

  /**
   * Increment viewer count
   */
  async incrementViewerCount(streamId: string): Promise<void> {
    try {
      const { data: stream, error: fetchError } = await supabase
        .from('streams')
        .select('viewer_count')
        .eq('id', streamId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('streams')
        .update({
          viewer_count: (((stream as unknown as Stream)?.viewer_count as number) || 0) + 1,
        })
        .eq('id', streamId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error incrementing viewer count:', error);
      throw error;
    }
  }

  /**
   * Decrement viewer count
   */
  async decrementViewerCount(streamId: string): Promise<void> {
    try {
      const { data: stream, error: fetchError } = await supabase
        .from('streams')
        .select('viewer_count')
        .eq('id', streamId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('streams')
        .update({
          viewer_count: Math.max((((stream as unknown as Stream)?.viewer_count as number) || 0) - 1, 0),
        })
        .eq('id', streamId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error decrementing viewer count:', error);
      throw error;
    }
  }

  /**
   * Get streams by category
   */
  async getStreamsByCategory(category: string): Promise<Stream[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('category', category)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as unknown as unknown as Stream[];
    } catch (error) {
      console.error('Error fetching streams by category:', error);
      throw error;
    }
  }
}

export const streamsService = new StreamsService();
