import { CartItem, cartService } from '@/api/services/cart.service';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface CartState {
  cart: Cart;
  isLoading: boolean;
  error: string | null;
}

const initialCart: Cart = {
  items: [],
  total: 0,
};

const initialState: CartState = {
  cart: initialCart,
  isLoading: false,
  error: null,
};

// Helper functions
const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  return total;
};

// Async Thunks
export const fetchCart = createAsyncThunk('cart/fetchCart', async (userId: string, { rejectWithValue }) => {
  try {
    const cartItems = await cartService.getCart(userId);
    return cartItems;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch cart');
  }
});

export const addToCartAsync = createAsyncThunk(
  'cart/addToCart',
  async (
    { userId, listingId, quantity = 1 }: { userId: string; listingId: string; quantity?: number },
    { rejectWithValue }
  ) => {
    try {
      await cartService.addToCart(userId, listingId, quantity);
      const cartItems = await cartService.getCart(userId);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add item to cart');
    }
  }
);

export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async ({ userId, listingId }: { userId: string; listingId: string }, { rejectWithValue }) => {
    try {
      await cartService.removeFromCart(userId, listingId);
      const cartItems = await cartService.getCart(userId);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove item from cart');
    }
  }
);

export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantity',
  async (
    { userId, listingId, quantity }: { userId: string; listingId: string; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      await cartService.updateCartQuantity(userId, listingId, quantity);
      const cartItems = await cartService.getCart(userId);
      return cartItems;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update quantity');
    }
  }
);

export const clearCartAsync = createAsyncThunk('cart/clearCart', async (userId: string, { rejectWithValue }) => {
  try {
    await cartService.clearCart(userId);
    return [];
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear cart');
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

    // Reset cart to initial state (for logout)
    resetCart: (state) => {
      state.cart = initialCart;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cart = {
          items: action.payload,
          total: calculateTotals(action.payload),
        };
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to fetch cart');
      });

    // Add to Cart
    builder
      .addCase(addToCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.cart = {
          items: action.payload,
          total: calculateTotals(action.payload),
        };
        state.error = null;

        // Show success toast
        const addedItem = action.payload[0];
        if (addedItem && addedItem.product) {
          showSuccessToast(`${addedItem.product.product_name} has been added to your cart.`);
        }
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to add item to cart');
      });

    // Remove from Cart
    builder
      .addCase(removeFromCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.cart = {
          items: action.payload,
          total: calculateTotals(action.payload),
        };
        state.error = null;
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to remove item from cart');
      });

    // Update Quantity
    builder
      .addCase(updateQuantityAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        state.cart = {
          items: action.payload,
          total: calculateTotals(action.payload),
        };
        state.error = null;
      })
      .addCase(updateQuantityAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to update quantity');
      });

    // Clear Cart
    builder
      .addCase(clearCartAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.cart = initialCart;
        state.error = null;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        showErrorToast((action.payload as string) || 'Failed to clear cart');
      });
  },
});

export const { setLoading, setError, clearError, resetCart } = cartSlice.actions;

export default cartSlice.reducer;
