export interface Product {
  id: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  product_image: string | null;
  product_images: string[];
  product_description: string | null;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  brand_id: string | null;
  stock_quantity: number | null;
  status: 'draft' | 'published' | 'private';
  created_at: string;
  product_categories: {
    id: string;
    name: string;
  } | null;
  product_subcategories?: {
    id: string;
    name: string;
  } | null;
  product_sub_subcategories?: {
    id: string;
    name: string;
  } | null;
  product_sub_sub_subcategories?: {
    id: string;
    name: string;
  } | null;
  brands?: {
    id: string;
    name: string;
  } | null;
  seller_info_view: {
    shop_name: string;
    display_name_format?: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export interface InfiniteQueryResult {
  products: Product[];
  nextPage: number | undefined;
  total?: number;
}

export interface ListingsFilters {
  searchKeyword?: string;
  activeCategory?: string;
  activeSubcategory?: string;
  activeSubSubcategory?: string;
  activeSubSubSubcategory?: string;
  selectedBrands?: Set<string>;
  selectedColors?: Set<string>;
}
