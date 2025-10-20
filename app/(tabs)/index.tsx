import { listingsService } from '@/api/services/listings.service';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  // Listings state from Supabase
  const [listings, setListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // Search functionality
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
      const defaultStreamId = 'shop';
      if (!defaultStreamId) {
        throw new Error('Missing EXPO_PUBLIC_DEFAULT_STREAM_ID');
      }
      const apiProducts = await listingsService.getListings(defaultStreamId);
      // Map to ProductCard format
      const mapped = apiProducts.map((p) => ({
        id: p.id,
        name: p.title,
        brand: '',
        price: `£${Number(p.price || 0).toFixed(2)}`,
        image: p.imageUrl ? { uri: p.imageUrl } : undefined,
        likes: p.likes ?? 0,
      }));
      setListings(mapped);
    } catch (err) {
      console.error('Error loading listings:', err);
      setListings([]);
      setListingsError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setIsLoadingListings(false);
    }
  };

  const handleProductPress = (productId: string | number) => {
    router.push(`/listing/${productId}` as any);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setShowSearchResults(false);
      return;
    }
    setIsSearching(false);
    setShowSearchResults(false);
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

      {/* Home Content: FlatList with header to avoid nesting issues */}
      {isLoadingListings ? (
        <View className="py-10 items-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : listingsError ? (
        <Text className="text-xs font-inter text-red-600 text-center py-5">{listingsError}</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => handleProductPress(item.id)} width={180} height={240} />
          )}
          ListHeaderComponent={
            <View className="px-2">
              <View className="my-4">
                <View className="w-full relative rounded-xl overflow-hidden" style={{ aspectRatio: 16 / 5 }}>
                  <Image
                    source={require('@/assets/images/hero-banner.jpg')}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="absolute inset-0"
                  />
                </View>
              </View>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-inter-bold text-black">LISTINGS</Text>
              </View>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
