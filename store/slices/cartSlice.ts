import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: number;
  vendorName: string;
  lineTotal: number;
  protectionFee: number;
  protectionFeePercentage: number;
}

export interface Vendor {
  id: number;
  name: string;
  itemCount: number;
}

export interface Cart {
  items: CartItem[];
  vendors: { [key: number]: Vendor };
  vendorIds: number[];
  vendorItems: { [key: number]: CartItem[] };
  subtotal: number;
  formattedSubtotal: string;
  totalProtectionFee: number;
  formattedTotalProtectionFee: string;
  total: number;
  formattedTotal: string;
}

export interface CartState {
  cart: Cart;
  isLoading: boolean;
  error: string | null;
}

const initialCart: Cart = {
  items: [],
  vendors: {},
  vendorIds: [],
  vendorItems: {},
  subtotal: 0,
  formattedSubtotal: '£0.00',
  totalProtectionFee: 0,
  formattedTotalProtectionFee: '£0.00',
  total: 0,
  formattedTotal: '£0.00',
};

const initialState: CartState = {
  cart: initialCart,
  isLoading: false,
  error: null,
};

// Helper functions
const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalProtectionFee = items.reduce((sum, item) => sum + item.protectionFee, 0);
  const total = subtotal + totalProtectionFee;

  return {
    subtotal,
    totalProtectionFee,
    total,
    formattedSubtotal: `£${subtotal.toFixed(2)}`,
    formattedTotalProtectionFee: `£${totalProtectionFee.toFixed(2)}`,
    formattedTotal: `£${total.toFixed(2)}`,
  };
};

const updateVendorData = (items: CartItem[]) => {
  const vendors: { [key: number]: Vendor } = {};
  const vendorItems: { [key: number]: CartItem[] } = {};
  const vendorIds: number[] = [];

  items.forEach((item) => {
    if (!vendors[item.vendorId]) {
      vendors[item.vendorId] = {
        id: item.vendorId,
        name: item.vendorName,
        itemCount: 0,
      };
      vendorItems[item.vendorId] = [];
      vendorIds.push(item.vendorId);
    }
    vendors[item.vendorId].itemCount += item.quantity;
    vendorItems[item.vendorId].push(item);
  });

  return { vendors, vendorItems, vendorIds };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'id' | 'lineTotal' | 'protectionFee'>>) => {
      const itemData = action.payload;

      // Check if item already exists in cart
      const existingItemIndex = state.cart.items.findIndex(
        (item) => item.productId === itemData.productId && item.vendorId === itemData.vendorId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...state.cart.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + itemData.quantity;
        const newLineTotal = itemData.price * newQuantity;
        const newProtectionFee = newLineTotal * itemData.protectionFeePercentage;

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          lineTotal: newLineTotal,
          protectionFee: newProtectionFee,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          ...itemData,
          id: `${itemData.productId}_${itemData.vendorId}_${Date.now()}`,
          lineTotal: itemData.price * itemData.quantity,
          protectionFee: itemData.price * itemData.quantity * itemData.protectionFeePercentage,
        };
        updatedItems = [...state.cart.items, newItem];
      }

      const totals = calculateTotals(updatedItems);
      const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

      Alert.alert('Item added to cart', `${itemData.name} has been added to your cart.`);

      state.cart = {
        items: updatedItems,
        vendors,
        vendorItems,
        vendorIds,
        ...totals,
      };
      state.error = null;
    },

    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const updatedItems = state.cart.items.filter((item) => item.id !== itemId);
      const totals = calculateTotals(updatedItems);
      const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

      state.cart = {
        items: updatedItems,
        vendors,
        vendorItems,
        vendorIds,
        ...totals,
      };
      state.error = null;
    },

    // Update item quantity
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const updatedItems = state.cart.items.filter((item) => item.id !== itemId);
        const totals = calculateTotals(updatedItems);
        const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

        state.cart = {
          items: updatedItems,
          vendors,
          vendorItems,
          vendorIds,
          ...totals,
        };
      } else {
        // Update quantity
        const updatedItems = state.cart.items.map((item) => {
          if (item.id === itemId) {
            const newLineTotal = item.price * quantity;
            const newProtectionFee = newLineTotal * item.protectionFeePercentage;
            return {
              ...item,
              quantity,
              lineTotal: newLineTotal,
              protectionFee: newProtectionFee,
            };
          }
          return item;
        });

        const totals = calculateTotals(updatedItems);
        const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

        state.cart = {
          items: updatedItems,
          vendors,
          vendorItems,
          vendorIds,
          ...totals,
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
