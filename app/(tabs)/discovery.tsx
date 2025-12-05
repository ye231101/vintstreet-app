import { brandsService, categoriesService, listingsService } from '@/api/services';
import { Category, Product } from '@/api/types';
import FilterModal, { AppliedFilters, FilterOption } from '@/components/filter-modal';
import FilterSortBar from '@/components/filter-sort-bar';
import ProductCard from '@/components/product-card';
import SearchBar from '@/components/search-bar';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoveryScreen() {
  const router = useRouter();
  const { category, brand, brandName, subcategory, sub_subcategory, search } = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'products'>('categories');
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(null);

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
  });
  const [availableBrands, setAvailableBrands] = useState<FilterOption[]>([]);
  const [availablePrices, setAvailablePrices] = useState<FilterOption[]>([
    { label: 'Under £50', value: 'Under £50.00', count: 0 },
    { label: '£50 - £100', value: '£50.00 - £100.00', count: 0 },
    { label: '£100 - £200', value: '£100.00 - £200.00', count: 0 },
    { label: 'Over £200', value: 'Over £200.00', count: 0 },
  ]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Pagination state
  const PRODUCTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  // Cache for category results to support client-side pagination
  const [allCategoryProducts, setAllCategoryProducts] = useState<Product[]>([]);

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
          logger.error('Error loading brands:', brandError);
          // Set empty array as fallback
          setAvailableBrands([]);
        }
      } catch (error) {
        logger.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (search && typeof search === 'string' && search.trim()) {
      setSearchText(search.trim());
      setShowSearchResults(true);
      setCurrentPage(1);
    }
  }, [search]);

  // When page changes, reload the visible data for the current context
  useEffect(() => {
    setPageInput(currentPage.toString());
    if (showSearchResults && searchText.trim()) {
      loadSearchPage();
    } else if (selectedBrand) {
      loadProductsForBrand(selectedBrand.id, selectedBrand.name, currentSortBy, appliedFilters, currentPage);
    } else if (currentView === 'products' && categoryPath.length > 0) {
      // Slice from cached category products
      paginateCategoryProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Handle category parameter whenever this screen is focused (runs on each visit)
  useFocusEffect(
    useCallback(() => {
      // Skip category navigation if brandName is provided (brand navigation will handle it)
      if (brandName) {
        return;
      }

      if (category && categories.length > 0) {
        const categoryName = decodeURIComponent(category as string);
        const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
        const foundCategory = categoriesService.findCategoryBySlug(categories, categorySlug);

        if (foundCategory) {
          // If subcategory and sub_subcategory are provided, navigate to the deepest level
          if (subcategory && sub_subcategory) {
            const subcategorySlug = decodeURIComponent(subcategory as string)
              .toLowerCase()
              .replace(/\s+/g, '-');
            const subSubcategorySlug = decodeURIComponent(sub_subcategory as string)
              .toLowerCase()
              .replace(/\s+/g, '-');

            // Find the subcategory within the found category
            const foundSubcategory = foundCategory.children.find((sub) => sub.slug === subcategorySlug);
            if (foundSubcategory) {
              // Find the sub_subcategory within the subcategory
              const foundSubSubcategory = foundSubcategory.children.find(
                (subSub) => subSub.slug === subSubcategorySlug
              );
              if (foundSubSubcategory) {
                // Navigate to the deepest category level
                setCategoryPath([foundCategory, foundSubcategory, foundSubSubcategory]);
                setCurrentView('products');
                setCurrentPage(1);
                loadProductsForCategory(foundSubSubcategory, currentSortBy);
                return;
              }
            }
          } else if (subcategory) {
            // Only subcategory is provided
            const subcategorySlug = decodeURIComponent(subcategory as string)
              .toLowerCase()
              .replace(/\s+/g, '-');
            const foundSubcategory = foundCategory.children.find((sub) => sub.slug === subcategorySlug);
            if (foundSubcategory) {
              setCategoryPath([foundCategory, foundSubcategory]);
              if (foundSubcategory.children.length > 0) {
                setCurrentView('subcategories');
              } else {
                setCurrentView('products');
                setCurrentPage(1);
                loadProductsForCategory(foundSubcategory, currentSortBy);
              }
              return;
            }
          }

          // Default: navigate to the category level
          handleCategoryPress(foundCategory);
        }
      }
    }, [category, subcategory, sub_subcategory, categories, brandName])
  );

  // Handle brand parameter from navigation
  useEffect(() => {
    const handleBrandNavigation = async () => {
      // If brandName is provided, find the brand ID
      if (brandName && !brand) {
        try {
          const decodedBrandName = decodeURIComponent(brandName as string);
          // Search for the brand by name
          const brands = await brandsService.getBrands({ is_active: true });
          const foundBrand = brands.find((b) => b.name.toLowerCase() === decodedBrandName.toLowerCase());

          if (foundBrand) {
            // If category is also provided, load products with both category and brand filters
            if (category && categories.length > 0) {
              const categoryName = decodeURIComponent(category as string);
              const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
              const foundCategory = categoriesService.findCategoryBySlug(categories, categorySlug);

              if (foundCategory) {
                // Set category path and apply brand filter (don't set selectedBrand to show category view)
                setCategoryPath([foundCategory]);
                setCurrentView('products');
                setCurrentPage(1);
                setSelectedBrand(null); // Clear selected brand to show category view

                // Apply brand filter to the applied filters
                const filtersWithBrand: AppliedFilters = {
                  priceRanges: [],
                  brands: [foundBrand.id],
                };
                setAppliedFilters(filtersWithBrand);

                // Load products for category with brand filter
                await loadProductsForCategory(foundCategory, currentSortBy, filtersWithBrand);
                return;
              }
            }

            // No category, just load products for brand
            setSelectedBrand({ id: foundBrand.id, name: foundBrand.name });
            setCurrentView('products');
            loadProductsForBrand(foundBrand.id, foundBrand.name);
          }
        } catch (error) {
          logger.error('Error finding brand by name:', error);
        }
      } else if (brand && brandName) {
        // Brand ID is provided directly
        const decodedBrandId = decodeURIComponent(brand as string);
        const decodedBrandName = decodeURIComponent(brandName as string);

        // If category is also provided, load products with both category and brand filters
        if (category && categories.length > 0) {
          const categoryName = decodeURIComponent(category as string);
          const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
          const foundCategory = categoriesService.findCategoryBySlug(categories, categorySlug);

          if (foundCategory) {
            // Set category path and apply brand filter (don't set selectedBrand to show category view)
            setCategoryPath([foundCategory]);
            setCurrentView('products');
            setCurrentPage(1);
            setSelectedBrand(null); // Clear selected brand to show category view

            // Apply brand filter to the applied filters
            const filtersWithBrand: AppliedFilters = {
              priceRanges: [],
              brands: [decodedBrandId],
            };
            setAppliedFilters(filtersWithBrand);

            // Load products for category with brand filter
            await loadProductsForCategory(foundCategory, currentSortBy, filtersWithBrand);
            return;
          }
        }

        // No category, just load products for brand
        setSelectedBrand({ id: decodedBrandId, name: decodedBrandName });
        setCurrentView('products');
        loadProductsForBrand(decodedBrandId, decodedBrandName);
      }
    };

    if (brandName || brand) {
      handleBrandNavigation();
    }
  }, [brand, brandName, category, categories]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCategories = await categoriesService.getCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      setError('Failed to load categories');
      logger.error('Error loading categories:', err);
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

      // Cache full list and paginate client-side
      setAllCategoryProducts(filteredProducts);
      const total = filteredProducts.length;
      setTotalPages(Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)));
      setCurrentPage(1);
      setProducts(filteredProducts.slice(0, PRODUCTS_PER_PAGE));
    } catch (err) {
      logger.error('Error loading products for category:', err);
      setProductsError('Failed to load products for this category');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadProductsForBrand = async (
    brandId: string,
    brandName: string,
    sortBy?: string,
    filters?: AppliedFilters,
    page?: number
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

      // Load available brands (all brands with products)
      const brands = await listingsService.getAvailableBrandsForCategory();
      setAvailableBrands(brands.map((b) => ({ label: b.name, value: b.id, count: b.count })));

      // Load price range counts across all products
      const priceCounts = await listingsService.getPriceRangeCounts();
      setAvailablePrices([
        { label: 'Under £50', value: 'Under £50.00', count: priceCounts['Under £50.00'] },
        { label: '£50 - £100', value: '£50.00 - £100.00', count: priceCounts['£50.00 - £100.00'] },
        { label: '£100 - £200', value: '£100.00 - £200.00', count: priceCounts['£100.00 - £200.00'] },
        { label: 'Over £200', value: 'Over £200.00', count: priceCounts['Over £200.00'] },
      ]);

      // Use filters if provided, otherwise use current state
      const currentFilters = filters || appliedFilters;

      // For now, use first selected filter for API compatibility
      const priceFilter = currentFilters.priceRanges.length > 0 ? currentFilters.priceRanges[0] : 'All Prices';

      // Get products by brand using getListingsInfinite with brand filter
      const pageNumber = page ?? 1;
      const pageOffset = (pageNumber - 1) * PRODUCTS_PER_PAGE;
      const result = await listingsService.getListingsInfinite(pageOffset, PRODUCTS_PER_PAGE, {
        selectedBrands: new Set([brandId]),
      });
      let apiProducts = result.products;

      // Apply sorting
      if (sortOrder) {
        apiProducts = [...apiProducts].sort((a, b) => {
          const priceA = a.starting_price || 0;
          const priceB = b.starting_price || 0;
          if (sortOrder === 'price:asc') return priceA - priceB;
          if (sortOrder === 'price:desc') return priceB - priceA;
          return 0;
        });
      }

      // Client-side filtering for multiple selections
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

      // Filter by the selected brand
      filteredProducts = filteredProducts.filter((product) => product.brand_id === brandId);

      setProducts(filteredProducts);
      if (result.total !== undefined) {
        setTotalPages(Math.max(1, Math.ceil(result.total / PRODUCTS_PER_PAGE)));
      } else {
        setTotalPages(filteredProducts.length < PRODUCTS_PER_PAGE ? pageNumber : pageNumber + 1);
      }
    } catch (err) {
      logger.error('Error loading products for brand:', err);
      setProductsError('Failed to load products for this brand');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const paginateCategoryProducts = () => {
    const total = allCategoryProducts.length;
    setTotalPages(Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)));
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    setProducts(allCategoryProducts.slice(start, end));
  };

  const loadSearchPage = async (page?: number) => {
    try {
      setIsSearching(true);
      const pageNumber = page ?? currentPage;
      const pageOffset = (pageNumber - 1) * PRODUCTS_PER_PAGE;

      // Server-side search and brand filter; price will be client-side
      const filtersPayload: unknown = { searchKeyword: searchText.trim() };
      if (appliedFilters.brands.length > 0) {
        filtersPayload.selectedBrands = new Set(appliedFilters.brands);
      }

      const result = await listingsService.getListingsInfinite(pageOffset, PRODUCTS_PER_PAGE, filtersPayload);
      let pageProducts = result.products;

      // Client-side price filtering for multiple selections
      if (appliedFilters.priceRanges.length > 0) {
        pageProducts = pageProducts.filter((product) => {
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

      setSearchResults(pageProducts);
      if (result.total !== undefined) {
        setTotalPages(Math.max(1, Math.ceil(result.total / PRODUCTS_PER_PAGE)));
      }
    } catch (error) {
      logger.error('Error searching products:', error);
      Alert.alert('Search Error', 'Failed to search products. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAllCategoriesPress = () => {
    setCategoryPath([]);
    setCurrentView('categories');
    setCurrentPage(1);
    setTotalPages(1);
  };

  const handleCategoryPress = (category: Category) => {
    setCategoryPath([category]);
    if (category.children.length > 0) {
      setCurrentView('subcategories');
    } else {
      setCurrentView('products');
      setCurrentPage(1);
      loadProductsForCategory(category, currentSortBy);
    }
  };

  const handleSubcategoryPress = (subcategory: Category) => {
    setCategoryPath((prev) => [...prev, subcategory]);
    if (subcategory.children.length > 0) {
      setCurrentView('subcategories');
    } else {
      setCurrentView('products');
      setCurrentPage(1);
      loadProductsForCategory(subcategory, currentSortBy);
    }
  };

  const handleBack = () => {
    if (showSearchResults) {
      setShowSearchResults(false);
      setSearchText('');
      setSearchResults([]);
      setAppliedFilters({ priceRanges: [], brands: [] });
      setAvailableBrands([]);
      return;
    }

    if (selectedBrand) {
      setSelectedBrand(null);
      setCategoryPath([]);
      setCurrentView('categories');
      setAppliedFilters({ priceRanges: [], brands: [] });
      setAvailableBrands([]);
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }

    if (categoryPath.length > 1) {
      setCategoryPath((prev) => prev.slice(0, -1));
      setCurrentView('subcategories');
      setAppliedFilters({ priceRanges: [], brands: [] });
      setAvailableBrands([]);
    } else if (categoryPath.length === 1) {
      setCategoryPath([]);
      setCurrentView('categories');
      setAppliedFilters({ priceRanges: [], brands: [] });
      setAvailableBrands([]);
    }
  };

  const handleViewAllProducts = () => {
    setCurrentView('products');
    if (categoryPath.length > 0) {
      setCurrentPage(1);
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

      // For now, use first selected filter for API compatibility
      const priceFilter = appliedFilters.priceRanges.length > 0 ? appliedFilters.priceRanges[0] : 'All Prices';
      const brandFilter = appliedFilters.brands.length > 0 ? appliedFilters.brands[0] : 'All Brands';

      // Reset pagination and load first page via infinite query
      setCurrentPage(1);
      await loadSearchPage(1);
    } catch (error) {
      logger.error('Error searching products:', error);
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
      setAppliedFilters({ priceRanges: [], brands: [] });
      setAvailableBrands([]);
      setCurrentPage(1);
      setTotalPages(1);
    }
  };

  const handleFiltersApply = async (filters: AppliedFilters) => {
    setAppliedFilters(filters);

    // Reset to first page on filter change
    setCurrentPage(1);

    // Reload products with new filters if we're filtering by brand
    if (selectedBrand) {
      await loadProductsForBrand(selectedBrand.id, selectedBrand.name, currentSortBy, filters, 1);
    }
    // Reload products with new filters if we're in products view
    else if (currentView === 'products' && categoryPath.length > 0) {
      await loadProductsForCategory(categoryPath[categoryPath.length - 1], currentSortBy, filters);
    }

    // Reload search results if we're showing search results
    if (showSearchResults && searchText.trim()) {
      try {
        setIsSearching(true);

        // For now, use first selected filter for API compatibility
        const priceFilter = filters.priceRanges.length > 0 ? filters.priceRanges[0] : 'All Prices';
        const brandFilter = filters.brands.length > 0 ? filters.brands[0] : 'All Brands';

        await loadSearchPage(1);
      } catch (error) {
        logger.error('Error searching with filters:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleSortChange = (sortOption: string) => {
    setCurrentSortBy(sortOption);

    // Reload products with new sort if we're filtering by brand
    if (selectedBrand) {
      setCurrentPage(1);
      loadProductsForBrand(selectedBrand.id, selectedBrand.name, sortOption, appliedFilters, 1);
    }
    // Reload products with new sort if we're in products view
    else if (currentView === 'products' && categoryPath.length > 0) {
      setCurrentPage(1);
      loadProductsForCategory(categoryPath[categoryPath.length - 1], sortOption, appliedFilters);
    }
  };

  const getTotalFilterCount = () => {
    return appliedFilters.priceRanges.length + appliedFilters.brands.length;
  };

  const handleProductPress = (productId: string) => {
    // Navigate to product detail
    router.push(`/product/${productId}` as unknown);
  };

  const getCurrentTitle = () => {
    if (showSearchResults) return `Search: "${searchText}"`;
    if (selectedBrand) return selectedBrand.name;
    if (categoryPath.length === 0) return 'Discover';
    return categoryPath[categoryPath.length - 1].name;
  };

  // Pagination controls handlers
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
    const numericValue = text.replace(/[^0-9]/g, '');
    setPageInput(numericValue);
  };

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      setPageInput(currentPage.toString());
    }
    Keyboard.dismiss();
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
      <View className="px-5 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleAllCategoriesPress}>
              <Text className="text-base font-inter-bold text-black">All Categories</Text>
            </TouchableOpacity>
            {categoryPath.map((category, index) => (
              <View key={index} className="flex-row items-center">
                <Feather name="chevron-right" size={16} color="#666" />
                <TouchableOpacity
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
                </TouchableOpacity>
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
            <View className="flex-1 items-center justify-center p-2">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-4 text-base font-inter-semibold text-gray-600">Searching products...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item.id)} />}
              className="p-2"
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 8 }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center p-2">
                  <Feather name="search" size={64} color="#ccc" />
                  <Text className="mt-4 text-lg font-inter-bold text-gray-500 text-center">No results found</Text>
                  <Text className="mt-2 text-base font-inter-semibold text-center text-gray-400">
                    Try searching with different keywords
                  </Text>
                </View>
              }
            />
          )}
          {/* Pagination Controls for search */}
          {showSearchResults && totalPages > 1 && (
            <View className="mt-1 mb-2">
              <View className="flex-row items-center justify-center gap-3">
                <TouchableOpacity onPress={goToPrevPage} disabled={currentPage === 1} className="px-3 py-2">
                  <Text className={`${currentPage === 1 ? 'text-gray-400' : 'text-black'}`}>
                    <Feather name="chevron-left" size={24} color="#000" />
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
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-center text-base font-inter-medium text-black min-w-[50px]"
                  />
                  <Text className="text-base font-inter-medium text-gray-600 mx-2">/</Text>
                  <Text className="text-base font-inter-medium text-black">{totalPages}</Text>
                </View>
                <TouchableOpacity onPress={goToNextPage} disabled={currentPage === totalPages} className="px-3 py-2">
                  <Text className={`${currentPage === totalPages ? 'text-gray-400' : 'text-black'}`}>
                    <Feather name="chevron-right" size={24} color="#000" />
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      );
    }

    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center p-2">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-4 text-base font-inter-semibold text-gray-600">Loading categories...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-2">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading categories</Text>
          <TouchableOpacity className="px-6 py-3 rounded-lg bg-black" onPress={loadCategories}>
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (currentView) {
      case 'categories':
        return (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center justify-between px-5 py-4"
                onPress={() => handleCategoryPress(item)}
              >
                <View className="flex-1 flex-row items-center">
                  <Text className="text-base font-inter-bold text-black">{item.name}</Text>
                </View>
                {item.children.length > 0 && <Feather name="chevron-right" size={20} color="#666" className="ml-2" />}
              </TouchableOpacity>
            )}
            className="flex-1"
          />
        );

      case 'subcategories':
        return (
          <FlatList
            data={getCurrentCategories()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center justify-between px-5 py-4"
                onPress={() => handleSubcategoryPress(item)}
              >
                <View className="flex-1 flex-row items-center">
                  <Text className="text-base font-inter-bold text-black">{item.name}</Text>
                </View>
                {item.children.length > 0 && <Feather name="chevron-right" size={20} color="#666" className="ml-2" />}
              </TouchableOpacity>
            )}
            className="flex-1"
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
              <View className="flex-1 items-center justify-center p-2">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-4 text-base font-inter-semibold text-gray-600">Loading products...</Text>
              </View>
            ) : productsError ? (
              <View className="flex-1 items-center justify-center p-2">
                <Feather name="alert-circle" color="#ff4444" size={64} />
                <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">{productsError}</Text>
                <TouchableOpacity
                  className="px-6 py-3 rounded-lg bg-black"
                  onPress={() => {
                    if (categoryPath.length > 0) {
                      loadProductsForCategory(categoryPath[categoryPath.length - 1]);
                    }
                  }}
                >
                  <Text className="text-base font-inter-bold text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                renderItem={({ item }) => <ProductCard product={item} onPress={() => handleProductPress(item.id)} />}
                className="p-2"
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 8 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center">
                    <Feather name="shopping-bag" color="#999" size={64} />
                    <Text className="mt-4 text-lg font-inter-bold text-gray-900">No products found</Text>
                  </View>
                }
              />
            )}
            {/* Pagination Controls for products */}
            {currentView === 'products' && totalPages > 1 && (
              <View className="py-4">
                <View className="flex-row items-center justify-center gap-3">
                  <TouchableOpacity onPress={goToPrevPage} disabled={currentPage === 1} className="px-4 py-2">
                    <Text className={`${currentPage === 1 ? 'text-gray-400' : 'text-black'}`}>
                      <Feather name="chevron-left" size={24} color="#000" />
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
                      className="px-4 py-2 text-center text-base font-inter-medium text-black min-w-[50px] rounded-lg bg-white border border-gray-300"
                    />
                    <Text className="text-base font-inter-medium text-gray-600 mx-2">/</Text>
                    <Text className="text-base font-inter-medium text-black">{totalPages}</Text>
                  </View>
                  <TouchableOpacity onPress={goToNextPage} disabled={currentPage === totalPages} className="px-4 py-2">
                    <Text className={`${currentPage === totalPages ? 'text-gray-400' : 'text-black'}`}>
                      <Feather name="chevron-right" size={24} color="#000" />
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 mb-14 bg-white">
      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFiltersApply}
        priceOptions={availablePrices}
        brandOptions={availableBrands}
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
      <View className="flex-row items-center px-5 py-4">
        {(categoryPath.length > 0 || showSearchResults || selectedBrand) && (
          <TouchableOpacity onPress={handleBack} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text className="flex-1 text-3xl font-inter-bold text-black ">{getCurrentTitle()}</Text>
      </View>

      {/* All Categories Label */}
      {!showSearchResults && !selectedBrand && categoryPath.length === 0 && (
        <View className="px-5 py-3">
          <Text className="text-base font-inter-bold text-gray-600">All Categories</Text>
        </View>
      )}

      {/* Breadcrumbs */}
      {!showSearchResults && !selectedBrand && renderBreadcrumbs()}

      {/* Content */}
      {renderContent()}

      {/* Bottom Button for Categories */}
      {currentView === 'subcategories' && (
        <View className="px-5 py-4 border-t border-gray-100">
          <TouchableOpacity className="items-center py-3 rounded bg-black" onPress={handleViewAllProducts}>
            <Text className="text-base font-inter-bold text-white">View all products in this category</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
