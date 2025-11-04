import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CategorySelectionFormProps {
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedSubSubcategoryId: string;
  selectedSubSubSubcategoryId: string;
  categories: Array<{ id: string; name: string; slug?: string; display_order?: number }>;
  subcategories: Array<{ id: string; name: string; category_id: string }>;
  subSubcategories: Array<{ id: string; name: string; subcategory_id: string }>;
  subSubSubcategories: Array<{ id: string; name: string; sub_subcategory_id: string }>;
  onCategoryPress: () => void;
}

export const CategorySelectionForm: React.FC<CategorySelectionFormProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSubSubcategoryId,
  selectedSubSubSubcategoryId,
  categories,
  subcategories,
  subSubcategories,
  subSubSubcategories,
  onCategoryPress,
}) => {
  // Build the category path display
  const getCategoryPath = () => {
    const path = [];

    if (selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId);
      if (category) {
        path.push(category.name);
      }
    }

    if (selectedSubcategoryId) {
      const subcategory = subcategories.find((s) => s.id === selectedSubcategoryId);
      if (subcategory) {
        path.push(subcategory.name);
      }
    }

    if (selectedSubSubcategoryId) {
      const subSubcategory = subSubcategories.find((s) => s.id === selectedSubSubcategoryId);
      if (subSubcategory) {
        path.push(subSubcategory.name);
      }
    }

    if (selectedSubSubSubcategoryId) {
      const subSubSubcategory = subSubSubcategories.find((s) => s.id === selectedSubSubSubcategoryId);
      if (subSubSubcategory) {
        path.push(subSubSubcategory.name);
      }
    }

    return path;
  };

  const categoryPath = getCategoryPath();
  const hasSelection = categoryPath.length > 0;

  return (
    <View className="gap-2">
      <Text className="text-sm font-inter-semibold text-black">Category *</Text>
      <TouchableOpacity
        onPress={onCategoryPress}
        className="flex-row items-center justify-between px-3 py-3 rounded-lg bg-white border border-gray-300"
      >
        <View className="flex-1">
          {hasSelection ? (
            <View className="gap-1">
              <Text className="text-sm font-inter-semibold text-black">{categoryPath[0]}</Text>
              {categoryPath.length > 1 && (
                <Text className="text-xs font-inter-semibold text-gray-500">{categoryPath.slice(1).join(' > ')}</Text>
              )}
            </View>
          ) : (
            <Text className="text-sm font-inter-semibold text-gray-400">Select category</Text>
          )}
        </View>
        <Feather name="chevron-right" size={16} color="#999" />
      </TouchableOpacity>
      <View className="flex-row items-center gap-2">
        <Feather name="info" size={16} color="#999" />
        <Text className="text-sm font-inter-semibold text-gray-600">Select a category to view specific attributes</Text>
      </View>
    </View>
  );
};
