/**
 * Typesense Service
 * Service for interacting with Typesense search engine
 * Based on Flutter implementation
 *
 * Note: Uses direct HTTP calls instead of typesense npm package
 * due to React Native compatibility issues
 */

import { typesenseConfig } from '../config/typesense.config';
import {
  SearchParams,
  TypesenseProductDocument,
  TypesenseSearchResponse,
  VintStreetListing,
} from '../types/product.types';

class TypesenseService {
  private baseUrl!: string;
  private apiKey!: string;
  private collectionName!: string;
  private attributeMappings: Map<string, any> | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const { host, port, protocol, apiKey, collectionName } = typesenseConfig;

      // Construct base URL
      this.baseUrl = `${protocol}://${host}:${port}`;
      this.apiKey = apiKey;
      this.collectionName = collectionName;

      console.log(`Typesense client initialized with host: ${host}`);
    } catch (error) {
      console.error('Error initializing Typesense client:', error);
      throw error;
    }
  }

  /**
   * Make a request to Typesense API
   */
  private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
    try {
      // Build query string
      const queryString = params
        ? '?' +
          Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&')
        : '';

      const url = `${this.baseUrl}${endpoint}${queryString}`;

      console.log('Typesense request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-TYPESENSE-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Typesense API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Typesense request error:', error);
      throw error;
    }
  }

  /**
   * Normalize attribute value to string array
   */
  private normalizeAttribute(value: any): string[] {
    if (Array.isArray(value)) {
      return value.map((v) => String(v));
    } else if (value != null) {
      return [String(value)];
    }
    return [];
  }

  /**
   * Convert Typesense document to VintStreetListing
   */
  convertToVintStreetListing(document: TypesenseProductDocument): VintStreetListing {
    // Extract image URLs
    const fullImageUrls: string[] = [];
    const thumbnailImageUrls: string[] = [];

    if (document.image_urls) {
      if (Array.isArray(document.image_urls)) {
        fullImageUrls.push(...document.image_urls);
      } else if (typeof document.image_urls === 'string') {
        fullImageUrls.push(document.image_urls);
      }
    }

    if (document.image_urls_thumbnail) {
      if (Array.isArray(document.image_urls_thumbnail)) {
        thumbnailImageUrls.push(...document.image_urls_thumbnail);
      } else if (typeof document.image_urls_thumbnail === 'string') {
        thumbnailImageUrls.push(document.image_urls_thumbnail);
      }
    }

    // Safely extract brand - handle both array and string cases
    let brandName = '';
    if (document.brand) {
      if (Array.isArray(document.brand)) {
        const brandList = document.brand;
        if (brandList.length > 0) {
          brandName = brandList[0].toString();
        }
      } else if (typeof document.brand === 'string') {
        brandName = document.brand;
      }
    }

    return {
      id: parseInt(document.id?.toString() || '0', 10) || 0,
      name: document.name || '',
      price: parseFloat(document.price?.toString() || '0') || 0.0,
      stockQuantity: parseInt(document.stock_quantity?.toString() || '0', 10) || 0,
      permalink: document.permalink,
      onSale: document.onSale || false,
      featured: document.featured || false,
      brand: brandName,
      attributes: {
        pa_size: this.normalizeAttribute(document.pa_size),
        pa_colour: this.normalizeAttribute(document.pa_colour),
        pa_condition: this.normalizeAttribute(document.pa_condition),
        pa_gender: this.normalizeAttribute(document.pa_gender),
        flaws: this.normalizeAttribute(document.flaws),
        pa_collar_to_hem_cm: this.normalizeAttribute(document.collar_to_hem_cm),
      },
      fullImageUrls,
      thumbnailImageUrls,
      description: document.description,
      favoritesCount: document.favorites_count || 0,
      averageRating: document.average_rating || 0.0,
      reviewCount: document.review_count || 0,
      sku: document.sku,
      shortDescription: document.short_description,
      stockStatus: document.stock_status || 'instock',
      categories: Array.isArray(document.categories) ? document.categories.map((item) => item.toString()) : [],
      categorySlugs: Array.isArray(document.category_slugs)
        ? document.category_slugs.map((item) => item.toString())
        : [],
      vendorId: parseInt(document.vendor_id?.toString() || '0', 10) || 0,
      vendorName: document.vendor_name?.toString() || '',
      vendorShopName: document.vendor_shop_name?.toString() || '',
      vendorShopUrl: document.vendor_shop_url?.toString() || '',
      createdAt: new Date((document.created_at || 0) * 1000),
      updatedAt: new Date((document.updated_at || 0) * 1000),
    };
  }

  /**
   * Perform search operation
   */
  async search(params: SearchParams): Promise<TypesenseSearchResponse> {
    try {
      const {
        query,
        queryBy = 'name,description,short_description,brand,categories,category_slugs',
        filterBy,
        sortBy,
        perPage = 20,
        page = 1,
        facetBy,
        facetSize,
      } = params;

      // Create base filter conditions
      const defaultFilterConditions = 'post_status:="publish" && catalog_visibility:!="hidden"';

      // Combine default filters with user-provided filters
      let combinedFilter: string;
      if (filterBy && filterBy.trim().length > 0) {
        combinedFilter = `(${defaultFilterConditions}) && (${filterBy})`;
      } else {
        combinedFilter = defaultFilterConditions;
      }

      console.log('TypesenseService - Building search with filter:', combinedFilter);

      const searchParameters: any = {
        q: query,
        query_by: queryBy,
        filter_by: combinedFilter,
        per_page: perPage,
        page: page,
      };

      if (sortBy) {
        searchParameters.sort_by = sortBy;
        console.log('TypesenseService - Using sort:', sortBy);
      }

      if (facetBy && facetBy.length > 0) {
        searchParameters.facet_by = facetBy.join(',');
      }

      if (facetSize) {
        searchParameters.max_facet_values = facetSize;
      }

      console.log('TypesenseService - Search parameters:', searchParameters);

      const endpoint = `/collections/${this.collectionName}/documents/search`;
      const response = await this.makeRequest(endpoint, searchParameters);

      console.log(`TypesenseService - Found ${response.found || 0} results`);

      // Process facets if present
      const facets =
        response.facet_counts?.map((facet: any) => ({
          field: facet.field_name,
          counts: facet.counts,
        })) || [];

      return {
        hits: response.hits || [],
        found: response.found || 0,
        page: response.page || 1,
        per_page: response.per_page || perPage,
        facets,
      };
    } catch (error) {
      console.error('Error performing Typesense search:', error);
      throw error;
    }
  }

  /**
   * System search method that bypasses analytics tracking
   * Used for internal operations like popular products carousel
   */
  private async systemSearch(params: SearchParams): Promise<TypesenseSearchResponse> {
    try {
      const { query, queryBy = 'name,description,brand,categories', filterBy, sortBy, perPage = 20, page = 1 } = params;

      // Create base filter conditions
      const defaultFilterConditions = 'post_status:="publish" && catalog_visibility:!="hidden"';

      // Combine default filters with provided filters
      let combinedFilter: string;
      if (filterBy && filterBy.trim().length > 0) {
        combinedFilter = `(${defaultFilterConditions}) && (${filterBy})`;
      } else {
        combinedFilter = defaultFilterConditions;
      }

      const searchParameters: any = {
        q: query,
        query_by: queryBy,
        filter_by: combinedFilter,
        per_page: perPage,
        page: page,
      };

      if (sortBy) {
        searchParameters.sort_by = sortBy;
      }

      console.log('System search with parameters:', searchParameters);

      const endpoint = `/collections/${this.collectionName}/documents/search`;
      const response = await this.makeRequest(endpoint, searchParameters);

      return {
        hits: response.hits || [],
        found: response.found || 0,
        page: response.page || 1,
        per_page: response.per_page || perPage,
      };
    } catch (error) {
      console.error('Error performing system search:', error);
      throw error;
    }
  }

  /**
   * Get trending products using different criteria than recent products
   * Matches Flutter implementation
   */
  private async getTrendingProducts(limit: number = 30): Promise<TypesenseSearchResponse> {
    console.log('Getting trending products using system search');
    return this.systemSearch({
      query: '*',
      queryBy: 'name,description,brand,categories',
      perPage: limit,
      filterBy: 'stock_status:="instock"',
      sortBy: 'created_at:desc', // Sort by most recent since favorites_count doesn't exist
    });
  }

  /**
   * Get popular products based on search queries
   * Matches Flutter implementation
   */
  async getPopularProducts(limit: number = 30): Promise<TypesenseSearchResponse> {
    try {
      console.log('Fetching popular search queries...');

      // First try to get popular queries with a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Popular queries fetch timed out')), 3000);
      });

      const searchPromise = this.makeRequest(`/collections/product_queries/documents/search`, {
        q: '*',
        query_by: 'q',
        sort_by: 'count:desc',
        per_page: (limit * 3).toString(),
      });

      const popularQueries = (await Promise.race([searchPromise, timeoutPromise])) as any;

      console.log(`Received ${popularQueries.hits?.length || 0} popular queries`);

      // Extract popular query strings (not individual terms)
      const popularQueryStrings: string[] = [];
      for (const hit of popularQueries.hits || []) {
        try {
          const query = hit.document.q as string;
          if (query && query.length > 2) {
            popularQueryStrings.push(query);
          }
        } catch (e) {
          console.warn('Error processing query hit:', e);
          continue;
        }
        if (popularQueryStrings.length >= limit) break;
      }

      console.log(`Extracted ${popularQueryStrings.length} popular queries: ${popularQueryStrings.join(', ')}`);

      if (popularQueryStrings.length === 0) {
        return await this.getTrendingProducts(limit);
      }

      // Search for products using popular queries with OR logic
      const uniqueProductIds = new Set<number>();
      const allHits: any[] = [];

      // Search with the most popular queries first using system search (no analytics)
      for (let i = 0; i < popularQueryStrings.length && allHits.length < limit; i++) {
        try {
          const query = popularQueryStrings[i];

          const timeoutPromise2 = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Individual query search timed out')), 2000);
          });

          const searchPromise2 = this.systemSearch({
            query: query,
            queryBy: 'name,description,brand,categories',
            perPage: 10, // Get fewer per query to ensure diversity
            filterBy: 'stock_status:="instock"',
            sortBy: '_text_match:desc',
          });

          const response = (await Promise.race([searchPromise2, timeoutPromise2])) as TypesenseSearchResponse;

          const hits = response.hits || [];
          console.log(`Query "${query}" returned ${hits.length} products`);

          // Add unique products
          for (const hit of hits) {
            const productId = parseInt(hit.document.id || '0', 10);
            if (allHits.length < limit && !uniqueProductIds.has(productId)) {
              uniqueProductIds.add(productId);
              allHits.push(hit);
            }
          }
        } catch (e) {
          console.warn(`Error searching for query "${popularQueryStrings[i]}":`, e);
          continue;
        }
      }

      console.log(`Found ${allHits.length} unique products from popular queries`);

      // If we didn't get enough products, supplement with trending products
      if (allHits.length < limit) {
        try {
          const trendingResponse = await this.getTrendingProducts(limit - allHits.length);
          const trendingHits = trendingResponse.hits || [];

          for (const hit of trendingHits) {
            const productId = parseInt(hit.document.id || '0', 10);
            if (allHits.length < limit && !uniqueProductIds.has(productId)) {
              uniqueProductIds.add(productId);
              allHits.push(hit);
            }
          }
          console.log(`Supplemented with trending products, total: ${allHits.length}`);
        } catch (e) {
          console.warn('Error supplementing with trending products:', e);
        }
      }

      // Return the results in the expected format
      return {
        found: allHits.length,
        hits: allHits,
        page: 1,
        per_page: limit,
      };
    } catch (error) {
      console.warn('Error getting popular products, falling back to trending:', error);
      return this.getTrendingProducts(limit);
    }
  }

  /**
   * Fetch a product by its ID
   */
  async getProductById(productId: number): Promise<VintStreetListing | null> {
    try {
      const response = await this.search({
        query: '*',
        queryBy: 'name',
        filterBy: `id:=${productId}`,
        perPage: 1,
      });

      const hits = response.hits;
      if (hits && hits.length > 0) {
        const document = hits[0].document;
        return this.convertToVintStreetListing(document);
      }
      return null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  }

  /**
   * Get recently added products
   */
  async getRecentlyAddedProducts(limit: number = 20): Promise<TypesenseSearchResponse> {
    return this.systemSearch({
      query: '*',
      queryBy: 'name,description,brand,categories',
      perPage: limit,
      filterBy: 'stock_status:="instock"',
      sortBy: 'created_at:desc',
    });
  }
}

// Export singleton instance
export const typesenseService = new TypesenseService();
