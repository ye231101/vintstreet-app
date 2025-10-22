import { Product } from '@/api/services/listings.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addToWishlist,
  clearWishlist,
  removeFromWishlist,
  toggleWishlist,
} from '@/store/slices/wishlistSlice';
import { useCallback } from 'react';

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector((state) => state.wishlist);

  // Add item to wishlist
  const addItem = useCallback(
    (product: Product) => {
      dispatch(addToWishlist(product));
    },
    [dispatch]
  );

  // Remove item from wishlist
  const removeItem = useCallback(
    (productId: string) => {
      dispatch(removeFromWishlist(productId));
    },
    [dispatch]
  );

  // Toggle item in wishlist (add if not exists, remove if exists)
  const toggleItem = useCallback(
    (product: Product) => {
      dispatch(toggleWishlist(product));
    },
    [dispatch]
  );

  // Check if product is in wishlist
  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.id === productId);
    },
    [items]
  );

  // Clear wishlist
  const clearAll = useCallback(() => {
    dispatch(clearWishlist());
  }, [dispatch]);

  // Get wishlist count
  const wishlistCount = items.length;

  return {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearAll,
    wishlistCount,
  };
};

