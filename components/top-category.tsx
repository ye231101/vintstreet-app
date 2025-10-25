import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface TopCategory {
  id: number;
  title: string;
  image: string;
}

const topCategories: TopCategory[] = [
  {
    id: 1,
    title: 'Caps',
    image: require('@/assets/images/cat/cat_caps.jpg'),
  },
  {
    id: 2,
    title: 'Denim',
    image: require('@/assets/images/cat/cat_denim.jpg'),
  },
  {
    id: 3,
    title: 'Vinyl',
    image: require('@/assets/images/cat/cat_vinyl.jpg'),
  },
  {
    id: 4,
    title: 'Football Shirts',
    image: require('@/assets/images/cat/cat_football_shirts.jpg'),
  },
  {
    id: 5,
    title: 'Gaming',
    image: require('@/assets/images/cat/cat_gaming.jpg'),
  },
  {
    id: 6,
    title: "Levi's",
    image: require('@/assets/images/cat/cat_levis.jpg'),
  },
  {
    id: 7,
    title: 'Nike',
    image: require('@/assets/images/cat/cat_nike.jpg'),
  },
  {
    id: 8,
    title: 'Tees',
    image: require('@/assets/images/cat/cat_tees.jpg'),
  },
  {
    id: 9,
    title: 'VeeFriends',
    image: require('@/assets/images/cat/cat_veefriends.jpg'),
  },
  {
    id: 10,
    title: 'Y2K',
    image: require('@/assets/images/cat/cat_y2k.jpg'),
  },
];

const TopCategoryCard = ({ category }: { category: TopCategory }) => (
  <Pressable
    onPress={() => router.push(`/(tabs)/discovery?category=${encodeURIComponent(category.title)}` as any)}
    className="relative mr-2 overflow-hidden rounded-lg border border-gray-200"
    style={{
      width: screenWidth / 2,
      height: (screenWidth / 2) * (9 / 16),
    }}
  >
    <Image source={category.image} contentFit="cover" transition={1000} style={{ width: '100%', height: '100%' }} />
    {/* 3-step gradient overlay */}
    <View className="absolute inset-0 bg-transparent">
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        locations={[0.0, 0.5, 0.8]}
        className="absolute inset-0"
      />
    </View>
    {/* Title with arrow */}
    <View className="absolute left-3 right-3 bottom-3 flex-row items-center justify-between">
      <Text className="text-base font-inter-bold text-white" numberOfLines={1}>
        {category.title}
      </Text>
      <Feather name="chevron-right" size={16} color="white" />
    </View>
  </Pressable>
);

export default function TopCategory() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {topCategories.map((category) => (
        <TopCategoryCard key={category.id} category={category} />
      ))}
    </ScrollView>
  );
}
