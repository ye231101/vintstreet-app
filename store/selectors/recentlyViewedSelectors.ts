import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Basic selectors
export const selectRecentlyViewedState = (state: RootState) => state.recentlyViewed;
export const selectRecentlyViewedItems = (state: RootState) => state.recentlyViewed.items;
export const selectRecentlyViewedLoading = (state: RootState) => state.recentlyViewed.loading;
export const selectRecentlyViewedError = (state: RootState) => state.recentlyViewed.error;
export const selectRecentlyViewedInitialized = (state: RootState) => state.recentlyViewed.isInitialized;

// Computed selectors
export const selectRecentlyViewedCount = createSelector([selectRecentlyViewedItems], (items) => items.length);

export const selectIsRecentlyViewedEmpty = createSelector([selectRecentlyViewedItems], (items) => items.length === 0);

export const selectRecentlyViewedHasItems = createSelector([selectRecentlyViewedItems], (items) => items.length > 0);

// Get recently viewed items with limit
export const selectRecentlyViewedWithLimit = (limit: number) =>
  createSelector([selectRecentlyViewedItems], (items) => items.slice(0, limit));

// Convert string dates back to Date objects for components
export const selectRecentlyViewedItemsWithDates = createSelector([selectRecentlyViewedItems], (items) =>
  items.map((item) => ({
    ...item,
    createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt,
    updatedAt: typeof item.updatedAt === 'string' ? new Date(item.updatedAt) : item.updatedAt,
  }))
);

// Get first N items
export const selectFirstRecentlyViewed = (count: number) =>
  createSelector([selectRecentlyViewedItems], (items) => items.slice(0, count));

// Check if product is in recently viewed
export const selectIsProductRecentlyViewed = (productId: number) =>
  createSelector([selectRecentlyViewedItems], (items) => items.some((item) => item.id === productId));

// Get recently viewed item by ID
export const selectRecentlyViewedItemById = (productId: number) =>
  createSelector([selectRecentlyViewedItems], (items) => items.find((item) => item.id === productId));

// Get recently viewed items by brand
export const selectRecentlyViewedByBrand = (brand: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => item.brand?.toLowerCase() === brand.toLowerCase())
  );

// Get recently viewed items by price range
export const selectRecentlyViewedByPriceRange = (minPrice: number, maxPrice: number) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => item.price >= minPrice && item.price <= maxPrice)
  );

// Get recently viewed items sorted by date (most recent first)
export const selectRecentlyViewedSorted = createSelector([selectRecentlyViewedItems], (items) =>
  [...items].sort((a, b) => {
    // Since we add new items to the front, the array is already sorted by recency
    // But we can add additional sorting logic here if needed
    return 0;
  })
);

// Get recently viewed items with specific attributes
export const selectRecentlyViewedByAttribute = (attribute: string, value: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => {
      const attr = item.attributes as any;
      return attr[attribute]?.includes(value);
    })
  );

// Get recently viewed items by category
export const selectRecentlyViewedByCategory = (category: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => item.categories?.some((cat) => cat.toLowerCase() === category.toLowerCase()))
  );

// Get recently viewed items with images
export const selectRecentlyViewedWithImages = createSelector([selectRecentlyViewedItems], (items) =>
  items.filter((item) => item.thumbnailImageUrls?.length > 0 || item.fullImageUrls?.length > 0)
);

// Get recently viewed items without images
export const selectRecentlyViewedWithoutImages = createSelector([selectRecentlyViewedItems], (items) =>
  items.filter(
    (item) =>
      (!item.thumbnailImageUrls || item.thumbnailImageUrls.length === 0) &&
      (!item.fullImageUrls || item.fullImageUrls.length === 0)
  )
);

// Get recently viewed items by vendor
export const selectRecentlyViewedByVendor = (vendorId: number) =>
  createSelector([selectRecentlyViewedItems], (items) => items.filter((item) => item.vendorId === vendorId));

// Get recently viewed items by condition
export const selectRecentlyViewedByCondition = (condition: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => item.attributes.pa_condition?.includes(condition.toLowerCase()))
  );

// Get recently viewed items by gender
export const selectRecentlyViewedByGender = (gender: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => item.attributes.pa_gender?.includes(gender.toLowerCase()))
  );

// Get recently viewed items by color
export const selectRecentlyViewedByColor = (color: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => item.attributes.pa_colour?.includes(color.toLowerCase()))
  );

// Get recently viewed items by size
export const selectRecentlyViewedBySize = (size: string) =>
  createSelector([selectRecentlyViewedItems], (items) =>
    items.filter((item) => {
      const sizes = item.attributes?.pa_size;
      return sizes?.includes(size);
    })
  );

// Get recently viewed items with high ratings
export const selectRecentlyViewedWithHighRatings = (minRating: number = 4.0) =>
  createSelector([selectRecentlyViewedItems], (items) => items.filter((item) => item.averageRating >= minRating));

// Get recently viewed items on sale
export const selectRecentlyViewedOnSale = createSelector([selectRecentlyViewedItems], (items) =>
  items.filter((item) => item.onSale)
);

// Get recently viewed items with stock
export const selectRecentlyViewedInStock = createSelector([selectRecentlyViewedItems], (items) =>
  items.filter((item) => item.stockQuantity > 0)
);

// Get recently viewed items out of stock
export const selectRecentlyViewedOutOfStock = createSelector([selectRecentlyViewedItems], (items) =>
  items.filter((item) => item.stockQuantity === 0)
);
