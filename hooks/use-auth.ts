import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearError,
  deleteAccount as deleteAccountAction,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updatePassword as updatePasswordAction,
  updateProfile as updateProfileAction,
} from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading, error } = useAppSelector((state) => state.auth);

  const login = async (email: string, password: string) => {
    if (loading) return;
    dispatch(loginUser({ email, password }));
  };

  const register = async (email: string, fullName: string, username: string, accountType: string, password: string) => {
    if (loading) return;

    const result = await dispatch(
      registerUser({
        username,
        email,
        fullName,
        accountType,
        password,
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

  const updateProfile = async (data: {
    username?: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    user_type?: string;
  }) => {
    const result = await dispatch(updateProfileAction(data));
    return result;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const result = await dispatch(updatePasswordAction({ currentPassword, newPassword }));
    return result;
  };

  const logout = async () => {
    if (loading) return;
    dispatch(logoutUser());
  };

  const deleteAccount = async () => {
    if (loading) return;
    const result = await dispatch(deleteAccountAction());
    return result;
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    register,
    resetPassword: resetPasswordAction,
    updateProfile,
    changePassword,
    logout,
    deleteAccount,
    clearError: clearAuthError,
  };
};
