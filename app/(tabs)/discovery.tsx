import { categoriesService, listingsService } from '@/api/services';
import { Product } from '@/api/services/listings.service';
import { Category } from '@/api/types/category.types';
import FilterSortBar from '@/components/filter-sort-bar';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoveryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'products'>('categories');
  const [sortBy, setSortBy] = useState('Most Relevant');

  // New state for API data
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Filter and sort state
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [currentSortBy, setCurrentSortBy] = useState('Most Relevant');
  const [currentPriceFilter, setCurrentPriceFilter] = useState('All Prices');

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle category parameter from navigation
  useEffect(() => {
    if (category && categories.length > 0) {
      const categoryName = decodeURIComponent(category as string);
      // Find the category in categories and navigate to it
      const foundCategory = categoriesService.findCategoryBySlug(
        categories,
        categoryName.toLowerCase().replace(/\s+/g, '-')
      );
      if (foundCategory) {
        handleCategoryPress(foundCategory);
      }
    }
  }, [category, categories]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCategories = await categoriesService.getCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductsForCategory = async (
    category: Category,
    filters?: any,
    sortBy?: string,
    priceFilterOverride?: string
  ) => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);

      // Map UI sort to service sort key
      let sortOrder: string | undefined;
      if (sortBy) {
        switch (sortBy) {
          case 'Price: Low to High':
            sortOrder = 'price:asc';
            break;
          case 'Price: High to Low':
            sortOrder = 'price:desc';
            break;
          default:
            sortOrder = undefined;
            break;
        }
      }

      // Use override if provided, otherwise use current state
      const priceFilter = priceFilterOverride !== undefined ? priceFilterOverride : currentPriceFilter;

      // Query by category UUID against known id columns with price filter
      const apiProducts = await listingsService.getListingsByCategory(category.id, sortOrder, priceFilter);
      setProducts(apiProducts);
    } catch (err) {
      console.error('Error loading products for category:', err);
      setProductsError('Failed to load products for this category');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    setCategoryPath([category]);
    if (category.children.length > 0) {
      setCurrentView('subcategories');
    } else {
      setCurrentView('products');
      loadProductsForCategory(category, appliedFilters, currentSortBy);
    }
  };

  const handleSubcategoryPress = (subcategory: Category) => {
    setCategoryPath((prev) => [...prev, subcategory]);
    if (subcategory.children.length > 0) {
      setCurrentView('subcategories');
    } else {
      setCurrentView('products');
      loadProductsForCategory(subcategory, appliedFilters, currentSortBy);
    }
  };

  const handleBack = () => {
    if (showSearchResults) {
      setShowSearchResults(false);
      setSearchText('');
      setSearchResults([]);
      return;
    }

    if (categoryPath.length > 1) {
      setCategoryPath((prev) => prev.slice(0, -1));
      setCurrentView('subcategories');
    } else if (categoryPath.length === 1) {
      setCategoryPath([]);
      setCurrentView('categories');
    }
  };

  const handleViewAllProducts = () => {
    setCurrentView('products');
    if (categoryPath.length > 0) {
      loadProductsForCategory(categoryPath[categoryPath.length - 1], appliedFilters, currentSortBy);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      setShowSearchResults(true);

      const results = await listingsService.searchListings(searchText.trim(), currentPriceFilter);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Search Error', 'Failed to search products. Please try again.');
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

  const handlePriceFilterChange = async (priceFilter: string) => {
    setCurrentPriceFilter(priceFilter);

    // Reload products with new price filter if we're in products view
    if (currentView === 'products' && categoryPath.length > 0) {
      await loadProductsForCategory(categoryPath[categoryPath.length - 1], {}, currentSortBy, priceFilter);
    }

    // Reload search results if we're showing search results
    if (showSearchResults && searchText.trim()) {
      try {
        setIsSearching(true);
        const results = await listingsService.searchListings(searchText.trim(), priceFilter);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching with price filter:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleSortChange = (sortOption: string) => {
    setCurrentSortBy(sortOption);

    // Reload products with new sort if we're in products view
    if (currentView === 'products' && categoryPath.length > 0) {
      loadProductsForCategory(categoryPath[categoryPath.length - 1], appliedFilters, sortOption);
    }
  };

  const handleProductPress = (productId: string) => {
    // Navigate to product detail
    router.push(`/product/${productId}` as any);
  };

  const getCurrentTitle = () => {
    if (showSearchResults) return `Search: "${searchText}"`;
    if (categoryPath.length === 0) return 'Discover';
    return categoryPath[categoryPath.length - 1].name;
  };

  const getCurrentCategories = () => {
    if (categoryPath.length === 0) {
      return categories;
    }
    return categoryPath[categoryPath.length - 1].children;
  };

  const renderBreadcrumbs = () => {
    if (categoryPath.length === 0) return null;

    return (
      <View className="bg-white border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center px-5 py-3">
            <Pressable
              onPress={() => {
                setCategoryPath([]);
                setCurrentView('categories');
              }}
            >
              <Text className="text-sm font-inter text-black font-bold">All Categories</Text>
            </Pressable>
            {categoryPath.map((category, index) => (
              <View key={index} className="flex-row items-center ml-2">
                <Feather name="chevron-right" size={16} color="#666" />
                <Pressable
                  onPress={() => {
                    if (index === categoryPath.length - 1) return;
                    setCategoryPath((prev) => prev.slice(0, index + 1));
                    setCurrentView(index === 0 ? 'subcategories' : 'products');
                  }}
                >
                  <Text
                    className={`text-sm font-inter font-bold ${
                      index === categoryPath.length - 1 ? 'text-gray-600' : 'text-black'
                    }`}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderContent = () => {
    // Show search results if searching
    if (showSearchResults) {
      return (
        <View className="flex-1">
          <FilterSortBar
            priceFilter={currentPriceFilter}
            sortBy={sortBy}
            onPriceFilterChange={handlePriceFilterChange}
            onSortChange={handleSortChange}
          />
          {isSearching ? (
            <View className="flex-1 justify-center items-center p-5">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-4 text-base font-inter text-gray-600">Searching products...</Text>
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
                renderItem={({ item }) => (
                  <ProductCard product={item} onPress={() => handleProductPress(item.id)} width={180} height={240} />
                )}
                className="p-4 mb-4"
                columnWrapperStyle={{ justifyContent: 'space-between' }}
              />
            </View>
          ) : (
            <View className="flex-1 justify-center items-center p-10">
              <Feather name="search" size={64} color="#ccc" />
              <Text className="text-lg font-inter-bold text-gray-500 text-center mt-4">No results found</Text>
              <Text className="text-gray-400 text-center mt-2">Try searching with different keywords</Text>
            </View>
          )}
        </View>
      );
    }

    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center p-5">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-4 text-base font-inter text-gray-600">Loading categories...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-base font-inter text-gray-600 text-center mb-4">{error}</Text>
          <Pressable className="bg-black px-6 py-3 rounded" onPress={loadCategories}>
            <Text className="text-white text-base font-inter-bold">Retry</Text>
          </Pressable>
        </View>
      );
    }

    switch (currentView) {
      case 'categories':
        return (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Pressable
                className={`flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white ${
                  index === categories.length - 1 ? 'border-b-0' : ''
                }`}
                onPress={() => handleCategoryPress(item)}
              >
                <View className="flex-1 flex-row items-center">
                  <Text className="text-base font-inter text-black">{item.name}</Text>
                </View>
                {item.children.length > 0 && <Feather name="chevron-right" size={20} color="#666" className="ml-2" />}
              </Pressable>
            )}
            className="flex-1 bg-white"
          />
        );

      case 'subcategories':
        return (
          <FlatList
            data={getCurrentCategories()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Pressable
                className={`flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white ${
                  index === getCurrentCategories().length - 1 ? 'border-b-0' : ''
                }`}
                onPress={() => handleSubcategoryPress(item)}
              >
                <View className="flex-1 flex-row items-center">
                  <Text className="text-base font-inter text-black">{item.name}</Text>
                </View>
                {item.children.length > 0 && <Feather name="chevron-right" size={20} color="#666" className="ml-2" />}
              </Pressable>
            )}
            className="flex-1 bg-white"
          />
        );

      case 'products':
        return (
          <View className="flex-1">
            <FilterSortBar
              priceFilter={currentPriceFilter}
              sortBy={currentSortBy}
              onPriceFilterChange={handlePriceFilterChange}
              onSortChange={handleSortChange}
            />
            {isLoadingProducts ? (
              <View className="flex-1 justify-center items-center p-5">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-4 text-base font-inter text-gray-600">Loading products...</Text>
              </View>
            ) : productsError ? (
              <View className="flex-1 justify-center items-center p-5">
                <Text className="text-base font-inter text-gray-600 text-center mb-4">{productsError}</Text>
                <Pressable
                  className="bg-black px-6 py-3 rounded"
                  onPress={() => {
                    if (categoryPath.length > 0) {
                      loadProductsForCategory(categoryPath[categoryPath.length - 1]);
                    }
                  }}
                >
                  <Text className="text-white text-base font-inter-bold">Retry</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                renderItem={({ item }) => (
                  <ProductCard product={item} onPress={() => handleProductPress(item.id)} width={180} height={240} />
                )}
                className="p-4 mb-4"
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center p-10">
                    <Text className="text-base font-inter text-gray-600 text-center">
                      No products found in this category
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChangeText={handleSearchTextChange}
        onSearch={handleSearch}
        placeholder="Search products..."
      />

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white">
        {(categoryPath.length > 0 || showSearchResults) && (
          <Pressable onPress={handleBack} className="mr-4 p-2">
            <Feather name="arrow-left" size={24} color="#000" />
          </Pressable>
        )}
        <Text className="text-3xl font-inter-bold text-black flex-1 font-bold">{getCurrentTitle()}</Text>
      </View>

      {/* All Categories Label */}
      {!showSearchResults && categoryPath.length === 0 && (
        <View className="px-5 py-2 bg-white">
          <Text className="text-base font-inter text-gray-600">All Categories</Text>
        </View>
      )}

      {/* Breadcrumbs */}
      {!showSearchResults && renderBreadcrumbs()}

      {/* Content */}
      {renderContent()}

      {/* Bottom Button for Categories */}
      {currentView === 'subcategories' && (
        <View className="bg-white px-5 py-4 border-t border-gray-100">
          <Pressable className="bg-black rounded py-3 items-center" onPress={handleViewAllProducts}>
            <Text className="text-white text-base font-inter-bold">View all products in this category</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
