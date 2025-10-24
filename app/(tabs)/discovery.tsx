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

  const loadProductsForCategory = async (category: Category, sortBy?: string, priceFilterOverride?: string) => {
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
      loadProductsForCategory(category, currentSortBy);
    }
  };

  const handleSubcategoryPress = (subcategory: Category) => {
    setCategoryPath((prev) => [...prev, subcategory]);
    if (subcategory.children.length > 0) {
      setCurrentView('subcategories');
    } else {
      setCurrentView('products');
      loadProductsForCategory(subcategory, currentSortBy);
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
      loadProductsForCategory(categoryPath[categoryPath.length - 1], currentSortBy);
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
      await loadProductsForCategory(categoryPath[categoryPath.length - 1], currentSortBy, priceFilter);
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
      loadProductsForCategory(categoryPath[categoryPath.length - 1], sortOption);
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
      <View className="bg-gray-50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center px-5 py-3">
            <Pressable
              onPress={() => {
                setCategoryPath([]);
                setCurrentView('categories');
              }}
            >
              <Text className="text-base font-inter-bold text-black">All Categories</Text>
            </Pressable>
            {categoryPath.map((category, index) => (
              <View key={index} className="flex-row items-center">
                <Feather name="chevron-right" size={16} color="#666" />
                <Pressable
                  onPress={() => {
                    if (index === categoryPath.length - 1) return;
                    setCategoryPath((prev) => prev.slice(0, index + 1));
                    setCurrentView(index === 0 ? 'subcategories' : 'products');
                  }}
                >
                  <Text
                    className={`text-base font-inter-bold ${
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
            sortBy={currentSortBy}
            onPriceFilterChange={handlePriceFilterChange}
            onSortChange={handleSortChange}
          />
          {isSearching ? (
            <View className="flex-1 justify-center items-center p-2 bg-gray-50">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-4 text-base font-inter-semibold text-gray-600">Searching products...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item.id)} />}
              className="p-2 bg-gray-50"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 8 }}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center p-2 bg-gray-50">
                  <Feather name="search" size={64} color="#ccc" />
                  <Text className="mt-4 text-lg font-inter-bold text-gray-500 text-center">No results found</Text>
                  <Text className="mt-2 text-base font-inter-semibold text-center text-gray-400">
                    Try searching with different keywords
                  </Text>
                </View>
              }
            />
          )}
        </View>
      );
    }

    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center p-2 bg-gray-50">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-4 text-base font-inter-semibold text-gray-600">Loading categories...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center p-2 bg-gray-50">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading categories</Text>
          <Pressable className="bg-black px-6 py-3 rounded-lg" onPress={loadCategories}>
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </Pressable>
        </View>
      );
    }

    switch (currentView) {
      case 'categories':
        return (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Pressable
                className="flex-row items-center justify-between px-5 py-4 bg-gray-50"
                onPress={() => handleCategoryPress(item)}
              >
                <View className="flex-1 flex-row items-center">
                  <Text className="text-base font-inter-bold text-black">{item.name}</Text>
                </View>
                {item.children.length > 0 && <Feather name="chevron-right" size={20} color="#666" className="ml-2" />}
              </Pressable>
            )}
            className="flex-1 bg-gray-50"
          />
        );

      case 'subcategories':
        return (
          <FlatList
            data={getCurrentCategories()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Pressable
                className="flex-row items-center justify-between px-5 py-4 bg-gray-50"
                onPress={() => handleSubcategoryPress(item)}
              >
                <View className="flex-1 flex-row items-center">
                  <Text className="text-base font-inter-bold text-black">{item.name}</Text>
                </View>
                {item.children.length > 0 && <Feather name="chevron-right" size={20} color="#666" className="ml-2" />}
              </Pressable>
            )}
            className="flex-1 bg-gray-50"
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
              <View className="flex-1 justify-center items-center p-2 bg-gray-50">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-4 text-base font-inter-semibold text-gray-600">Loading products...</Text>
              </View>
            ) : productsError ? (
              <View className="flex-1 justify-center items-center p-2 bg-gray-50">
                <Feather name="alert-circle" color="#ff4444" size={64} />
                <Text className="my-4 text-lg font-inter-bold text-red-500">{productsError}</Text>
                <Pressable
                  className="bg-black px-6 py-3 rounded-lg"
                  onPress={() => {
                    if (categoryPath.length > 0) {
                      loadProductsForCategory(categoryPath[categoryPath.length - 1]);
                    }
                  }}
                >
                  <Text className="text-base font-inter-bold text-white">Retry</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item.id)} />}
                className="p-2 bg-gray-50"
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 8 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center">
                    <Feather name="shopping-bag" color="#999" size={64} />
                    <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-900">No products found</Text>
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
    <SafeAreaView className="flex-1 mb-50 bg-black">
      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChangeText={handleSearchTextChange}
        onSearch={handleSearch}
        placeholder="Search products, brands, articles..."
      />

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-gray-50">
        {(categoryPath.length > 0 || showSearchResults) && (
          <Pressable onPress={handleBack} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </Pressable>
        )}
        <Text className="flex-1 text-3xl font-inter-bold text-black ">{getCurrentTitle()}</Text>
      </View>

      {/* All Categories Label */}
      {!showSearchResults && categoryPath.length === 0 && (
        <View className="px-5 py-3 bg-gray-50">
          <Text className="text-base font-inter-bold text-gray-600">All Categories</Text>
        </View>
      )}

      {/* Breadcrumbs */}
      {!showSearchResults && renderBreadcrumbs()}

      {/* Content */}
      {renderContent()}

      {/* Bottom Button for Categories */}
      {currentView === 'subcategories' && (
        <View className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <Pressable className="bg-black rounded py-3 items-center" onPress={handleViewAllProducts}>
            <Text className="text-white text-base font-inter-bold">View all products in this category</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
