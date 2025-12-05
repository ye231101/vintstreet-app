import { cartService } from '@/api/services';
import { CartItem } from '@/api/types';
import { showErrorToast } from '@/utils/toast';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Cart {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: Cart = {
  items: [],
  isLoading: false,
  error: null,
};

// Async thunk to fetch cart items
export const fetchCart = createAsyncThunk('cart/fetchCart', async (userId: string, { rejectWithValue }) => {
  try {
    const cartItems = await cartService.getCart(userId);
    return cartItems;
  } catch (error: unknown) {
    return rejectWithValue(error.message || 'Failed to fetch cart');
  }
});

// Async thunk to add item to cart
export const addToCartAsync = createAsyncThunk(
  'cart/addToCart',
  async ({ userId, listingId }: { userId: string; listingId: string }, { rejectWithValue }) => {
    try {
      await cartService.addToCart(userId, listingId);
      const cartItems = await cartService.getCart(userId);
      return cartItems;
    } catch (error: unknown) {
      showErrorToast('Failed to add item to cart');
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

// Async thunk to remove item from cart
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async ({ userId, listingId }: { userId: string; listingId: string }, { rejectWithValue }) => {
    try {
      await cartService.removeFromCart(userId, listingId);
      const cartItems = await cartService.getCart(userId);
      return cartItems;
    } catch (error: unknown) {
      showErrorToast('Failed to remove item from cart');
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

// Async thunk to clear cart
export const clearCartAsync = createAsyncThunk('cart/clearCart', async (userId: string, { rejectWithValue }) => {
  try {
    await cartService.clearCart(userId);
    return [];
  } catch (error: unknown) {
    showErrorToast('Failed to clear cart');
    return rejectWithValue(error.message || 'Failed to clear cart');
  }
});

const cartSlice = createSlice({
  name: 'cart',
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

    // Reset cart to initial state
    resetCart: (state) => {
      state.items = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to fetch cart');
      });

    // Add to cart
    builder
      .addCase(addToCartAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to add item to cart');
      });

    // Remove from cart
    builder
      .addCase(removeFromCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        state.error = null;
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to remove item from cart');
      });

    // Clear cart
    builder
      .addCase(clearCartAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = [];
        state.isLoading = false;
        state.error = null;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to clear cart');
      });
  },
});

export const { setLoading, setError, clearError, resetCart } = cartSlice.actions;

export default cartSlice.reducer;
