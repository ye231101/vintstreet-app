import { categoriesService, listingsService } from '@/api/services';
import { Category } from '@/api/types/category.types';
import FilterModal from '@/components/filter-modal';
import FilterSortBar from '@/components/filter-sort-bar';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import Feather from '@expo/vector-icons/Feather';
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
  const [filterCount, setFilterCount] = useState(0);
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // New state for API data
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Filter and sort state
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [currentSortBy, setCurrentSortBy] = useState('Most Relevant');
  const [showSortModal, setShowSortModal] = useState(false);

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

  const loadProductsForCategory = async (category: Category, filters?: any, sortBy?: string) => {
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

      // Query by category UUID against known id columns
      const apiProducts = await listingsService.getListingsByCategory(category.id, sortOrder);
      const mapped = apiProducts.map((p) => ({
        id: p.id,
        name: p.title,
        brand: '',
        price: `£${Number(p.price || 0).toFixed(2)}`,
        image: p.imageUrl ? { uri: p.imageUrl } : undefined,
        likes: p.likes ?? 0,
      }));

      setProducts(mapped);
      console.log(`Loaded ${mapped.length} products for category: ${category.name}`);
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

      setSearchResults([]);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Search Error', 'Failed to search products. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log('Applied filters:', filters);
    setAppliedFilters(filters);

    // Update filter count based on applied filters
    const totalFilters = Object.values(filters).reduce((total: number, options: any) => total + options.length, 0);
    setFilterCount(totalFilters);

    // Reload products with new filters if we're in products view
    if (currentView === 'products' && categoryPath.length > 0) {
      loadProductsForCategory(categoryPath[categoryPath.length - 1], filters, currentSortBy);
    }
  };

  const handleSortPress = () => {
    setShowSortModal(true);
  };

  const handleSortChange = (sortOption: string) => {
    setCurrentSortBy(sortOption);
    setShowSortModal(false);

    // Reload products with new sort if we're in products view
    if (currentView === 'products' && categoryPath.length > 0) {
      loadProductsForCategory(categoryPath[categoryPath.length - 1], appliedFilters, sortOption);
    }
  };

  const handleProductPress = (productId: number) => {
    // Navigate to product detail
    router.push(`/listing/${productId}` as any);
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
            filterCount={filterCount}
            sortBy={sortBy}
            onFilterPress={handleFilterPress}
            onSortPress={handleSortPress}
          />
          {isSearching ? (
            <View className="flex-1 justify-center items-center p-5">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-4 text-base font-inter text-gray-600">Searching products...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
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
                    No products found for "{searchText}"
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
              filterCount={filterCount}
              sortBy={currentSortBy}
              onFilterPress={handleFilterPress}
              onSortPress={handleSortPress}
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
        onChangeText={setSearchText}
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

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
      />

      {/* Sort Dropdown */}
      {showSortModal && (
        <>
          <Pressable className="absolute top-0 left-0 right-0 bottom-0 z-50" onPress={() => setShowSortModal(false)} />
          <View className="absolute top-12 right-5 w-60 bg-white rounded-lg shadow-lg z-50">
            {[
              'Most Relevant',
              'Price: Low to High',
              'Price: High to Low',
              'Newest First',
              'Oldest First',
              'Most Popular',
            ].map((option) => (
              <Pressable
                key={option}
                className={`flex-row justify-between items-center px-4 py-3 border-b border-gray-100 ${
                  currentSortBy === option ? 'bg-gray-50' : ''
                }`}
                onPress={() => handleSortChange(option)}
              >
                <Text
                  className={`text-sm font-inter text-gray-800 flex-1 ${
                    currentSortBy === option ? 'font-inter-semibold text-black' : ''
                  }`}
                >
                  {option}
                </Text>
                {currentSortBy === option && <Feather name="check" size={16} color="#000" />}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
