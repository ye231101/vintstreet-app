import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Order, ordersService } from '../../api/services/orders.service';
import { ContactSellerModal } from '../../components/contact-seller-modal';
import { WriteReviewModal } from '../../components/write-review-modal';
import { useAuth } from '../../hooks/use-auth';

export default function OrdersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    orderId: string;
    sellerId: string;
    productName: string;
  }>({
    isOpen: false,
    orderId: '',
    sellerId: '',
    productName: '',
  });
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    orderId: string;
    sellerId: string;
    productName: string;
  }>({
    isOpen: false,
    orderId: '',
    sellerId: '',
    productName: '',
  });

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
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
      console.error('Error loading orders:', err);
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
      case 'pending':
        return orders.filter((order) => order.status === 'pending');
      case 'processing':
        return orders.filter((order) => order.status === 'processing');
      case 'shipped':
        return orders.filter((order) => order.status === 'shipped');
      case 'delivered':
        return orders.filter((order) => order.status === 'delivered' || order.status === 'completed');
      case 'cancelled':
        return orders.filter((order) => order.status === 'cancelled');
      default:
        return orders;
    }
  };

  const handleWriteReview = (orderId: string, sellerId: string, productName: string) => {
    setReviewModal({ isOpen: true, orderId, sellerId, productName });
  };

  const handleContactSeller = (orderId: string, sellerId: string, productName: string) => {
    setContactModal({ isOpen: true, orderId, sellerId, productName });
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <View className="bg-white rounded-xl mb-4 shadow-sm">
      {/* Order header */}
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-gray-900 font-inter-bold text-base mb-1">Order #{order.id.slice(-6)}</Text>
            <Text className="text-gray-600 text-sm font-inter">{formatDate(order.createdAt)}</Text>
          </View>
          <View
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: `#${order.statusColor.toString(16).padStart(6, '0')}` }}
          >
            <Text className="font-inter-bold text-xs text-white">{order.displayStatus}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-200" />

      {/* Order items */}
      {order.items.map((item, index) => (
        <View key={index}>
          <View className="flex-row items-center px-4 py-2">
            <View className="w-15 h-15 rounded-lg bg-gray-200 mr-4 overflow-hidden">
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} className="w-15 h-15" resizeMode="cover" />
              ) : (
                <View className="w-15 h-15 bg-gray-200 justify-center items-center">
                  <Feather name="image" color="#666" size={24} />
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-gray-900 font-inter-medium text-base mb-1">{item.name}</Text>
              <Text className="text-gray-600 text-sm font-inter-semibold mb-1">Quantity: {item.quantity}</Text>
              <Text className="text-gray-900 font-inter-bold text-base">
                £{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Divider */}
      <View className="h-px bg-gray-200" />

      {/* Order actions */}
      <View className="flex-row items-center justify-between p-4">
        <Text className="text-gray-900 font-inter-bold text-base">
          Total: £{order.totals.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View className="flex-row gap-2">
          {(order.status === 'delivered' || order.status === 'completed') && (
            <TouchableOpacity
              onPress={() => handleWriteReview(order.id, '', order.items[0]?.name || 'Product')}
              className="flex-row items-center gap-1 border border-gray-300 rounded-lg px-3 py-2"
            >
              <Feather name="star" size={14} color="#666" />
              <Text className="text-gray-700 text-xs font-inter-medium">Review</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleContactSeller(order.id, '', order.items[0]?.name || 'Product')}
            className="flex-row items-center gap-1 border border-gray-300 rounded-lg px-3 py-2"
          >
            <Feather name="message-circle" size={14} color="#666" />
            <Text className="text-gray-700 text-xs font-inter-medium">Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">My Orders</Text>
      </View>

      <View className="flex-1 bg-gray-50">
        <View className="px-4 border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`py-4 px-5 border-b-2 ${activeTab === tab.key ? 'border-blue-500' : 'border-transparent'}`}
              >
                <Text
                  className={`text-base font-inter-semibold ${
                    activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your orders...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading orders</Text>
            <TouchableOpacity onPress={loadOrders} className="bg-black rounded-lg py-3 px-6">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : getFilteredOrders().length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadOrders} tintColor="#007AFF" />}
            contentContainerStyle={{ flexGrow: 1 }}
            className="p-4"
          >
            {getFilteredOrders().map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="shopping-bag" color="#666" size={64} />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4">No orders found</Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <WriteReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        orderId={reviewModal.orderId}
        sellerId={reviewModal.sellerId}
        productName={reviewModal.productName}
        userId={user?.id}
        onSuccess={loadOrders}
      />

      <ContactSellerModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ ...contactModal, isOpen: false })}
        sellerId={contactModal.sellerId}
        sellerName="Seller"
        productName={contactModal.productName}
        orderId={contactModal.orderId}
        userId={user?.id}
      />
    </SafeAreaView>
  );
}
