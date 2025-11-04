import { Order, ordersService } from '@/api';
import { DropdownComponent } from '@/components/common';
import { ContactModal } from '@/components/contact-modal';
import { blurhash } from '@/utils';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface OrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
  onOrderUpdated: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ visible, onClose, order, onOrderUpdated }) => {
  const [selectedStatus, setSelectedStatus] = useState(order.delivery_status || 'processing');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const STATUS_OPTIONS = [
    {
      label: 'Pending',
      value: 'pending',
    },
    {
      label: 'Processing',
      value: 'processing',
    },
    {
      label: 'Shipped',
      value: 'shipped',
    },
    {
      label: 'Delivered',
      value: 'delivered',
    },
    {
      label: 'Cancelled',
      value: 'cancelled',
    },
  ];

  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    setSelectedStatus(order.delivery_status || 'processing');
  }, [order]);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus || newStatus === order.delivery_status) return;

    setIsUpdating(true);
    try {
      await ordersService.updateOrderStatus(order.id, newStatus);
      showSuccessToast('Order status updated successfully');
      onOrderUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating status:', error);
      showErrorToast('Failed to update order status');
      // Revert to previous status on error
      setSelectedStatus(order.delivery_status || 'processing');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveTrackingNumber = async () => {
    if (!trackingNumber.trim()) {
      showErrorToast('Please enter a tracking number');
      return;
    }

    setIsSavingTracking(true);
    try {
      await ordersService.updateTrackingNumber(order.id, trackingNumber.trim());
      showSuccessToast('Tracking number saved successfully');
      onOrderUpdated();
    } catch (error) {
      console.error('Error saving tracking number:', error);
      showErrorToast('Failed to save tracking number');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();

      // Get ordinal suffix for day
      const getSuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1:
            return 'st';
          case 2:
            return 'nd';
          case 3:
            return 'rd';
          default:
            return 'th';
        }
      };

      const suffix = getSuffix(day);
      const formatted = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Calculate time ago
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo = '';
      if (diffHours < 24) {
        timeAgo = `about ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        timeAgo = '';
      }

      return {
        date: formatted.replace(/^\d+/, day + suffix),
        timeAgo,
      };
    } catch (e) {
      return { date: dateString, timeAgo: '' };
    }
  };

  const dateInfo = formatDate(order.order_date);

  const handleMessageBuyer = () => {
    setShowContactModal(true);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-2xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-xl font-inter-bold text-gray-900">Order Details - {order.order_number}</Text>
              <Text className="text-sm font-inter text-gray-500 mt-0.5">
                Review order info and print a shipping label.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View className="p-4 gap-4">
              {/* Three Info Cards */}
              <View className="flex-row gap-4">
                {/* Total Items */}
                <View className="flex-1 bg-gray-50 rounded-lg p-4">
                  <Text className="text-sm font-inter-semibold text-gray-700 mb-2">Total Items</Text>
                  <Text className="text-3xl font-inter-bold text-gray-900">{order.quantity || 0}</Text>
                </View>

                {/* Order Date */}
                <View className="flex-1 bg-gray-50 rounded-lg p-4">
                  <View className="flex-row items-center mb-2">
                    <Feather name="calendar" size={16} color="#666" />
                    <Text className="text-sm font-inter-semibold text-gray-700 ml-1.5">Order Date</Text>
                  </View>
                  <Text className="text-base font-inter-semibold text-gray-900">{dateInfo.date}</Text>
                  {dateInfo.timeAgo && (
                    <Text className="text-xs font-inter text-gray-500 mt-0.5">({dateInfo.timeAgo})</Text>
                  )}
                </View>
              </View>

              {/* Order Status */}
              <View className="gap-2">
                <Text className="text-sm font-inter-semibold text-gray-700">Order Status</Text>
                <DropdownComponent
                  data={STATUS_OPTIONS}
                  value={selectedStatus}
                  placeholder="Select a status"
                  onChange={(item) => handleStatusChange(item.value)}
                  disabled={isUpdating}
                />
              </View>

              {order.listings && (
                <View className="flex-row items-center px-4 py-3 bg-gray-50 rounded-lg">
                  <View className="w-20 h-20 rounded-lg bg-gray-200 mr-4 overflow-hidden">
                    <Image
                      source={order.listings.product_image}
                      contentFit="cover"
                      placeholder={{ blurhash }}
                      transition={1000}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-gray-900 font-inter-medium text-base mb-1" numberOfLines={2}>
                      {order.listings.product_name}
                    </Text>
                    <Text className="text-gray-600 text-sm font-inter mb-1">Qty: {order.quantity}</Text>
                    <Text className="text-gray-900 font-inter-bold text-base">
                      £
                      {order.order_amount?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              )}

              {/* Delivery Address */}
              <View className="flex-1 bg-gray-50 rounded-lg p-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="map-pin" size={16} color="#666" />
                  <Text className="text-sm font-inter-semibold text-gray-700 ml-1.5">Delivery Address</Text>
                </View>
                <View className="pl-6">
                  <Text className="text-sm font-inter-medium text-gray-900">
                    Name: {order.buyer_profile?.full_name || order.buyer_profile?.username || 'N/A'}
                  </Text>
                  {order.buyer_details?.shipping_address_line1 && (
                    <Text className="text-sm font-inter text-gray-600 mt-0.5">
                      Address: {order.buyer_details.shipping_address_line1}
                    </Text>
                  )}
                  {order.buyer_details?.shipping_city && order.buyer_details?.shipping_postal_code && (
                    <Text className="text-sm font-inter text-gray-600">
                      City: {order.buyer_details.shipping_city}, {order.buyer_details.shipping_postal_code}
                    </Text>
                  )}
                  <Text className="text-sm font-inter text-gray-600">
                    Country: {order.buyer_details?.shipping_country || 'UK'}
                  </Text>
                </View>
              </View>

              {/* Shipping Method */}
              <View className="flex-1 bg-gray-50 rounded-lg p-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="truck" size={16} color="#666" />
                  <Text className="text-sm font-inter-semibold text-gray-700 ml-1.5">Shipping Method</Text>
                </View>
                <View className="pl-6">
                  <Text className="text-sm font-inter text-gray-900">Standard Shipping</Text>
                </View>
              </View>

              {/* Tracking Number */}
              <View className="flex-1 bg-gray-50 rounded-lg p-4 gap-2">
                <View className="flex-row items-center">
                  <Feather name="package" size={20} color="#666" />
                  <Text className="text-base font-inter-semibold text-gray-700 ml-1.5">Tracking Number</Text>
                </View>
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-4">
                    <TextInput
                      value={trackingNumber}
                      onChangeText={setTrackingNumber}
                      placeholder="Enter tracking number"
                      className="flex-1 bg-white rounded-lg px-3 py-2.5 text-sm font-inter text-gray-900 border border-gray-300"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      onPress={handleSaveTrackingNumber}
                      disabled={isSavingTracking || !trackingNumber.trim()}
                      className={`rounded-lg px-4 py-2.5 ${
                        isSavingTracking || !trackingNumber.trim() ? 'bg-gray-400' : 'bg-black'
                      }`}
                    >
                      {isSavingTracking ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-sm font-inter-semibold text-white">Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {order.tracking_number && (
                    <Text className="text-sm font-inter text-gray-500">Current: {order.tracking_number}</Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row items-center justify-center gap-4 p-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={() => showSuccessToast('Shipping label printing functionality coming soon')}
              className="flex-1 bg-black rounded-lg py-3 flex-row items-center justify-center gap-2"
            >
              <Feather name="printer" size={18} color="#fff" />
              <Text className="text-base font-inter-bold text-white ml-2">Print Shipping Label</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMessageBuyer}
              className="flex-1 bg-gray-200 rounded-lg py-3 flex-row items-center justify-center gap-2"
            >
              <Feather name="message-square" size={18} color="#000" />
              <Text className="text-base font-inter-bold text-gray-900">Message Buyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ContactModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        order={order}
        product={null}
        mode="seller"
      />
    </Modal>
  );
};
