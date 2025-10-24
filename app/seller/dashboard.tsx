import { ShippingSettingsModal } from '@/components/shipping-settings-modal';
import { useAuth } from '@/hooks/use-auth';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReportsData {
  summary: {
    totalSales: number;
    formattedTotalSales: string;
    totalOrders: number;
    pageviews: number;
    sellerBalance: number;
    formattedSellerBalance: string;
    processingOrders: number;
    completedOrders: number;
    onHoldOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    refundedOrders: number;
  };
}

interface RecentOrder {
  id: string;
  number: string;
  status: string;
  total: number;
  formattedTotal: string;
  dateCreated: string;
}

interface TopSellingProduct {
  id: string;
  title: string;
  soldQty: number;
  formattedSoldQty: string;
}

interface SellerSettings {
  storeName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    fullAddress: string;
  };
  gravatar: string;
  trusted: boolean;
  rating: {
    rating: number;
    count: number;
  };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [sellerSettings, setSellerSettings] = useState<SellerSettings | null>(null);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      const mockReportsData: ReportsData = {
        summary: {
          totalSales: 1250.5,
          formattedTotalSales: '£1,250.50',
          totalOrders: 15,
          pageviews: 1250,
          sellerBalance: 850.25,
          formattedSellerBalance: '£850.25',
          processingOrders: 3,
          completedOrders: 8,
          onHoldOrders: 1,
          pendingOrders: 2,
          cancelledOrders: 1,
          refundedOrders: 0,
        },
      };

      const mockRecentOrders: RecentOrder[] = [
        {
          id: '1',
          number: '#1001',
          status: 'processing',
          total: 89.99,
          formattedTotal: '£89.99',
          dateCreated: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          number: '#1002',
          status: 'completed',
          total: 125.5,
          formattedTotal: '£125.50',
          dateCreated: '2024-01-14T14:20:00Z',
        },
      ];

      const mockSellerSettings: SellerSettings = {
        storeName: 'Vintage Street Store',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@vintagestreet.com',
        phone: '+1234567890',
        address: {
          fullAddress: '123 Vintage Lane, London, UK',
        },
        gravatar: '',
        trusted: true,
        rating: {
          rating: 4.8,
          count: 127,
        },
      };

      const mockTopProducts: TopSellingProduct[] = [
        {
          id: '1',
          title: 'Vintage Nike Air Max',
          soldQty: 25,
          formattedSoldQty: '25',
        },
        {
          id: '2',
          title: 'Retro Adidas Jacket',
          soldQty: 18,
          formattedSoldQty: '18',
        },
      ];

      setReportsData(mockReportsData);
      setRecentOrders(mockRecentOrders);
      setSellerSettings(mockSellerSettings);
      setTopSellingProducts(mockTopProducts);
    } catch (err) {
      setError('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const changePeriod = (period: string) => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
    }
  };

  const navigateToProduct = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const navigateToEditProduct = (productId: string) => {
    // router.push(`/sell/edit/${productId}`);
  };

  const StatsCard = ({ title, value, isPositive = true }: { title: string; value: string; isPositive?: boolean }) => (
    <View className="bg-white rounded-xl p-4 flex-1 shadow-sm">
      <Text className="text-gray-600 text-sm font-inter mb-2">{title}</Text>
      <Text className="text-gray-900 text-2xl font-inter-bold">{value}</Text>
    </View>
  );

  const OrderStatusBreakdown = () => {
    if (!reportsData?.summary) return null;

    const summary = reportsData.summary;
    const statusItems = [
      {
        label: 'Processing',
        count: summary.processingOrders,
        color: '#007AFF',
      },
      { label: 'Completed', count: summary.completedOrders, color: '#34C759' },
      { label: 'On Hold', count: summary.onHoldOrders, color: '#FF9500' },
      { label: 'Pending', count: summary.pendingOrders, color: '#FFCC00' },
      { label: 'Cancelled', count: summary.cancelledOrders, color: '#FF3B30' },
      { label: 'Refunded', count: summary.refundedOrders, color: '#AF52DE' },
    ].filter((item) => item.count > 0);

    if (statusItems.length === 0) {
      return (
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-gray-600 text-sm font-inter text-center">No orders yet</Text>
        </View>
      );
    }

    return (
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-900 text-base font-inter-bold">Order Status</Text>
          <Text className="text-gray-600 text-sm font-inter">{summary.totalOrders} Total</Text>
        </View>

        {statusItems.map((item, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
            <Text className="text-gray-900 text-sm font-inter flex-1">{item.label}</Text>
            <Text className="text-gray-900 text-sm font-inter-bold">{item.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  const TopProductsList = () => (
    <View className="bg-white rounded-xl shadow-sm">
      {topSellingProducts.map((product, index) => (
        <View key={product.id}>
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 rounded-full bg-blue-500/20 justify-center items-center mr-4">
              <Text className="text-blue-500 text-base font-inter-bold">{index + 1}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-gray-900 text-base font-inter-bold mb-1">{product.title}</Text>
              <Text className="text-gray-600 text-sm font-inter">Sold: {product.formattedSoldQty}</Text>
            </View>

            <View className="flex-row">
              <TouchableOpacity onPress={() => navigateToEditProduct(product.id)} className="p-2 mr-2">
                <Feather name="edit" color="#007AFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToProduct(product.id)} className="p-2">
                <Feather name="eye" color="#666" size={20} />
              </TouchableOpacity>
            </View>
          </View>
          {index < topSellingProducts.length - 1 && <View className="h-px bg-gray-200 ml-18" />}
        </View>
      ))}
    </View>
  );

  const RecentOrdersList = () => (
    <View className="bg-white rounded-xl shadow-sm">
      {recentOrders.map((order, index) => (
        <View key={order.id}>
          <View className="flex-row items-center p-4">
            <View className="flex-1">
              <Text className="text-gray-900 text-base font-inter-bold mb-1">{order.number}</Text>
              <Text className="text-gray-600 text-sm font-inter">
                {order.status} • {order.formattedTotal}
              </Text>
            </View>
            <TouchableOpacity className="bg-blue-600 rounded-lg py-2 px-4">
              <Text className="text-white text-sm font-inter-bold">View</Text>
            </TouchableOpacity>
          </View>
          {index < recentOrders.length - 1 && <View className="h-px bg-gray-200 ml-4" />}
        </View>
      ))}
    </View>
  );

  const StoreProfileCard = () => {
    if (!sellerSettings) return null;

    return (
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-gray-200 justify-center items-center mr-4">
            <Feather name="shopping-bag" color="#333" size={25} />
          </View>

          <View className="flex-1">
            <Text className="text-gray-900 text-lg font-inter-bold mb-1">{sellerSettings.storeName}</Text>
            <Text className="text-gray-600 text-sm font-inter">
              {sellerSettings.firstName} {sellerSettings.lastName}
            </Text>
          </View>

          {sellerSettings.trusted && (
            <View className="items-center">
              <Feather name="check-circle" color="#34C759" size={20} />
              <Text className="text-green-500 text-xs font-inter mt-1">Trusted</Text>
            </View>
          )}
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Feather name="mail" color="#666" size={16} />
              <Text className="text-gray-600 text-xs font-inter ml-2">Email</Text>
            </View>
            <Text className="text-gray-900 text-sm ml-6">{sellerSettings.email}</Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Feather name="phone" color="#666" size={16} />
              <Text className="text-gray-600 text-xs font-inter ml-2">Phone</Text>
            </View>
            <Text className="text-gray-900 text-sm ml-6">{sellerSettings.phone || 'Not provided'}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Feather name="map-pin" color="#666" size={16} />
          <Text className="text-gray-600 text-xs font-inter ml-2">Address</Text>
        </View>
        <Text className="text-gray-900 text-sm mb-3 ml-6">{sellerSettings.address.fullAddress || 'Not provided'}</Text>

        {sellerSettings.rating.count > 0 && (
          <View className="flex-row items-center">
            <Feather name="star" color="#666" size={16} />
            <Text className="text-gray-600 text-xs font-inter ml-2">Rating</Text>
            <Text className="text-gray-900 text-sm ml-2">
              {sellerSettings.rating.rating} ({sellerSettings.rating.count} reviews)
            </Text>
          </View>
        )}
      </View>
    );
  };

  const FinancialSummary = () => {
    if (!reportsData?.summary) return null;

    const summary = reportsData.summary;

    return (
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="mb-3">
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 text-sm font-inter">Total Sales</Text>
            <Text className="text-gray-900 text-sm font-inter-bold">{summary.formattedTotalSales}</Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 text-sm font-inter">Current Balance</Text>
            <Text className="text-gray-900 text-sm font-inter-bold">{summary.formattedSellerBalance}</Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 text-sm font-inter">Total Orders</Text>
            <Text className="text-gray-900 text-sm font-inter-bold">{summary.totalOrders}</Text>
          </View>
        </View>

        <View className="h-px bg-gray-200 my-3" />

        <View className="flex-row justify-between">
          <Text className="text-gray-900 text-base font-inter-bold">Active Orders</Text>
          <Text className="text-gray-900 text-base font-inter-bold">
            {summary.processingOrders + summary.pendingOrders}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">Seller Dashboard</Text>
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
        <View className="flex-row items-center bg-white px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">Seller Dashboard</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={48} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading dashboard data</Text>
          <Text className="text-gray-600 text-sm font-inter text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadDashboardData} className="bg-blue-600 rounded-lg py-3 px-6">
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

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">Seller Dashboard</Text>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Select Period',
              'Choose a time period',
              periodOptions.map((option) => ({
                text: option.label,
                onPress: () => changePeriod(option.value),
              }))
            );
          }}
          className="mr-4 p-2"
        >
          <Feather name="calendar" color="#333" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={loadDashboardData} className="p-2">
          <Feather name="refresh-cw" color="#333" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDashboardData} tintColor="#007AFF" />}
        className="flex-1"
      >
        <View className="p-4">
          {/* Period Selector */}
          <View className="flex-row items-center mb-4">
            <Text className="text-gray-600 text-sm font-inter mr-2">Period:</Text>
            <View className="bg-gray-200 rounded px-3 py-1.5">
              <Text className="text-gray-900 text-sm font-inter-bold">
                {periodOptions.find((p) => p.value === selectedPeriod)?.label}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mb-3">
            <StatsCard title="Total Sales" value={reportsData?.summary?.formattedTotalSales || '£0.00'} />
            <View className="w-3" />
            <StatsCard title="Total Orders" value={reportsData?.summary?.totalOrders?.toString() || '0'} />
          </View>

          <View className="flex-row mb-6">
            <StatsCard title="Page Views" value={reportsData?.summary?.pageviews?.toString() || '0'} />
            <View className="w-3" />
            <StatsCard title="Balance" value={reportsData?.summary?.formattedSellerBalance || '£0.00'} />
          </View>

          {/* Order Status Breakdown */}
          {reportsData?.summary && (
            <>
              <Text className="text-gray-900 text-lg font-inter-bold mb-3">Order Status Breakdown</Text>
              <OrderStatusBreakdown />
              <View className="h-6" />
            </>
          )}

          {/* Quick Actions */}
          <Text className="text-gray-900 text-lg font-inter-bold mb-3">Quick Actions</Text>
          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <TouchableOpacity
                onPress={() => router.push('/seller/orders')}
                className="flex-1 bg-gray-100 rounded-lg p-3 mr-1 items-center"
              >
                <Feather name="package" color="#333" size={20} className="mb-1.5" />
                <Text className="text-gray-900 text-xs font-inter-bold">Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/seller/offers')}
                className="flex-1 bg-gray-100 rounded-lg p-3 mx-1 items-center"
              >
                <Feather name="heart" color="#8B5CF6" size={20} className="mb-1.5" />
                <Text className="text-gray-900 text-xs font-inter-bold">Offers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/seller/reviews')}
                className="flex-1 bg-gray-100 rounded-lg p-3 mx-1 items-center"
              >
                <Feather name="star" color="#FFD700" size={20} className="mb-1.5" />
                <Text className="text-gray-900 text-xs font-inter-bold">Reviews</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/seller/listings')}
                className="flex-1 bg-gray-100 rounded-lg p-3 ml-1 items-center"
              >
                <Feather name="grid" color="#34C759" size={20} className="mb-1.5" />
                <Text className="text-gray-900 text-xs font-inter-bold">Listings</Text>
              </TouchableOpacity>
            </View>

            {/* Shipping Settings Button */}
            <TouchableOpacity
              onPress={() => {
                if (!user?.id) {
                  Alert.alert('Authentication Required', 'Please sign in to manage shipping settings.');
                  return;
                }
                setIsShippingModalOpen(true);
              }}
              className="bg-blue-50 rounded-lg p-4 mt-4 flex-row items-center"
            >
              <Feather name="truck" color="#007AFF" size={20} className="mr-3" />
              <View className="flex-1">
                <Text className="text-gray-900 text-sm font-inter-semibold">Shipping Settings</Text>
                <Text className="text-gray-600 text-xs font-inter">
                  Manage your shipping options and delivery times
                </Text>
              </View>
              <Feather name="chevron-right" color="#666" size={16} />
            </TouchableOpacity>
          </View>

          {/* Store Profile */}
          {sellerSettings && (
            <>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-900 text-lg font-inter-bold">Store Profile</Text>
                <TouchableOpacity onPress={() => router.push('/other/app-settings')}>
                  <Text className="text-blue-600 text-base font-inter">Edit</Text>
                </TouchableOpacity>
              </View>
              <StoreProfileCard />
              <View className="h-6" />
            </>
          )}

          {/* Top Selling Products */}
          {topSellingProducts.length > 0 && (
            <>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-900 text-lg font-inter-bold">Top Selling Products</Text>
                <TouchableOpacity onPress={() => router.push('/seller/listings')}>
                  <Text className="text-blue-600 text-base font-inter">View All</Text>
                </TouchableOpacity>
              </View>
              <TopProductsList />
              <View className="h-6" />
            </>
          )}

          {/* Recent Orders */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-lg font-inter-bold">Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/seller/orders')}>
              <Text className="text-blue-600 text-base font-inter">View All</Text>
            </TouchableOpacity>
          </View>
          <RecentOrdersList />

          {/* Financial Summary */}
          {reportsData?.summary && (
            <>
              <View className="h-6" />
              <FinancialSummary />
            </>
          )}
        </View>
      </ScrollView>

      {/* Shipping Settings Modal */}
      <ShippingSettingsModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        userId={user?.id}
      />
    </SafeAreaView>
  );
}
