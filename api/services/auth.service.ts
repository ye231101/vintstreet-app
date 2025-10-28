import { supabase } from '../config/supabase';
import {
  AuthResponse,
  AuthUser,
  PasswordResetResponse,
  ResendEmailResponse,
  SignInData,
  SignUpData,
  mapSupabaseUserToAuthUser,
} from '../types';

/**
 * Auth Service
 * Handles all authentication operations with Supabase
 */
class AuthService {
  /**
   * Sign up a new user
   * @param data - User registration data
   * @returns AuthResponse with user, session, and error
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, username, full_name, ...additionalData } = data;

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            full_name,
            ...additionalData,
          },
        },
      });

      if (error) {
        // Handle specific Supabase errors for duplicate emails
        if (
          error.message.includes('already registered') ||
          error.message.includes('User already registered') ||
          error.message.includes('already exists') ||
          error.message.includes('duplicate key') ||
          error.message.includes('email already exists') ||
          error.message.includes('User with this email already exists')
        ) {
          return {
            user: null,
            session: null,
            error: 'An account with this email already exists. Please use a different email or try logging in.',
          };
        }

        return {
          user: null,
          session: null,
          error: error.message,
        };
      }

      // Additional check: if user is null but no error, it might mean email already exists
      if (!authData.user) {
        return {
          user: null,
          session: null,
          error: 'An account with this email already exists. Please use a different email or try logging in.',
        };
      }

      return {
        user: mapSupabaseUserToAuthUser(authData.user),
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }

  /**
   * Sign in an existing user
   * @param data - User login credentials
   * @returns AuthResponse with user, session, and error
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: error.message,
        };
      }

      // Get profile data from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      // Map auth user data
      const authUser = mapSupabaseUserToAuthUser(authData.user);

      if (!authUser) {
        return {
          user: null,
          session: null,
          error: 'Failed to map user data',
        };
      }

      // Merge with profile data if available
      const user = profileData
        ? {
            ...authUser,
            username: (profileData as unknown as AuthUser).username || authUser.username,
            full_name: (profileData as unknown as AuthUser).full_name || authUser.full_name,
            bio: (profileData as unknown as AuthUser).bio || authUser.bio,
            avatar_url: (profileData as unknown as AuthUser).avatar_url || authUser.avatar_url,
            user_type: (profileData as unknown as AuthUser).user_type || authUser.user_type,
          }
        : authUser;

      return {
        user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Sign out the current user
   * @returns Error message if any
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }

  /**
   * Reset password for a user
   * Sends a password reset email with a link to reset password
   * @param email - User email address
   * @returns PasswordResetResponse with success status
   */
  async resetPassword(email: string): Promise<PasswordResetResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return {
          error: error.message,
          success: false,
        };
      }

      return {
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Password reset failed',
        success: false,
      };
    }
  }

  /**
   * Get the current session
   * @returns Current session or null
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { session: null, error: error.message };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Failed to get session',
      };
    }
  }

  /**
   * Refresh the current session
   * Forces Supabase to refresh the access token if it's expired
   * @returns Refreshed session or null
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { session: null, error: error.message };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
      };
    }
  }

  /**
   * Get the current user
   * @returns Current user or null
   */
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user found' };
      }

      // Get profile data from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      // Map auth user data
      const authUser = mapSupabaseUserToAuthUser(data.user);

      if (!authUser) {
        return { user: null, error: 'Failed to map user data' };
      }

      // Merge with profile data if available
      if (profileData && !profileError) {
        return {
          user: {
            ...authUser,
            username: (profileData as unknown as AuthUser).username || authUser.username,
            full_name: (profileData as unknown as AuthUser).full_name || authUser.full_name,
            bio: (profileData as unknown as AuthUser).bio || authUser.bio,
            avatar_url: (profileData as unknown as AuthUser).avatar_url || authUser.avatar_url,
            user_type: (profileData as unknown as AuthUser).user_type || authUser.user_type,
          },
          error: null,
        };
      }

      // Return auth user data if profile not found
      return {
        user: authUser,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  }

  /**
   * Resend OTP code to email
   * @param email - User email address
   * @param type - Type of OTP (signup, email, etc.)
   * @returns ResendEmailResponse
   */
  async resendEmail(email: string, type: 'signup' | 'email_change' = 'signup'): Promise<ResendEmailResponse> {
    try {
      const { error } = await supabase.auth.resend({
        type: type as 'signup' | 'email_change',
        email,
      });

      if (error) {
        return {
          error: error.message,
          success: false,
        };
      }

      return {
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
        success: false,
      };
    }
  }

  /**
   * Update user profile
   * @param data - Profile data to update
   * @returns Response with success status
   */
  async updateProfile(data: {
    username?: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    user_type?: string;
  }): Promise<{ error: string | null; success: boolean }> {
    try {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          error: 'User not authenticated',
          success: false,
        };
      }

      // Update profile in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.full_name,
          bio: data.bio,
          avatar_url: data.avatar_url,
          user_type: data.user_type,
        })
        .eq('user_id', user.id);

      if (error) {
        return {
          error: error.message,
          success: false,
        };
      }

      return {
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Profile update failed',
        success: false,
      };
    }
  }

  /**
   * Listen to auth state changes
   * @param callback - Callback function to handle auth state changes
   * @returns Subscription object
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
