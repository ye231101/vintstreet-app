import { sellerService } from '@/api/services';
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
  const [sellerSettings, setSellerSettings] = useState<SellerSettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [selectedPeriod, user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all dashboard data in parallel
      const [reports, settings] = await Promise.all([
        sellerService.getDashboardReports(user.id, selectedPeriod),
        sellerService.getSellerSettings(user.id),
      ]);

      setReportsData(reports);
      setSellerSettings(settings);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const changePeriod = (period: string) => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
    }
  };

  const StatsCard = ({ title, value, isPositive = true }: { title: string; value: string; isPositive?: boolean }) => (
    <View className="bg-white rounded-xl p-4 flex-1 shadow-sm">
      <Text className="text-gray-600 text-sm font-inter-semibold mb-2">{title}</Text>
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
          <Text className="text-gray-600 text-sm font-inter-semibold text-center">No orders yet</Text>
        </View>
      );
    }

    return (
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-900 text-base font-inter-bold">Order Status</Text>
          <Text className="text-gray-600 text-sm font-inter">{summary.totalOrders} Total</Text>
        </View>

        {statusItems.map((item, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
            <Text className="text-gray-900 text-sm font-inter-semibold flex-1">{item.label}</Text>
            <Text className="text-gray-900 text-sm font-inter-bold">{item.count}</Text>
          </View>
        ))}
      </View>
    );
  };

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
        </View>

        {sellerSettings.rating.count > 0 && (
          <View className="flex-row items-center">
            <Feather name="star" color="#666" size={16} />
            <Text className="text-gray-600 text-xs font-inter-semibold ml-2">Rating</Text>
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
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Seller Dashboard</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Seller Dashboard</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading dashboard data</Text>
          <TouchableOpacity onPress={loadDashboardData} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 gap-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Seller Dashboard</Text>

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
        >
          <Feather name="calendar" color="#fff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={loadDashboardData}>
          <Feather name="refresh-cw" color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDashboardData} tintColor="#007AFF" />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 p-4 bg-gray-50">
          {/* Period Selector */}
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-gray-600 text-sm font-inter-semibold">Period:</Text>
            <View className="bg-gray-200 rounded px-3 py-1.5">
              <Text className="text-gray-900 text-sm font-inter-bold">
                {periodOptions.find((p) => p.value === selectedPeriod)?.label}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="mb-6 gap-3">
            <View className="flex-row gap-3">
              <StatsCard title="Total Sales" value={reportsData?.summary?.formattedTotalSales || '£0.00'} />
              <StatsCard title="Total Orders" value={reportsData?.summary?.totalOrders?.toString() || '0'} />
            </View>

            <View className="flex-row gap-3">
              <StatsCard title="Page Views" value={reportsData?.summary?.pageviews?.toString() || '0'} />
              <StatsCard title="Balance" value={reportsData?.summary?.formattedSellerBalance || '£0.00'} />
            </View>
          </View>

          {/* Order Status Breakdown */}
          {reportsData?.summary && (
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-inter-bold mb-3">Order Status Breakdown</Text>
              <OrderStatusBreakdown />
            </View>
          )}

          {/* Quick Actions */}
          <Text className="text-gray-900 text-lg font-inter-bold mb-3">Quick Actions</Text>
          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
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
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 text-lg font-inter-bold">Store Profile</Text>
                <TouchableOpacity onPress={() => router.push('/other/app-settings')}>
                  <Text className="text-blue-600 text-base font-inter">Edit</Text>
                </TouchableOpacity>
              </View>
              <StoreProfileCard />
            </View>
          )}

          {/* Financial Summary */}
          {reportsData?.summary && <FinancialSummary />}
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
