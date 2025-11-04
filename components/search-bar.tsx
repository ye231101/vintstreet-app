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
}

interface Suggestion {
  type: 'product' | 'brand' | 'recent';
  value: string;
  id?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChangeText, onSearch }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const fetchSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        await loadRecentSearches();
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const apiSuggestions = await listingsService.getSearchSuggestions(searchTerm.trim(), 20);

        // Also get recent searches that match
        const recentSearches = await getRecentSearches();
        const matchingRecent = recentSearches
          .filter((search) => search.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5)
          .map((search) => ({
            type: 'recent' as const,
            value: search,
          }));

        // Combine recent and API suggestions, prioritizing recent
        const combinedSuggestions = [...matchingRecent, ...apiSuggestions].slice(0, 20);
        setSuggestions(combinedSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    [loadRecentSearches]
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
    setShowSuggestions(false);
    Keyboard.dismiss();
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
        <Pressable onPress={() => router.push('/cart')} hitSlop={8}>
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
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.type}-${item.value}-${index}`}
            renderItem={renderSuggestion}
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
