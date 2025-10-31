export interface Order {
  id: string;
  order_number?: string;
  listing_id?: string;
  buyer_id?: string;
  seller_id?: string;
  stream_id?: string;
  order_amount?: number;
  quantity?: number;
  status: 'pending' | 'shipped' | 'completed';
  delivery_status: 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  status_color?: number;
  order_date: string;
  tracking_number?: string;
  amount_gbp?: string;
  display_currency?: string;
  display_amount?: number;
  exchange_rate_used?: number;
  funds_available_at?: string;
  funds_released?: boolean;
  buyer_confirmed?: boolean;
  issue_reported?: boolean;
  payout_status?: 'available' | 'clearing' | 'on_hold';
  listings?: {
    id: string;
    product_name: string;
    product_image?: string;
    starting_price?: number;
    discounted_price?: number;
  };
  buyer_profile?: {
    user_id: string;
    full_name?: string;
    username?: string;
  };
  buyer_details?: {
    user_id: string;
    shipping_address_line1?: string;
    shipping_address_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal_code?: string;
    shipping_country?: string;
    shipping_phone?: string;
    billing_phone?: string;
  };
}
