import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, loginUser, logoutUser, registerUser, resetPassword } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading, error, isInitialized } = useAppSelector((state) => state.auth);

  const login = async (email: string, password: string) => {
    if (loading) return;
    dispatch(loginUser({ email, password }));
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    data: {
      firstName?: string;
      lastName?: string;
      shopName?: string;
      address1?: string;
      address2?: string;
      city?: string;
      postcode?: string;
      country?: string;
      state?: string;
      phone?: string;
      termsAccepted?: boolean;
    }
  ) => {
    if (loading) return;

    const result = await dispatch(
      registerUser({
        username,
        email,
        password,
        ...data,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      return { requiresVerification: result.payload.requiresVerification };
    }
    return undefined;
  };

  const resetPasswordAction = async (email: string) => {
    if (loading) return;
    dispatch(resetPassword(email));
  };

  const logout = async () => {
    if (loading) return;
    dispatch(logoutUser());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    isInitialized,
    login,
    register,
    resetPassword: resetPasswordAction,
    logout,
    clearError: clearAuthError,
  };
};
