import { listingsService } from '@/api/services';
import { Product } from '@/api/types';
import Brand from '@/components/brand';
import { MegaMenuNav } from '@/components/mega-menu-nav';
import ProductCard from '@/components/product-card';
import QuickLinks from '@/components/quick-links';
import SearchBar from '@/components/search-bar';
import ShopBannerCarousel from '@/components/shop-banner-carousel';
import TopCategory from '@/components/top-category';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { getStorageJSON } from '@/utils/storage';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const PRODUCTS_PER_PAGE = 10;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [isLoadingRecentlyViewed, setIsLoadingRecentlyViewed] = useState(false);

  useEffect(() => {
    fetchProducts();
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    if (searchKeyword === '') {
      fetchProducts();
    }
  }, [searchKeyword]);

  // Refresh recently viewed and recommended products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRecommendedProducts();
    }, [])
  );

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
      logger.error('Error loading products:', err);
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setCurrentPage(1);
      setError(null);
      await Promise.all([fetchProducts(), fetchRecommendedProducts()]);
    } catch (err) {
      logger.error('Error refreshing:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (keyword?: string) => {
    setCurrentPage(1);
    fetchProducts(keyword);
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

  const fetchRecommendedProducts = async () => {
    try {
      setIsLoadingRecentlyViewed(true);
      setIsLoadingRecommended(true);

      // Get recently viewed products from AsyncStorage
      const recentlyViewedIds = await getStorageJSON('RECENTLY_VIEWED_PRODUCTS');
      if (!recentlyViewedIds || !Array.isArray(recentlyViewedIds) || recentlyViewedIds.length === 0) {
        setRecentlyViewedProducts([]);
        setRecommendedProducts([]);
        return;
      }

      // Fetch recently viewed products by their IDs
      const recentlyViewedIdsSlice = recentlyViewedIds.slice(0, 4);
      const recentlyViewed = await listingsService.getProductsByIds(recentlyViewedIdsSlice);
      setRecentlyViewedProducts(recentlyViewed);

      if (recentlyViewed.length === 0) {
        setRecommendedProducts([]);
        return;
      }

      // Fetch recommended products based on recently viewed
      const recommended = await listingsService.getRecommendedProducts(recentlyViewed, 8);
      setRecommendedProducts(recommended);
    } catch (err) {
      logger.error('Error loading recommended products:', err);
      setRecentlyViewedProducts([]);
      setRecommendedProducts([]);
    } finally {
      setIsLoadingRecentlyViewed(false);
      setIsLoadingRecommended(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 mb-14 bg-white">
      {/* Search Bar */}
      <SearchBar value={searchKeyword} onChangeText={(text) => setSearchKeyword(text)} onSearch={handleSearch} />

      {/* Mega Menu Navigation */}
      <MegaMenuNav />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 gap-6 py-4">
            {/* Shop Banner Carousel */}
            <ShopBannerCarousel />

            {/* Quick Links Section */}
            <View className="gap-2 px-2">
              <Text className="text-sm font-inter-bold text-black">QUICK LINKS</Text>
              <QuickLinks />
            </View>

            {/* Top Categories Section */}
            <View className="gap-2 px-2">
              <Text className="text-sm font-inter-bold text-black">TOP CATEGORIES</Text>
              <TopCategory />
            </View>

            {/* Brands Section */}
            <View className="gap-2 px-2">
              <Text className="text-sm font-inter-bold text-black">BRANDS YOU MAY LIKE</Text>
              <Brand />
            </View>

            {/* Recently Viewed Products Section */}
            {recentlyViewedProducts.length > 0 && (
              <View className="gap-2 px-2">
                <Text className="text-sm font-inter-bold text-black">RECENTLY VIEWED</Text>
                {isLoadingRecentlyViewed ? (
                  <View className="flex-row items-center justify-center py-4">
                    <ActivityIndicator size="small" color="#000" />
                    <Text className="ml-2 text-sm font-inter-medium text-gray-600">Loading recently viewed...</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {recentlyViewedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onPress={() => router.push(`/product/${product.id}`)}
                          width={(screenWidth / 5) * 2}
                        />
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {/* Recommended Products Section */}
            {recommendedProducts.length > 0 && (
              <View className="gap-2 px-2">
                <Text className="text-sm font-inter-bold text-black">WE THINK YOU'LL LIKE</Text>
                {isLoadingRecommended ? (
                  <View className="flex-row items-center justify-center py-4">
                    <ActivityIndicator size="small" color="#000" />
                    <Text className="ml-2 text-sm font-inter-medium text-gray-600">Loading recommendations...</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {recommendedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onPress={() => router.push(`/product/${product.id}`)}
                          width={(screenWidth / 5) * 2}
                        />
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {/* All Listings Section */}
            <View className="gap-2 px-2">
              <Text className="text-sm font-inter-bold text-black">ALL LISTINGS</Text>

              {isLoading ? (
                <View className="flex-1 items-center justify-center p-2">
                  <ActivityIndicator size="large" color="#000" />
                  <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading products...</Text>
                </View>
              ) : error ? (
                <View className="flex-1 items-center justify-center p-2">
                  <Feather name="alert-circle" color="#ff4444" size={64} />
                  <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading products</Text>
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
                    <View className="flex-1 items-center justify-center p-2">
                      <Feather name="shopping-bag" color="#999" size={64} />
                      <Text className="mt-2 mb-4 text-lg font-inter-bold text-gray-900">No products found</Text>
                      <TouchableOpacity onPress={() => fetchProducts()} className="px-6 py-3 rounded-lg bg-black">
                        <Text className="text-base font-inter-bold text-white">Retry</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {totalPages > 1 && (
                <View className="mt-4">
                  <View className="flex-row items-center justify-center gap-2">
                    <TouchableOpacity
                      onPress={goToPrevPage}
                      disabled={currentPage === 1 || isLoading}
                      className="px-4 py-2"
                    >
                      <Text className={`${currentPage === 1 || isLoading ? 'text-gray-400' : 'text-black'}`}>
                        <Feather name="chevron-left" size={24} />
                      </Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={pageInput}
                        onChangeText={handlePageInputChange}
                        onSubmitEditing={handlePageInputSubmit}
                        onBlur={handlePageInputSubmit}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        editable={!isLoading}
                        className="min-w-[50px] px-4 py-2 rounded-lg text-center text-base font-inter-medium text-black bg-white border border-gray-300"
                      />
                      <Text className="text-base font-inter-medium text-gray-600">/</Text>
                      <Text className="text-base font-inter-medium text-black">{totalPages}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={goToNextPage}
                      disabled={currentPage === totalPages || isLoading}
                      className="px-4 py-2"
                    >
                      <Text className={`${currentPage === totalPages || isLoading ? 'text-gray-400' : 'text-black'}`}>
                        <Feather name="chevron-right" size={24} />
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
