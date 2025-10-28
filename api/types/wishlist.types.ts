import { Product } from './listings.types';

export interface WishlistItem {
  id: string;
  listing_id: string;
  user_id: string;
  created_at: string;
  listings: Product;
}
