/**
 * Validates an email address using a comprehensive regex pattern
 * @param email - The email address to validate
 * @returns boolean - true if email is valid, false otherwise
 */
export const validateEmail = (email: string) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email.trim());
};

/**
 * Blurhash for the app
 * @returns string - blurhash
 */
export const blurhash = 'L8AAaa_300IUxuRjRjt7004n~q%M';

/**
 * Export storage utilities
 */
export { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch } from './storage';

