import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface PopularProductItem {
  id: number | string;
  name: string;
  brand: string;
  price: string;
  images: any[];
  likes?: number;
}

export default function PopularProductsCarousel({
  title = 'TRENDING NOW',
  items = [],
  onPressItem,
}: {
  title?: string;
  items?: PopularProductItem[];
  onPressItem?: (item: PopularProductItem) => void;
}) {
  const cardWidth = screenWidth / 2 - 20;
  const cardHeight = cardWidth * (4 / 3);
  const [currentForId, setCurrentForId] = useState<Record<string | number, number>>({});
  const [outerScrollEnabled, setOuterScrollEnabled] = useState(true);
  const [draggingInner, setDraggingInner] = useState(false);

  const handleImageScroll = (id: string | number, event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const viewW = event.nativeEvent.layoutMeasurement.width;
    const idx = Math.round(x / viewW);
    if (currentForId[id] !== idx) {
      setCurrentForId((prev) => ({ ...prev, [id]: idx }));
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-xs font-poppins-bold text-black mb-3">{title}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={outerScrollEnabled}>
        {items.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => {
              if (!draggingInner) onPressItem?.(product);
            }}
            className="bg-white overflow-hidden mr-2"
            style={{ width: cardWidth }}
          >
            <View className="relative">
              {Array.isArray(product.images) && product.images.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  directionalLockEnabled
                  showsHorizontalScrollIndicator={false}
                  onScrollBeginDrag={() => {
                    setDraggingInner(true);
                    setOuterScrollEnabled(false);
                  }}
                  onScrollEndDrag={() => {
                    setDraggingInner(false);
                    setOuterScrollEnabled(true);
                  }}
                  onMomentumScrollEnd={() => {
                    setDraggingInner(false);
                    setOuterScrollEnabled(true);
                  }}
                  onScroll={(e) => handleImageScroll(product.id, e)}
                  scrollEventThrottle={16}
                  style={{ width: cardWidth, height: cardHeight }}
                >
                  {product.images.map((img, idx) => (
                    <Image
                      key={`${product.id}-${idx}`}
                      source={img}
                      className="rounded-lg"
                      style={{ width: cardWidth, height: cardHeight }}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <Image
                  source={product.images[0]}
                  className="rounded-lg"
                  style={{ width: cardWidth, height: cardHeight }}
                  resizeMode="cover"
                />
              )}
              <View className="absolute bottom-2 right-2 bg-white/60 rounded-xl px-1.5 py-0.5 flex-row items-center">
                <Text className="text-black text-xs mr-2">{product.likes ?? 0}</Text>
                <Feather name="heart" size={12} color="black" />
              </View>
              {Array.isArray(product.images) && product.images.length > 1 && (
                <View
                  className="absolute left-0 right-0 bottom-1.5 flex-row justify-center items-center"
                  pointerEvents="none"
                >
                  {product.images.map((_, dotIdx) => (
                    <View
                      key={dotIdx}
                      className={`w-1.5 h-1.5 rounded-full mx-0.75 ${
                        (currentForId[product.id] ?? 0) === dotIdx ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </View>
              )}
            </View>
            <View className="p-2">
              <Text className="text-xs font-poppins-bold mb-0.5" numberOfLines={1}>
                {product.name}
              </Text>
              <Text className="text-xs font-poppins text-gray-600 mb-0.5" numberOfLines={1}>
                {product.brand}
              </Text>
              <Text className="text-xs font-poppins-semibold">{product.price}</Text>
              <Text className="text-xs font-poppins text-gray-600 mt-0.5">(Official Vint Street Product)</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
