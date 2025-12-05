// Algolia Product Type
export interface AlgoliaProduct {
  objectID: string;
  product_name: string;
  product_description?: string;
  product_image?: string;
  slug?: string;
  brand_id?: string;
  brand_name?: string;
  category_id?: string;
  category_name?: string;
  price?: number;
  status?: string;
  [key: string]: unknown;
}

// Algolia Category Type
export interface AlgoliaCategory {
  objectID: string;
  name: string;
  description?: string;
  slug: string;
  category_path?: string[];
  category_path_names?: string[];
  is_active?: boolean;
  [key: string]: unknown;
}

// Algolia Brand Type
export interface AlgoliaBrand {
  objectID: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

// Algolia Query Suggestion Type
export interface AlgoliaQuerySuggestion {
  objectID: string;
  query: string;
  [key: string]: unknown;
}

// Algolia Search Result Types
export interface AlgoliaSearchResult<T> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  query: string;
  params: string;
}
