import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChangeText, onSearch }) => {
  return (
    <View className="flex-row items-center gap-8 p-4 bg-black">
      <View className="flex-1 flex-row items-center bg-gray-800 rounded-lg px-3">
        <Feather name="search" size={24} color="white" />
        <TextInput
          className="flex-1 ml-2 text-base font-inter-bold text-white"
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => onSearch?.(value || '')}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value && value.length > 0 && (
          <Pressable onPress={() => {
            onChangeText?.('');
          }}>
            <Feather name="x" size={20} color="white" />
          </Pressable>
        )}
      </View>
      <Pressable onPress={() => router.push('/cart')}>
        <Feather name="shopping-bag" size={28} color="white" />
      </Pressable>
    </View>
  );
};

export default SearchBar;
