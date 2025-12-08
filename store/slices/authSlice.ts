import { authService } from '@/api/services';
import { AuthUser } from '@/api/types';
import { logger } from '@/utils/logger';
import { removeSecureValue, setSecureValue } from '@/utils/secure-storage';
import { removeStorageValue, setStorageValue } from '@/utils/storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

const KEY_TOKEN = 'TOKEN';
const KEY_USER_DATA = 'USER_DATA';

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }) => {
    if (email.trim().length === 0 || password.trim().length < 6) {
      throw new Error('Invalid email or password');
    }

    const {
      user: authUser,
      session,
      error: authError,
    } = await authService.signIn({
      email,
      password,
    });

    if (authError || !authUser || !session) {
      throw new Error(authError || 'Login failed');
    }

    // Store user data in regular storage (non-sensitive)
    await setStorageValue(KEY_USER_DATA, JSON.stringify(authUser));
    // Store token in secure storage (encrypted)
    await setSecureValue(KEY_TOKEN, session.access_token);

    return { user: authUser, session };
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (data: { email: string; fullName: string; username: string; accountType: string; password: string }) => {
    if (data.username.trim().length < 3 || data.email.trim().length === 0 || data.password.trim().length < 6) {
      throw new Error('Invalid registration data');
    }

    const {
      user: authUser,
      session,
      error: authError,
    } = await authService.signUp({
      email: data.email,
      password: data.password,
      username: data.username,
      full_name: data.fullName,
      accountType: data.accountType,
    });

    if (authError || !authUser) {
      throw new Error(authError || 'Registration failed');
    }

    // If session exists, store in secure storage
    if (session) {
      // Store user data in regular storage (non-sensitive)
      await setStorageValue(KEY_USER_DATA, JSON.stringify(authUser));
      // Store token in secure storage (encrypted)
      await setSecureValue(KEY_TOKEN, session.access_token);
    }

    return { user: authUser, session, requiresVerification: !session };
  }
);

export const resetPassword = createAsyncThunk('auth/resetPassword', async (email: string) => {
  if (email.trim().length === 0) {
    throw new Error('Email is required');
  }

  const { error: resetError, success } = await authService.resetPassword(email);

  if (resetError || !success) {
    throw new Error(resetError || 'Failed to send reset email');
  }

  return { success: true };
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: { username?: string; full_name?: string; bio?: string; avatar_url?: string; user_type?: string }) => {
    const { error, success } = await authService.updateProfile(data);

    if (error || !success) {
      throw new Error(error || 'Failed to update profile');
    }

    // Get updated user data
    const { user: updatedUser } = await authService.getCurrentUser();

    if (updatedUser) {
      // Update storage with new user data
      await setStorageValue(KEY_USER_DATA, JSON.stringify(updatedUser));
      return updatedUser;
    }

    throw new Error('Failed to retrieve updated user data');
  }
);

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (data: { currentPassword: string; newPassword: string }) => {
    if (data.currentPassword.trim().length === 0) {
      throw new Error('Current password is required');
    }

    if (data.newPassword.trim().length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    const { error, success } = await authService.updatePassword(data.currentPassword, data.newPassword);

    if (error || !success) {
      throw new Error(error || 'Failed to update password');
    }

    return { success: true };
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    // Sign out from Supabase
    const { error: signOutError } = await authService.signOut();

    if (signOutError) {
      logger.error('Supabase sign out error', signOutError);
      // Continue with local cleanup even if server signout fails
    }
  } catch (error) {
    logger.error('Logout error', error);
  } finally {
    // Remove token from secure storage
    await removeSecureValue(KEY_TOKEN);
    // Remove user data from regular storage
    await removeStorageValue(KEY_USER_DATA);
  }
});

export const deleteAccount = createAsyncThunk('auth/deleteAccount', async () => {
  const { error, success } = await authService.deleteAccount();

  if (error || !success) {
    throw new Error(error || 'Failed to delete account');
  }

  // Clean up local storage
  await removeSecureValue(KEY_TOKEN);
  await removeStorageValue(KEY_USER_DATA);

  return { success: true };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Handle auth state changes from Supabase
    handleAuthStateChange: (state, action: PayloadAction<{ event: string; session: unknown }>) => {
      const { event, session } = action.payload;

      if (event === 'SIGNED_IN' && session) {
        // This will be handled by the auth listener in the provider
      } else if (event === 'SIGNED_OUT') {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      } else if (event === 'USER_UPDATED' && session) {
        // Handle email confirmation
        // The actual user data will be updated by the auth listener
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.error.message || 'Login failed';
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.session) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.error.message || 'Registration failed';
      })
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Password reset failed';
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Profile update failed';
      })
      // Update password
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Password update failed';
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.error.message || 'Logout failed';
      })
      // Delete account
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Account deletion failed';
      });
  },
});

export const { clearError, setLoading, handleAuthStateChange } = authSlice.actions;
export default authSlice.reducer;
