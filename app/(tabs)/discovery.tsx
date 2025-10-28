import { attributesService, categoriesService, listingsService } from '@/api/services';
import { Product } from '@/api/services/listings.service';
import { Category } from '@/api/types/category.types';
import FilterSortBar from '@/components/filter-sort-bar';
import FilterModal, { AppliedFilters, FilterOption } from '@/components/filter-modal';
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
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    priceRanges: [],
    brands: [],
    sizes: [],
  });
  const [availableBrands, setAvailableBrands] = useState<FilterOption[]>([]);
  const [availableSizes, setAvailableSizes] = useState<FilterOption[]>([]);
  const [availablePrices, setAvailablePrices] = useState<FilterOption[]>([
    { label: 'Under £50', value: 'Under £50.00', count: 0 },
    { label: '£50 - £100', value: '£50.00 - £100.00', count: 0 },
    { label: '£100 - £200', value: '£100.00 - £200.00', count: 0 },
    { label: 'Over £200', value: 'Over £200.00', count: 0 },
  ]);
  const [currentSizeAttributeId, setCurrentSizeAttributeId] = useState<string | undefined>();
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Load categories and brands on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await loadCategories();

          // Load brands that have published products (across all categories initially)
          try {
            const brands = await listingsService.getAvailableBrandsForCategory();
            setAvailableBrands(brands.map((b) => ({ label: b.name, value: b.id, count: b.count })));
            
            // Load price counts across all categories
            const priceCounts = await listingsService.getPriceRangeCounts();
            setAvailablePrices([
              { label: 'Under £50', value: 'Under £50.00', count: priceCounts['Under £50.00'] },
              { label: '£50 - £100', value: '£50.00 - £100.00', count: priceCounts['£50.00 - £100.00'] },
              { label: '£100 - £200', value: '£100.00 - £200.00', count: priceCounts['£100.00 - £200.00'] },
              { label: 'Over £200', value: 'Over £200.00', count: priceCounts['Over £200.00'] },
            ]);
          } catch (brandError) {
            console.error('Error loading brands:', brandError);
            // Set empty array as fallback
            setAvailableBrands([]);
          }

        // Set default sizes (will be updated when category is selected)
        setAvailableSizes([
          { label: 'XS', value: 'XS', count: 0 },
          { label: 'S', value: 'S', count: 0 },
          { label: 'M', value: 'M', count: 0 },
          { label: 'L', value: 'L', count: 0 },
          { label: 'XL', value: 'XL', count: 0 },
          { label: 'XXL', value: 'XXL', count: 0 },
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
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

  const loadProductsForCategory = async (category: Category, sortBy?: string, filters?: AppliedFilters) => {
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

      // Load available brands for this specific category (only brands with products in this category)
      const brands = await listingsService.getAvailableBrandsForCategory(category.id);
      setAvailableBrands(brands.map((b) => ({ label: b.name, value: b.id, count: b.count })));

      // Load price range counts for this category
      const priceCounts = await listingsService.getPriceRangeCounts(category.id);
      setAvailablePrices([
        { label: 'Under £50', value: 'Under £50.00', count: priceCounts['Under £50.00'] },
        { label: '£50 - £100', value: '£50.00 - £100.00', count: priceCounts['£50.00 - £100.00'] },
        { label: '£100 - £200', value: '£100.00 - £200.00', count: priceCounts['£100.00 - £200.00'] },
        { label: 'Over £200', value: 'Over £200.00', count: priceCounts['Over £200.00'] },
      ]);

      // Load available sizes from attributes
      // Find the deepest category level to get attributes
      let attributesData = [];
      if (categoryPath.length > 0) {
        const currentCategory = categoryPath[categoryPath.length - 1];
        // Try to get subcategory_id from the current category
        const subcategoryId = currentCategory.id;

        try {
          attributesData = await attributesService.getAttributes(subcategoryId);

          // Find size attribute
          const sizeAttribute = attributesData.find(
            (attr) =>
              attr.name.toLowerCase() === 'size' ||
              attr.name.toLowerCase() === 'sizes' ||
              attr.name.toLowerCase().includes('size')
          );

          if (sizeAttribute && sizeAttribute.attribute_options) {
            const sizeAttributeId = sizeAttribute.id;
            setCurrentSizeAttributeId(sizeAttributeId);

            // Get actual size counts from database
            const sizeCounts = await listingsService.getSizeCounts(category.id, sizeAttributeId);

            setAvailableSizes(
              sizeAttribute.attribute_options
                .filter((opt) => opt.is_active)
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((opt) => ({
                  label: opt.value,
                  value: opt.id,
                  count: sizeCounts.get(opt.id) || 0,
                }))
            );
          } else {
            setCurrentSizeAttributeId(undefined);
            // Fallback to common sizes if no size attribute found
            setAvailableSizes([
              { label: 'XS', value: 'XS', count: 0 },
              { label: 'S', value: 'S', count: 0 },
              { label: 'M', value: 'M', count: 0 },
              { label: 'L', value: 'L', count: 0 },
              { label: 'XL', value: 'XL', count: 0 },
              { label: 'XXL', value: 'XXL', count: 0 },
            ]);
          }
        } catch (error) {
          console.error('Error loading attributes for sizes:', error);
          setCurrentSizeAttributeId(undefined);
          // Fallback to common sizes
          setAvailableSizes([
            { label: 'XS', value: 'XS', count: 0 },
            { label: 'S', value: 'S', count: 0 },
            { label: 'M', value: 'M', count: 0 },
            { label: 'L', value: 'L', count: 0 },
            { label: 'XL', value: 'XL', count: 0 },
            { label: 'XXL', value: 'XXL', count: 0 },
          ]);
        }
      }

      // Use filters if provided, otherwise use current state
      const currentFilters = filters || appliedFilters;

      // For now, use first selected filter for API compatibility
      // TODO: Update API to support multiple filters
      const priceFilter = currentFilters.priceRanges.length > 0 ? currentFilters.priceRanges[0] : 'All Prices';
      const brandFilter = currentFilters.brands.length > 0 ? currentFilters.brands[0] : 'All Brands';

      // Query by category UUID against known id columns with filters
      const apiProducts = await listingsService.getListingsByCategory(category.id, sortOrder, priceFilter, brandFilter);

      // Client-side filtering for multiple selections until API supports it
      let filteredProducts = apiProducts;

      if (currentFilters.priceRanges.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
          return currentFilters.priceRanges.some((range) => {
            const price = product.starting_price || 0;
            if (range === 'Under £50.00') return price < 50;
            if (range === '£50.00 - £100.00') return price >= 50 && price <= 100;
            if (range === '£100.00 - £200.00') return price >= 100 && price <= 200;
            if (range === 'Over £200.00') return price > 200;
            return true;
          });
        });
      }

      if (currentFilters.brands.length > 0) {
        filteredProducts = filteredProducts.filter((product) => currentFilters.brands.includes(product.brand_id || ''));
      }

      // Apply size filtering if size attribute is available
      if (currentFilters.sizes.length > 0 && currentSizeAttributeId) {
        const productIdsWithSizes = await listingsService.getProductIdsBySizes(
          currentFilters.sizes,
          currentSizeAttributeId
        );
        filteredProducts = filteredProducts.filter((product) => productIdsWithSizes.includes(product.id));
      }

      setProducts(filteredProducts);
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
      setAppliedFilters({ priceRanges: [], brands: [], sizes: [] });
      setAvailableBrands([]);
      setAvailableSizes([]);
      setCurrentSizeAttributeId(undefined);
      return;
    }

    if (categoryPath.length > 1) {
      setCategoryPath((prev) => prev.slice(0, -1));
      setCurrentView('subcategories');
      setAppliedFilters({ priceRanges: [], brands: [], sizes: [] });
      setAvailableBrands([]);
      setAvailableSizes([]);
      setCurrentSizeAttributeId(undefined);
    } else if (categoryPath.length === 1) {
      setCategoryPath([]);
      setCurrentView('categories');
      setAppliedFilters({ priceRanges: [], brands: [], sizes: [] });
      setAvailableBrands([]);
      setAvailableSizes([]);
      setCurrentSizeAttributeId(undefined);
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

      // Load available brands across all categories for search (only brands with products)
      const brands = await listingsService.getAvailableBrandsForCategory();
      setAvailableBrands(brands.map((b) => ({ label: b.name, value: b.id, count: b.count })));

      // Load price counts for search results
      const priceCounts = await listingsService.getPriceRangeCounts();
      setAvailablePrices([
        { label: 'Under £50', value: 'Under £50.00', count: priceCounts['Under £50.00'] },
        { label: '£50 - £100', value: '£50.00 - £100.00', count: priceCounts['£50.00 - £100.00'] },
        { label: '£100 - £200', value: '£100.00 - £200.00', count: priceCounts['£100.00 - £200.00'] },
        { label: 'Over £200', value: 'Over £200.00', count: priceCounts['Over £200.00'] },
      ]);

      // For search, use common sizes as we don't have category context
      setAvailableSizes([
        { label: 'XS', value: 'XS', count: 0 },
        { label: 'S', value: 'S', count: 0 },
        { label: 'M', value: 'M', count: 0 },
        { label: 'L', value: 'L', count: 0 },
        { label: 'XL', value: 'XL', count: 0 },
        { label: 'XXL', value: 'XXL', count: 0 },
      ]);

      // For now, use first selected filter for API compatibility
      const priceFilter = appliedFilters.priceRanges.length > 0 ? appliedFilters.priceRanges[0] : 'All Prices';
      const brandFilter = appliedFilters.brands.length > 0 ? appliedFilters.brands[0] : 'All Brands';

      const results = await listingsService.searchListings(searchText.trim(), priceFilter, brandFilter);

      // Client-side filtering for multiple selections
      let filteredResults = results;

      if (appliedFilters.priceRanges.length > 0) {
        filteredResults = filteredResults.filter((product) => {
          return appliedFilters.priceRanges.some((range) => {
            const price = product.starting_price || 0;
            if (range === 'Under £50.00') return price < 50;
            if (range === '£50.00 - £100.00') return price >= 50 && price <= 100;
            if (range === '£100.00 - £200.00') return price >= 100 && price <= 200;
            if (range === 'Over £200.00') return price > 200;
            return true;
          });
        });
      }

      if (appliedFilters.brands.length > 0) {
        filteredResults = filteredResults.filter((product) => appliedFilters.brands.includes(product.brand_id || ''));
      }

      // Apply size filtering for search results if size attribute is available
      if (appliedFilters.sizes.length > 0 && currentSizeAttributeId) {
        const productIdsWithSizes = await listingsService.getProductIdsBySizes(
          appliedFilters.sizes,
          currentSizeAttributeId
        );
        filteredResults = filteredResults.filter((product) => productIdsWithSizes.includes(product.id));
      }

      setSearchResults(filteredResults);
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
      setAppliedFilters({ priceRanges: [], brands: [], sizes: [] });
      setAvailableBrands([]);
      setAvailableSizes([]);
      setCurrentSizeAttributeId(undefined);
    }
  };

  const handleFiltersApply = async (filters: AppliedFilters) => {
    setAppliedFilters(filters);

    // Reload products with new filters if we're in products view
    if (currentView === 'products' && categoryPath.length > 0) {
      await loadProductsForCategory(categoryPath[categoryPath.length - 1], currentSortBy, filters);
    }

    // Reload search results if we're showing search results
    if (showSearchResults && searchText.trim()) {
      try {
        setIsSearching(true);

        // For now, use first selected filter for API compatibility
        const priceFilter = filters.priceRanges.length > 0 ? filters.priceRanges[0] : 'All Prices';
        const brandFilter = filters.brands.length > 0 ? filters.brands[0] : 'All Brands';

        const results = await listingsService.searchListings(searchText.trim(), priceFilter, brandFilter);

        // Client-side filtering for multiple selections
        let filteredResults = results;

        if (filters.priceRanges.length > 0) {
          filteredResults = filteredResults.filter((product) => {
            return filters.priceRanges.some((range) => {
              const price = product.starting_price || 0;
              if (range === 'Under £50.00') return price < 50;
              if (range === '£50.00 - £100.00') return price >= 50 && price <= 100;
              if (range === '£100.00 - £200.00') return price >= 100 && price <= 200;
              if (range === 'Over £200.00') return price > 200;
              return true;
            });
          });
        }

        if (filters.brands.length > 0) {
          filteredResults = filteredResults.filter((product) => filters.brands.includes(product.brand_id || ''));
        }

        // Apply size filtering for applied filters if size attribute is available
        if (filters.sizes.length > 0 && currentSizeAttributeId) {
          const productIdsWithSizes = await listingsService.getProductIdsBySizes(filters.sizes, currentSizeAttributeId);
          filteredResults = filteredResults.filter((product) => productIdsWithSizes.includes(product.id));
        }

        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching with filters:', error);
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
      loadProductsForCategory(categoryPath[categoryPath.length - 1], sortOption, appliedFilters);
    }
  };

  const getTotalFilterCount = () => {
    return appliedFilters.priceRanges.length + appliedFilters.brands.length + appliedFilters.sizes.length;
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
            filterCount={getTotalFilterCount()}
            sortBy={currentSortBy}
            onFilterPress={() => setShowFilterModal(true)}
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
              filterCount={getTotalFilterCount()}
              sortBy={currentSortBy}
              onFilterPress={() => setShowFilterModal(true)}
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
      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFiltersApply}
        priceOptions={availablePrices}
        brandOptions={availableBrands}
        sizeOptions={availableSizes}
        initialFilters={appliedFilters}
      />

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
