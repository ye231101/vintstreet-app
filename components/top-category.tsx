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
  slug: string;
}

const topCategories: TopCategory[] = [
  {
    id: 1,
    title: 'Caps',
    image: require('@/assets/images/cat/cat_caps.jpg'),
    slug: 'men-accessories-hats-caps',
  },
  {
    id: 2,
    title: 'Denim',
    image: require('@/assets/images/cat/cat_denim.jpg'),
    slug: 'men-clothing-shirts-denim-shirts',
  },
  {
    id: 3,
    title: 'Vinyl',
    image: require('@/assets/images/cat/cat_vinyl.jpg'),
    slug: 'vinyls',
  },
  {
    id: 4,
    title: 'Football Shirts',
    image: require('@/assets/images/cat/cat_football_shirts.jpg'),
    slug: 'footwear',
  },
  {
    id: 5,
    title: 'Games',
    image: require('@/assets/images/cat/cat_games.jpg'),
    slug: 'games',
  },
  {
    id: 6,
    title: 'VeeFriends',
    image: require('@/assets/images/cat/cat_veefriends.jpg'),
    slug: 'veefriends-cards',
  },
];

const TopCategoryCard = ({ category }: { category: TopCategory }) => {
  const handlePress = () => {
    // Navigate to discovery screen with category filter
    router.push(`/(tabs)/discovery?category=${encodeURIComponent(category.slug)}` as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="relative overflow-hidden rounded-lg bg-white border border-gray-200"
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
};

export default function TopCategory() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {topCategories.map((category) => (
          <TopCategoryCard key={category.id} category={category} />
        ))}
      </View>
    </ScrollView>
  );
}
