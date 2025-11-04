export interface DashboardReports {
  summary: {
    totalSales: number;
    formattedTotalSales: string;
    totalOrders: number;
    pageviews: number;
    sellerBalance: number;
    formattedSellerBalance: string;
    processingOrders: number;
    completedOrders: number;
    onHoldOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    refundedOrders: number;
  };
}

export interface SellerSettings {
  storeName: string;
  fullName: string;
  displayName: string;
  displayNameFormat: 'shop_name' | 'personal_name';
  rating: {
    rating: number;
    count: number;
  };
}

export interface SellerProfile {
  id?: string;
  user_id: string;
  business_name?: string;
  shop_name?: string;
  shop_tagline?: string;
  shop_description?: string;
  display_name_format?: 'shop_name' | 'personal_name';
  contact_email?: string;
  contact_phone?: string;
  return_address_line1?: string;
  return_address_line2?: string;
  return_city?: string;
  return_state?: string;
  return_postal_code?: string;
  return_country?: string;
  shipping_policy?: string;
  return_policy?: string;
  tax_id?: string;
  business_license?: string;
  created_at?: string;
  updated_at?: string;
}