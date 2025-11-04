import { Feather } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';

interface InputProps {
  value: string;
  label?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  onSubmitEditing?: () => void;
  editable?: boolean;
  height?: number;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'top' | 'bottom' | 'center';
  textAlign?: 'left' | 'right' | 'center';
  textContentType?:
    | 'none'
    | 'username'
    | 'password'
    | 'emailAddress'
    | 'name'
    | 'telephoneNumber'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'postalCode'
    | 'location'
    | 'countryName';
  autoComplete?:
    | 'off'
    | 'username'
    | 'password'
    | 'email'
    | 'name'
    | 'tel'
    | 'street-address'
    | 'postal-code'
    | 'cc-number'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-month'
    | 'cc-exp-year';
  error?: string;
  style?: StyleProp<ViewStyle>;
}

export const InputComponent: React.FC<InputProps> = ({
  label,
  value,
  icon,
  size = 'medium',
  required = false,
  placeholder,
  onChangeText,
  secureTextEntry = false,
  showPasswordToggle = false,
  onTogglePassword,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType = 'done',
  onSubmitEditing,
  editable = true,
  height,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  textAlignVertical = 'center',
  textAlign = 'left',
  textContentType,
  autoComplete,
  error,
  style,
}: InputProps) => {
  const styles = StyleSheet.create({
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: height || (size === 'small' ? 40 : size === 'medium' ? 50 : 60),
      padding: 12,
      backgroundColor: 'white',
      borderColor: error ? '#F87171' : '#D1D5DB',
      borderWidth: 1,
      borderRadius: 8,
    },
  });

  return (
    <View className="w-full gap-2">
      {label && (
        <Text className="text-sm font-inter-semibold text-gray-700">
          {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
      )}
      <View style={[styles.input, style]}>
        {icon && (
          <Text className="mr-2">
            <Feather name={icon as any} size={24} color="black" />
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          textContentType={textContentType}
          autoComplete={autoComplete}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={textAlignVertical}
          textAlign={textAlign}
          className="flex-1 font-inter text-black"
          style={{ height: height || (size === 'small' ? 40 : size === 'medium' ? 50 : 60) }}
        />
        {showPasswordToggle && (
          <Pressable onPress={onTogglePassword} hitSlop={8}>
            <Feather name={secureTextEntry ? 'eye' : 'eye-off'} size={24} color="black" />
          </Pressable>
        )}
      </View>
      {maxLength && (
        <Text className="text-sm font-inter-semibold text-gray-500 text-right">
          {value.length}/{maxLength} characters
        </Text>
      )}
      {error && <Text className="text-red-400 text-xs mt-1 font-inter">{error}</Text>}
    </View>
  );
};
