import { Attribute, AttributeOption } from '@/api/types';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DynamicAttributesFormProps {
  attributes: Attribute[];
  dynamicAttributes: Record<string, unknown>;
  onAttributeChange: (attributeId: string, value: unknown) => void;
}

export const DynamicAttributesForm: React.FC<DynamicAttributesFormProps> = ({
  attributes,
  dynamicAttributes,
  onAttributeChange,
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [showAttributeModal, setShowAttributeModal] = useState(false);

  // Reset modal state when selectedAttribute changes
  useEffect(() => {
    if (selectedAttribute) {
      setShowAttributeModal(true);
    }
  }, [selectedAttribute]);

  if (attributes.length === 0) return null;

  const renderAttributeInput = (attribute: Attribute) => {
    const options = attribute.attribute_options?.filter((opt) => opt.is_active) || [];
    const hasOptions = options.length > 0;
    const selectedValue = dynamicAttributes[attribute.id];

    switch (attribute.data_type) {
      case 'string':
        if (hasOptions) {
          return (
            <TouchableOpacity
              key={`${attribute.id}-${selectedValue}`}
              className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row items-center justify-between"
              onPress={() => {
                setSelectedAttribute(attribute);
                setShowAttributeModal(true);
              }}
            >
              <Text className="text-sm font-inter-semibold text-black">
                {selectedValue ? selectedValue : `Select ${attribute.name.toLowerCase()}`}
              </Text>
              <Feather name="chevron-down" size={16} color="#999" />
            </TouchableOpacity>
          );
        } else {
          return (
            <TextInput
              className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
              placeholder={`Enter ${attribute.name.toLowerCase()}`}
              value={selectedValue || ''}
              onChangeText={(value) => onAttributeChange(attribute.id, value)}
            />
          );
        }

      case 'number':
        return (
          <TextInput
            className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
            value={selectedValue || ''}
            onChangeText={(value) => onAttributeChange(attribute.id, value)}
            keyboardType="numeric"
          />
        );

      case 'boolean':
        return (
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => onAttributeChange(attribute.id, !selectedValue)}
          >
            <View
              className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                selectedValue ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}
            >
              {selectedValue && <Feather name="check" size={14} color="#fff" />}
            </View>
            <Text className="text-sm font-inter-semibold text-black">Yes</Text>
          </TouchableOpacity>
        );

      case 'multi-select':
        if (hasOptions) {
          const selectedValues = Array.isArray(selectedValue) ? selectedValue : [];
          return (
            <TouchableOpacity
              key={`${attribute.id}-${JSON.stringify(selectedValues)}`}
              className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row items-center justify-between"
              onPress={() => {
                setSelectedAttribute(attribute);
                setShowAttributeModal(true);
              }}
            >
              <Text className="text-sm font-inter-semibold text-black">
                {selectedValues.length > 0
                  ? `${selectedValues.length} selected`
                  : `Select ${attribute.name.toLowerCase()}`}
              </Text>
              <Feather name="chevron-up" size={16} color="#999" />
            </TouchableOpacity>
          );
        }
        return null;

      default:
        return null;
    }
  };

  const renderAttributeModal = () => {
    if (!selectedAttribute) return null;

    const options = selectedAttribute.attribute_options?.filter((opt) => opt.is_active) || [];
    const isMultiSelect = selectedAttribute.data_type === 'multi-select';
    const currentAttributeValue = dynamicAttributes[selectedAttribute.id];
    const selectedValues = isMultiSelect
      ? Array.isArray(currentAttributeValue)
        ? currentAttributeValue
        : []
      : currentAttributeValue;

    const handleOptionSelect = (option: AttributeOption) => {
      if (isMultiSelect) {
        const currentValues = Array.isArray(currentAttributeValue) ? currentAttributeValue : [];
        const isSelected = currentValues.includes(option.value);

        if (isSelected) {
          const newValues = currentValues.filter((v) => v !== option.value);
          onAttributeChange(selectedAttribute.id, newValues);
        } else {
          const newValues = [...currentValues, option.value];
          onAttributeChange(selectedAttribute.id, newValues);
        }
      } else {
        onAttributeChange(selectedAttribute.id, option.value);
        setShowAttributeModal(false);
      }
    };

    return (
      <Modal
        key={`${selectedAttribute.id}-${JSON.stringify(currentAttributeValue)}`}
        visible={showAttributeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAttributeModal(false);
          setSelectedAttribute(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView edges={['bottom']} className="max-h-4/5 rounded-t-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-inter-bold text-black">{selectedAttribute.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAttributeModal(false);
                  setSelectedAttribute(null);
                }}
                hitSlop={8}
              >
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
              {options.length === 0 ? (
                <View className="items-center p-8">
                  <Text className="text-sm font-inter-semibold text-gray-500">No options available</Text>
                </View>
              ) : (
                options.map((option) => {
                  const isSelected = isMultiSelect
                    ? selectedValues.includes(option.value)
                    : selectedValues === option.value;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      className={`flex-row items-center justify-between p-4 border-b border-gray-200  ${
                        isSelected ? 'bg-gray-100' : 'bg-transparent'
                      }`}
                      onPress={() => handleOptionSelect(option)}
                    >
                      <Text className="text-base font-inter-semibold text-black">{option.value}</Text>
                      {isSelected && <Feather name="check" size={16} color="#000" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Done Button for Multi-select */}
            {isMultiSelect && (
              <View className="p-4">
                <TouchableOpacity
                  className="items-center justify-center p-4 rounded-lg bg-black"
                  onPress={() => {
                    setShowAttributeModal(false);
                    setSelectedAttribute(null);
                  }}
                >
                  <Text className="text-base font-inter-semibold text-white">Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  return (
    <View className="gap-4 mt-2">
      <Text className="font-semibold text-sm text-gray-500">Category-Specific Attributes</Text>
      <View className="gap-4">
        {attributes.map((attribute) => (
          <View key={attribute.id} className="gap-2">
            <Text className="text-sm font-inter-semibold text-black">
              {attribute.name} {attribute.is_required && <Text className="text-red-500">*</Text>}
            </Text>
            {renderAttributeInput(attribute)}
          </View>
        ))}
      </View>
      {renderAttributeModal()}
    </View>
  );
};
