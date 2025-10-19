/**
 * Typesense Configuration
 * Configure Typesense client connection settings
 */

// Environment variables for Typesense
// Make sure to add these to your .env file
const TYPESENSE_HOST = process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'localhost';
const TYPESENSE_PORT = process.env.EXPO_PUBLIC_TYPESENSE_PORT || '8108';
const TYPESENSE_PROTOCOL = process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL || 'http';
const TYPESENSE_API_KEY = process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || '';

// Validate critical environment variables
if (!TYPESENSE_API_KEY) {
  console.warn('Warning: EXPO_PUBLIC_TYPESENSE_API_KEY is not set. Typesense features may not work correctly.');
}

export const typesenseConfig = {
  host: TYPESENSE_HOST,
  port: parseInt(TYPESENSE_PORT, 10),
  protocol: TYPESENSE_PROTOCOL as 'http' | 'https',
  apiKey: TYPESENSE_API_KEY,
  collectionName: 'products',
  connectionTimeout: 5000,
  retryInterval: 100,
  numRetries: 3,
  healthcheckInterval: 15000,
};
