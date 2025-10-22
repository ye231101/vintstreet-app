import { useCart } from '@/hooks/use-cart';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Use the interfaces from the cart slice
import { Cart, CartItem } from '@/store/slices/cartSlice';

export default function CartScreen() {
  const { cart, isLoading, error, removeItem, updateItemQuantity, clearAll } = useCart();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Cart data is managed by the provider

  const refreshCart = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Cart data is managed by the provider, no need to reload
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCart = () => {
    clearAll();
    setShowClearModal(false);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateItemQuantity(itemId, quantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const proceedToCheckout = () => {
    router.push('/checkout');
  };

  const VendorItemSection = ({
    cartItem,
    onQuantityChanged,
    onRemove,
  }: {
    cartItem: CartItem;
    onQuantityChanged: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
  }) => {
    return (
      <View className="bg-white rounded-xl mb-4">
        {/* Vendor Header */}
        <View className="flex-row items-center p-4 border-b border-gray-100">
          <Feather name="shopping-bag" color="#333" size={20} />
          <Text className="text-base font-inter-bold text-gray-800 ml-2 flex-1">{cartItem.product.product_name}</Text>
        </View>

        {/* Items */}
        <View key={cartItem.product.id}>
          <View className="flex-row p-4 items-center">
            {/* Product Image */}
            <View className="w-20 h-20 rounded-lg bg-gray-100 mr-3 overflow-hidden">
              <Image
                source={{ uri: cartItem.product.product_image || undefined }}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            {/* Product Details */}
            <View className="flex-1">
              <Text className="text-base font-inter-bold text-gray-800 mb-1" numberOfLines={2}>
                {cartItem.product.product_name}
              </Text>
              <Text className="text-lg font-inter-bold text-gray-800 mb-1">
                £{cartItem.product.starting_price.toFixed(2)}
              </Text>
              <Text className="text-xs font-inter text-gray-600">D&@</Text>
            </View>

            {/* Remove Button */}
            <TouchableOpacity onPress={() => onRemove(cartItem.product.id)} className="absolute top-4 right-4 p-1">
              <Feather name="x" color="#999" size={20} />
            </TouchableOpacity>

            {/* Quantity Controls */}
            <View className="flex-row items-center mt-2">
              <TouchableOpacity
                onPress={() => onQuantityChanged(cartItem.product.id, cartItem.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
              >
                <Feather name="minus" color="#333" size={16} />
              </TouchableOpacity>

              <Text className="text-base font-inter-bold text-gray-800 mx-4 min-w-5 text-center">
                {cartItem.quantity}
              </Text>

              <TouchableOpacity
                onPress={() => onQuantityChanged(cartItem.product.id, cartItem.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
              >
                <Feather name="plus" color="#333" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Vendor Totals */}
        <View className="p-4 border-t border-gray-100">
          <View className="flex-row justify-between mb-4">
            <Text className="text-base font-inter-bold text-gray-800">Vendor Total</Text>
            <Text className="text-base font-inter-bold text-gray-800">
              £{cartItem.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <TouchableOpacity className="bg-black rounded-lg py-3 px-6 items-center">
            <Text className="text-white text-base font-inter-bold">Checkout with {cartItem.product.product_name}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const CartSummary = ({ cart }: { cart: Cart }) => (
    <View className="bg-white p-4 border-t border-gray-100">
      <View className="flex-row justify-between mb-4">
        <Text className="text-lg font-inter-bold text-gray-800">Total</Text>
        <Text className="text-lg font-inter-bold text-gray-800">{cart.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Your Cart</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Your Cart</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={48} />
          <Text className="text-white text-lg font-inter-bold mt-4 mb-2">Error loading cart</Text>
          <Text className="text-gray-400 text-sm font-inter text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={refreshCart} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Your Cart</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="shopping-bag" color="#999" size={64} />
          <Text className="text-white text-lg font-inter-bold mt-4 mb-2">Your cart is empty</Text>
          <Text className="text-gray-400 text-sm font-inter text-center mb-4">
            Items you add to your cart will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-white">Your Cart</Text>

        <TouchableOpacity onPress={() => setShowClearModal(true)} className="mr-4 p-2">
          <Feather name="trash-2" color="#fff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={refreshCart} className="p-2">
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="refresh-cw" color="#fff" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshCart} tintColor="#007AFF" />}
          className="flex-1"
        >
          <View className="p-4">
            {/* Display items by vendor */}
            <View className="flex-1">
              {cart.items.map((item) => (
                <VendorItemSection
                  key={item.product.id}
                  cartItem={item}
                  onQuantityChanged={(productId, quantity) => handleUpdateQuantity(productId, quantity)}
                  onRemove={(productId) => handleRemoveItem(productId)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Cart Summary */}
        <CartSummary cart={cart} />

        {/* Checkout Button */}
        <View className="px-4 py-2 pb-4">
          <TouchableOpacity onPress={proceedToCheckout} className="bg-black rounded-lg py-4 items-center">
            <Text className="text-white text-base font-inter-bold">Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clear Cart Modal */}
      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-inter-bold text-gray-800 mb-4 text-center">Clear Cart</Text>
            <Text className="text-base font-inter text-gray-600 mb-6 text-center">
              Are you sure you want to remove all items from your cart?
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowClearModal(false)}
                className="flex-1 bg-gray-100 rounded-lg py-3 mr-2 items-center"
              >
                <Text className="text-gray-800 text-base font-inter-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearCart}
                className="flex-1 bg-red-500 rounded-lg py-3 ml-2 items-center"
              >
                <Text className="text-white text-base font-inter-bold">Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
