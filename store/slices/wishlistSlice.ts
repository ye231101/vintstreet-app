import { Product } from '@/api/services/listings.service';
import { showSuccessToast } from '@/utils/toast';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistState {
  items: Product[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Add item to wishlist
    addToWishlist: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      
      // Check if item already exists in wishlist
      const existingItem = state.items.find((item) => item.id === product.id);
      
      if (!existingItem) {
        state.items.push(product);
        showSuccessToast(`${product.product_name} added to wishlist`);
      }
      state.error = null;
    },

    // Remove item from wishlist
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      const product = state.items.find((item) => item.id === productId);
      
      state.items = state.items.filter((item) => item.id !== productId);
      
      if (product) {
        showSuccessToast(`${product.product_name} removed from wishlist`);
      }
      state.error = null;
    },

    // Toggle item in wishlist (add if not exists, remove if exists)
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const existingItemIndex = state.items.findIndex((item) => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Remove from wishlist
        state.items.splice(existingItemIndex, 1);
        showSuccessToast(`${product.product_name} removed from wishlist`);
      } else {
        // Add to wishlist
        state.items.push(product);
        showSuccessToast(`${product.product_name} added to wishlist`);
      }
      state.error = null;
    },

    // Clear entire wishlist
    clearWishlist: (state) => {
      state.items = [];
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
  setLoading,
  setError,
  clearError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;

