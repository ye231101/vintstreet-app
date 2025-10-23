import { Product } from '@/api/services/listings.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCart,
  selectCartError,
  selectCartItemByProductId,
  selectCartItemCount,
  selectCartItemCountByProduct,
  selectCartLoading,
  selectCartTotal,
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
  updateQuantityAsync,
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
  const itemCount = useAppSelector(selectCartItemCount);
  const total = useAppSelector(selectCartTotal);
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
  const addItem = async (product: Product, quantity: number = 1) => {
    if (!userId) {
      dispatch(setError('Please sign in to add items to cart'));
      return;
    }
    await dispatch(addToCartAsync({ userId, listingId: product.id, quantity }));
  };

  const removeItem = async (itemId: string) => {
    if (!userId) {
      dispatch(setError('Please sign in to remove items from cart'));
      return;
    }
    await dispatch(removeFromCartAsync({ userId, listingId: itemId }));
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (!userId) {
      dispatch(setError('Please sign in to update cart'));
      return;
    }
    await dispatch(updateQuantityAsync({ userId, listingId: itemId, quantity }));
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

  const getItemCountByProduct = (productId: string) => {
    return useAppSelector(selectCartItemCountByProduct(productId));
  };

  return {
    // State
    cart,
    isLoading,
    error,
    itemCount,
    total,
    isEmpty,
    userId,

    // Actions
    addItem,
    removeItem,
    updateItemQuantity,
    clearAll,
    refreshCart,
    setCartError,
    clearCartError,

    // Utility functions
    getItemByProductId,
    getItemCountByProduct,
  };
};
