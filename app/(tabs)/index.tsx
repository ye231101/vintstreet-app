import { listingsService } from '@/api/services/listings.service';
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

      {isLoadingListings ? (
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
