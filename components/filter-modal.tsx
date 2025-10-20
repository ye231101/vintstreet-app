import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, Text, View } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

export interface FilterCategory {
  id: string;
  name: string;
  icon: string;
  options: FilterOption[];
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApplyFilters }) => {
  const [selectedCategory, setSelectedCategory] = useState('price');
  const [selectedFilters, setSelectedFilters] = useState<{
    [key: string]: string[];
  }>({});

  // Supported filters for current DB schema: Price only
  const filterCategories: FilterCategory[] = [
    {
      id: 'price',
      name: 'Price',
      icon: 'check',
      options: [
        { id: 'under-50', name: 'Under £50', count: 0 },
        { id: '50-100', name: '£50 - £100', count: 0 },
        { id: '100-200', name: '£100 - £200', count: 0 },
        { id: 'over-200', name: 'Over £200', count: 0 },
      ],
    },
  ];

  const currentCategory = filterCategories.find((cat) => cat.id === selectedCategory);

  const handleFilterToggle = (optionId: string) => {
    const currentFilters = selectedFilters[selectedCategory] || [];
    const newFilters = currentFilters.includes(optionId)
      ? currentFilters.filter((id) => id !== optionId)
      : [...currentFilters, optionId];

    setSelectedFilters({
      ...selectedFilters,
      [selectedCategory]: newFilters,
    });
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  const handleApply = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };

  const getTotalFilterCount = () => {
    return (selectedFilters.price?.length || 0);
  };

  const renderFilterOption = ({ item }: { item: FilterOption }) => {
    const isSelected = selectedFilters[selectedCategory]?.includes(item.id) || false;

    return (
      <Pressable
        className="flex-row items-center justify-between py-3 px-5 border-b border-gray-200"
        onPress={() => handleFilterToggle(item.id)}
      >
        <Text className="text-base text-gray-800 flex-1">
          {item.name} ({item.count})
        </Text>
        <View
          className={`w-5 h-5 border rounded items-center justify-center ${
            isSelected ? 'bg-black border-black' : 'bg-white border-gray-300'
          }`}
        >
          {isSelected && <Feather name="check" size={12} color="#fff" />}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-2xl pb-0" style={{ height: screenHeight * 0.8 }}>
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-300 self-center mt-2 mb-4 rounded-full" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
            <Text className="text-lg font-bold text-black">Filters</Text>
            <Pressable className="flex-row items-center">
              <Feather name="grid" size={16} color="#666" />
              <Text className="text-sm text-gray-600 ml-2">Browse Categories</Text>
            </Pressable>
            <Pressable onPress={handleClearAll} className="flex-row items-center">
              <Feather name="trash-2" size={16} color="#666" />
              <Text className="text-sm text-gray-600 ml-2">Clear all</Text>
            </Pressable>
          </View>

          <View className="flex-1 flex-row">
            {/* Filter Categories */}
            <View className="w-1/4 bg-gray-50 border-r border-gray-200">
              {filterCategories.map((category) => (
                <Pressable
                  key={category.id}
                  className={`py-3 px-3 items-center justify-center border-b border-gray-200 ${
                    selectedCategory === category.id ? 'bg-black' : 'bg-gray-50'
                  }`}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Feather
                    name={category.icon as any}
                    size={16}
                    color={selectedCategory === category.id ? '#fff' : '#000'}
                  />
                  <Text
                    className={`text-xs mt-1 text-center ${
                      selectedCategory === category.id ? 'text-white font-semibold' : 'text-gray-800'
                    }`}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Filter Options */}
            <View className="flex-3 flex-1 px-5 py-4">
              <FlatList
                data={currentCategory?.options || []}
                renderItem={renderFilterOption}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>

          {/* Apply Button */}
          <Pressable className="bg-black mx-5 my-4 py-4 rounded-lg items-center" onPress={handleApply}>
            <Text className="text-white text-base font-semibold">
              Apply Filters {getTotalFilterCount() > 0 && `(${getTotalFilterCount()})`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;
