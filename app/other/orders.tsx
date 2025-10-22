import { Feather, MaterialIcons } from '@expo/vector-icons';
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
import { useAuth } from '../../hooks/use-auth';
import { supabase } from '../../api/config/supabase';
import { WriteReviewModal } from '../../components/write-review-modal';
import { ContactSellerModal } from '../../components/contact-seller-modal';

interface Order {
  id: string;
  listing_id: string;
  seller_id: string;
  order_amount: number;
  quantity: number;
  order_date: string;
  status: string;
  delivery_status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  listing?: {
    product_name: string;
    product_image: string | null;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return { bg: '#DEF7EC', text: '#03543F' };
    case 'shipped':
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'processing':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'cancelled':
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#F3F4F6', text: '#1F2937' };
  }
};

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
    { key: 'all', label: 'All' },
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
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, listing_id, seller_id, order_amount, quantity, order_date, status, delivery_status')
        .eq('buyer_id', user.id)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch listing details for each order
      const listingIds = (ordersData as any[]).map((o: any) => o.listing_id);
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, product_name, product_image')
        .in('id', listingIds);

      if (listingsError) throw listingsError;

      // Combine orders with listing details
      const ordersWithListings = (ordersData as any[]).map((order: any) => {
        const listing = (listingsData as any[] | null)?.find((l: any) => l.id === order.listing_id);
        return {
          ...order,
          listing: listing
            ? {
                product_name: listing.product_name,
                product_image: listing.product_image,
              }
            : undefined,
        };
      });

      setOrders(ordersWithListings as Order[]);
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
    if (activeTab === 'all') return orders;
    return orders.filter((order) => order.delivery_status === activeTab);
  };

  const filteredOrders = getFilteredOrders();
  const orderCounts = {
    all: orders.length,
    processing: orders.filter((o) => o.delivery_status === 'processing').length,
    shipped: orders.filter((o) => o.delivery_status === 'shipped').length,
    delivered: orders.filter((o) => o.delivery_status === 'delivered').length,
    cancelled: orders.filter((o) => o.delivery_status === 'cancelled').length,
  };

  const handleWriteReview = (orderId: string, sellerId: string, productName: string) => {
    setReviewModal({ isOpen: true, orderId, sellerId, productName });
  };

  const handleContactSeller = (orderId: string, sellerId: string, productName: string) => {
    setContactModal({ isOpen: true, orderId, sellerId, productName });
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusColors = getStatusColor(order.delivery_status);
    const productName = order.listing?.product_name || 'Product';

    return (
      <View className="bg-white rounded-xl mb-4 shadow-sm p-4">
        <View className="flex-row gap-3">
          {/* Product Image */}
          <View className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden">
            {order.listing?.product_image ? (
              <Image
                source={{ uri: order.listing.product_image }}
                className="w-20 h-20"
                resizeMode="cover"
              />
            ) : (
              <View className="w-20 h-20 bg-gray-200 justify-center items-center">
                <Feather name="image" color="#666" size={24} />
              </View>
            )}
          </View>

          {/* Order Details */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-gray-900 text-base font-inter-semibold mb-1">{productName}</Text>
                <Text className="text-gray-600 text-sm font-inter">Order #{order.id.slice(-8)}</Text>
              </View>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: statusColors.bg }}
              >
                <Text
                  className="font-inter-semibold text-xs"
                  style={{ color: statusColors.text }}
                >
                  {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-gray-600 text-sm font-inter">Qty: {order.quantity}</Text>
              <Text className="text-gray-400">•</Text>
              <Text className="text-gray-600 text-sm font-inter">£{Number(order.order_amount).toFixed(2)}</Text>
              <Text className="text-gray-400">•</Text>
              <Text className="text-gray-600 text-sm font-inter">
                {formatDate(order.order_date)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 flex-wrap">
              {order.delivery_status === 'delivered' && (
                <TouchableOpacity
                  onPress={() => handleWriteReview(order.id, order.seller_id, productName)}
                  className="flex-row items-center gap-1 border border-gray-300 rounded-lg px-3 py-2"
                >
                  <Feather name="star" size={14} color="#666" />
                  <Text className="text-gray-700 text-xs font-inter-medium">Write Review</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handleContactSeller(order.id, order.seller_id, productName)}
                className="flex-row items-center gap-1 border border-gray-300 rounded-lg px-3 py-2"
              >
                <Feather name="message-circle" size={14} color="#666" />
                <Text className="text-gray-700 text-xs font-inter-medium">Contact Seller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const OrdersList = ({ orders, onRefresh }: { orders: Order[]; onRefresh: () => void }) => {
    if (orders.length === 0) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <Feather name="package" color="#666666" size={64} style={{ marginBottom: 24 }} />
          <Text className="text-gray-900 text-lg font-inter-bold mb-2">No orders found</Text>
          <Text className="text-gray-600 text-sm font-inter text-center px-6 mb-6">
            {activeTab === 'all'
              ? "You haven't placed any orders yet"
              : `No ${activeTab} orders found`}
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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Orders</Text>
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

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Orders</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading orders</Text>
          <Text className="text-gray-600 text-sm font-inter text-center mb-4">{error}</Text>
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

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Orders</Text>
      </View>

      {/* Tabs */}
      <View className="bg-gray-50 px-4 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => {
            const count = orderCounts[tab.key as keyof typeof orderCounts];
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`py-4 px-5 border-b-2 ${activeTab === tab.key ? 'border-blue-500' : 'border-transparent'}`}
              >
                <View className="flex-row items-center gap-2">
                  <Text className={`text-base font-inter ${activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'}`}>
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      className="rounded-full px-2 py-0.5 min-w-[20px] items-center justify-center"
                      style={{ backgroundColor: activeTab === tab.key ? '#3B82F6' : '#E5E7EB' }}
                    >
                      <Text
                        className="text-xs font-inter-semibold"
                        style={{ color: activeTab === tab.key ? '#FFFFFF' : '#6B7280' }}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <OrdersList orders={filteredOrders} onRefresh={loadOrders} />

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
