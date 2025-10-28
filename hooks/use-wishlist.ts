import { Product } from '@/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addToWishlistAsync,
  clearWishlistAsync,
  fetchWishlist,
  removeFromWishlistAsync,
  toggleWishlistAsync
} from '@/store/slices/wishlistSlice';
import { useCallback, useEffect } from 'react';

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const { items, wishlistMap = {}, isLoading, error } = useAppSelector((state) => state.wishlist);
  const { user } = useAppSelector((state) => state.auth);

  // Fetch wishlist on mount if user is authenticated
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWishlist(user.id));
    }
  }, [user?.id, dispatch]);

  // Add item to wishlist
  const addItem = useCallback(
    async (product: Product) => {
      if (!user?.id) {
        console.warn('User not authenticated');
        return;
      }
      await dispatch(addToWishlistAsync({ userId: user.id, product }));
    },
    [dispatch, user?.id]
  );

  // Remove item from wishlist
  const removeItem = useCallback(
    async (productId: string, productName?: string) => {
      if (!user?.id) {
        console.warn('User not authenticated');
        return;
      }
      await dispatch(
        removeFromWishlistAsync({ userId: user.id, listingId: productId, productName })
      );
    },
    [dispatch, user?.id]
  );

  // Toggle item in wishlist (add if not exists, remove if exists)
  const toggleItem = useCallback(
    async (product: Product) => {
      if (!user?.id) {
        console.warn('User not authenticated');
        return;
      }
      await dispatch(toggleWishlistAsync({ userId: user.id, product }));
    },
    [dispatch, user?.id]
  );

  // Check if product is in wishlist
  const isInWishlist = useCallback(
    (productId: string) => {
      return !!(wishlistMap && wishlistMap[productId]);
    },
    [wishlistMap]
  );

  // Clear wishlist
  const clearAll = useCallback(async () => {
    if (!user?.id) {
      console.warn('User not authenticated');
      return;
    }
    await dispatch(clearWishlistAsync(user.id));
  }, [dispatch, user?.id]);

  // Refresh wishlist
  const refresh = useCallback(async () => {
    if (!user?.id) {
      console.warn('User not authenticated');
      return;
    }
    await dispatch(fetchWishlist(user.id));
  }, [dispatch, user?.id]);

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
    refresh,
    wishlistCount,
  };
};
