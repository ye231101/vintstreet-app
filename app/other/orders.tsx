import { ordersService } from '@/api/services';
import { Order } from '@/api/types';
import { ContactModal } from '@/components/contact-modal';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const { user } = useAuth();

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch orders from the API
      const fetchedOrders = await ordersService.getOrders(user.id, 'buyer');
      setOrders(fetchedOrders);
    } catch (err) {
      logger.error('Error loading orders', err);
      setError(err instanceof Error ? err.message : 'Error loading orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'all':
        return orders;
      case 'processing':
        return orders.filter((order) => order.delivery_status === 'processing');
      case 'shipped':
        return orders.filter((order) => order.delivery_status === 'shipped');
      case 'delivered':
        return orders.filter((order) => order.delivery_status === 'delivered' || order.delivery_status === 'completed');
      case 'cancelled':
        return orders.filter((order) => order.delivery_status === 'cancelled');
      default:
        return orders;
    }
  };

  const getTabCount = (key: string) => {
    switch (key) {
      case 'all':
        return orders.length;
      case 'processing':
        return orders.filter((o) => o.delivery_status === 'processing').length;
      case 'shipped':
        return orders.filter((o) => o.delivery_status === 'shipped').length;
      case 'delivered':
        return orders.filter((o) => o.delivery_status === 'delivered' || o.delivery_status === 'completed').length;
      case 'cancelled':
        return orders.filter((o) => o.delivery_status === 'cancelled').length;
      default:
        return 0;
    }
  };

  const handleContactSeller = (order: Order) => {
    setSelectedOrder(order);
    setShowContactModal(true);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <View className="bg-white rounded-lg shadow-lg">
      {/* Order header */}
      <View className="flex-row justify-between items-start p-4">
        <View className="flex-1">
          <Text className="text-gray-900 font-inter-bold text-base mb-1">{order.order_number}</Text>
          <Text className="text-gray-600 text-sm font-inter">{formatDate(order.order_date)}</Text>
        </View>
        <View
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: `#${order.status_color?.toString(16).padStart(6, '0')}` }}
        >
          <Text className="font-inter-bold text-xs text-white">
            {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-200" />

      {/* Order items */}
      {order.listings && (
        <View className="flex-row items-center px-4 py-3">
          <View className="w-20 h-20 rounded-lg bg-gray-200 mr-4 overflow-hidden">
            <Image
              source={{ uri: order.listings.product_image }}
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

      {/* Divider */}
      <View className="h-px bg-gray-200" />

      {/* Order actions */}
      <View className="p-4">
        <TouchableOpacity
          onPress={() => handleContactSeller(order)}
          className="flex-1 bg-black rounded-lg py-3 flex-row items-center justify-center"
        >
          <Feather name="message-circle" size={16} color="#fff" />
          <Text className="text-white text-sm font-inter-bold ml-2">Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">My Orders</Text>
      </View>

      <View className="flex-1">
        <View className="border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => {
              const count = getTabCount(tab.key);
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`py-3 px-4 border-b-2 ${activeTab === tab.key ? 'border-black' : 'border-transparent'}`}
                >
                  <Text
                    className={`text-base font-inter-semibold ${
                      activeTab === tab.key ? 'text-black' : 'text-gray-600'
                    }`}
                  >
                    {tab.label} {count > 0 ? `(${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading your orders...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading orders</Text>
            <TouchableOpacity onPress={loadOrders} className="px-6 py-3 rounded-lg bg-black">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : getFilteredOrders().length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadOrders} />}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="gap-4 p-4">
              {getFilteredOrders().map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="shopping-cart" color="#666" size={64} />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4">No orders found</Text>
            <Text className="text-gray-600 text-sm font-inter mt-2">
              {activeTab === 'all'
                ? 'Your orders will appear here when you make purchases'
                : `No ${activeTab} orders at this time`}
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      {selectedOrder && (
        <ContactModal
          visible={showContactModal}
          onClose={() => setShowContactModal(false)}
          order={selectedOrder}
          product={null}
          mode="buyer"
        />
      )}
    </SafeAreaView>
  );
}
