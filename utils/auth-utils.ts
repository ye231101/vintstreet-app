import { authService } from '@/api/services';
import { logger } from '@/utils/logger';
import { removeSecureValue } from '@/utils/secure-storage';
import { getStorageValue, removeStorageValue } from '@/utils/storage';

/**
 * Authentication utility functions
 */
export class AuthUtils {
  /**
   * Get current user with automatic session refresh
   * @param maxRetries - Maximum number of retry attempts
   * @returns Promise with user data or null
   */
  static async getCurrentUserWithRefresh(maxRetries: number = 2): Promise<{ user: unknown; error?: string }> {
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        // First try to get user directly
        const { data: currentUser, error: userError } = await authService.getUser();

        if (currentUser && !userError) {
          return { user: currentUser };
        }

        // If no user or error, try to refresh session
        if (retryCount < maxRetries) {
          // Check if we have a valid session first
          const { session, error: sessionError } = await authService.getSession();

          if (session && !sessionError) {
            // We have a session, try to refresh it
            const { session: refreshData, error: refreshError } = await authService.refreshSession();

            if (refreshData && !refreshError) {
              // Try to get user again after refresh
              const { data: refreshedUser, error: refreshedUserError } = await authService.getUser();
              if (refreshedUser && !refreshedUserError) {
                return { user: refreshedUser };
              }
            }
          } else {
            // Try to restore from stored data as last resort
            if (retryCount === 0) {
              try {
                const storedUserData = await getStorageValue('USER_DATA');
                if (storedUserData) {
                  const user = JSON.parse(storedUserData);
                  // Try to get user one more time after finding stored data
                  const { data: restoredUser, error: restoredError } = await authService.getUser();
                  if (restoredUser && !restoredError) {
                    return { user: restoredUser };
                  }
                }
              } catch (storageError) {
                logger.error('Failed to restore from storage', storageError);
              }
            }
          }
        }

        retryCount++;
      } catch (error) {
        logger.error(`Auth check attempt ${retryCount + 1} failed`, error);
        retryCount++;
      }
    }

    return { user: null, error: 'Your session has expired. Please log in again.' };
  }

  /**
   * Check if the current session is valid
   * @returns Promise with session validity
   */
  static async isSessionValid(): Promise<boolean> {
    try {
      const { session, error } = await authService.getSession();
      return !error && !!session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh the current session
   * @returns Promise with refresh result
   */
  static async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { session, error } = await authService.refreshSession();
      return { success: !error && !!session, error: error || undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
      };
    }
  }

  /**
   * Force re-authentication by clearing all stored data and redirecting to login
   * @returns Promise that resolves when cleanup is complete
   */
  static async forceReAuthentication(): Promise<void> {
    try {
      // Clear all stored authentication data
      await authService.signOut();

      // Clear stored data
      // Remove token from secure storage
      await removeSecureValue('TOKEN');
      // Remove user data from regular storage
      await removeStorageValue('USER_DATA');
    } catch (error) {
      logger.error('Error during force re-authentication', error);
    }
  }

  /**
   * Check if the user needs to re-authenticate
   * @returns Promise with re-authentication status
   */
  static async needsReAuthentication(): Promise<boolean> {
    try {
      const { session, error } = await authService.getSession();

      if (error || !session) {
        return true;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        return true;
      }

      return false;
    } catch (error) {
      return true;
    }
  }
}
