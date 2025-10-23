import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Basic selectors
export const selectCartState = (state: RootState) => state.cart;
export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartItems = (state: RootState) => state.cart.cart.items;
export const selectCartLoading = (state: RootState) => state.cart.isLoading;
export const selectCartError = (state: RootState) => state.cart.error;

export const selectCartItemByProductId = (productId: string) =>
  createSelector([selectCartItems], (items) => items.find((item) => item.product?.id === productId));

export const selectIsCartEmpty = createSelector([selectCartItems], (items) => items.length === 0);
