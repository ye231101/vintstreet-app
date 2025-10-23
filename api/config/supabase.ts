import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Get environment variables
// In Expo, environment variables must be prefixed with EXPO_PUBLIC_ to be accessible in the app
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable URL detection for email confirmation links
    // Optional: Set custom redirect URL for email confirmations
    // redirectTo: 'vintstreetapp://confirm-email',
  },
});
