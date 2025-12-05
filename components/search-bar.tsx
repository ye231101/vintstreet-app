import {
  brandsIndex,
  brandsQuerySuggestionsIndex,
  categoriesIndex,
  categoriesQuerySuggestionsIndex,
  productsIndex,
  productsQuerySuggestionsIndex,
  searchClient,
} from '@/api/config';
import { AlgoliaBrand, AlgoliaCategory, AlgoliaProduct, AlgoliaQuerySuggestion } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { addRecentSearch, getRecentSearches, removeRecentSearch } from '@/utils';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, SectionList, Text, TextInput, View } from 'react-native';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
}

interface SuggestionItem {
  type: 'product' | 'brand' | 'category' | 'recent' | 'query_suggestion';
  value: string;
  id?: string;
  data?: AlgoliaProduct | AlgoliaBrand | AlgoliaCategory | AlgoliaQuerySuggestion;
  imageUrl?: string;
  description?: string;
}

interface SuggestionSection {
  title: string;
  data: SuggestionItem[];
  type: 'recent' | 'brands' | 'categories' | 'products' | 'query_suggestions';
}

// Helper function to highlight text
const highlightText = (text: string, query: string): string => {
  if (!text || !query) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '**$1**'); // Mark for highlighting
};

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChangeText, onSearch }) => {
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionSection[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches when input is focused and empty
  const loadRecentSearches = useCallback(async () => {
    try {
      const recentSearches = await getRecentSearches();
      if (recentSearches.length > 0) {
        const recentSuggestions: SuggestionItem[] = recentSearches.slice(0, 5).map((search) => ({
          type: 'recent',
          value: search,
        }));
        setSuggestions([
          {
            title: 'Recent Searches',
            data: recentSuggestions,
            type: 'recent',
          },
        ]);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      logger.error('Error loading recent searches:', error);
    }
  }, []);

  // Search Algolia indices
  const searchAlgolia = useCallback(async (query: string) => {
    if (!searchClient || !query || query.trim().length < 2) {
      return {
        brands: [],
        categories: [],
        products: [],
        querySuggestions: [],
      };
    }

    const searchQuery = query.trim();
    const results = {
      brands: [] as AlgoliaBrand[],
      categories: [] as AlgoliaCategory[],
      products: [] as AlgoliaProduct[],
      querySuggestions: [] as AlgoliaQuerySuggestion[],
    };

    try {
      // Search brands
      const brandsResponse = await searchClient.searchSingleIndex({
        indexName: brandsIndex.indexName,
        searchParams: {
          query: searchQuery,
          hitsPerPage: 5,
          filters: 'is_active:true',
        },
      });
      if (brandsResponse.hits) {
        results.brands = brandsResponse.hits as AlgoliaBrand[];
      }

      // Search categories
      const categoriesResponse = await searchClient.searchSingleIndex({
        indexName: categoriesIndex.indexName,
        searchParams: {
          query: searchQuery,
          hitsPerPage: 5,
          filters: 'is_active:true',
        },
      });
      if (categoriesResponse.hits) {
        results.categories = categoriesResponse.hits as AlgoliaCategory[];
      }

      // Search products
      const productsResponse = await searchClient.searchSingleIndex({
        indexName: productsIndex.indexName,
        searchParams: {
          query: searchQuery,
          hitsPerPage: 5,
          filters: 'status:published',
        },
      });
      if (productsResponse.hits) {
        results.products = productsResponse.hits as AlgoliaProduct[];
      }

      // Get query suggestions (only if query exists)
      if (searchQuery.length >= 2) {
        try {
          // Try brands query suggestions
          const brandsQSResponse = await searchClient.searchSingleIndex({
            indexName: brandsQuerySuggestionsIndex.indexName,
            searchParams: {
              query: searchQuery,
              hitsPerPage: 3,
            },
          });
          if (brandsQSResponse.hits) {
            results.querySuggestions.push(...(brandsQSResponse.hits as AlgoliaQuerySuggestion[]));
          }

          // Try categories query suggestions
          const categoriesQSResponse = await searchClient.searchSingleIndex({
            indexName: categoriesQuerySuggestionsIndex.indexName,
            searchParams: {
              query: searchQuery,
              hitsPerPage: 3,
            },
          });
          if (categoriesQSResponse.hits) {
            results.querySuggestions.push(...(categoriesQSResponse.hits as AlgoliaQuerySuggestion[]));
          }

          // Try products query suggestions
          const productsQSResponse = await searchClient.searchSingleIndex({
            indexName: productsQuerySuggestionsIndex.indexName,
            searchParams: {
              query: searchQuery,
              hitsPerPage: 3,
            },
          });
          if (productsQSResponse.hits) {
            results.querySuggestions.push(...(productsQSResponse.hits as AlgoliaQuerySuggestion[]));
          }
        } catch (error) {
          // Query suggestions are optional, so we don't fail if they're not configured
          logger.error('Query suggestions not available:', error);
        }
      }
    } catch (error) {
      logger.error('Error searching Algolia:', error);
    }

    return results;
  }, []);

  // Fetch suggestions from Algolia
  const fetchSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        await loadRecentSearches();
        return;
      }

      try {
        setIsLoadingSuggestions(true);

        // Get recent searches that match
        const recentSearches = await getRecentSearches();
        const matchingRecent = recentSearches
          .filter((search) => search.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5)
          .map((search) => ({
            type: 'recent' as const,
            value: search,
          }));

        // Search Algolia
        const algoliaResults = await searchAlgolia(searchTerm);

        // Build sections
        const sections: SuggestionSection[] = [];

        // Recent searches section
        if (matchingRecent.length > 0) {
          sections.push({
            title: 'Recent Searches',
            data: matchingRecent,
            type: 'recent',
          });
        }

        // Query suggestions section
        if (algoliaResults.querySuggestions.length > 0) {
          const uniqueQueries = new Set<string>();
          const querySuggestions: SuggestionItem[] = [];
          for (const suggestion of algoliaResults.querySuggestions) {
            if (suggestion.query && !uniqueQueries.has(suggestion.query.toLowerCase())) {
              uniqueQueries.add(suggestion.query.toLowerCase());
              querySuggestions.push({
                type: 'query_suggestion',
                value: suggestion.query,
                data: suggestion,
              });
              if (querySuggestions.length >= 5) break;
            }
          }
          if (querySuggestions.length > 0) {
            sections.push({
              title: 'Suggestions',
              data: querySuggestions,
              type: 'query_suggestions',
            });
          }
        }

        // Brands section
        if (algoliaResults.brands.length > 0) {
          sections.push({
            title: 'Brands',
            data: algoliaResults.brands.map((brand) => ({
              type: 'brand' as const,
              value: brand.name,
              id: brand.objectID,
              data: brand,
              imageUrl: brand.logo_url,
              description: brand.description,
            })),
            type: 'brands',
          });
        }

        // Categories section
        if (algoliaResults.categories.length > 0) {
          sections.push({
            title: 'Categories',
            data: algoliaResults.categories.map((category) => ({
              type: 'category' as const,
              value: category.name,
              id: category.objectID,
              data: category,
              description: category.category_path_names
                ? category.category_path_names.slice(0, -1).join(' > ')
                : category.description,
            })),
            type: 'categories',
          });
        }

        // Products section
        if (algoliaResults.products.length > 0) {
          sections.push({
            title: 'Products',
            data: algoliaResults.products.map((product) => ({
              type: 'product' as const,
              value: product.product_name,
              id: product.objectID,
              data: product,
              imageUrl: product.product_image,
              description: product.product_description,
            })),
            type: 'products',
          });
        }

        setSuggestions(sections);
      } catch (error) {
        logger.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    [loadRecentSearches, searchAlgolia]
  );

  // Debounced search suggestions
  useEffect(() => {
    if (showSuggestions) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        fetchSuggestions(value || '');
      }, 300);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [value, showSuggestions, fetchSuggestions]);

  const handleFocus = () => {
    setShowSuggestions(true);
    if (!value || value.trim().length === 0) {
      loadRecentSearches();
    }
  };

  const handleBlur = () => {
    // Delay to allow press events to fire
    setTimeout(() => {
      setShowSuggestions(false);
      Keyboard.dismiss();
    }, 150);
  };

  const handleSuggestionPress = async (item: SuggestionItem) => {
    const searchValue = item.value;
    onChangeText?.(searchValue);
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Add to recent searches
    await addRecentSearch(searchValue);

    // Navigate based on type
    if (item.type === 'brand' && item.data) {
      const brand = item.data as AlgoliaBrand;
      router.push(`/(tabs)/discovery?brandName=${encodeURIComponent(brand.name.toLowerCase())}` as unknown);
    } else if (item.type === 'category' && item.data) {
      const category = item.data as AlgoliaCategory;
      router.push(`/(tabs)/discovery?category=${encodeURIComponent(category.slug)}` as unknown);
    } else if (item.type === 'product' && item.data) {
      const product = item.data as AlgoliaProduct;
      router.push(`/product/${product.objectID}` as unknown);
    } else {
      router.push(`/(tabs)/discovery?search=${encodeURIComponent(searchValue)}` as unknown);
    }
  };

  const handleRemoveRecent = async (searchTerm: string, event: unknown) => {
    event.stopPropagation();
    await removeRecentSearch(searchTerm);
    await loadRecentSearches();
  };

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    setShowSuggestions(true);
  };

  const handleClearSearch = () => {
    onChangeText?.('');
    setSuggestions([]);
  };

  const handleSearch = async () => {
    if (value && value.trim().length > 0) {
      await addRecentSearch(value.trim());
    }
    handleBlur();
    onSearch?.(value || '');
  };

  const handleCart = () => {
    if (!isAuthenticated) {
      const currentPath = '/' + segments.join('/');
      router.push(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      router.push('/cart');
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return 'package';
      case 'brand':
        return 'tag';
      case 'category':
        return 'grid';
      case 'recent':
        return 'clock';
      case 'query_suggestion':
        return 'search';
      default:
        return 'search';
    }
  };

  const renderSuggestionItem = ({ item }: { item: SuggestionItem }) => {
    const highlightedValue = highlightText(item.value, value || '');
    const parts = highlightedValue.split('**');
    const displayText = parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is the highlighted part
        return (
          <Text key={index} className="font-bold bg-yellow-200">
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });

    return (
      <Pressable
        className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 active:bg-gray-50"
        onPress={() => handleSuggestionPress(item)}
      >
        <View className="flex-1 flex-row items-center">
          {item.imageUrl ? (
            <View className="w-10 h-10 rounded overflow-hidden">
              <Image
                source={{ uri: item.imageUrl }}
                contentFit="cover"
                transition={1000}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : (
            <View className="w-10 h-10 items-center justify-center rounded overflow-hidden bg-gray-200">
              <Feather name={getSuggestionIcon(item.type)} size={18} color="#666" />
            </View>
          )}
          <View className="flex-1 ml-4">
            <Text className="text-base font-inter-medium text-gray-900" numberOfLines={1}>
              {displayText}
            </Text>
            {item.description && (
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        {item.type === 'recent' && (
          <Pressable onPress={(e) => handleRemoveRecent(item.value, e)} className="p-1">
            <Feather name="x" size={16} color="#999" />
          </Pressable>
        )}
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: SuggestionSection }) => (
    <View className="w-full py-2 bg-primary/5 border-b border-gray-200">
      <View className="flex-row items-center gap-2 px-3">
        <Text className="text-base font-semibold text-primary uppercase">{section.title}</Text>
      </View>
    </View>
  );

  return (
    <View className="relative bg-white border-b border-gray-100">
      <View className="flex-row items-center gap-8 p-4">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3">
          <Feather name="search" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base font-inter text-black py-3"
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {value && value.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Feather name="x" size={20} color="#666" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={handleCart} hitSlop={8}>
          <Feather name="shopping-bag" size={24} color="#000" />
        </Pressable>
      </View>

      {/* Light grey backdrop overlay - non-interactive, just visual */}
      {showSuggestions && (isLoadingSuggestions || suggestions.length > 0) && (
        <Pressable
          onPress={handleBlur}
          className="absolute left-0 right-0"
          style={{ top: 70, bottom: -9999, zIndex: 1000 }}
        />
      )}

      {/* Suggestions Dropdown - Absolutely Positioned */}
      {showSuggestions && suggestions.length > 0 && (
        <View
          className="bg-white mx-4 rounded-lg"
          style={{
            position: 'absolute',
            top: 70,
            left: 0,
            right: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <SectionList
            sections={suggestions}
            keyExtractor={(item, index) => `${item.type}-${item.value}-${index}`}
            renderItem={renderSuggestionItem}
            renderSectionHeader={renderSectionHeader}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ flexGrow: 1 }}
            style={{ maxHeight: 400 }}
          />
        </View>
      )}

      {/* Loading indicator - Absolutely Positioned */}
      {showSuggestions && isLoadingSuggestions && suggestions.length === 0 && (
        <View
          className="bg-white mx-4 rounded-lg p-4"
          style={{
            position: 'absolute',
            top: 70,
            left: 0,
            right: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
            zIndex: 1000,
          }}
        >
          <Text className="text-center text-gray-600 text-sm font-inter-medium">Loading suggestions...</Text>
        </View>
      )}
    </View>
  );
};

export default SearchBar;
