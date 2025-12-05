import { logger } from '@/utils/logger';
import { algoliasearch } from 'algoliasearch';

// Get environment variables
const ALGOLIA_APP_ID = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_API_KEY = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY;

// Validate environment variables
if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_API_KEY) {
  logger.error(
    'Missing Algolia environment variables. Please check your .env file. Algolia search will not work without these.'
  );
}

// Create Algolia search client
export const searchClient =
  ALGOLIA_APP_ID && ALGOLIA_SEARCH_API_KEY ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY) : null;

// Index names - update these to match your Algolia indices
export const productsIndex = {
  indexName: process.env.EXPO_PUBLIC_ALGOLIA_PRODUCTS_INDEX || 'products',
};

export const categoriesIndex = {
  indexName: process.env.EXPO_PUBLIC_ALGOLIA_CATEGORIES_INDEX || 'categories',
};

export const brandsIndex = {
  indexName: process.env.EXPO_PUBLIC_ALGOLIA_BRANDS_INDEX || 'brands',
};

export const brandsQuerySuggestionsIndex = {
  indexName: process.env.EXPO_PUBLIC_ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX || 'brands_query_suggestions',
};

export const categoriesQuerySuggestionsIndex = {
  indexName: process.env.EXPO_PUBLIC_ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX || 'categories_query_suggestions',
};

export const productsQuerySuggestionsIndex = {
  indexName: process.env.EXPO_PUBLIC_ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX || 'products_query_suggestions',
};
