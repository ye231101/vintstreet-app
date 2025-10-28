import { Product } from '@/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCart,
  selectCartError,
  selectCartItemByProductId,
  selectCartLoading,
  selectIsCartEmpty,
} from '@/store/selectors/cartSelectors';
import {
  addToCartAsync,
  clearCartAsync,
  clearError,
  fetchCart,
  removeFromCartAsync,
  resetCart,
  setError,
} from '@/store/slices/cartSlice';
import { useEffect } from 'react';

export const useCart = () => {
  const dispatch = useAppDispatch();

  // Get user ID from auth state
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Selectors
  const cart = useAppSelector(selectCart);
  const isLoading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const isEmpty = useAppSelector(selectIsCartEmpty);

  // Fetch cart when user ID changes
  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId));
    } else {
      // Reset cart when user logs out
      dispatch(resetCart());
    }
  }, [userId, dispatch]);

  // Actions
  const addItem = async (product: Product) => {
    if (!userId) {
      dispatch(setError('Please sign in to add items to cart'));
      return;
    }
    await dispatch(addToCartAsync({ userId, listingId: product.id }));
  };

  const removeItem = async (itemId: string) => {
    if (!userId) {
      dispatch(setError('Please sign in to remove items from cart'));
      return;
    }
    await dispatch(removeFromCartAsync({ userId, listingId: itemId }));
  };

  const clearAll = async () => {
    if (!userId) {
      dispatch(setError('Please sign in to clear cart'));
      return;
    }
    await dispatch(clearCartAsync(userId));
  };

  const refreshCart = async () => {
    if (userId) {
      await dispatch(fetchCart(userId));
    }
  };

  const setCartError = (errorMessage: string | null) => {
    dispatch(setError(errorMessage));
  };

  const clearCartError = () => {
    dispatch(clearError());
  };

  // Utility functions
  const getItemByProductId = (productId: string) => {
    return useAppSelector(selectCartItemByProductId(productId));
  };

  return {
    // State
    cart,
    isLoading,
    error,
    isEmpty,
    userId,

    // Actions
    addItem,
    removeItem,
    clearAll,
    refreshCart,
    setCartError,
    clearCartError,

    // Utility functions
    getItemByProductId,
  };
};
