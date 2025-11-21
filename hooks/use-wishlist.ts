import { Product } from '@/api/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectWishlistError, selectWishlistItems, selectWishlistLoading } from '@/store/selectors/wishlistSelectors';
import {
  addToWishlistAsync,
  clearWishlistAsync,
  fetchWishlist,
  removeFromWishlistAsync,
  resetWishlist,
  setError,
  toggleWishlistAsync,
} from '@/store/slices/wishlistSlice';
import { useEffect } from 'react';

export const useWishlist = () => {
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.auth.user?.id);
  const items = useAppSelector(selectWishlistItems);
  const isLoading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);

  // Fetch wishlist when user ID changes
  useEffect(() => {
    if (userId) {
      dispatch(fetchWishlist(userId));
    } else {
      // Reset wishlist when user logs out
      dispatch(resetWishlist());
    }
  }, [userId, dispatch]);

  // Add item to wishlist
  const addItem = async (product: Product) => {
    if (!userId) {
      dispatch(setError('Please sign in to add items to wishlist'));
      return;
    }
    await dispatch(addToWishlistAsync({ userId, product }));
  };

  // Remove item from wishlist
  const removeItem = async (productId: string, productName?: string) => {
    if (!userId) {
      dispatch(setError('Please sign in to remove items from wishlist'));
      return;
    }
    await dispatch(removeFromWishlistAsync({ userId, listingId: productId, productName }));
  };

  // Toggle item in wishlist (add if not exists, remove if exists)
  const toggleItem = async (product: Product) => {
    if (!userId) {
      dispatch(setError('Please sign in to toggle items in wishlist'));
      return;
    }
    await dispatch(toggleWishlistAsync({ userId, product }));
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string) => {
    return items.some((item) => item.listing_id === productId);
  };

  // Clear wishlist
  const clearWishlist = async () => {
    if (!userId) {
      dispatch(setError('Please sign in to clear wishlist'));
      return;
    }
    await dispatch(clearWishlistAsync(userId));
  };

  // Refresh wishlist
  const refreshWishlist = async () => {
    if (!userId) {
      dispatch(setError('Please sign in to refresh wishlist'));
      return;
    }
    await dispatch(fetchWishlist(userId));
  };

  return {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
    refreshWishlist,
  };
};
