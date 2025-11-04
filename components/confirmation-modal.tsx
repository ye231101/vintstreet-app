import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: 'default' | 'destructive';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'default',
  isLoading = false,
}) => {
  const confirmButtonClass = confirmButtonStyle === 'destructive' ? 'bg-red-600' : 'bg-green-600';

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/50 items-center justify-center p-4">
        <Pressable className="bg-white rounded-2xl p-6 w-full max-w-sm" onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  confirmButtonStyle === 'destructive' ? 'bg-red-100' : 'bg-green-100'
                }`}
              >
                <Feather
                  name={confirmButtonStyle === 'destructive' ? 'alert-triangle' : 'help-circle'}
                  size={20}
                  color={confirmButtonStyle === 'destructive' ? '#dc2626' : '#16a34a'}
                />
              </View>
              <Text className="text-lg font-inter-bold text-gray-900 ml-3">{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <Text className="text-base font-inter text-gray-600 mb-6 leading-6">{message}</Text>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
            >
              <Text className="text-base font-inter-bold text-gray-900">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoading}
              className={`flex-1 ${confirmButtonClass} rounded-lg py-3 items-center`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-base font-inter-bold text-white">{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
