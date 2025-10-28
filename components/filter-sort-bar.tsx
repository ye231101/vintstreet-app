import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export interface FilterSortBarProps {
  filterCount?: number;
  sortBy?: string;
  priceFilter?: string;
  brandFilter?: string;
  brandOptions?: Array<{ label: string; value: string }>;
  onPriceFilterChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
  onBrandFilterChange?: (value: string) => void;
}

const FilterSortBar: React.FC<FilterSortBarProps> = ({
  filterCount = 0,
  sortBy = 'Most Relevant',
  priceFilter = 'All Prices',
  brandFilter = 'All Brands',
  brandOptions = [],
  onPriceFilterChange,
  onSortChange,
  onBrandFilterChange,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [sortValue, setSortValue] = useState(sortBy);
  const [priceValue, setPriceValue] = useState(priceFilter);
  const [brandValue, setBrandValue] = useState(brandFilter);

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

  const [brandItems, setBrandItems] = useState([{ label: 'All Brands', value: 'All Brands' }, ...brandOptions]);

  // Update brand items when brandOptions changes
  useEffect(() => {
    setBrandItems([{ label: 'All Brands', value: 'All Brands' }, ...brandOptions]);
  }, [brandOptions]);

  const handleSortChange = (value: string) => {
    setSortValue(value);
    onSortChange?.(value);
  };

  const handlePriceChange = (value: string) => {
    setPriceValue(value);
    onPriceFilterChange?.(value);
  };

  const handleBrandChange = (value: string) => {
    setBrandValue(value);
    onBrandFilterChange?.(value);
  };

  return (
    <View className="p-4 bg-gray-50 border-b border-gray-100">
      {/* First Row: Brand and Price */}
      <View className="flex-row gap-4 mb-4">
        {/* Brand Filter Dropdown */}
        <View className="flex-1">
          <DropDownPicker
            open={brandOpen}
            items={brandItems}
            value={brandValue}
            listMode="SCROLLVIEW"
            setOpen={setBrandOpen}
            setItems={setBrandItems}
            setValue={(callback) => {
              const newValue = typeof callback === 'function' ? callback(brandValue) : callback;
              handleBrandChange(newValue);
            }}
            placeholder="Filter by brand"
            style={{
              backgroundColor: '#e5e5e5',
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
            zIndex={4000}
            zIndexInverse={1000}
          />
        </View>

        {/* Price Filter Dropdown */}
        <View className="flex-1">
          <DropDownPicker
            open={priceOpen}
            items={priceItems}
            value={priceValue}
            listMode="SCROLLVIEW"
            setOpen={setPriceOpen}
            setItems={setPriceItems}
            setValue={(callback) => {
              const newValue = typeof callback === 'function' ? callback(priceValue) : callback;
              handlePriceChange(newValue);
            }}
            placeholder="Filter by price"
            style={{
              backgroundColor: '#e5e5e5',
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
            zIndex={3000}
            zIndexInverse={2000}
          />
        </View>
      </View>

      {/* Second Row: Sort */}
      <View>
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
            backgroundColor: '#e5e5e5',
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
  );
};

export default FilterSortBar;
