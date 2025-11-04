import { DropdownComponent } from '@/components/common';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export interface FilterSortBarProps {
  filterCount?: number;
  sortBy?: string;
  onFilterPress?: () => void;
  onSortChange?: (value: string) => void;
}

const SortBar: React.FC<FilterSortBarProps> = ({
  filterCount = 0,
  sortBy = 'Most Relevant',
  onFilterPress,
  onSortChange,
}) => {
  const [sortValue, setSortValue] = useState(sortBy);

  const SORT_OPTIONS = [
    { label: 'Most Relevant', value: 'Most Relevant' },
    { label: 'Price: Low to High', value: 'Price: Low to High' },
    { label: 'Price: High to Low', value: 'Price: High to Low' },
    { label: 'Newest First', value: 'Newest First' },
    { label: 'Oldest First', value: 'Oldest First' },
    { label: 'Most Popular', value: 'Most Popular' },
  ];

  const handleSortChange = (value: string) => {
    setSortValue(value);
    onSortChange?.(value);
  };

  return (
    <View className="p-4 border-b border-gray-100">
      <View className="flex-row items-center gap-4">
        {/* Filter Button */}
        <Pressable
          onPress={onFilterPress}
          className="flex-row items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300"
          style={{ height: 40 }}
        >
          <Feather name="filter" size={16} color="#000" />
          <Text className="text-sm font-inter-semibold text-black">
            Filter {filterCount > 0 ? `(${filterCount})` : ''}
          </Text>
        </Pressable>

        {/* Sort Dropdown */}
        <View className="flex-1">
          <DropdownComponent
            data={SORT_OPTIONS}
            value={sortValue}
            placeholder="Sort by"
            onChange={(item) => handleSortChange(item.value)}
            style={{
              height: 40,
              borderRadius: 8,
              backgroundColor: '#fff',
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default SortBar;
