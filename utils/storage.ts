/**
 * Storage Utilities
 * Shared functions for storage operations using @react-native-async-storage/async-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

/**
 * Set a value in storage
 * @param key - The key to store the value under
 * @param value - The value to store
 */
export const setStorageValue = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);
};

/**
 * Get a value from storage
 * @param key - The key to retrieve the value for
 * @returns The stored value or null if not found
 */
export const getStorageValue = async (key: string) => {
  return await AsyncStorage.getItem(key);
};

/**
 * Remove a value from storage
 * @param key - The key to remove
 */
export const removeStorageValue = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

/**
 * Check if a key exists in storage
 * @param key - The key to check
 * @returns True if the key exists, false otherwise
 */
export const hasStorageValue = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  return value !== null;
};

/**
 * Store a JSON object in storage
 * @param key - The key to store the object under
 * @param value - The object to store
 */
export const setStorageJSON = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

/**
 * Get a JSON object from storage
 * @param key - The key to retrieve the object for
 * @returns The parsed object or null if not found
 */
export const getStorageJSON = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }
  return null;
};

/**
 * Recent Search History Management
 */
const RECENT_SEARCHES_KEY = 'RECENT_SEARCHES';
const MAX_RECENT_SEARCHES = 10;

/**
 * Get recent searches from storage
 * @returns Array of recent search terms
 */
export const getRecentSearches = async (): Promise<string[]> => {
  try {
    const searches = await getStorageJSON(RECENT_SEARCHES_KEY);
    return Array.isArray(searches) ? searches : [];
  } catch (error) {
    logger.error('Error getting recent searches:', error);
    return [];
  }
};

/**
 * Add a search term to recent searches
 * @param searchTerm - The search term to add
 */
export const addRecentSearch = async (searchTerm: string): Promise<void> => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) return;

    const trimmedTerm = searchTerm.trim();
    const searches = await getRecentSearches();

    // Remove the term if it already exists (to move it to the front)
    const filteredSearches = searches.filter((s) => s.toLowerCase() !== trimmedTerm.toLowerCase());

    // Add the new term to the front
    const updatedSearches = [trimmedTerm, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);

    await setStorageJSON(RECENT_SEARCHES_KEY, updatedSearches);
  } catch (error) {
    logger.error('Error adding recent search:', error);
  }
};

/**
 * Clear all recent searches
 */
export const clearRecentSearches = async (): Promise<void> => {
  try {
    await removeStorageValue(RECENT_SEARCHES_KEY);
  } catch (error) {
    logger.error('Error clearing recent searches:', error);
  }
};

/**
 * Remove a specific search term from recent searches
 * @param searchTerm - The search term to remove
 */
export const removeRecentSearch = async (searchTerm: string): Promise<void> => {
  try {
    const searches = await getRecentSearches();
    const filteredSearches = searches.filter((s) => s.toLowerCase() !== searchTerm.toLowerCase());
    await setStorageJSON(RECENT_SEARCHES_KEY, filteredSearches);
  } catch (error) {
    logger.error('Error removing recent search:', error);
  }
};

/**
 * Recently Viewed Products Management
 */
const RECENTLY_VIEWED_PRODUCTS_KEY = 'RECENTLY_VIEWED_PRODUCTS';
const MAX_RECENTLY_VIEWED = 20; // Store more than we display to have buffer

/**
 * Get recently viewed product IDs from storage
 * @returns Array of recently viewed product IDs
 */
export const getRecentlyViewedProducts = async (): Promise<string[]> => {
  try {
    const products = await getStorageJSON(RECENTLY_VIEWED_PRODUCTS_KEY);
    return Array.isArray(products) ? products : [];
  } catch (error) {
    logger.error('Error getting recently viewed products:', error);
    return [];
  }
};

/**
 * Add a product ID to recently viewed products
 * @param productId - The product ID to add
 */
export const addRecentlyViewedProduct = async (productId: string): Promise<void> => {
  try {
    if (!productId || productId.trim().length === 0) return;

    const trimmedId = productId.trim();
    const products = await getRecentlyViewedProducts();

    // Remove the product if it already exists (to move it to the front)
    const filteredProducts = products.filter((id) => id !== trimmedId);

    // Add the new product ID to the front
    const updatedProducts = [trimmedId, ...filteredProducts].slice(0, MAX_RECENTLY_VIEWED);

    await setStorageJSON(RECENTLY_VIEWED_PRODUCTS_KEY, updatedProducts);
  } catch (error) {
    logger.error('Error adding recently viewed product:', error);
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewedProducts = async (): Promise<void> => {
  try {
    await removeStorageValue(RECENTLY_VIEWED_PRODUCTS_KEY);
  } catch (error) {
    logger.error('Error clearing recently viewed products:', error);
  }
};
