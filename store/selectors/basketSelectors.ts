import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Basic selectors
export const selectBasketState = (state: RootState) => state.basket;
export const selectBasket = (state: RootState) => state.basket.basket;
export const selectBasketItems = (state: RootState) => state.basket.basket.items;
export const selectBasketLoading = (state: RootState) => state.basket.isLoading;
export const selectBasketError = (state: RootState) => state.basket.error;

// Computed selectors
export const selectBasketItemCount = createSelector([selectBasketItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);

export const selectBasketTotal = createSelector([selectBasket], (basket) => basket.total);

export const selectBasketSubtotal = createSelector([selectBasket], (basket) => basket.subtotal);

export const selectBasketProtectionFee = createSelector([selectBasket], (basket) => basket.totalProtectionFee);

export const selectBasketFormattedTotal = createSelector([selectBasket], (basket) => basket.formattedTotal);

export const selectBasketFormattedSubtotal = createSelector([selectBasket], (basket) => basket.formattedSubtotal);

export const selectBasketFormattedProtectionFee = createSelector(
  [selectBasket],
  (basket) => basket.formattedTotalProtectionFee
);

export const selectBasketVendors = createSelector([selectBasket], (basket) => basket.vendors);

export const selectBasketVendorIds = createSelector([selectBasket], (basket) => basket.vendorIds);

export const selectBasketVendorItems = createSelector([selectBasket], (basket) => basket.vendorItems);

// Vendor-specific selectors
export const selectVendorItems = (vendorId: number) =>
  createSelector([selectBasketItems], (items) => items.filter((item) => item.vendorId === vendorId));

export const selectVendorTotals = (vendorId: number) =>
  createSelector([selectBasketItems], (items) => {
    const vendorItems = items.filter((item) => item.vendorId === vendorId);
    const subtotal = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const protectionFee = vendorItems.reduce((sum, item) => sum + item.protectionFee, 0);
    const total = subtotal + protectionFee;

    return { subtotal, protectionFee, total };
  });

export const selectVendorShopName = (vendorId: number) =>
  createSelector([selectBasketVendors], (vendors) => vendors[vendorId]?.name || `Vendor ${vendorId}`);

// Item-specific selectors
export const selectBasketItemById = (itemId: string) =>
  createSelector([selectBasketItems], (items) => items.find((item) => item.id === itemId));

export const selectBasketItemByProductId = (productId: number, vendorId: number) =>
  createSelector([selectBasketItems], (items) =>
    items.find((item) => item.productId === productId && item.vendorId === vendorId)
  );

// Utility selectors
export const selectIsBasketEmpty = createSelector([selectBasketItems], (items) => items.length === 0);

export const selectBasketItemCountByProduct = (productId: number, vendorId: number) =>
  createSelector([selectBasketItems], (items) => {
    const item = items.find((item) => item.productId === productId && item.vendorId === vendorId);
    return item ? item.quantity : 0;
  });

// Check if basket has items from specific vendor
export const selectHasVendorItems = (vendorId: number) =>
  createSelector([selectBasketItems], (items) => items.some((item) => item.vendorId === vendorId));
