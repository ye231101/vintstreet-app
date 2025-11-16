import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectWishlistItems = (state: RootState) => state.wishlist.items;
export const selectWishlistLoading = (state: RootState) => state.wishlist.isLoading;
export const selectWishlistError = (state: RootState) => state.wishlist.error;

export const selectWishlistItemByProductId = (productId: string) =>
  createSelector([selectWishlistItems], (items) => items.find((item) => item.product?.id === productId));
