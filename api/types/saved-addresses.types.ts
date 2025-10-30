export interface SavedAddress {
  id: string;
  user_id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}