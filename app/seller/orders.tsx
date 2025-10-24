import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Order, ordersService } from '../../api/services/orders.service';
import { useAuth } from '../../hooks/use-auth';

// Interfaces are now imported from the orders service

export default function OrdersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('fulfilled');
  const { user } = useAuth();

  const tabs = [
    { key: 'fulfilled', label: 'Orders To Fulfilled' },
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
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
      const fetchedOrders = await ordersService.getOrders(user.id, 'seller');
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
      case 'fulfilled': // Fulfilled
        return orders.filter((order) => order.status === 'pending' || order.status === 'processing');
      case 'all': // All
        return orders;
      case 'pending': // Pending
        return orders.filter((order) => order.status === 'pending');
      case 'shipped': // Shipped
        return orders.filter((order) => order.status === 'shipped');
      case 'delivered': // Delivered (Completed)
        return orders.filter((order) => order.status === 'completed');
      case 'cancelled': // Cancelled
        return orders.filter((order) => order.status === 'cancelled');
      default:
        return orders;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <View className="bg-white rounded-xl mb-4 shadow-sm">
      {/* Order header */}
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-gray-900 font-inter-bold text-base mb-1">Order {order.id}</Text>
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
          {order.status === 'pending' && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await ordersService.updateOrderStatus(order.id, 'processing');
                  Alert.alert('Order Accepted', 'Order has been accepted and moved to processing');
                  loadOrders(); // Refresh the orders list
                } catch (error) {
                  Alert.alert('Error', 'Failed to accept order. Please try again.');
                }
              }}
              className="bg-green-500 rounded-md py-1.5 px-3 justify-center items-center"
            >
              <Text className="text-white text-xs font-inter-bold">Accept</Text>
            </TouchableOpacity>
          )}
          {order.status === 'processing' && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await ordersService.updateOrderStatus(order.id, 'shipped');
                  Alert.alert('Order Shipped', 'Order has been marked as shipped');
                  loadOrders(); // Refresh the orders list
                } catch (error) {
                  Alert.alert('Error', 'Failed to mark order as shipped. Please try again.');
                }
              }}
              className="bg-blue-500 rounded-md py-1.5 px-3 justify-center items-center"
            >
              <Text className="text-white text-xs font-inter-bold">Ship</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Order Details', 'This would show order details');
            }}
            className="py-2 px-4"
          >
            <Text className="text-blue-500 text-base font-inter">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const OrdersList = ({ orders, onRefresh }: { orders: Order[]; onRefresh: () => void }) => {
    if (orders.length === 0) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <Feather name="shopping-bag" color="#666666" size={64} style={{ marginBottom: 24 }} />
          <Text className="text-gray-900 text-lg font-inter-bold mb-2">No orders found</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#007AFF" />}
        className="flex-1 p-4"
      >
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">Orders</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">Orders</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading orders</Text>
          <Text className="text-gray-600 text-sm font-inter-semibold text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadOrders} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">Orders</Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-gray-50 px-4 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`py-4 px-5 border-b-2 ${activeTab === tab.key ? 'border-blue-500' : 'border-transparent'}`}
            >
              <Text className={`text-base font-inter-semibold ${activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <OrdersList orders={getFilteredOrders()} onRefresh={loadOrders} />
    </SafeAreaView>
  );
}
