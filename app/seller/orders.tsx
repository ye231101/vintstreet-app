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

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface OrderTotals {
  total: number;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  displayStatus: string;
  statusColor: number;
  items: OrderItem[];
  totals: OrderTotals;
}

export default function OrdersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['Orders To Fulfil', 'All Orders', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          createdAt: '2024-01-15T10:30:00Z',
          status: 'processing',
          displayStatus: 'Processing',
          statusColor: 0x007aff,
          items: [
            {
              id: '1',
              name: 'Vintage Nike Air Max 90',
              price: 89.99,
              quantity: 1,
              imageUrl: 'https://example.com/nike-air-max.jpg',
            },
          ],
          totals: { total: 89.99 },
        },
        {
          id: 'ORD-002',
          createdAt: '2024-01-14T14:20:00Z',
          status: 'shipped',
          displayStatus: 'Shipped',
          statusColor: 0x34c759,
          items: [
            {
              id: '2',
              name: 'Retro Adidas Jacket',
              price: 125.5,
              quantity: 1,
              imageUrl: 'https://example.com/adidas-jacket.jpg',
            },
          ],
          totals: { total: 125.5 },
        },
        {
          id: 'ORD-003',
          createdAt: '2024-01-13T09:15:00Z',
          status: 'pending',
          displayStatus: 'Pending',
          statusColor: 0xffcc00,
          items: [
            {
              id: '3',
              name: "Vintage Levi's Jeans",
              price: 75.0,
              quantity: 2,
              imageUrl: 'https://example.com/levis-jeans.jpg',
            },
          ],
          totals: { total: 150.0 },
        },
        {
          id: 'ORD-004',
          createdAt: '2024-01-12T16:45:00Z',
          status: 'completed',
          displayStatus: 'Completed',
          statusColor: 0x34c759,
          items: [
            {
              id: '4',
              name: 'Classic Converse Chuck Taylor',
              price: 65.0,
              quantity: 1,
              imageUrl: 'https://example.com/converse.jpg',
            },
          ],
          totals: { total: 65.0 },
        },
      ];
      setOrders(mockOrders);
    } catch (err) {
      setError('Error loading orders');
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
      case 0: // Orders To Fulfil (Pending + Processing)
        return orders.filter((order) => order.status === 'pending' || order.status === 'processing');
      case 1: // All Orders
        return orders;
      case 2: // Pending
        return orders.filter((order) => order.status === 'pending');
      case 3: // Shipped
        return orders.filter((order) => order.status === 'shipped');
      case 4: // Delivered (Completed)
        return orders.filter((order) => order.status === 'completed');
      case 5: // Cancelled
        return orders.filter((order) => order.status === 'cancelled');
      default:
        return orders;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <View className="bg-gray-800 rounded-xl mb-4">
      {/* Order header */}
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-white font-inter-bold text-base mb-1">Order {order.id}</Text>
            <Text className="text-gray-400 text-sm font-inter">{formatDate(order.createdAt)}</Text>
          </View>
          <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: `rgba(${order.statusColor}, 0.1)` }}>
            <Text
              className="font-inter-bold text-xs"
              style={{ color: `#${order.statusColor.toString(16).padStart(6, '0')}` }}
            >
              {order.displayStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-600" />

      {/* Order items */}
      {order.items.map((item, index) => (
        <View key={index}>
          <View className="flex-row items-center px-4 py-2">
            <View className="w-15 h-15 rounded-lg bg-gray-600 mr-4 overflow-hidden">
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} className="w-15 h-15" resizeMode="cover" />
              ) : (
                <View className="w-15 h-15 bg-gray-600 justify-center items-center">
                  <Feather name="image" color="#999" size={24} />
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-white font-inter-medium text-base mb-1">{item.name}</Text>
              <Text className="text-gray-400 text-sm font-inter mb-1">Quantity: {item.quantity}</Text>
              <Text className="text-white font-inter-bold text-base">£{item.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Divider */}
      <View className="h-px bg-gray-600" />

      {/* Order actions */}
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-white font-inter-bold text-base">Total: £{order.totals.total.toFixed(2)}</Text>
        <View className="flex-row gap-2">
          {order.status === 'pending' && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Accept Order', 'Order has been accepted and moved to processing');
              }}
              className="bg-green-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-inter-bold">Accept</Text>
            </TouchableOpacity>
          )}
          {order.status === 'processing' && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Mark as Shipped', 'Order has been marked as shipped');
              }}
              className="bg-blue-500 rounded-md py-1.5 px-3"
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
        <View className="flex-1 justify-center items-center px-8">
          <Feather name="package" color="#999" size={64} />
          <Text className="text-white text-lg font-inter-bold mt-4">No processing orders.</Text>
          <Text className="text-gray-400 text-sm font-inter mt-2 text-center">
            No orders with processing status found.
          </Text>
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
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Orders</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Orders</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-white text-lg font-inter-bold mt-4 mb-2">Error loading orders</Text>
          <Text className="text-gray-400 text-sm font-inter text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadOrders} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="bg-black px-4 py-5 border-b border-gray-700">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-2xl font-inter-bold text-white">Orders</Text>
        </View>

        <Text className="text-sm font-inter text-gray-400 ml-10">Manage your customer orders and shipping.</Text>
      </View>

      {/* Filter Buttons */}
      <View className="bg-gray-700 px-4 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-4">
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveTab(index)}
              className={`py-2 px-4 mr-2 rounded border border-gray-600 ${
                activeTab === index ? 'bg-black' : 'bg-gray-600'
              }`}
            >
              <Text className={`text-sm font-inter-medium ${activeTab === index ? 'text-white' : 'text-gray-400'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Export Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Export Excel', 'Orders data will be exported to Excel format');
          }}
          className="flex-row items-center bg-gray-600 py-3 px-4 rounded-md border border-gray-500 mt-3 self-start"
        >
          <Feather name="download" size={16} color="#999" className="mr-2" />
          <Text className="text-gray-400 text-sm font-inter-medium">Export Excel</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <OrdersList orders={getFilteredOrders()} onRefresh={loadOrders} />
    </SafeAreaView>
  );
}
