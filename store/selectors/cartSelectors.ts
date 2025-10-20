import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Basic selectors
export const selectCartState = (state: RootState) => state.cart;
export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartItems = (state: RootState) => state.cart.cart.items;
export const selectCartLoading = (state: RootState) => state.cart.isLoading;
export const selectCartError = (state: RootState) => state.cart.error;

// Computed selectors
export const selectCartItemCount = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartTotal = createSelector([selectCart], (cart) => cart.total);

export const selectCartSubtotal = createSelector([selectCart], (cart) => cart.subtotal);

export const selectCartProtectionFee = createSelector([selectCart], (cart) => cart.totalProtectionFee);

export const selectCartFormattedTotal = createSelector([selectCart], (cart) => cart.formattedTotal);

export const selectCartFormattedSubtotal = createSelector([selectCart], (cart) => cart.formattedSubtotal);

export const selectCartFormattedProtectionFee = createSelector(
  [selectCart],
  (cart) => cart.formattedTotalProtectionFee
);

export const selectCartVendors = createSelector([selectCart], (cart) => cart.vendors);

export const selectCartVendorIds = createSelector([selectCart], (cart) => cart.vendorIds);

export const selectCartVendorItems = createSelector([selectCart], (cart) => cart.vendorItems);

// Vendor-specific selectors
export const selectVendorItems = (vendorId: number) =>
  createSelector([selectCartItems], (items) => items.filter((item) => item.vendorId === vendorId));

export const selectVendorTotals = (vendorId: number) =>
  createSelector([selectCartItems], (items) => {
    const vendorItems = items.filter((item) => item.vendorId === vendorId);
    const subtotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const protectionFee = vendorItems.reduce((sum, item) => sum + item.protectionFee, 0);
    const total = subtotal + protectionFee;

    return { subtotal, protectionFee, total };
  });

export const selectVendorShopName = (vendorId: number) =>
  createSelector([selectCartVendors], (vendors) => vendors[vendorId]?.name || `Vendor ${vendorId}`);

// Item-specific selectors
export const selectCartItemById = (itemId: string) =>
  createSelector([selectCartItems], (items) => items.find((item) => item.id === itemId));

export const selectCartItemByProductId = (productId: number, vendorId: number) =>
  createSelector([selectCartItems], (items) =>
    items.find((item) => item.productId === productId && item.vendorId === vendorId)
  );

// Utility selectors
export const selectIsCartEmpty = createSelector([selectCartItems], (items) => items.length === 0);

export const selectCartItemCountByProduct = (productId: number, vendorId: number) =>
  createSelector([selectCartItems], (items) => {
    const item = items.find((item) => item.productId === productId && item.vendorId === vendorId);
    return item ? item.quantity : 0;
  });

// Check if cart has items from specific vendor
export const selectHasVendorItems = (vendorId: number) =>
  createSelector([selectCartItems], (items) => items.some((item) => item.vendorId === vendorId));
