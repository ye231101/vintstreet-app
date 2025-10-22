import { Product } from '@/api/services/listings.service';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

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
  const total = items.reduce((sum, item) => sum + item.product.starting_price * item.quantity, 0);

  return total;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const itemData = action.payload;

      // Check if item already exists in cart
      const existingItemIndex = state.cart.items.findIndex((item) => item.product.id === itemData.product.id);

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...state.cart.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + itemData.quantity;
        const newSubtotal = itemData.product.starting_price * newQuantity;

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: newSubtotal,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          ...itemData,
          subtotal: itemData.product.starting_price * itemData.quantity,
        };
        updatedItems = [...state.cart.items, newItem];
      }

      const total = calculateTotals(updatedItems);

      Alert.alert('Item added to cart', `${itemData.product.product_name} has been added to your cart.`);

      state.cart = {
        items: updatedItems,
        total: total,
      };
      state.error = null;
    },

    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const updatedItems = state.cart.items.filter((item) => item.product.id !== itemId);
      const total = calculateTotals(updatedItems);

      state.cart = {
        items: updatedItems,
        total: total,
      };
      state.error = null;
    },

    // Update item quantity
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const updatedItems = state.cart.items.filter((item) => item.product.id !== itemId);
        const total = calculateTotals(updatedItems);

        state.cart = {
          items: updatedItems,
          total: total,
        };
      } else {
        // Update quantity
        const updatedItems = state.cart.items.map((item) => {
          if (item.product.id === itemId) {
            const newSubtotal = item.product.starting_price * quantity;
            return {
              ...item,
              quantity,
              subtotal: newSubtotal,
            };
          }
          return item;
        });

        const total = calculateTotals(updatedItems);

        state.cart = {
          items: updatedItems,
          total: total,
        };
      }
      state.error = null;
    },

    // Clear entire cart
    clearCart: (state) => {
      state.cart = initialCart;
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

export const { addToCart, removeFromCart, updateQuantity, clearCart, setLoading, setError, clearError } =
  cartSlice.actions;

export default cartSlice.reducer;
