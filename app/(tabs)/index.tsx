import { listingsService, Product } from '@/api/services/listings.service';
import ArticleCarousel from '@/components/article-carousel';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface TopCategory {
  title: string;
  image: string;
}

const topCategories = [
  {
    title: 'Caps',
    image: require('@/assets/images/cat_caps.jpg'),
  },
  {
    title: 'Denim',
    image: require('@/assets/images/cat_denim.jpg'),
  },
  {
    title: 'Vinyl',
    image: require('@/assets/images/cat_vinyl.jpg'),
  },
  {
    title: 'Football Shirts',
    image: require('@/assets/images/cat_football_shirts.jpg'),
  },
  {
    title: 'Gaming',
    image: require('@/assets/images/cat_gaming.jpg'),
  },
  {
    title: "Levi's",
    image: require('@/assets/images/cat_levis.jpg'),
  },
  {
    title: 'Nike',
    image: require('@/assets/images/cat_nike.jpg'),
  },
  {
    title: 'Tees',
    image: require('@/assets/images/cat_tees.jpg'),
  },
  {
    title: 'VeeFriends',
    image: require('@/assets/images/cat_veefriends.jpg'),
  },
  {
    title: 'Y2K',
    image: require('@/assets/images/cat_y2k.jpg'),
  },
];

const TopCategoryCard = ({ category }: { category: TopCategory }) => (
  <Pressable
    key={category.title}
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

interface Brand {
  name: string;
  image: string;
}

const brands = [
  {
    name: "Levi's",
    image: 'https://1000logos.net/wp-content/uploads/2017/03/Levis-Logo.png',
  },
  {
    name: 'Adidas',
    image: 'https://1000logos.net/wp-content/uploads/2016/10/Adidas-Logo.png',
  },
  {
    name: 'H&M',
    image: 'https://1000logos.net/wp-content/uploads/2017/02/HM-Logo.png',
  },
  {
    name: 'Nike',
    image: 'https://1000logos.net/wp-content/uploads/2021/11/Nike-Logo.png',
  },
  {
    name: 'Zara',
    image: 'https://1000logos.net/wp-content/uploads/2022/08/Zara-logо.png',
  },
  {
    name: 'Gucci',
    image: 'https://1000logos.net/wp-content/uploads/2017/01/Gucci-Logo.png',
  },
];

const BrandCard = ({ brand }: { brand: Brand }) => (
  <View
    className="bg-white rounded-lg p-2 mr-2 mb-2 border border-gray-200 items-center justify-center"
    style={{
      width: screenWidth / 3,
      height: screenWidth / 4,
    }}
  >
    <Image source={brand.image} contentFit="contain" transition={1000} style={{ width: '100%', height: '100%' }} />
  </View>
);

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (searchKeyword: string = '') => {
    try {
      setIsLoading(true);
      setError(null);

      if (searchKeyword.trim()) {
        const results = await listingsService.searchListings(searchKeyword);
        setProducts(results);
      } else {
        const apiProducts = await listingsService.getListings();
        setProducts(apiProducts);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const apiProducts = await listingsService.getListings();
      setProducts(apiProducts);
      setError(null);
    } catch (err) {
      console.error('Error refreshing:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 mb-50 bg-black">
      {/* Search Bar */}
      <SearchBar value={searchText} onChangeText={(text) => setSearchText(text)} onSearch={fetchProducts} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 gap-6 py-4 bg-gray-50">
          {/* Quick Links Section */}
          <View className="px-2">
            <Text className="text-sm font-inter-bold text-black mb-3">QUICK LINKS</Text>
            <ArticleCarousel />
          </View>

          {/* Top Categories Section */}
          <View className="pl-2">
            <Text className="text-sm font-inter-bold text-black mb-3">TOP CATEGORIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topCategories.map((category) => (
                <TopCategoryCard key={category.title} category={category} />
              ))}
            </ScrollView>
          </View>

          {/* Brands Section */}
          <View className="pl-2">
            <Text className="text-sm font-inter-bold text-black mb-3">BRANDS YOU MAY LIKE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({ length: Math.ceil(brands.length / 2) }).map((_, colIndex) => {
                const first = brands[colIndex * 2];
                const second = brands[colIndex * 2 + 1];
                return (
                  <View key={colIndex}>
                    {first && <BrandCard brand={first} />}
                    {second && <BrandCard brand={second} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* All Listings Section */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center p-4">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading products...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center p-4">
              <Feather name="alert-circle" color="#ff4444" size={48} />
              <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading products</Text>
              <TouchableOpacity onPress={() => fetchProducts()} className="bg-black rounded-lg py-3 px-6">
                <Text className="text-base font-inter-bold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-2">
              <Text className="text-sm font-inter-bold text-black mb-3">ALL LISTINGS</Text>
              <View className="flex-row flex-wrap justify-between gap-2">
                {products.length > 0 ? (
                  products.map((item) => (
                    <ProductCard key={item.id} product={item} onPress={() => router.push(`/product/${item.id}`)} />
                  ))
                ) : (
                  <View className="flex-1 justify-center items-center p-4 bg-gray-50">
                    <Feather name="shopping-bag" color="#999" size={64} />
                    <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-900">No products found</Text>
                    <TouchableOpacity onPress={() => fetchProducts()} className="bg-black rounded-lg py-3 px-6">
                      <Text className="text-base font-inter-bold text-white">Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
