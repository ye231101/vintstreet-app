import { Product } from '@/api/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCartError, selectCartItems, selectCartLoading } from '@/store/selectors/cartSelectors';
import {
  addToCartAsync,
  clearCartAsync,
  fetchCart,
  removeFromCartAsync,
  resetCart,
  setError,
} from '@/store/slices/cartSlice';
import { useEffect } from 'react';

export const useCart = () => {
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.auth.user?.id);
  const items = useAppSelector(selectCartItems);
  const isLoading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);

  // Fetch cart when user ID changes
  useEffect(() => {
    if (userId) {
      dispatch(fetchCart(userId));
    } else {
      // Reset cart when user logs out
      dispatch(resetCart());
    }
  }, [userId, dispatch]);

  // Add item to cart
  const addItem = async (product: Product) => {
    if (!userId) {
      dispatch(setError('Please sign in to add items to cart'));
      return;
    }
    await dispatch(addToCartAsync({ userId, listingId: product.id }));
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (!userId) {
      dispatch(setError('Please sign in to remove items from cart'));
      return;
    }
    await dispatch(removeFromCartAsync({ userId, listingId: itemId }));
  };

  // Check if product is in cart
  const isInCart = (productId?: string) => {
    if (!productId) {
      return false;
    }
    return items.some((cartItem) => cartItem.product?.id === productId);
  };

  // Clear cart
  const clearCart = async () => {
    if (!userId) {
      dispatch(setError('Please sign in to clear cart'));
      return;
    }
    await dispatch(clearCartAsync(userId));
  };

  // Refresh cart
  const refreshCart = async () => {
    if (!userId) {
      dispatch(setError('Please sign in to clear cart'));
      return;
    }
    await dispatch(fetchCart(userId));
  };

  return {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    isInCart,
    clearCart,
    refreshCart,
  };
};
