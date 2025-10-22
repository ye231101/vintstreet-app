import React from 'react';
import { View, Text } from 'react-native';
import { CategorySelectionForm } from './CategorySelectionForm';
import { DynamicAttributesForm } from './DynamicAttributesForm';

interface Attribute {
  id: string;
  name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'multi-select';
  is_required: boolean;
  attribute_options?: Array<{
    id: string;
    value: string;
    is_active: boolean;
    display_order?: number;
  }>;
}

interface CategoryAttributesCardProps {
  // Category selection props
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedSubSubcategoryId: string;
  selectedSubSubSubcategoryId: string;
  categories: Array<{ id: string; name: string; slug?: string; display_order?: number }>;
  subcategories: Array<{ id: string; name: string; category_id: string }>;
  subSubcategories: Array<{ id: string; name: string; subcategory_id: string }>;
  subSubSubcategories: Array<{ id: string; name: string; sub_subcategory_id: string }>;
  onCategoryPress: () => void;

  // Dynamic attributes props
  attributes: Attribute[];
  dynamicAttributes: Record<string, any>;
  onAttributeChange: (attributeId: string, value: any) => void;
}

export const CategoryAttributesCard: React.FC<CategoryAttributesCardProps> = ({
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSubSubcategoryId,
  selectedSubSubSubcategoryId,
  categories,
  subcategories,
  subSubcategories,
  subSubSubcategories,
  onCategoryPress,
  attributes,
  dynamicAttributes,
  onAttributeChange,
}) => {
  return (
    <View className="bg-white rounded-lg p-4 mb-4">
      <Text className="text-lg font-inter-bold text-black mb-4">Category & Attributes</Text>

      <CategorySelectionForm
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedSubSubcategoryId={selectedSubSubcategoryId}
        selectedSubSubSubcategoryId={selectedSubSubSubcategoryId}
        categories={categories}
        subcategories={subcategories}
        subSubcategories={subSubcategories}
        subSubSubcategories={subSubSubcategories}
        onCategoryPress={onCategoryPress}
      />

      {attributes.length > 0 && (
        <DynamicAttributesForm
          attributes={attributes}
          dynamicAttributes={dynamicAttributes}
          onAttributeChange={onAttributeChange}
        />
      )}
    </View>
  );
};
