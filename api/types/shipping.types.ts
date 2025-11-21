export interface ShippingAddress {
  return_city: string;
  return_postal_code: string;
  return_country: string;
}

export interface ShippingBand {
  id: string;
  name: string;
  min_weight: number;
  max_weight: number;
  display_order: number | null;
  is_active: boolean | null;
}

export interface ShippingProvider {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

export interface ShippingProviderPrice {
  id: string;
  provider_id: string;
  band_id: string;
  price: number;
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
  shipping_providers?: {
    name: string;
    description: string | null;
    display_order: number | null;
  } | null;
}

export interface SellerShippingOptions {
  provider_id: string;
  estimated_days_min: number;
  estimated_days_max: number;
}
