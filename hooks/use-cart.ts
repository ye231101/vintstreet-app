import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCart,
  selectCartError,
  selectCartFormattedTotal,
  selectCartItemByProductId,
  selectCartItemCount,
  selectCartItemCountByProduct,
  selectCartLoading,
  selectCartTotal,
  selectIsCartEmpty,
} from '@/store/selectors/cartSelectors';
import {
  addToCart,
  CartItem,
  clearCart,
  clearError,
  removeFromCart,
  setError,
  updateQuantity,
} from '@/store/slices/cartSlice';

export const useCart = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const cart = useAppSelector(selectCart);
  const isLoading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const itemCount = useAppSelector(selectCartItemCount);
  const total = useAppSelector(selectCartTotal);
  const formattedTotal = useAppSelector(selectCartFormattedTotal);
  const isEmpty = useAppSelector(selectIsCartEmpty);

  // Actions
  const addItem = (itemData: Omit<CartItem, 'id' | 'lineTotal' | 'protectionFee'>) => {
    dispatch(addToCart(itemData));
  };

  const removeItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    dispatch(updateQuantity({ itemId, quantity }));
  };

  const clearAll = () => {
    dispatch(clearCart());
  };

  const setCartError = (errorMessage: string | null) => {
    dispatch(setError(errorMessage));
  };

  const clearCartError = () => {
    dispatch(clearError());
  };

  // Utility functions
  const getItemByProductId = (productId: number, vendorId: number) => {
    return useAppSelector(selectCartItemByProductId(productId, vendorId));
  };

  const getItemCountByProduct = (productId: number, vendorId: number) => {
    return useAppSelector(selectCartItemCountByProduct(productId, vendorId));
  };

  return {
    // State
    cart,
    isLoading,
    error,
    itemCount,
    total,
    formattedTotal,
    isEmpty,

    // Actions
    addItem,
    removeItem,
    updateItemQuantity,
    clearAll,
    setCartError,
    clearCartError,

    // Utility functions
    getItemByProductId,
    getItemCountByProduct,
  };
};
