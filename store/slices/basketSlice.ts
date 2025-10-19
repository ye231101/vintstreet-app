import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BasketItem {
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

export interface Basket {
  items: BasketItem[];
  vendors: { [key: number]: Vendor };
  vendorIds: number[];
  vendorItems: { [key: number]: BasketItem[] };
  subtotal: number;
  formattedSubtotal: string;
  totalProtectionFee: number;
  formattedTotalProtectionFee: string;
  total: number;
  formattedTotal: string;
}

export interface BasketState {
  basket: Basket;
  isLoading: boolean;
  error: string | null;
}

const initialBasket: Basket = {
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

const initialState: BasketState = {
  basket: initialBasket,
  isLoading: false,
  error: null,
};

// Helper functions
const calculateTotals = (items: BasketItem[]) => {
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

const updateVendorData = (items: BasketItem[]) => {
  const vendors: { [key: number]: Vendor } = {};
  const vendorItems: { [key: number]: BasketItem[] } = {};
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

const basketSlice = createSlice({
  name: 'basket',
  initialState,
  reducers: {
    // Add item to basket
    addToBasket: (state, action: PayloadAction<Omit<BasketItem, 'id' | 'lineTotal' | 'protectionFee'>>) => {
      const itemData = action.payload;

      // Check if item already exists in basket
      const existingItemIndex = state.basket.items.findIndex(
        (item) => item.productId === itemData.productId && item.vendorId === itemData.vendorId
      );

      let updatedItems: BasketItem[];

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...state.basket.items];
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
        const newItem: BasketItem = {
          ...itemData,
          id: `${itemData.productId}_${itemData.vendorId}_${Date.now()}`,
          lineTotal: itemData.price * itemData.quantity,
          protectionFee: itemData.price * itemData.quantity * itemData.protectionFeePercentage,
        };
        updatedItems = [...state.basket.items, newItem];
      }

      const totals = calculateTotals(updatedItems);
      const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

      state.basket = {
        items: updatedItems,
        vendors,
        vendorItems,
        vendorIds,
        ...totals,
      };
      state.error = null;
    },

    // Remove item from basket
    removeFromBasket: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const updatedItems = state.basket.items.filter((item) => item.id !== itemId);
      const totals = calculateTotals(updatedItems);
      const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

      state.basket = {
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
        const updatedItems = state.basket.items.filter((item) => item.id !== itemId);
        const totals = calculateTotals(updatedItems);
        const { vendors, vendorItems, vendorIds } = updateVendorData(updatedItems);

        state.basket = {
          items: updatedItems,
          vendors,
          vendorItems,
          vendorIds,
          ...totals,
        };
      } else {
        // Update quantity
        const updatedItems = state.basket.items.map((item) => {
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

        state.basket = {
          items: updatedItems,
          vendors,
          vendorItems,
          vendorIds,
          ...totals,
        };
      }
      state.error = null;
    },

    // Clear entire basket
    clearBasket: (state) => {
      state.basket = initialBasket;
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

export const { addToBasket, removeFromBasket, updateQuantity, clearBasket, setLoading, setError, clearError } =
  basketSlice.actions;

export default basketSlice.reducer;
