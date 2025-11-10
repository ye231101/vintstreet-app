import { listingsService, Product } from '@/api';
import Brand from '@/components/brand';
import { MegaMenuNav } from '@/components/mega-menu-nav';
import ProductCard from '@/components/product-card';
import QuickLinks from '@/components/quick-links';
import SearchBar from '@/components/search-bar';
import TopCategory from '@/components/top-category';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRODUCTS_PER_PAGE = 10;

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    fetchProducts();
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    if (searchKeyword === '') {
      fetchProducts();
    }
  }, [searchKeyword]);

  const fetchProducts = async (keyword?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const searchTerm = keyword !== undefined ? keyword : searchKeyword;
      const pageOffset = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const filters = searchTerm.trim() ? { searchKeyword: searchTerm.trim() } : {};
      const result = await listingsService.getListingsInfinite(pageOffset, PRODUCTS_PER_PAGE, filters);

      setProducts(result.products);

      // Calculate total pages based on whether there are more products
      if (result.total !== undefined) {
        setTotalPages(Math.ceil(result.total / PRODUCTS_PER_PAGE));
      } else {
        // If we got fewer products than requested, we're on the last page
        if (result.products.length < PRODUCTS_PER_PAGE) {
          setTotalPages(currentPage);
        } else if (result.nextPage === undefined) {
          setTotalPages(currentPage);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (keyword?: string) => {
    setCurrentPage(1);
    fetchProducts(keyword);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setCurrentPage(1);
      setError(null);
      await fetchProducts();
    } catch (err) {
      console.error('Error refreshing:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageInputChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setPageInput(numericValue);
  };

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
  };

  return (
    <SafeAreaView className="flex-1 mb-14 bg-white">
      {/* Search Bar */}
      <SearchBar value={searchKeyword} onChangeText={(text) => setSearchKeyword(text)} onSearch={handleSearch} />

      {/* Mega Menu Navigation */}
      <MegaMenuNav />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 gap-6 py-4">
          {/* Quick Links Section */}
          <View className="px-2">
            <Text className="text-sm font-inter-bold text-black mb-3">QUICK LINKS</Text>
            <QuickLinks />
          </View>

          {/* Top Categories Section */}
          <View className="px-2">
            <Text className="text-sm font-inter-bold text-black mb-3">TOP CATEGORIES</Text>
            <TopCategory />
          </View>

          {/* Brands Section */}
          <View className="px-2">
            <Text className="text-sm font-inter-bold text-black mb-3">BRANDS YOU MAY LIKE</Text>
            <Brand />
          </View>

          {/* All Listings Section */}
          <View className="px-2">
            <Text className="text-sm font-inter-bold text-black mb-3">ALL LISTINGS</Text>

            {isLoading ? (
              <View className="flex-1 items-center justify-center p-4">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading products...</Text>
              </View>
            ) : error ? (
              <View className="flex-1 items-center justify-center p-4">
                <Feather name="alert-circle" color="#ff4444" size={64} />
                <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading products</Text>
                <TouchableOpacity onPress={() => fetchProducts()} className="px-6 py-3 rounded-lg bg-black">
                  <Text className="text-base font-inter-bold text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between gap-2">
                {products.length > 0 ? (
                  products.map((item) => (
                    <ProductCard key={item.id} product={item} onPress={() => router.push(`/product/${item.id}`)} />
                  ))
                ) : (
                  <View className="flex-1 items-center justify-center p-4">
                    <Feather name="shopping-bag" color="#999" size={64} />
                    <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-900">No products found</Text>
                    <TouchableOpacity onPress={() => fetchProducts()} className="bg-black rounded-lg py-3 px-6">
                      <Text className="text-base font-inter-bold text-white">Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Pagination Controls - Always visible */}
            {totalPages > 1 && (
              <View className="mt-4">
                {/* Pagination Buttons */}
                <View className="flex-row items-center justify-center gap-3">
                  {/* Prev Arrow */}
                  <TouchableOpacity
                    onPress={goToPrevPage}
                    disabled={currentPage === 1 || isLoading}
                    className="px-4 py-2"
                  >
                    <Text className={`${currentPage === 1 || isLoading ? 'text-gray-400' : 'text-black'}`}>
                      <Feather name="chevron-left" size={24} color="black" />
                    </Text>
                  </TouchableOpacity>

                  {/* Current Page Input / Total Pages */}
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      value={pageInput}
                      onChangeText={handlePageInputChange}
                      onSubmitEditing={handlePageInputSubmit}
                      onBlur={handlePageInputSubmit}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      editable={!isLoading}
                      className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-center text-base font-inter-medium text-black min-w-[50px]"
                    />
                    <Text className="text-base font-inter-medium text-gray-600">/</Text>
                    <Text className="text-base font-inter-medium text-black">{totalPages}</Text>
                  </View>

                  {/* Next Arrow */}
                  <TouchableOpacity
                    onPress={goToNextPage}
                    disabled={currentPage === totalPages || isLoading}
                    className="px-4 py-2"
                  >
                    <Text className={`${currentPage === totalPages || isLoading ? 'text-gray-400' : 'text-black'}`}>
                      <Feather name="chevron-right" size={24} color="black" />
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
