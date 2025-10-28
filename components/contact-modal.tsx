import { Product } from '@/api/services/listings.service';
import { Order } from '@/api/services/orders.service';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { messagesService } from '../api/services/messages.service';
import { useAuth } from '../hooks/use-auth';
import DropdownComponent from './common/dropdown';

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
  order?: Order | null;
  product?: Product | null;
  mode?: 'buyer' | 'seller';
}

export const ContactModal: React.FC<ContactModalProps> = ({ visible, onClose, order, product, mode = 'seller' }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const SUBJECT_OPTIONS = [
    { label: 'Product Inquiry', value: 'Product Inquiry' },
    { label: 'Shipping Question', value: 'Shipping Question' },
    { label: 'Payment Issue', value: 'Payment Issue' },
    { label: 'Product Condition', value: 'Product Condition' },
    { label: 'Return Request', value: 'Return Request' },
    { label: 'Order Update', value: 'Order Update' },
    { label: 'General Question', value: 'General Question' },
    { label: 'Other', value: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to send a message');
      return;
    }

    if (!order?.buyer_id || order?.buyer_id.trim() === '') {
      Alert.alert('Error', 'Invalid recipient. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      await messagesService.sendMessage({
        sender_id: user.id,
        recipient_id: order?.buyer_id,
        subject: subject.trim(),
        message: message.trim(),
        order_id: order?.id || undefined,
      });

      Alert.alert(
        'Success',
        `Message sent to ${order?.buyer_profile?.full_name || order?.buyer_profile?.username || 'N/A'}!`
      );
      onClose();
      setSubject('');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error?.message || 'Failed to send message. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = mode === 'seller' ? 'Message Buyer' : 'Contact Seller';
  const modalDescription =
    mode === 'seller'
      ? `Send a message to ${order?.buyer_profile?.full_name || order?.buyer_profile?.username || 'N/A'}${
          order?.listings?.product_name ? ` about ${order?.listings?.product_name}` : ''
        }`
      : product
      ? `Send a message to ${product?.seller_info_view?.shop_name || product?.seller_info_view?.full_name || 'Seller'}${
          product?.product_name ? ` about ${product?.product_name}` : ''
        }`
      : `Send a message to Seller ${order?.listings?.product_name ? ` about ${order?.listings?.product_name}` : ''}`;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <Pressable onPress={onClose} className="flex-1 bg-black/50 justify-end">
          <View className="flex-1" />
          <Pressable className="bg-white rounded-t-3xl max-h-[90%]" onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="flex-col p-4 gap-2 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Feather name="message-circle" size={20} color="#000" />
                  <Text className="text-xl font-inter-bold text-gray-900 ml-2">{modalTitle}</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm font-inter text-gray-600">{modalDescription}</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
            >
              <View className="gap-4">
                {/* Order Reference */}
                {order?.id && (
                  <View className="p-4 bg-gray-100 rounded-lg">
                    <Text className="text-sm font-inter-semibold text-gray-600">{order?.order_number}</Text>
                  </View>
                )}

                {/* Subject */}
                <View className="gap-2">
                  <Text className="text-sm font-inter-semibold text-gray-700">Subject *</Text>
                  <DropdownComponent
                    data={SUBJECT_OPTIONS}
                    value={subject}
                    placeholder="Select a subject"
                    onChange={(item) => setSubject(item.value)}
                  />
                </View>

                {/* Message */}
                <View className="gap-2">
                  <Text className="text-sm font-inter-medium text-gray-900">Message *</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 h-48"
                    placeholder="Type your message here..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    value={message}
                    onChangeText={setMessage}
                    maxLength={1000}
                  />
                  <Text className="text-xs font-inter-semibold text-gray-500 text-right mt-1">
                    {message.length}/1000 characters
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                    className={`flex-row flex-1 items-center justify-center py-3 rounded-lg ${
                      isSubmitting || !subject.trim() || !message.trim() ? 'bg-gray-300' : 'bg-black'
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="send" size={20} color="#fff" />
                        <Text className="text-base font-inter-bold text-white ml-2">Send Message</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-200 rounded-lg py-3 flex-row items-center justify-center"
                  >
                    <Text className="text-base font-inter-bold text-gray-900 text-center">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
