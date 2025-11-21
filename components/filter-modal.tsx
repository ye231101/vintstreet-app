import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AppliedFilters) => void;
  priceOptions?: FilterOption[];
  brandOptions?: FilterOption[];
  initialFilters?: AppliedFilters;
}

export interface AppliedFilters {
  priceRanges: string[];
  brands: string[];
}

type FilterCategory = 'price' | 'brand';

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  priceOptions = [
    { label: 'Under £50', value: 'Under £50.00', count: 0 },
    { label: '£50 - £100', value: '£50.00 - £100.00', count: 0 },
    { label: '£100 - £200', value: '£100.00 - £200.00', count: 0 },
    { label: 'Over £200', value: 'Over £200.00', count: 0 },
  ],
  brandOptions = [],
  initialFilters,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('price');
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    if (initialFilters) {
      setSelectedPrices(initialFilters.priceRanges);
      setSelectedBrands(initialFilters.brands);
    }
  }, [initialFilters]);

  const togglePrice = (value: string) => {
    setSelectedPrices((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  };

  const toggleBrand = (value: string) => {
    setSelectedBrands((prev) => (prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]));
  };

  const handleClearAll = () => {
    setSelectedPrices([]);
    setSelectedBrands([]);
  };

  const handleApply = () => {
    onApply({
      priceRanges: selectedPrices,
      brands: selectedBrands,
    });
    onClose();
  };

  const getTotalFiltersCount = () => {
    return selectedPrices.length + selectedBrands.length;
  };

  const renderFilterOptions = () => {
    let options: FilterOption[] = [];
    let selectedValues: string[] = [];
    let toggleFunction: (value: string) => void = () => {};

    switch (selectedCategory) {
      case 'price':
        options = priceOptions;
        selectedValues = selectedPrices;
        toggleFunction = togglePrice;
        break;
      case 'brand':
        options = brandOptions;
        selectedValues = selectedBrands;
        toggleFunction = toggleBrand;
        break;
    }

    if (options.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-5">
          <Feather name="inbox" size={48} color="#ccc" />
          <Text className="text-gray-400 font-inter-medium mt-3 text-center">
            No {selectedCategory} options available
          </Text>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => toggleFunction(option.value)}
            className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
          >
            <View className="flex-1">
              <Text className="text-base font-inter-medium text-black">
                {option.label} {option.count !== undefined ? `(${option.count})` : ''}
              </Text>
            </View>
            <View
              className={`w-6 h-6 border-2 rounded ${
                selectedValues.includes(option.value) ? 'bg-black border-black' : 'bg-white border-gray-300'
              } items-center justify-center`}
            >
              {selectedValues.includes(option.value) && <Feather name="check" size={16} color="#fff" />}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <SafeAreaView edges={['bottom']} className="h-3/5 w-full rounded-t-2xl bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <View className="flex-1 flex-row items-center gap-4">
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
              <Text className="text-xl font-inter-bold text-black">Filters</Text>
            </View>
            <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
              <Text className="text-base font-inter-semibold text-black">Clear all</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 flex-row">
            {/* Left Sidebar - Filter Categories */}
            <View className="w-32 bg-gray-100 border-r border-gray-200">
              <Pressable
                onPress={() => setSelectedCategory('price')}
                className={`p-4 border-b border-gray-200 ${selectedCategory === 'price' ? 'bg-white' : 'bg-gray-100'}`}
              >
                <View className="flex-row items-center">
                  {selectedCategory === 'price' && (
                    <Feather name="check" size={20} color="#000" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    className={`text-sm font-inter-semibold ${
                      selectedCategory === 'price' ? 'text-black' : 'text-gray-600'
                    }`}
                  >
                    Price
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setSelectedCategory('brand')}
                className={`p-4 border-b border-gray-200 ${selectedCategory === 'brand' ? 'bg-white' : 'bg-gray-100'}`}
              >
                <View className="flex-row items-center">
                  {selectedCategory === 'brand' && (
                    <Feather name="check" size={20} color="#000" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    className={`text-sm font-inter-semibold ${
                      selectedCategory === 'brand' ? 'text-black' : 'text-gray-600'
                    }`}
                  >
                    Brand
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Right Side - Filter Options */}
            <View className="flex-1 bg-white">{renderFilterOptions()}</View>
          </View>

          {/* Apply Button */}
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity onPress={handleApply} className="bg-black rounded-lg p-4 items-center">
              <Text className="text-white text-base font-inter-bold">
                Apply Filters {getTotalFiltersCount() > 0 ? `(${getTotalFiltersCount()})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default FilterModal;
