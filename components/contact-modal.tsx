import { messagesService, Order, Product } from '@/api';
import { DropdownComponent, InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
        style={styles.container}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl">
            {/* Header */}
            <View className="flex-col gap-2 p-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Feather name="message-circle" size={20} color="#000" />
                  <Text className="text-xl font-inter-bold text-gray-900">{modalTitle}</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm font-inter-semibold text-gray-600">{modalDescription}</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="gap-4 p-4">
                {/* Order Reference */}
                {order?.id && (
                  <View className="p-4 rounded-lg bg-gray-100">
                    <Text className="text-sm font-inter-semibold text-gray-600">{order?.order_number}</Text>
                  </View>
                )}

                {/* Subject */}
                <DropdownComponent
                  data={SUBJECT_OPTIONS}
                  value={subject}
                  label="Subject"
                  size="small"
                  required={true}
                  placeholder="Select a subject"
                  onChange={(item) => setSubject(item.value)}
                />

                {/* Message */}
                <InputComponent
                  value={message}
                  label="Message"
                  size="small"
                  required={true}
                  placeholder="Type your message here..."
                  onChangeText={(text) => setMessage(text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  height={200}
                  maxLength={1000}
                />

                {/* Actions */}
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
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
                    className="flex-1 flex-row items-center justify-center py-3 rounded-lg bg-gray-200"
                  >
                    <Text className="text-base font-inter-bold text-gray-900 text-center">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
