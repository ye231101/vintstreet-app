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
   * Get current user profile
   * @returns User profile data
   */
  async getUser(): Promise<{ data: AuthUser | null; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: 'User not authenticated',
        };
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        return {
          data: null,
          error: profileError.message,
        };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        username: (profile as any).username,
        full_name: (profile as any).full_name,
        avatar_url: (profile as any).avatar_url,
        user_type: (profile as any).user_type,
        bio: (profile as any).bio,
        preferred_currency: (profile as any).preferred_currency,
        is_blocked: (profile as any).is_blocked,
      };

      return {
        data: authUser,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user',
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
    shop_name?: string;
    expo_push_token?: string;
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
          shop_name: data.shop_name,
          expo_push_token: data.expo_push_token,
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
   * Follow a user
   * @param followerId - The user ID of the follower
   * @param followedUserId - The user ID of the user being followed
   */
  async followUser(followerId: string, followedUserId: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_follows').insert({
        follower_id: followerId,
        followed_user_id: followedUserId,
      });

      if (error) {
        throw new Error(`Failed to follow user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @param followerId - The user ID of the follower
   * @param followedUserId - The user ID of the user being unfollowed
   */
  async unfollowUser(followerId: string, followedUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followed_user_id', followedUserId);

      if (error) {
        throw new Error(`Failed to unfollow user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Check if a user is following another user
   * @param followerId - The user ID of the follower
   * @param followedUserId - The user ID of the user being checked
   */
  async isFollowing(followerId: string, followedUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('followed_user_id', followedUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Response with success status
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null; success: boolean }> {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        return {
          error: 'User not authenticated',
          success: false,
        };
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return {
          error: 'Current password is incorrect',
          success: false,
        };
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return {
          error: updateError.message,
          success: false,
        };
      }

      return {
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Password update failed',
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
