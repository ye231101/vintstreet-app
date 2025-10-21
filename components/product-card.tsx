import { blurhash } from '@/utils';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface Product {
  id: string | number;
  name: string;
  brand: string;
  price: string;
  originalPrice?: string;
  image: any;
  likes: number;
  size?: string;
  protectionFee?: string;
}

export interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  width?: number;
  height?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  width = screenWidth / 2 - 12,
  height = width * (4 / 3),
}) => {
  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ width }}>
      <View className="relative">
        <Image
          source={product.image}
          contentFit="cover"
          placeholder={{ blurhash }}
          style={{ width, height }}
          transition={1000}
        />

        <View className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-sm">
          <Feather name="heart" size={18} color="black" />
        </View>
      </View>

      <View className="p-4">
        <Text className="text-sm font-inter mb-3 leading-5" numberOfLines={1}>
          {product.name}
        </Text>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-inter-bold text-black mb-1">{product.price}</Text>
            {product.originalPrice && (
              <Text className="text-sm font-inter text-gray-400 line-through">{product.originalPrice}</Text>
            )}
          </View>

          <Pressable 
            onPress={(e) => {
              e?.stopPropagation();
              onAddToCart?.();
            }}
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
