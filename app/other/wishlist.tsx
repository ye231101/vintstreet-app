import { Product } from '@/api/services/listings.service';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WishlistScreen() {
  const { items: wishlist, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleRemoveFromWishlist = (productId: string) => {
    removeItem(productId);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const navigateToProduct = (itemId: string) => {
    router.push(`/product/${itemId}` as any);
  };

  const WishlistCard = ({ item }: { item: Product }) => (
    <Pressable
      onPress={() => navigateToProduct(item.id)}
      className="bg-white rounded-lg mb-3 overflow-hidden shadow-sm flex-row"
    >
      {/* Product Image */}
      <View className="w-28 h-28">
        <Image
          source={item.product_image}
          contentFit="cover"
          placeholder={{ blurhash }}
          style={{ width: '100%', height: '100%' }}
          transition={300}
        />
      </View>

      {/* Product Info */}
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-base font-inter-semibold mb-1" numberOfLines={1}>
            {item.product_name}
          </Text>
          <Text className="text-xs text-gray-500 font-inter" numberOfLines={1}>
            by {item.seller_info_view?.shop_name || 'Big ship test'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-inter-bold text-black">£{item.starting_price.toFixed(2)}</Text>

          <View className="flex-row gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              className="bg-black rounded-lg px-4 py-2 flex-row items-center gap-2"
            >
              <Feather name="shopping-cart" size={16} color="white" />
              <Text className="text-white text-sm font-inter-medium">Add to Cart</Text>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFromWishlist(item.id);
              }}
              className="bg-gray-100 rounded-lg p-2.5"
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Feather name="heart" color="#999" size={64} />
      <Text className="text-gray-600 text-lg font-inter-medium mt-4 mb-2">Your wishlist is empty</Text>
      <Text className="text-gray-400 text-sm font-inter text-center mb-6">
        Start adding items you love to your wishlist!
      </Text>
      <Pressable onPress={() => router.push('/(tabs)')} className="bg-black rounded-lg py-3 px-6">
        <Text className="text-white text-base font-inter-bold">Browse Products</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#000" />
        </Pressable>

        <Text className="flex-1 text-lg font-inter-bold text-black">My Wishlist</Text>

        {wishlist.length > 0 && (
          <View className="bg-black rounded-full px-3 py-1">
            <Text className="text-white text-sm font-inter-semibold">{wishlist.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {wishlist.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={wishlist}
          renderItem={({ item }) => <WishlistCard item={item} />}
          keyExtractor={(item) => item.id}
          className="px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
