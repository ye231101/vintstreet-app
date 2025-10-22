import { RootState } from '../index';

// Select all wishlist items
export const selectWishlistItems = (state: RootState) => state.wishlist.items;

// Select wishlist count
export const selectWishlistCount = (state: RootState) => state.wishlist.items.length;

// Select if a product is in wishlist
export const selectIsInWishlist = (state: RootState, productId: string) =>
  state.wishlist.items.some((item) => item.id === productId);

// Select wishlist loading state
export const selectWishlistLoading = (state: RootState) => state.wishlist.isLoading;

// Select wishlist error
export const selectWishlistError = (state: RootState) => state.wishlist.error;

