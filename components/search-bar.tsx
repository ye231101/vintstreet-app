import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChangeText, onSearch }) => {
  return (
    <View className="flex-row items-center px-4 py-2 bg-gray-900 gap-8">
      <View className="flex-1 flex-row items-center bg-gray-600 rounded-lg px-3">
        <Feather name="search" size={20} color="white" />
        <TextInput
          className="flex-1 ml-2 text-sm text-white font-inter"
          placeholder={placeholder}
          placeholderTextColor="#b0b0b0"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value && value.length > 0 && (
          <Pressable onPress={() => onChangeText?.('')}>
            <Feather name="x" size={20} color="white" />
          </Pressable>
        )}
      </View>
      <Pressable onPress={() => router.push('/cart')}>
        <Feather name="shopping-bag" size={20} color="white" />
      </Pressable>
    </View>
  );
};

export default SearchBar;
