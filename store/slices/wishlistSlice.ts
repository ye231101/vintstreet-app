import { wishlistService } from '@/api/services';
import { Product, WishlistItem } from '@/api/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  error: null,
};

// Async thunk to fetch wishlist items
export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (userId: string, { rejectWithValue }) => {
  try {
    const items = await wishlistService.getWishlist(userId);
    return items;
  } catch (error: unknown) {
    return rejectWithValue(error.message || 'Failed to fetch wishlist');
  }
});

// Async thunk to add item to wishlist
export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlist',
  async ({ userId, product }: { userId: string; product: Product }, { rejectWithValue }) => {
    try {
      await wishlistService.addToWishlist(userId, product.id);
      // Fetch updated wishlist to get the wishlist item ID
      const items = await wishlistService.getWishlist(userId);
      showSuccessToast(`${product.product_name} added to wishlist`);
      return items;
    } catch (error: unknown) {
      showErrorToast('Failed to add to wishlist');
      return rejectWithValue(error.message || 'Failed to add to wishlist');
    }
  }
);

// Async thunk to remove item from wishlist
export const removeFromWishlistAsync = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (
    { userId, listingId, productName }: { userId: string; listingId: string; productName?: string },
    { rejectWithValue }
  ) => {
    try {
      await wishlistService.removeFromWishlist(userId, listingId);
      showSuccessToast(`${productName || 'Item'} removed from wishlist`);
      const wishlistItems = await wishlistService.getWishlist(userId);
      return wishlistItems;
    } catch (error: unknown) {
      showErrorToast('Failed to remove from wishlist');
      return rejectWithValue(error.message || 'Failed to remove from wishlist');
    }
  }
);

// Async thunk to toggle item in wishlist
export const toggleWishlistAsync = createAsyncThunk(
  'wishlist/toggleWishlist',
  async ({ userId, product }: { userId: string; product: Product }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { wishlist: WishlistState };
      const isInWishlist = state.wishlist.items.some((item) => item.listing_id === product.id);

      if (isInWishlist) {
        await wishlistService.removeFromWishlist(userId, product.id);
        const items = await wishlistService.getWishlist(userId);
        showSuccessToast(`${product.product_name} removed from wishlist`);
        return { action: 'remove' as const, items };
      } else {
        await wishlistService.addToWishlist(userId, product.id);
        const items = await wishlistService.getWishlist(userId);
        showSuccessToast(`${product.product_name} added to wishlist`);
        return { action: 'add' as const, items };
      }
    } catch (error: unknown) {
      showErrorToast('Failed to update wishlist');
      return rejectWithValue(error.message || 'Failed to update wishlist');
    }
  }
);

// Async thunk to clear wishlist
export const clearWishlistAsync = createAsyncThunk(
  'wishlist/clearWishlist',
  async (userId: string, { rejectWithValue }) => {
    try {
      await wishlistService.clearWishlist(userId);
      showSuccessToast('Wishlist cleared');
      return;
    } catch (error: unknown) {
      showErrorToast('Failed to clear wishlist');
      return rejectWithValue(error.message || 'Failed to clear wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
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

    // Reset wishlist to initial state
    resetWishlist: (state) => {
      state.items = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch wishlist
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to fetch wishlist');
      });

    // Add to wishlist
    builder
      .addCase(addToWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to add to wishlist');
      });

    // Remove from wishlist
    builder
      .addCase(removeFromWishlistAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        state.error = null;
      })
      .addCase(removeFromWishlistAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to remove from wishlist');
      });

    // Toggle wishlist
    builder
      .addCase(toggleWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleWishlistAsync.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(toggleWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to toggle wishlist');
      });

    // Clear wishlist
    builder
      .addCase(clearWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.items = [];
        state.isLoading = false;
        state.error = null;
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to clear wishlist');
      });
  },
});

export const { setLoading, setError, clearError, resetWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
