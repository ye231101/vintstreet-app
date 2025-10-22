import { Product } from '@/api/services/listings.service';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash } from '@/utils';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';

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
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product);
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
            fill={isWishlisted ? '#ef4444' : 'transparent'}
          />
        </Pressable>
      </View>

      <View className="p-4">
        <Text className="text-sm font-inter mb-3 leading-5" numberOfLines={1}>
          {product.product_name}
        </Text>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-inter-bold text-black mb-1">
              £{product.starting_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            {product.discounted_price && (
              <Text className="text-sm font-inter text-gray-400 line-through">
                £
                {product.discounted_price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleAddToCart}
            className="bg-white border border-gray-200 rounded-lg w-10 h-10 items-center justify-center"
          >
            <Feather name="plus" size={20} color="black" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default ProductCard;
