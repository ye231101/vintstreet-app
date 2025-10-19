import { typesenseService } from '@/api/services';
import ArticleCarousel from '@/components/article-carousel';
import FilterSortBar from '@/components/filter-sort-bar';
import PopularProductsCarousel from '@/components/popular-products-carousel';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
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

const eras = [
  {
    name: '70s',
    decade: '1970s',
    color: '#E91E63',
    image: require('@/assets/images/70s.jpg'),
  },
  {
    name: '80s',
    decade: '1980s',
    color: '#9C27B0',
    image: require('@/assets/images/80s.jpg'),
  },
  {
    name: '90s',
    decade: '1990s',
    color: '#2196F3',
    image: require('@/assets/images/90s.jpg'),
  },
  {
    name: '00s',
    decade: '2000s',
    color: '#4CAF50',
    image: require('@/assets/images/00s.jpg'),
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
    <Text className="text-xs font-poppins mt-2">{brand.name}</Text>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const { items: recentlyViewedItems, isInitialized: recentlyViewedInitialized } = useRecentlyViewed();
  const [trendingProductsData, setTrendingProductsData] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [recentlyAddedProductsData, setRecentlyAddedProductsData] = useState<any[]>([]);
  const [isLoadingRecentlyAdded, setIsLoadingRecentlyAdded] = useState(true);
  const [indieItemsData, setIndieItemsData] = useState<any[]>([]);
  const [isLoadingIndieItems, setIsLoadingIndieItems] = useState(true);

  // Search functionality
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [sortBy, setSortBy] = useState('Most Relevant');

  // Fetch all product sections on mount
  useEffect(() => {
    fetchTrendingProducts();
    fetchRecentlyAddedProducts();
    fetchIndieItems();
  }, []);

  const fetchTrendingProducts = async () => {
    try {
      setIsLoadingTrending(true);
      const response = await typesenseService.getPopularProducts(30);

      // Convert Typesense results to carousel format
      const products = response.hits.map((hit) => {
        const listing = typesenseService.convertToVintStreetListing(hit.document);

        // Use thumbnail URLs for better performance, fallback to full images
        const imageUrls = listing.thumbnailImageUrls.length > 0 ? listing.thumbnailImageUrls : listing.fullImageUrls;

        return {
          id: listing.id,
          name: listing.name,
          brand: listing.brand || 'No Brand',
          price: `£${listing.price.toFixed(2)}`,
          images: imageUrls.map((url) => ({ uri: url })),
          likes: listing.favoritesCount,
        };
      });

      setTrendingProductsData(products);
      console.log(`Loaded ${products.length} trending products`);
    } catch (error) {
      console.error('Error fetching trending products:', error);
      // Keep empty array on error, carousel will show nothing
      setTrendingProductsData([]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const fetchRecentlyAddedProducts = async () => {
    try {
      setIsLoadingRecentlyAdded(true);
      const response = await typesenseService.getRecentlyAddedProducts(10);

      // Convert Typesense results to product card format
      const products = response.hits.map((hit) => {
        const listing = typesenseService.convertToVintStreetListing(hit.document);

        // Use thumbnail URLs for better performance, fallback to full images
        const imageUrl =
          listing.thumbnailImageUrls.length > 0
            ? listing.thumbnailImageUrls[0]
            : listing.fullImageUrls.length > 0
            ? listing.fullImageUrls[0]
            : null;

        return {
          id: listing.id,
          name: listing.name,
          brand: listing.brand || 'No Brand',
          price: `£${listing.price.toFixed(2)}`,
          image: imageUrl ? { uri: imageUrl } : undefined,
          likes: listing.favoritesCount,
        };
      });

      setRecentlyAddedProductsData(products);
      console.log(`Loaded ${products.length} recently added products`);
    } catch (error) {
      console.error('Error fetching recently added products:', error);
      // Keep empty array on error
      setRecentlyAddedProductsData([]);
    } finally {
      setIsLoadingRecentlyAdded(false);
    }
  };

  const fetchIndieItems = async () => {
    try {
      setIsLoadingIndieItems(true);
      // Fetch indie items - products where vendor_id is NOT 42 (matching Flutter)
      const response = await typesenseService.search({
        query: '*',
        queryBy: 'name,description,short_description,brand,categories,category_slugs',
        filterBy: 'vendor_id:!=42',
        perPage: 10,
        page: 1,
      });

      // Convert Typesense results to product card format with additional fields
      const products = response.hits.map((hit) => {
        const listing = typesenseService.convertToVintStreetListing(hit.document);

        // Use thumbnail URLs for better performance, fallback to full images
        const imageUrl =
          listing.thumbnailImageUrls.length > 0
            ? listing.thumbnailImageUrls[0]
            : listing.fullImageUrls.length > 0
            ? listing.fullImageUrls[0]
            : null;

        // Get first available size
        const size =
          listing.attributes.pa_size && listing.attributes.pa_size.length > 0
            ? listing.attributes.pa_size[0]
            : undefined;

        // Calculate protection fee (example: 7.2% of price, matching typical marketplace fees)
        const protectionFee = (listing.price * 0.072).toFixed(2);

        return {
          id: listing.id,
          name: listing.name,
          brand: listing.brand || 'No Brand',
          price: `£${listing.price.toFixed(2)}`,
          image: imageUrl ? { uri: imageUrl } : undefined,
          likes: listing.favoritesCount,
          size: size,
          protectionFee: `£${protectionFee}`,
        };
      });

      setIndieItemsData(products);
      console.log(`Loaded ${products.length} indie items`);
    } catch (error) {
      console.error('Error fetching indie items:', error);
      // Keep empty array on error
      setIndieItemsData([]);
    } finally {
      setIsLoadingIndieItems(false);
    }
  };

  const handleProductPress = (productId: number) => {
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

      const response = await typesenseService.search({
        query: searchText,
        queryBy: 'name,description,short_description,brand,categories,category_slugs',
        perPage: 20,
        page: 1,
      });

      // Convert Typesense results to product card format
      const products = response.hits.map((hit) => {
        const listing = typesenseService.convertToVintStreetListing(hit.document);

        // Use thumbnail URLs for better performance, fallback to full images
        const imageUrl =
          listing.thumbnailImageUrls.length > 0
            ? listing.thumbnailImageUrls[0]
            : listing.fullImageUrls.length > 0
            ? listing.fullImageUrls[0]
            : null;

        // Get first available size
        const size =
          listing.attributes.pa_size && listing.attributes.pa_size.length > 0
            ? listing.attributes.pa_size[0]
            : undefined;

        return {
          id: listing.id,
          name: listing.name,
          brand: listing.brand || 'No Brand',
          price: `£${listing.price.toFixed(2)}`,
          image: imageUrl ? { uri: imageUrl } : undefined,
          likes: listing.favoritesCount,
          size: size,
        };
      });

      setSearchResults(products);
      console.log(`Search for "${searchText}" returned ${products.length} results`);
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

  const handleFilterPress = () => {
    // TODO: Implement filter modal
    console.log('Filter pressed');
  };

  const handleSortPress = () => {
    // TODO: Implement sort options
    console.log('Sort pressed');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Bar */}
      <SearchBar value={searchText} onChangeText={handleSearchTextChange} onSearch={handleSearch} />

      {showSearchResults ? (
        // Search Results View
        <View className="flex-1">
          {/* Filter and Sort Bar */}
          <FilterSortBar
            filterCount={filterCount}
            sortBy={sortBy}
            onFilterPress={handleFilterPress}
            onSortPress={handleSortPress}
          />

          {isSearching ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-3 text-sm font-poppins text-gray-600">Searching for "{searchText}"...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={() => handleProductPress(item.id)} width={180} height={240} />
              )}
              contentContainerStyle={{ padding: 16 }}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            />
          ) : (
            <View className="py-10 items-center">
              <Text className="text-base font-poppins text-gray-600 text-center">
                No results found for "{searchText}"
              </Text>
              <Text className="text-sm font-poppins text-gray-400 text-center mt-2">
                Try different keywords or check your spelling
              </Text>
            </View>
          )}
        </View>
      ) : (
        // Home Content
        <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
          {/* Banner Section */}
          <View className="my-4">
            <View className="w-full relative rounded-xl overflow-hidden" style={{ aspectRatio: 16 / 5 }}>
              <Image source={require('@/assets/images/hero-banner.jpg')} className="w-full h-full" resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="absolute inset-0"
              />
            </View>
          </View>

          {/* Quick Links Section */}
          <View className="mb-6">
            <Text className="text-xs font-poppins-bold text-black mb-3">QUICK LINKS</Text>
            <ArticleCarousel />
          </View>

          <View className="mb-6">
            {isLoadingTrending ? (
              <View>
                <Text className="text-xs font-poppins-bold text-black mb-3">TRENDING NOW</Text>
                <View className="py-10 items-center">
                  <ActivityIndicator size="large" color="#000" />
                </View>
              </View>
            ) : trendingProductsData.length > 0 ? (
              <PopularProductsCarousel
                title="TRENDING NOW"
                items={trendingProductsData}
                onPressItem={(item) => handleProductPress(Number(item.id))}
              />
            ) : (
              <View>
                <Text className="text-xs font-poppins-bold text-black mb-3">TRENDING NOW</Text>
                <Text className="text-xs font-poppins text-gray-600 text-center py-5">
                  No trending products available
                </Text>
              </View>
            )}
          </View>

          {/* RECENTLY ADDS */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-poppins-bold text-black">RECENTLY ADDED</Text>
              <Pressable>
                <Text className="text-xs font-poppins text-blue-500">See All</Text>
              </Pressable>
            </View>
            {isLoadingRecentlyAdded ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : recentlyAddedProductsData.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentlyAddedProductsData.map((product) => (
                  <ProductCard key={product.id} product={product} onPress={() => handleProductPress(product.id)} />
                ))}
              </ScrollView>
            ) : (
              <Text className="text-xs font-poppins text-gray-600 text-center py-5">
                No recently added products available
              </Text>
            )}
          </View>

          {/* Top Categories Section */}
          <View className="mb-6">
            <Text className="text-xs font-poppins-bold text-black mb-3">TOP CATEGORIES</Text>
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
                      <Text className="text-base font-poppins-bold text-white" numberOfLines={1}>
                        {cat.title}
                      </Text>
                      <Feather name="chevron-right" size={16} color="white" />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Explore the Eras Section */}
          <View className="mb-6">
            <Text className="text-xs font-poppins-bold text-black mb-3">EXPLORE THE ERAS</Text>
            <View className="flex-row flex-wrap">
              {eras.map((era, idx) => {
                const cardWidth = screenWidth / 2 - (16 + 12) / 2;
                const cardHeight = cardWidth * (7 / 16);
                const isLeft = idx % 2 === 0;
                return (
                  <View
                    key={era.name}
                    className={`rounded-lg overflow-hidden ${isLeft ? 'mr-3' : 'mr-0'} mb-3`}
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                    }}
                  >
                    <Image source={era.image} className="w-full h-full" resizeMode="cover" />
                    <View className="absolute inset-0 opacity-50" style={{ backgroundColor: era.color }} />
                    <View className="absolute inset-0 items-center justify-center">
                      <Text
                        className="text-xl font-poppins-bold text-white"
                        style={{
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {era.name}
                      </Text>
                      <Text
                        className="text-sm font-poppins text-white"
                        style={{
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {era.decade}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Brands Section */}
          <View className="mb-6">
            <Text className="text-xs font-poppins-bold text-black mb-3">Brands you may like</Text>
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

          {/* Recently Viewed Section */}
          {recentlyViewedInitialized && recentlyViewedItems.length > 0 && (
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-poppins-bold text-black">RECENTLY VIEWED</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentlyViewedItems.map((listing) => {
                  // Convert listing to product card format
                  const imageUrl =
                    listing.thumbnailImageUrls.length > 0
                      ? listing.thumbnailImageUrls[0]
                      : listing.fullImageUrls.length > 0
                      ? listing.fullImageUrls[0]
                      : null;

                  const size =
                    listing.attributes.pa_size && listing.attributes.pa_size.length > 0
                      ? listing.attributes.pa_size[0]
                      : undefined;

                  const protectionFee = (listing.price * 0.072).toFixed(2);

                  const product = {
                    id: listing.id,
                    name: listing.name,
                    brand: listing.brand || 'No Brand',
                    price: `£${listing.price.toFixed(2)}`,
                    image: imageUrl ? { uri: imageUrl } : undefined,
                    likes: listing.favoritesCount,
                    size: size,
                    protectionFee: `£${protectionFee}`,
                  };

                  return (
                    <ProductCard
                      key={listing.id}
                      product={product}
                      showSize={true}
                      showProtectionFee={true}
                      onPress={() => handleProductPress(listing.id)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Indie Items Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-poppins-bold text-black">INDIE ITEMS</Text>
              <Pressable>
                <Text className="text-xs font-poppins text-blue-500">See All</Text>
              </Pressable>
            </View>
            {isLoadingIndieItems ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : indieItemsData.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {indieItemsData.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showSize={true}
                    showProtectionFee={true}
                    onPress={() => handleProductPress(product.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text className="text-xs font-poppins text-gray-600 text-center py-5">No indie items available</Text>
            )}
          </View>

          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
