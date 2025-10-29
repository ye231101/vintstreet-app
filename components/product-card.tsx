import { Product } from '@/api';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash } from '@/utils';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
  const { addItem, cart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const isInCart = cart.items.some((cartItem) => cartItem.product?.id === product.id);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      await addItem(product);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
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
          <FontAwesome
            name={isWishlisted ? 'heart' : 'heart-o'}
            size={18}
            color={isWishlisted ? '#ef4444' : 'black'}
          />
        </Pressable>
      </View>

      <View className="p-4">
        <Text className="text-sm font-inter-semibold mb-3 leading-5" numberOfLines={1}>
          {product.product_name}
        </Text>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-inter-bold text-black mb-1">
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
            {product.discounted_price !== null && (
              <Text className="text-sm font-inter-semibold text-gray-400 line-through">
                £
                {product.starting_price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleAddToCart}
            disabled={isAddingToCart || isInCart}
            className={`${
              isInCart ? 'bg-gray-100 border-2 border-gray-300' : 'bg-white border border-gray-200'
            } rounded-lg w-10 h-10 items-center justify-center`}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#000" />
            ) : isInCart ? (
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
