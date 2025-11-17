import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartLoading = (state: RootState) => state.cart.isLoading;
export const selectCartError = (state: RootState) => state.cart.error;

export const selectCartItemByProductId = (productId: string) =>
  createSelector([selectCartItems], (items) => items.find((item) => item.product?.id === productId));
