export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  is_popular?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrandFilters {
  is_active?: boolean;
  is_popular?: boolean;
  search?: string;
}
