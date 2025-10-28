export interface Stream {
  id: string;
  title: string;
  description: string;
  seller_id: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  viewer_count?: number;
  start_time: string;
  end_time?: string;
  category: string;
  thumbnail?: string;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStreamData {
  title: string;
  description: string;
  start_time: string;
  category: string;
  thumbnail?: string;
}

export interface UpdateStreamData {
  title?: string;
  description?: string;
  start_time?: string;
  category?: string;
  thumbnail?: string;
  status?: Stream['status'];
  end_time?: string;
}
