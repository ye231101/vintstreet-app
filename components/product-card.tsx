import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface Product {
  id: string | number;
  name: string;
  brand: string;
  price: string;
  image: any;
  likes: number;
  size?: string;
  protectionFee?: string;
}

export interface ProductCardProps {
  product: Product;
  showSize?: boolean;
  showProtectionFee?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showSize = false,
  showProtectionFee = false,
  onPress,
  width = screenWidth / 2 - 12,
  height = width * (4 / 3),
}) => {
  return (
    <Pressable className="bg-white overflow-hidden" style={{ width }} onPress={onPress}>
      <View className="relative">
        <Image source={product.image} className="w-full rounded-lg" style={{ height }} resizeMode="cover" />

        {/* Like Button */}
        <View className="absolute bottom-2 right-2 bg-white/60 rounded-xl px-1.5 py-0.5 flex-row items-center">
          <Text className="text-black text-xs mr-2">{product.likes}</Text>
          <Feather name="heart" size={12} color="black" />
        </View>
      </View>

      <View className="p-3">
        <Text className="text-xs font-inter mb-1 leading-4" numberOfLines={2}>
          {product.name}
        </Text>

        <Text className="text-xs font-inter text-gray-600 mb-1" numberOfLines={1}>
          {product.brand}
        </Text>

        {showSize && product.size && (
          <Text className="text-xs font-inter text-gray-600 mb-1" numberOfLines={1}>
            {product.size}
          </Text>
        )}

        <Text className="text-sm font-inter-semibold mb-0.5 text-black">{product.price}</Text>

        {showProtectionFee && product.protectionFee && (
          <Text className="text-xs font-inter text-gray-600 mb-0.5">({product.protectionFee} Protection Fee)</Text>
        )}

        <Text className="text-xs font-inter text-gray-600 mt-0.5">(Official Vint Street Product)</Text>
      </View>
    </Pressable>
  );
};

export default ProductCard;
