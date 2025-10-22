import { supabase } from '@/api/config/supabase';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  userId?: string;
  productName?: string;
  orderId?: string;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  userId,
  productName,
  orderId,
}) => {
  const [contactSubject, setContactSubject] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [subjectItems, setSubjectItems] = useState([
    { label: 'Product Inquiry', value: 'Product Inquiry' },
    { label: 'Shipping Question', value: 'Shipping Question' },
    { label: 'Payment Issue', value: 'Payment Issue' },
    { label: 'Product Condition', value: 'Product Condition' },
    { label: 'Return Request', value: 'Return Request' },
    { label: 'General Question', value: 'General Question' },
    { label: 'Other', value: 'Other' },
  ]);

  const handleSendMessage = async () => {
    if (!contactSubject || !contactMessage.trim()) {
      console.log('Please fill in all fields');
      return;
    }

    if (!userId) {
      console.log('You must be logged in to send a message');
      return;
    }

    setIsSubmittingMessage(true);

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        recipient_id: sellerId,
        subject: contactSubject,
        message: contactMessage.trim(),
        order_id: orderId || null,
      });

      if (error) throw error;

      console.log('Message sent to seller!');
      handleClose();
    } catch (error) {
      console.error('Error sending message:', error);
      console.log('Failed to send message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleClose = () => {
    setContactSubject(null);
    setContactMessage('');
    setShowSubjectDropdown(false);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
        <View className="flex-1" />
        <Pressable className="bg-white w-full rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Feather name="message-circle" size={20} color="#000" />
                <Text className="text-lg font-inter-semibold text-gray-900 ml-2">Contact Seller</Text>
              </View>
              <Pressable onPress={handleClose} className="p-1">
                <Feather name="x" size={20} color="#666" />
              </Pressable>
            </View>
            <Text className="text-sm font-inter text-gray-600">
              Send a message to {sellerName}
              {productName ? ` about ${productName}` : ''}
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!showSubjectDropdown}
            contentContainerStyle={{ flexGrow: 1 }}
            className="p-6"
          >
            {/* Order Reference */}
            {orderId && (
              <View className="p-3 bg-gray-100 rounded-lg mb-4">
                <Text className="text-sm font-inter text-gray-600">Order #{orderId.slice(-8)}</Text>
              </View>
            )}

            {/* Subject */}
            <View className="mb-4">
              <Text className="text-sm font-inter text-gray-700 mb-2">Subject *</Text>
              <DropDownPicker
                open={showSubjectDropdown}
                value={contactSubject}
                items={subjectItems}
                listMode="SCROLLVIEW"
                setOpen={setShowSubjectDropdown}
                setValue={setContactSubject}
                setItems={setSubjectItems}
                placeholder="Select a subject"
                style={{
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                textStyle={{
                  fontSize: 14,
                  fontFamily: 'Inter',
                }}
                placeholderStyle={{
                  color: '#9CA3AF',
                  fontSize: 14,
                  fontFamily: 'Inter',
                }}
                dropDownContainerStyle={{
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  maxHeight: 300,
                }}
                listItemContainerStyle={{
                  paddingVertical: 12,
                }}
                listItemLabelStyle={{
                  fontSize: 14,
                  fontFamily: 'Inter',
                }}
                scrollViewProps={{
                  nestedScrollEnabled: true,
                  scrollEnabled: true,
                  showsVerticalScrollIndicator: true,
                }}
                disableLocalSearch={false}
              />
            </View>

            {/* Message */}
            <View className="mb-4">
              <Text className="text-sm font-inter text-gray-700 mb-2">Message *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                style={{ height: 200 }}
                placeholder="Type your message here..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                value={contactMessage}
                onChangeText={setContactMessage}
                maxLength={1000}
              />
              <Text className="text-xs font-inter text-gray-500 text-right mt-1">
                {contactMessage.length}/1000 characters
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 py-3 rounded-lg border border-gray-300"
                onPress={handleClose}
                disabled={isSubmittingMessage}
              >
                <Text className="text-center text-sm font-inter-semibold text-gray-800">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-lg bg-black"
                onPress={handleSendMessage}
                disabled={isSubmittingMessage || !contactSubject || !contactMessage.trim()}
              >
                <Text className="text-center text-sm font-inter-semibold text-white">
                  {isSubmittingMessage ? 'Sending...' : 'Send Message'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
