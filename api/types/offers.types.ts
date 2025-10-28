export interface Offer {
  id: string;
  listing_id?: string;
  buyer_id?: string;
  seller_id?: string;
  offer_amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  status_color: number;
  created_at?: string;
  expires_at?: string;
  listings?: {
    id: string;
    product_name: string;
    seller_id: string;
    product_image?: string;
    starting_price?: number;
    discounted_price?: number;
  };
  buyer_profile?: {
    user_id: string;
    full_name?: string;
    username?: string;
  };
  seller_profile?: {
    user_id: string;
    full_name?: string;
    username?: string;
  };
}
