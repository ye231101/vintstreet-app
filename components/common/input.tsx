import { Feather } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';

interface InputProps {
  value: string;
  label?: string;
  required?: boolean;
  icon?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  onSubmitEditing?: () => void;
  error?: string;
  style?: StyleProp<ViewStyle>;
}

export const InputComponent: React.FC<InputProps> = ({
  label,
  value,
  required = false,
  icon,
  placeholder,
  onChangeText,
  secureTextEntry = false,
  showPasswordToggle = false,
  onTogglePassword,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType = 'done',
  onSubmitEditing,
  error,
  style,
}: InputProps) => {
  const styles = StyleSheet.create({
    input: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      padding: 12,
      backgroundColor: 'white',
      borderColor: error ? '#F87171' : '#D1D5DB',
      borderWidth: 1,
      borderRadius: 8,
    },
  });

  return (
    <View className="gap-2">
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
          className="flex-1 text-base font-inter text-black"
          style={{ height: 50 }}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {showPasswordToggle && (
          <Pressable onPress={onTogglePassword} hitSlop={8}>
            <Feather name={secureTextEntry ? 'eye' : 'eye-off'} size={24} color="black" />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 font-inter">{error}</Text>}
    </View>
  );
};
