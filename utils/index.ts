import Constants from 'expo-constants';

export const getProjectId = () => {
  if (
    Constants.expoConfig &&
    Constants.expoConfig.extra &&
    Constants.expoConfig.extra.eas &&
    Constants.expoConfig.extra.eas.projectId
  ) {
    return Constants.expoConfig.extra.eas.projectId;
  }
  return null; // Or handle the case where the projectId is not found
};

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
export const blurhash = 'LHF7~qC=^7WB6cof86t71R*I96IM';

/**
 * Export storage utilities
 */
export { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch } from './storage';

