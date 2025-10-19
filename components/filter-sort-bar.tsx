import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface FilterSortBarProps {
  filterCount?: number;
  sortBy?: string;
  onFilterPress?: () => void;
  onSortPress?: () => void;
}

const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filterCount = 0,
  sortBy = 'Most Relevant',
  onFilterPress,
  onSortPress,
}) => {
  return (
    <View className="flex-row px-4 py-3 bg-white border-b border-gray-100 gap-3">
      <Pressable
        className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-2xl px-4 py-2 gap-2"
        onPress={onFilterPress}
      >
        <Text className="text-sm font-inter text-gray-800">Filter by {filterCount > 0 && `| ${filterCount}`}</Text>
        <Feather name="chevron-down" size={16} color="#666" />
      </Pressable>

      <Pressable
        className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-2xl px-4 py-2 gap-2"
        onPress={onSortPress}
      >
        <Text className="text-sm font-inter text-gray-800">Sort by | {sortBy}</Text>
        <Feather name="chevron-down" size={16} color="#666" />
      </Pressable>
    </View>
  );
};

export default FilterSortBar;
