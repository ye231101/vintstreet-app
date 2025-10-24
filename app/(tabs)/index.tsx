import { listingsService, Product } from '@/api/services/listings.service';
import ArticleCarousel from '@/components/article-carousel';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const brands = [
  {
    name: "Levi's",
    image: 'https://www.citypng.com/public/uploads/preview/levis-black-logo-hd-png-70175169470713089bqxrjlb3.png',
  },
  {
    name: 'Adidas',
    image: 'https://1000logos.net/wp-content/uploads/2019/06/Adidas-Logo-1991.jpg',
  },
  {
    name: 'H&M',
    image: 'https://1000logos.net/wp-content/uploads/2017/02/H-Logo-1999.png',
  },
  {
    name: 'Nike',
    image:
      'https://static.vecteezy.com/system/resources/previews/010/994/412/original/nike-logo-black-with-name-clothes-design-icon-abstract-football-illustration-with-white-background-free-vector.jpg',
  },
  {
    name: 'Zara',
    image: 'https://1000logos.net/wp-content/uploads/2017/05/Zara-Logo-2008.png',
  },
  {
    name: 'Gucci',
    image: 'https://1000logos.net/wp-content/uploads/2017/03/Gucci-Logo-2015.png',
  },
];

const topCategories = [
  {
    title: 'Caps',
    image: require('@/assets/images/cat_caps.png'),
  },
  {
    title: 'Denim',
    image: require('@/assets/images/cat_denim.png'),
  },
  {
    title: 'Vinyl',
    image: require('@/assets/images/cat_vinyl.png'),
  },
  {
    title: 'Football Shirts',
    image: require('@/assets/images/cat_football_shirts.png'),
  },
  {
    title: 'Gaming',
    image: require('@/assets/images/cat_gaming.png'),
  },
  {
    title: "Levi's",
    image: require('@/assets/images/cat_levis.png'),
  },
  {
    title: 'Nike',
    image: require('@/assets/images/cat_nike.png'),
  },
  {
    title: 'Tees',
    image: require('@/assets/images/cat_tees.png'),
  },
  {
    title: 'Y2K',
    image: require('@/assets/images/cat_y2k.png'),
  },
];

interface Brand {
  name: string;
  image: any;
}

const BrandCard = ({ brand }: { brand: Brand }) => (
  <View
    className="bg-white rounded-lg mr-2 mb-2 border border-gray-200 items-center justify-center"
    style={{
      width: screenWidth / 3,
      height: (screenWidth / 3) * (3 / 4),
    }}
  >
    <Image source={{ uri: brand.image }} className="w-4/5 h-3/5" resizeMode="contain" />
    <Text className="text-xs font-inter mt-2">{brand.name}</Text>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  // Listings state from Supabase
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Search functionality
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setIsLoadingListings(true);
      setListingsError(null);
      const apiProducts = await listingsService.getListings();
      setListings(apiProducts);
    } catch (err) {
      console.error('Error loading listings:', err);
      setListings([]);
      setListingsError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setIsLoadingListings(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (showSearchResults) {
        // Refresh search results
        await handleSearch();
      } else {
        // Refresh listings
        const apiProducts = await listingsService.getListings();
        setListings(apiProducts);
        setListingsError(null);
      }
    } catch (err) {
      console.error('Error refreshing:', err);
      if (!showSearchResults) {
        setListingsError(err instanceof Error ? err.message : 'Failed to refresh listings');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const handleCategoryPress = (categoryName: string) => {
    router.push(`/(tabs)/discovery?category=${encodeURIComponent(categoryName)}`);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const results = await listingsService.searchListings(searchText.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Bar */}
      <SearchBar value={searchText} onChangeText={handleSearchTextChange} onSearch={handleSearch} />

      {showSearchResults ? (
        // Search Results View
        isSearching ? (
          <View className="flex-1 items-center justify-center p-2">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-gray-600 mt-2">Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <View className="flex-1">
            <View className="px-4 py-2 bg-gray-100">
              <Text className="text-xl text-gray-600">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "
                <Text className="text-red-500 underline decoration-red-500 decoration-2 underline-offset-2">
                  {searchText}
                </Text>
                "
              </Text>
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item.id)} />}
              contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="search" size={64} color="#ccc" />
            <Text className="text-lg font-inter-bold text-gray-500 text-center mt-4">No results found</Text>
            <Text className="text-gray-400 text-center mt-2">Try searching with different keywords</Text>
          </View>
        )
      ) : isLoadingListings ? (
        <View className="flex-1 items-center justify-center p-2">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : listingsError ? (
        <View className="flex-1 items-center justify-center gap-2 p-2">
          <Feather name="alert-circle" size={64} color="#ff4444" />
          <Text className="text-lg font-inter-bold text-red-600 text-center">{listingsError}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-2"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Quick Links Section */}
          <View className="mb-6 mt-4">
            <Text className="text-xs font-inter-bold text-black mb-3">QUICK LINKS</Text>
            <ArticleCarousel />
          </View>

          {/* Top Categories Section */}
          <View className="mb-6">
            <Text className="text-xs font-inter-bold text-black mb-3">TOP CATEGORIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topCategories.map((cat) => {
                const cardWidth = screenWidth / 2;
                const cardHeight = cardWidth * (9 / 16);
                return (
                  <Pressable
                    key={cat.title}
                    onPress={() => handleCategoryPress(cat.title)}
                    className="mr-2 rounded-lg overflow-hidden relative border border-gray-200"
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                    }}
                  >
                    <Image source={cat.image} className="w-full h-full" resizeMode="cover" />
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
                    <View className="absolute left-3 right-3 bottom-3 flex-row justify-between items-center">
                      <Text className="text-base font-inter-bold text-white" numberOfLines={1}>
                        {cat.title}
                      </Text>
                      <Feather name="chevron-right" size={16} color="white" />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Brands Section */}
          <View className="mb-6">
            <Text className="text-xs font-inter-bold text-black mb-3">BRANDS YOU MAY LIKE</Text>
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
          <View className="mb-6">
            <Text className="text-xs font-inter-bold text-black mb-3">ALL LISTINGS</Text>
            <View className="flex-row flex-wrap justify-between">
              {listings.map((item) => (
                <ProductCard key={item.id} product={item} onPress={() => handleProductPress(item.id)} />
              ))}
            </View>
          </View>

          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
