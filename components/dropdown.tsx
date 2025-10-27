import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

export interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  data: DropdownItem[];
  value: string;
  placeholder?: string;
  maxHeight?: number;
  onChange: (item: DropdownItem) => void;
  style?: StyleProp<ViewStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
  selectedTextStyle?: StyleProp<TextStyle>;
}

export const DropdownComponent: React.FC<DropdownProps> = ({
  data,
  value,
  placeholder = 'Select an option',
  maxHeight = 300,
  onChange,
  style,
  placeholderStyle,
  selectedTextStyle,
}: DropdownProps) => {
  return (
    <Dropdown
      data={data}
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
      style={style || styles.dropdown}
      placeholderStyle={placeholderStyle || styles.placeholderStyle}
      selectedTextStyle={selectedTextStyle || styles.selectedTextStyle}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
  },
  placeholderStyle: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  selectedTextStyle: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
});
