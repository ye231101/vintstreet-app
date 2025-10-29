export interface ShippingAddress {
  return_city: string;
  return_postal_code: string;
  return_country: string;
}

export interface ShippingProvider {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

export interface ShippingOption {
  id: string;
  seller_id: string;
  provider_id: string;
  name: string;
  description: string;
  price: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
}

export interface SellerShippingOptions {
  provider_id: string;
  estimated_days_min: number;
  estimated_days_max: number;
}
