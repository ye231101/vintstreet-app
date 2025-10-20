import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  firstName?: string;
  lastName?: string;
  shopName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  state?: string;
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

export interface VerifyOTPData {
  email: string;
  token: string;
  type: 'email' | 'sms' | 'signup';
}

export interface VerifyOTPResponse {
  error: string | null;
  success: boolean;
  session: Session | null;
  user: AuthUser | null;
}

export interface ResendOTPResponse {
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
    firstName: supabaseUser.user_metadata?.firstName,
    lastName: supabaseUser.user_metadata?.lastName,
    shopName: supabaseUser.user_metadata?.shopName,
    phone: supabaseUser.user_metadata?.phone,
    address1: supabaseUser.user_metadata?.address1,
    address2: supabaseUser.user_metadata?.address2,
    city: supabaseUser.user_metadata?.city,
    postcode: supabaseUser.user_metadata?.postcode,
    country: supabaseUser.user_metadata?.country,
    state: supabaseUser.user_metadata?.state,
  };
}
