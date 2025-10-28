import React, { useState, useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Feather } from '@expo/vector-icons';

export interface FilterSortBarProps {
  filterCount?: number;
  sortBy?: string;
  onFilterPress?: () => void;
  onSortChange?: (value: string) => void;
}

const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filterCount = 0,
  sortBy = 'Most Relevant',
  onFilterPress,
  onSortChange,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(sortBy);

  const [sortItems, setSortItems] = useState([
    { label: 'Most Relevant', value: 'Most Relevant' },
    { label: 'Price: Low to High', value: 'Price: Low to High' },
    { label: 'Price: High to Low', value: 'Price: High to Low' },
    { label: 'Newest First', value: 'Newest First' },
    { label: 'Oldest First', value: 'Oldest First' },
    { label: 'Most Popular', value: 'Most Popular' },
  ]);

  const handleSortChange = (value: string) => {
    setSortValue(value);
    onSortChange?.(value);
  };

  return (
    <View className="p-4 bg-gray-50 border-b border-gray-100">
      <View className="flex-row gap-4">
        {/* Filter Button */}
        <Pressable
          onPress={onFilterPress}
          className="flex-row items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg"
          style={{ minHeight: 40 }}
        >
          <Feather name="filter" size={16} color="#000" />
          <Text className="ml-2 text-sm font-inter-semibold text-black">
            Filter {filterCount > 0 ? `(${filterCount})` : ''}
          </Text>
        </Pressable>

        {/* Sort Dropdown */}
        <View className="flex-1">
          <DropDownPicker
            open={sortOpen}
            items={sortItems}
            value={sortValue}
            listMode="SCROLLVIEW"
            setOpen={setSortOpen}
            setItems={setSortItems}
            setValue={(callback) => {
              const newValue = typeof callback === 'function' ? callback(sortValue) : callback;
              handleSortChange(newValue);
            }}
            placeholder="Sort by"
            style={{
              backgroundColor: '#fff',
              borderColor: '#d1d5db',
              borderRadius: 8,
              minHeight: 40,
            }}
            textStyle={{
              fontSize: 14,
              fontFamily: 'Inter',
            }}
            dropDownContainerStyle={{
              borderColor: '#e5e7eb',
              borderRadius: 8,
              maxHeight: 300,
            }}
            scrollViewProps={{
              nestedScrollEnabled: true,
              scrollEnabled: true,
              showsVerticalScrollIndicator: true,
            }}
            zIndex={2000}
            zIndexInverse={3000}
          />
        </View>
      </View>
    </View>
  );
};

export default FilterSortBar;
