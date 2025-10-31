import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  user_type?: string;
  bio?: string;
  preferred_currency?: string;
  is_blocked?: string;
  expo_push_token?: string;
}

export interface SignUpData {
  email: string;
  full_name?: string;
  username?: string;
  accountType?: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: Session | null;
  error: string | null;
}

export interface PasswordResetResponse {
  error: string | null;
  success: boolean;
}

export interface ResendEmailResponse {
  error: string | null;
  success: boolean;
}

// Helper to convert Supabase user to AuthUser
export function mapSupabaseUserToAuthUser(supabaseUser: SupabaseUser | null): AuthUser | null {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata?.username,
    full_name: supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    user_type: supabaseUser.user_metadata?.user_type,
    bio: supabaseUser.user_metadata?.bio,
    preferred_currency: supabaseUser.user_metadata?.preferred_currency,
    is_blocked: supabaseUser.user_metadata?.is_blocked,
    expo_push_token: supabaseUser.user_metadata?.expo_push_token,
  };
}
