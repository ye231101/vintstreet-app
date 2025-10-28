export interface BuyerProfile {
  id?: string;
  user_id: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  shipping_phone?: string;
  billing_first_name?: string;
  billing_last_name?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  billing_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddressData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}
