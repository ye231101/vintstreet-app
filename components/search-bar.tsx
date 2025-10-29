import { listingsService } from '@/api';
import { addRecentSearch, getRecentSearches, removeRecentSearch } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
}

interface Suggestion {
  type: 'product' | 'brand' | 'recent';
  value: string;
  id?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onSearch,
  onSuggestionsVisibilityChange,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notify parent when suggestions visibility changes
  useEffect(() => {
    onSuggestionsVisibilityChange?.(showSuggestions);
  }, [showSuggestions, onSuggestionsVisibilityChange]);

  // Load recent searches when input is focused and empty
  const loadRecentSearches = useCallback(async () => {
    try {
      const recentSearches = await getRecentSearches();
      const recentSuggestions: Suggestion[] = recentSearches.map((search) => ({
        type: 'recent',
        value: search,
      }));
      setSuggestions(recentSuggestions);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      await loadRecentSearches();
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const apiSuggestions = await listingsService.getSearchSuggestions(searchTerm.trim(), 8);

      // Also get recent searches that match
      const recentSearches = await getRecentSearches();
      const matchingRecent = recentSearches
        .filter((search) => search.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 3)
        .map((search) => ({
          type: 'recent' as const,
          value: search,
        }));

      // Combine recent and API suggestions, prioritizing recent
      const combinedSuggestions = [...matchingRecent, ...apiSuggestions].slice(0, 10);
      setSuggestions(combinedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [loadRecentSearches]);

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
    // Delay hiding suggestions to allow tap on suggestion to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionPress = async (suggestion: Suggestion) => {
    onChangeText?.(suggestion.value);
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Add to recent searches
    await addRecentSearch(suggestion.value);

    // Trigger search
    onSearch?.(suggestion.value);
  };

  const handleRemoveRecent = async (searchTerm: string, event: any) => {
    event.stopPropagation();
    await removeRecentSearch(searchTerm);
    await loadRecentSearches();
  };

  const handleSearch = async () => {
    if (value && value.trim().length > 0) {
      await addRecentSearch(value.trim());
    }
    setShowSuggestions(false);
    Keyboard.dismiss();
    onSearch?.(value || '');
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return 'package';
      case 'brand':
        return 'tag';
      case 'recent':
        return 'clock';
      default:
        return 'search';
    }
  };

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <Pressable
      className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 active:bg-gray-50"
      onPress={() => handleSuggestionPress(item)}
    >
      <View className="flex-1 flex-row items-center">
        <Feather name={getSuggestionIcon(item.type)} size={18} color="#666" />
        <Text className="ml-3 text-base font-inter-medium text-gray-900 flex-1" numberOfLines={1}>
          {item.value}
        </Text>
      </View>
      {item.type === 'recent' && (
        <Pressable onPress={(e) => handleRemoveRecent(item.value, e)} className="p-1">
          <Feather name="x" size={16} color="#999" />
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <>
      <View className="bg-black" style={{ position: 'relative', zIndex: 1000 }}>
        <View className="flex-row items-center gap-8 p-4">
          <View className="flex-1 flex-row items-center bg-gray-800 rounded-lg px-3">
            <Feather name="search" size={24} color="white" />
            <TextInput
              className="flex-1 ml-2 text-base font-inter-bold text-white py-3"
              placeholder={placeholder}
              placeholderTextColor="#999"
              value={value}
              onChangeText={onChangeText}
              onSubmitEditing={handleSearch}
              onFocus={handleFocus}
              onBlur={handleBlur}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {value && value.length > 0 && (
              <Pressable
                onPress={() => {
                  onChangeText?.('');
                  onSearch?.('');
                  setSuggestions([]);
                }}
              >
                <Feather name="x" size={20} color="white" />
              </Pressable>
            )}
          </View>
          <Pressable onPress={() => router.push('/cart')}>
            <Feather name="shopping-bag" size={28} color="white" />
          </Pressable>
        </View>

        {/* Backdrop to block interactions - positioned behind suggestions */}
        {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
          <Pressable
            style={{
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              bottom: -5000,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999,
            }}
            onPress={() => {
              setShowSuggestions(false);
              Keyboard.dismiss();
            }}
          />
        )}

        {/* Suggestions Dropdown - Absolutely Positioned */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            className="bg-white mx-4 rounded-lg overflow-hidden"
            style={{
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              maxHeight: 300,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
              zIndex: 1000,
            }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.type}-${item.value}-${index}`}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
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
    </>
  );
};

export default SearchBar;
