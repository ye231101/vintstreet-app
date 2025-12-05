import { Product } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash } from '@/utils';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WishlistScreen() {
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const { items: wishlist, removeItem, isLoading, refreshWishlist, clearWishlist } = useWishlist();
  const { addItem: addToCart, items } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWishlist();
    setRefreshing(false);
  }, [refreshWishlist]);

  const handleRefreshWishlist = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshWishlist();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearWishlist = () => {
    clearWishlist();
    setShowClearModal(false);
  };

  const handleRemoveFromWishlist = async (productId: string, productName: string) => {
    await removeItem(productId, productName);
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      const currentPath = '/' + segments.join('/');
      router.push(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check if item is already in cart
    const existingItem = items.find((item) => item.product?.id === product.id);
    if (existingItem) {
      return;
    }
    try {
      setAddingToCartId(product.id);
      await addToCart(product);
    } catch (error) {
      logger.error('Error adding to cart:', error);
    } finally {
      setAddingToCartId(null);
    }
  };

  const navigateToProduct = (itemId: string) => {
    router.push(`/product/${itemId}` as unknown);
  };

  const WishlistCard = ({ item }: { item: Product }) => {
    const hasDiscount = item.discounted_price && item.discounted_price < item.starting_price;
    const finalPrice = item.discounted_price || item.starting_price;
    const isInCart = items.some((item) => item.product?.id === item.id);

    return (
      <TouchableOpacity
        onPress={() => navigateToProduct(item.id)}
        activeOpacity={0.7}
        className="bg-white rounded-lg mb-4 shadow-lg"
      >
        <View className="flex-row items-center">
          {/* Product Image */}
          <View className="w-28 h-28 rounded-lg overflow-hidden">
            <Image
              source={item.product_image}
              contentFit="cover"
              placeholder={{ blurhash }}
              style={{ width: '100%', height: '100%' }}
              transition={300}
            />
          </View>

          {/* Product Info */}
          <View className="flex-1 p-4 justify-between">
            <View className="mb-2">
              <Text className="text-gray-900 font-inter-medium text-base mb-1" numberOfLines={1}>
                {item.product_name}
              </Text>
              <Text className="text-gray-600 text-sm font-inter" numberOfLines={1}>
                by {item.seller_info_view?.shop_name || 'Seller'}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                {hasDiscount ? (
                  <View>
                    <Text className="text-gray-900 font-inter-bold text-base">
                      £{finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text className="text-gray-400 text-xs font-inter-semibold line-through">
                      £
                      {item.starting_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-900 font-inter-bold text-base">
                    £{finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleAddToCart(item)}
                  disabled={addingToCartId === item.id || isInCart}
                  className={`${
                    isInCart ? 'bg-gray-100 border border-gray-200' : 'bg-black border border-black'
                  } rounded-lg px-3 py-2 flex-row items-center gap-1.5`}
                >
                  {addingToCartId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : isInCart ? (
                    <Feather name="check" size={16} color="#000" />
                  ) : (
                    <Feather name="shopping-cart" size={16} color="white" />
                  )}
                  <Text className={`${isInCart ? 'text-black' : 'text-white'} text-base font-inter-medium`}>
                    {addingToCartId === item.id ? 'Adding...' : isInCart ? 'Added to Cart' : 'Add'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemoveFromWishlist(item.id, item.product_name)}
                  className="items-center justify-center bg-gray-100 border border-gray-200 rounded-lg p-2"
                >
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">My Wishlist</Text>

        <TouchableOpacity onPress={() => setShowClearModal(true)} hitSlop={8}>
          <Feather name="trash-2" color="#000" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRefreshWishlist} hitSlop={8}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="refresh-cw" color="#000" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {isLoading && !refreshing && wishlist.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading your wishlist...</Text>
          </View>
        ) : wishlist.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="heart" color="#666" size={64} />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4">Your wishlist is empty</Text>
            <Text className="text-gray-600 text-sm font-inter text-center mt-2 mb-6">
              Start adding items you love to your wishlist!
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} className="px-6 py-3 rounded-lg bg-black">
              <Text className="text-white text-base font-inter-bold">Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ flexGrow: 1 }}
            className="p-4"
          >
            {wishlist.map((item) => (
              <WishlistCard key={item.id} item={item.product} />
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-inter-bold text-black mb-4 text-center">Clear Wishlist</Text>
            <Text className="text-base font-inter-semibold text-gray-600 mb-6 text-center">
              Are you sure you want to remove all items from your wishlist?
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowClearModal(false)}
                className="flex-1 bg-gray-100 rounded-lg py-3 mr-2 items-center"
              >
                <Text className="text-black text-base font-inter-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearWishlist}
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
