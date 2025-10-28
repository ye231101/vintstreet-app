import { Product } from "./listings.types";

export interface CartItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  product?: Product;
}