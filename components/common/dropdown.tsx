import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

export interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  data: DropdownItem[];
  value: string;
  label?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  maxHeight?: number;
  onChange: (item: DropdownItem) => void;
  style?: StyleProp<ViewStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
  selectedTextStyle?: StyleProp<TextStyle>;
  error?: string;
}

export const DropdownComponent: React.FC<DropdownProps> = ({
  data,
  value,
  label,
  icon,
  size = 'medium',
  required = false,
  placeholder = 'Select an option',
  height,
  maxHeight = 300,
  onChange,
  style,
  placeholderStyle,
  selectedTextStyle,
  disabled = false,
  error,
}: DropdownProps) => {
  const styles = StyleSheet.create({
    dropdown: {
      alignItems: 'center',
      justifyContent: 'center',
      height: height || (size === 'small' ? 40 : size === 'medium' ? 50 : 60),
      paddingVertical: 12,
      paddingHorizontal: icon ? 12 : 6,
      backgroundColor: '#fff',
      borderColor: error ? '#F87171' : '#D1D5DB',
      borderWidth: 1,
      borderRadius: 8,
    },
    placeholderStyle: {
      fontSize: 14,
      fontFamily: 'Inter',
      color: '#6B7280',
    },
    selectedTextStyle: {
      fontSize: 14,
      fontFamily: 'Inter',
      color: 'black',
    },
  });

  return (
    <View className="w-full gap-2">
      {label && (
        <Text className="text-sm font-inter-semibold text-gray-700">
          {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
      )}
      <Dropdown
        data={data}
        renderLeftIcon={() => (
          <Text className="mr-3">{icon ? <Feather name={icon as unknown} size={24} color="black" /> : null}</Text>
        )}
        labelField="label"
        valueField="value"
        value={value}
        placeholder={placeholder}
        maxHeight={maxHeight}
        onChange={(item) => onChange(item)}
        renderItem={(item) => (
          <View className="px-5 py-3">
            <Text className="text-base font-inter text-black">{item.label}</Text>
          </View>
        )}
        disable={disabled}
        style={[styles.dropdown, style]}
        placeholderStyle={[styles.placeholderStyle, placeholderStyle]}
        selectedTextStyle={[styles.selectedTextStyle, selectedTextStyle]}
      />
      {error && <Text className="text-red-400 text-sm font-inter-semibold mt-1">{error}</Text>}
    </View>
  );
};
