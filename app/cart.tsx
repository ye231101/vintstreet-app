import { CartItem } from '@/api/services/cart.service';
import { useCart } from '@/hooks/use-cart';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { cart, isLoading, error, removeItem, clearAll, refreshCart } = useCart();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleRefreshCart = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshCart();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCart = () => {
    clearAll();
    setShowClearModal(false);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleCartItemCheckout = (productId: string) => {
    router.push(`/checkout?productId=${productId}`);
  };

  const CartItemSection = ({ cartItem, onRemove }: { cartItem: CartItem; onRemove: (productId: string) => void }) => {
    if (!cartItem.product) return null;

    const product = cartItem.product;

    return (
      <View key={product.id} className="rounded-xl overflow-hidden bg-white border border-gray-400">
        <View className="flex-row items-center gap-3 p-4 bg-gray-200">
          <Feather name="shopping-cart" color="#000" size={20} />
          <Text className="text-base font-inter-bold text-gray-800">Sold by {product.seller_info_view?.shop_name}</Text>
        </View>

        <View className="flex-row items-center gap-3 p-4 border-t border-gray-200">
          <View className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden">
            <Image
              source={product.product_image}
              contentFit="cover"
              placeholder={{ blurhash }}
              transition={1000}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          <View className="flex-1 gap-2">
            <Text className="text-base font-inter-semibold text-gray-800" numberOfLines={2}>
              {product.product_name}
            </Text>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-lg font-inter-bold text-gray-800">
                £
                {product.discounted_price !== null
                  ? product.discounted_price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : product.starting_price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </Text>
              <TouchableOpacity onPress={() => onRemove(product.id)}>
                <Feather name="trash-2" color="#ff4444" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => handleCartItemCheckout(product.id)}
            className="items-center justify-center px-6 py-3 rounded-lg bg-black"
          >
            <Text className="text-center text-base font-inter-bold text-white">
              Checkout with {product.product_name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Your Cart</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Your Cart</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <Feather name="alert-circle" color="#ff4444" size={48} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading cart</Text>
          <TouchableOpacity onPress={handleRefreshCart} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Your Cart</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <Feather name="shopping-bag" color="#999" size={64} />
          <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-900">Your cart is empty</Text>
          <Text className="mb-4 text-sm font-inter text-center text-gray-600">Add some items to get started!</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Your Cart</Text>

        <TouchableOpacity onPress={() => setShowClearModal(true)} hitSlop={8} className="mr-8">
          <Feather name="trash-2" color="#fff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRefreshCart}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="refresh-cw" color="#fff" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshCart} tintColor="#007AFF" />}
        className="flex-1 bg-gray-50"
      >
        <View className="flex-1 gap-4 p-4">
          {cart.items.map((item) => (
            <CartItemSection
              key={item.product?.id || item.id}
              cartItem={item}
              onRemove={(productId) => handleRemoveItem(productId)}
            />
          ))}
        </View>
      </ScrollView>

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
