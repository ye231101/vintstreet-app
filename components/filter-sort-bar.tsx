import React, { useState } from 'react';
import { View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export interface FilterSortBarProps {
  filterCount?: number;
  sortBy?: string;
  priceFilter?: string;
  onPriceFilterChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
}

const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filterCount = 0,
  sortBy = 'Most Relevant',
  priceFilter = 'All Prices',
  onPriceFilterChange,
  onSortChange,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [sortValue, setSortValue] = useState(sortBy);
  const [priceValue, setPriceValue] = useState(priceFilter);

  const [sortItems, setSortItems] = useState([
    { label: 'Most Relevant', value: 'Most Relevant' },
    { label: 'Price: Low to High', value: 'Price: Low to High' },
    { label: 'Price: High to Low', value: 'Price: High to Low' },
    { label: 'Newest First', value: 'Newest First' },
    { label: 'Oldest First', value: 'Oldest First' },
    { label: 'Most Popular', value: 'Most Popular' },
  ]);

  const [priceItems, setPriceItems] = useState([
    { label: 'All Prices', value: 'All Prices' },
    { label: 'Under £50.00', value: 'Under £50.00' },
    { label: '£50.00 - £100.00', value: '£50.00 - £100.00' },
    { label: '£100.00 - £200.00', value: '£100.00 - £200.00' },
    { label: 'Over £200.00', value: 'Over £200.00' },
  ]);

  const handleSortChange = (value: string) => {
    setSortValue(value);
    onSortChange?.(value);
  };

  const handlePriceChange = (value: string) => {
    setPriceValue(value);
    onPriceFilterChange?.(value);
  };

  return (
    <View className="flex-row p-4 gap-4 bg-gray-50 border-b border-gray-100">
      {/* Price Filter Dropdown */}
      <View className="flex-1">
        <DropDownPicker
          open={priceOpen}
          setOpen={setPriceOpen}
          items={priceItems}
          setItems={setPriceItems}
          value={priceValue}
          setValue={(callback) => {
            const newValue = typeof callback === 'function' ? callback(priceValue) : callback;
            handlePriceChange(newValue);
          }}
          listMode="SCROLLVIEW"
          placeholder="Filter by price"
          style={{
            backgroundColor: '#e5e5e5',
            borderColor: '#d1d5db',
            borderRadius: 12,
            minHeight: 40,
          }}
          textStyle={{
            fontSize: 14,
            fontFamily: 'Inter',
          }}
          dropDownContainerStyle={{
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderRadius: 12,
            maxHeight: 300,
          }}
          scrollViewProps={{
            nestedScrollEnabled: true,
            scrollEnabled: true,
            showsVerticalScrollIndicator: true,
          }}
          zIndex={2000}
          zIndexInverse={2000}
        />
      </View>

      {/* Sort Dropdown */}
      <View className="flex-1">
        <DropDownPicker
          open={sortOpen}
          setOpen={setSortOpen}
          items={sortItems}
          setItems={setSortItems}
          value={sortValue}
          setValue={(callback) => {
            const newValue = typeof callback === 'function' ? callback(sortValue) : callback;
            handleSortChange(newValue);
          }}
          listMode="SCROLLVIEW"
          placeholder="Sort by"
          style={{
            backgroundColor: '#e5e5e5',
            borderColor: '#d1d5db',
            borderRadius: 12,
            minHeight: 40,
          }}
          textStyle={{
            fontSize: 14,
            fontFamily: 'Inter',
          }}
          dropDownContainerStyle={{
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderRadius: 12,
            maxHeight: 300,
          }}
          scrollViewProps={{
            nestedScrollEnabled: true,
            scrollEnabled: true,
            showsVerticalScrollIndicator: true,
          }}
          zIndex={1000}
          zIndexInverse={1000}
        />
      </View>
    </View>
  );
};

export default FilterSortBar;
