import { Product } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash, formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  width?: number;
  height?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  width = screenWidth / 2 - 12,
  height = width * (4 / 3),
}) => {
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const { addItem, isInCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isCarted = isInCart(product.id);
  const isWishlisted = isInWishlist(product.id);

  const redirectToLogin = () => {
    const currentPath = '/' + segments.join('/');
    router.push(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    try {
      setIsAddingToCart(true);
      await addItem(product);
    } catch (error) {
      logger.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    toggleItem(product);
  };

  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ width }}>
      <View className="relative">
        <Image
          source={product.product_image}
          contentFit="cover"
          placeholder={{ blurhash }}
          style={{ width, height }}
          transition={1000}
        />

        <Pressable
          onPress={handleToggleWishlist}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-sm"
        >
          <FontAwesome name={isWishlisted ? 'heart' : 'heart-o'} size={18} color={isWishlisted ? '#ef4444' : 'black'} />
        </Pressable>
      </View>

      <View className="p-4">
        <Text className="text-sm font-inter-semibold mb-3 leading-5" numberOfLines={1}>
          {product.product_name}
        </Text>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-inter-bold text-black mb-1">
              £{formatPrice(product.discounted_price || product.starting_price)}
            </Text>
            {product.discounted_price !== null && (
              <Text className="text-sm font-inter-semibold text-gray-400 line-through">
                £{formatPrice(product.starting_price)}
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleAddToCart}
            disabled={isAddingToCart || isCarted}
            className={`${
              isCarted ? 'bg-gray-100 border-2 border-gray-300' : 'bg-white border border-gray-200'
            } rounded-lg w-10 h-10 items-center justify-center`}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#000" />
            ) : isCarted ? (
              <Feather name="check" size={20} color="#000" />
            ) : (
              <Feather name="shopping-cart" size={20} color="#000" />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default ProductCard;
