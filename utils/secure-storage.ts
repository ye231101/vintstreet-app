/**
 * Secure Storage Utilities
 * Uses expo-secure-store for encrypted storage of sensitive data like JWT tokens
 * This prevents other apps on the device from reading authentication tokens
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

/**
 * Set a value in secure storage (encrypted)
 * @param key - The key to store the value under
 * @param value - The value to store
 */
export const setSecureValue = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    logger.error(`Error setting secure value for key ${key}`, error);
    throw error;
  }
};

/**
 * Get a value from secure storage
 * @param key - The key to retrieve the value for
 * @returns The stored value or null if not found
 */
export const getSecureValue = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    logger.error(`Error getting secure value for key ${key}`, error);
    return null;
  }
};

/**
 * Remove a value from secure storage
 * @param key - The key to remove
 */
export const removeSecureValue = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    logger.error(`Error removing secure value for key ${key}`, error);
    throw error;
  }
};

/**
 * Check if a key exists in secure storage
 * @param key - The key to check
 * @returns True if the key exists, false otherwise
 */
export const hasSecureValue = async (key: string): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value !== null;
  } catch (error) {
    logger.error(`Error checking secure value for key ${key}`, error);
    return false;
  }
};
