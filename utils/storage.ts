/**
 * Storage Utilities
 * Shared functions for storage operations using @react-native-async-storage/async-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

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
export const setStorageJSON = async (key: string, value: any) => {
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
      console.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }
  return null;
};

/**
 * Recent Search History Management
 */
const RECENT_SEARCHES_KEY = 'recent_searches';
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
    console.error('Error getting recent searches:', error);
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
    console.error('Error adding recent search:', error);
  }
};

/**
 * Clear all recent searches
 */
export const clearRecentSearches = async (): Promise<void> => {
  try {
    await removeStorageValue(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
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
    console.error('Error removing recent search:', error);
  }
};
