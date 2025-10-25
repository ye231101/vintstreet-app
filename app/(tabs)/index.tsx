import { listingsService, Product } from '@/api/services/listings.service';
import Brand from '@/components/brand';
import ProductCard from '@/components/product-card';
import QuickLinks from '@/components/quick-links';
import SearchBar from '@/components/search-bar';
import TopCategory from '@/components/top-category';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // When search text is cleared, reload all products
    if (searchText === '') {
      fetchProducts('');
    }
  }, [searchText]);

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
            <QuickLinks />
          </View>

          {/* Top Categories Section */}
          <View className="pl-2">
            <Text className="text-sm font-inter-bold text-black mb-3">TOP CATEGORIES</Text>
            <TopCategory />
          </View>

          {/* Brands Section */}
          <View className="pl-2">
            <Text className="text-sm font-inter-bold text-black mb-3">BRANDS YOU MAY LIKE</Text>
            <Brand />
          </View>

          {/* All Listings Section */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center p-4">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading products...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center p-4">
              <Feather name="alert-circle" color="#ff4444" size={64} />
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
