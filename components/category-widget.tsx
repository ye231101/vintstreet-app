import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Pressable, Text } from 'react-native';

export interface CategoryWidgetProps {
  title: string;
  hasChildren: boolean;
  onPress?: () => void;
}

const CategoryWidget: React.FC<CategoryWidgetProps> = ({ title, hasChildren, onPress }) => {
  return (
    <Pressable
      className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-100"
      onPress={onPress}
    >
      <Text className="text-base font-poppins text-black flex-1">{title}</Text>
      {hasChildren && <Feather name="chevron-right" size={20} color="#666" />}
    </Pressable>
  );
};

export default CategoryWidget;
