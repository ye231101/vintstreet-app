import { Product, wishlistService } from '@/api';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistState {
  items: Product[];
  wishlistMap: Record<string, string>; // listingId -> wishlistId mapping
  isLoading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  wishlistMap: {},
  isLoading: false,
  error: null,
};

// Async thunk to fetch wishlist items
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (userId: string, { rejectWithValue }) => {
    try {
      const items = await wishlistService.getWishlistItems(userId);
      return items;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch wishlist');
    }
  }
);

// Async thunk to add item to wishlist
export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlist',
  async ({ userId, product }: { userId: string; product: Product }, { rejectWithValue }) => {
    try {
      await wishlistService.addToWishlist(userId, product.id);
      // Fetch updated wishlist to get the wishlist item ID
      const items = await wishlistService.getWishlistItems(userId);
      showSuccessToast(`${product.product_name} added to wishlist`);
      return items;
    } catch (error: any) {
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
      await wishlistService.removeFromWishlistByListingId(userId, listingId);
      showSuccessToast(`${productName || 'Item'} removed from wishlist`);
      return listingId;
    } catch (error: any) {
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
      const isInWishlist = state.wishlist.wishlistMap[product.id];

      if (isInWishlist) {
        await wishlistService.removeFromWishlistByListingId(userId, product.id);
        showSuccessToast(`${product.product_name} removed from wishlist`);
        return { action: 'remove' as const, listingId: product.id };
      } else {
        await wishlistService.addToWishlist(userId, product.id);
        const items = await wishlistService.getWishlistItems(userId);
        showSuccessToast(`${product.product_name} added to wishlist`);
        return { action: 'add' as const, items };
      }
    } catch (error: any) {
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
    } catch (error: any) {
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

    // Clear wishlist (local only)
    clearWishlistLocal: (state) => {
      state.items = [];
      state.wishlistMap = {};
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
        state.isLoading = false;
        state.items = action.payload.map((item) => item.listings);
        state.wishlistMap = action.payload.reduce((acc, item) => {
          acc[item.listing_id] = item.id;
          return acc;
        }, {} as Record<string, string>);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to wishlist
    builder
      .addCase(addToWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.map((item) => item.listings);
        state.wishlistMap = action.payload.reduce((acc, item) => {
          acc[item.listing_id] = item.id;
          return acc;
        }, {} as Record<string, string>);
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove from wishlist
    builder
      .addCase(removeFromWishlistAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        const listingId = action.payload;
        state.items = state.items.filter((item) => item.id !== listingId);
        delete state.wishlistMap[listingId];
      })
      .addCase(removeFromWishlistAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Toggle wishlist
    builder
      .addCase(toggleWishlistAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleWishlistAsync.fulfilled, (state, action) => {
        if (action.payload.action === 'remove') {
          const listingId = action.payload.listingId;
          state.items = state.items.filter((item) => item.id !== listingId);
          delete state.wishlistMap[listingId];
        } else {
          state.items = action.payload.items.map((item) => item.listings);
          state.wishlistMap = action.payload.items.reduce((acc, item) => {
            acc[item.listing_id] = item.id;
            return acc;
          }, {} as Record<string, string>);
        }
      })
      .addCase(toggleWishlistAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Clear wishlist
    builder
      .addCase(clearWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.wishlistMap = {};
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setLoading, setError, clearError, clearWishlistLocal } = wishlistSlice.actions;

export default wishlistSlice.reducer;
