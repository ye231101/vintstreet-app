import { listingsService, Product } from '@/api/services/listings.service';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  // Listings state from Supabase
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

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

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
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
              <Text className="text-sm text-gray-600">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchText}"
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
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="search" size={64} color="#ccc" />
            <Text className="text-lg font-inter-bold text-gray-500 text-center mt-4">
              No results found
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Try searching with different keywords
            </Text>
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
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item.id)} />}
          contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
