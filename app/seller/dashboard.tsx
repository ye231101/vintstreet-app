import { listingsService, offersService, sellerService } from '@/api/services';
import { DashboardReports, SellerSettings } from '@/api/types';
import { ShippingSettingsModal } from '@/components/shipping-settings-modal';
import { useAuth } from '@/hooks/use-auth';
import { logger } from '@/utils/logger';
import { Feather, FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportsData, setReportsData] = useState<DashboardReports | null>(null);
  const [sellerSettings, setSellerSettings] = useState<SellerSettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [pendingPeriod, setPendingPeriod] = useState<string | null>(null);
  const [pendingCustomDateRange, setPendingCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [listingsStats, setListingsStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    private: 0,
  });
  const [offersStats, setOffersStats] = useState({
    pending: 0,
    accepted: 0,
    declined: 0,
    total: 0,
  });

  const periodOptions = [
    { value: 'today', label: 'Today', icon: 'calendar' },
    { value: 'week', label: 'This Week', icon: 'calendar' },
    { value: 'month', label: 'This Month', icon: 'calendar' },
    { value: 'year', label: 'This Year', icon: 'calendar' },
    { value: 'custom', label: 'Custom Date Range', icon: 'calendar' },
  ];

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [selectedPeriod, customDateRange, user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine period parameter for API call
      const periodParam = customDateRange ? 'custom' : selectedPeriod;

      // Fetch all dashboard data in parallel
      const [reports, settings, listings, offers] = await Promise.all([
        sellerService.getDashboardReports(
          user.id,
          periodParam,
          customDateRange ? { start: customDateRange.start, end: customDateRange.end } : undefined
        ),
        sellerService.getSellerSettings(user.id),
        listingsService.getSellerListings(user.id).catch(() => []),
        offersService.getOffers(user.id, 'seller').catch(() => []),
      ]);
      setReportsData(reports);
      setSellerSettings(settings);

      // Calculate listings statistics
      const publishedListings = listings.filter((l) => l.status === 'published').length;
      const draftListings = listings.filter((l) => l.status === 'draft').length;
      const privateListings = listings.filter((l) => l.status === 'private').length;
      setListingsStats({
        total: listings.length,
        published: publishedListings,
        draft: draftListings,
        private: privateListings,
      });

      // Calculate offers statistics
      const pending = offers.filter((o) => o.status === 'pending').length;
      const accepted = offers.filter((o) => o.status === 'accepted').length;
      const declined = offers.filter((o) => o.status === 'declined').length;
      setOffersStats({
        pending,
        accepted,
        declined,
        total: offers.length,
      });
    } catch (err: unknown) {
      logger.error('Error loading dashboard data:', err);
      setError(err?.message || 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const changePeriod = (period: string) => {
    if (period === 'custom') {
      // Set default dates (last 7 days) or use existing custom range
      const end = customDateRange?.end || new Date();
      const start =
        customDateRange?.start ||
        (() => {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          return date;
        })();
      setTempStartDate(start);
      setTempEndDate(end);
      setPendingPeriod('custom');
    } else {
      // Set pending period without applying immediately
      setPendingPeriod(period);
      setPendingCustomDateRange(null);
    }
  };

  const applyPeriodChange = () => {
    if (pendingPeriod === 'custom') {
      if (tempStartDate > tempEndDate) {
        Alert.alert('Invalid Date Range', 'Start date must be before end date.');
        return;
      }
      setCustomDateRange({ start: tempStartDate, end: tempEndDate });
      setSelectedPeriod('custom');
      setPendingCustomDateRange({ start: tempStartDate, end: tempEndDate });
    } else if (pendingPeriod) {
      setCustomDateRange(null);
      setSelectedPeriod(pendingPeriod);
      setPendingCustomDateRange(null);
    }
    setPendingPeriod(null);
    setIsDateModalOpen(false);
  };

  const cancelPeriodChange = () => {
    // Reset pending changes to current state
    setPendingPeriod(null);
    setPendingCustomDateRange(null);
    if (customDateRange) {
      setTempStartDate(customDateRange.start);
      setTempEndDate(customDateRange.end);
    }
    setIsDateModalOpen(false);
  };

  const getPendingPeriodLabel = () => {
    if (pendingPeriod === 'custom') {
      const startStr = tempStartDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const endStr = tempEndDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${startStr} - ${endStr}`;
    }
    if (pendingPeriod) {
      return periodOptions.find((p) => p.value === pendingPeriod)?.label || '';
    }
    return getPeriodLabel();
  };

  const getPeriodLabel = () => {
    if (customDateRange) {
      const startStr = customDateRange.start.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const endStr = customDateRange.end.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${startStr} - ${endStr}`;
    }
    return periodOptions.find((p) => p.value === selectedPeriod)?.label || 'This Week';
  };

  const StatsCard = ({
    title,
    value,
    subtitle,
    icon,
    iconColor = '#007AFF',
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon?: string;
    iconColor?: string;
  }) => (
    <View className="flex-1 p-4 rounded-lg bg-white shadow-lg">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-inter-semibold text-gray-600">{title}</Text>
        {icon && <Feather name={icon as unknown} size={16} color={iconColor} />}
      </View>
      <Text className="mb-1 text-2xl font-inter-bold text-gray-900">{value}</Text>
      {subtitle && <Text className="text-xs font-inter text-gray-500">{subtitle}</Text>}
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
        <View className="p-4 rounded-lg bg-white shadow-lg">
          <Text className="text-gray-600 text-sm font-inter-semibold text-center">No orders yet</Text>
        </View>
      );
    }

    return (
      <View className="p-4 rounded-lg bg-white shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-inter-bold text-gray-900">Order Status</Text>
          <Text className="text-sm font-inter text-gray-600">{summary.totalOrders} Total</Text>
        </View>

        {statusItems.map((item, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
            <Text className="flex-1 text-sm font-inter-semibold text-gray-900">{item.label}</Text>
            <Text className="text-sm font-inter-bold text-gray-900">{item.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let starName: 'star' | 'star-half-o' | 'star-o';

      if (rating >= i) {
        // Full star
        starName = 'star';
      } else if (Math.ceil(rating) >= i) {
        // Half star
        starName = 'star-half-o';
      } else {
        // Empty star
        starName = 'star-o';
      }

      stars.push(
        <FontAwesome key={i} name={starName} size={size} color="#FFD700" style={{ marginRight: i < 5 ? 2 : 0 }} />
      );
    }
    return stars;
  };

  const StoreProfileCard = () => {
    if (!sellerSettings) return null;

    const getPersonalNameDisplay = (fullName: string) => {
      const trimmed = (fullName || '').trim();
      if (!trimmed) return '';
      const parts = trimmed.split(' ').filter(Boolean);
      if (parts.length === 0) return '';
      const firstName = parts[0];
      if (parts.length === 1) return firstName;
      const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.`;
    };

    const displayTitle =
      sellerSettings.displayNameFormat === 'shop_name'
        ? sellerSettings.storeName
        : getPersonalNameDisplay(sellerSettings.fullName) || sellerSettings.fullName || sellerSettings.storeName;

    return (
      <View className="rounded-lg bg-white shadow-lg">
        {/* Store Header */}
        <View className="flex-row items-center p-4">
          <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-4">
            <Feather name="shopping-bag" color="#007AFF" size={28} />
          </View>

          <View className="flex-1">
            <Text className="mb-1 text-xl font-inter-bold text-gray-900">{displayTitle}</Text>
            {sellerSettings.rating.count > 0 ? (
              <View className="flex-row items-center">
                {renderStars(sellerSettings.rating.rating, 14)}
                <Text className="ml-1 text-sm font-inter text-gray-900">
                  {sellerSettings.rating.rating.toFixed(1)} ({sellerSettings.rating.count} review
                  {sellerSettings.rating.count !== 1 ? 's' : ''})
                </Text>
              </View>
            ) : (
              <Text className="text-gray-500 text-sm font-inter">No reviews yet</Text>
            )}
          </View>
        </View>

        <View className="h-px bg-gray-200" />

        {/* Store Stats */}
        <View className="flex-row justify-between p-4">
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-lg font-inter-bold">{listingsStats.published}</Text>
            <Text className="text-gray-600 text-xs font-inter mt-1">Active Listings</Text>
          </View>
          <View className="w-px bg-gray-200 mx-2" />
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-lg font-inter-bold">{reportsData?.summary?.completedOrders || 0}</Text>
            <Text className="text-gray-600 text-xs font-inter mt-1">Completed Orders</Text>
          </View>
        </View>
      </View>
    );
  };

  const FinancialSummary = () => {
    if (!reportsData?.summary) return null;

    const summary = reportsData.summary;
    const activeOrders = summary.processingOrders + summary.pendingOrders;
    const averageOrderValue = summary.completedOrders > 0 ? summary.totalSales / summary.completedOrders : 0;

    return (
      <View className="rounded-lg bg-white shadow-lg">
        <View className="flex-row items-center justify-between p-4">
          <Text className="text-lg font-inter-bold text-gray-900">Financial Summary</Text>
          <Feather name="trending-up" color="#34C759" size={20} />
        </View>

        <View className="h-px bg-gray-200" />

        <View className="gap-2 p-4">
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-inter">Total Sales</Text>
              <Text className="text-gray-400 text-xs font-inter">Completed orders only</Text>
            </View>
            <Text className="text-base font-inter-bold text-gray-900">{summary.formattedTotalSales}</Text>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-inter">Available Balance</Text>
              <Text className="text-gray-400 text-xs font-inter">Ready to withdraw</Text>
            </View>
            <Text className="text-base font-inter-bold text-gray-900">{summary.formattedSellerBalance}</Text>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-inter">Average Order Value</Text>
              <Text className="text-gray-400 text-xs font-inter">Per completed order</Text>
            </View>
            <Text className="text-base font-inter-bold text-gray-900">£{averageOrderValue.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-inter">Total Orders</Text>
              <Text className="text-gray-400 text-xs font-inter">All time periods</Text>
            </View>
            <Text className="text-base font-inter-bold text-gray-900">{summary.totalOrders}</Text>
          </View>
        </View>

        <View className="h-px bg-gray-200" />

        <View className="gap-2 p-4">
          <View className="flex-row justify-between">
            <Text className="text-base font-inter-bold text-gray-900">Active Orders</Text>
            <Text className="text-base font-inter-bold text-gray-900">{activeOrders}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-inter text-gray-600">Processing</Text>
            <Text className="text-sm font-inter-semibold text-gray-900">{summary.processingOrders}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm font-inter text-gray-600">Pending</Text>
            <Text className="text-sm font-inter-semibold text-gray-900">{summary.pendingOrders}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 gap-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">Seller Dashboard</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 gap-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">Seller Dashboard</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading dashboard data</Text>
          <TouchableOpacity onPress={loadDashboardData} className="px-6 py-3 rounded-lg bg-black">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 gap-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">Seller Dashboard</Text>

        <TouchableOpacity
          onPress={() => {
            // Initialize dates if modal is opened directly
            if (!customDateRange) {
              const end = new Date();
              const start = new Date();
              start.setDate(start.getDate() - 7);
              setTempStartDate(start);
              setTempEndDate(end);
            } else {
              setTempStartDate(customDateRange.start);
              setTempEndDate(customDateRange.end);
            }
            // Reset pending period when opening modal
            setPendingPeriod(null);
            setIsDateModalOpen(true);
          }}
          className="flex-row items-center bg-gray-800 rounded-lg px-3 py-1"
        >
          <Feather name="calendar" color="#fff" size={16} />
          <Text className="text-white text-sm font-inter-semibold ml-2">{getPeriodLabel()}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={loadDashboardData}>
          <Feather name="refresh-cw" color="#000" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadDashboardData} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 p-4">
          {/* Period Selector */}
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-gray-600 text-sm font-inter-semibold">Period:</Text>
            <TouchableOpacity
              onPress={() => {
                // Initialize dates if modal is opened directly
                if (!customDateRange) {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setTempStartDate(start);
                  setTempEndDate(end);
                } else {
                  setTempStartDate(customDateRange.start);
                  setTempEndDate(customDateRange.end);
                }
                // Reset pending period when opening modal
                setPendingPeriod(null);
                setIsDateModalOpen(true);
              }}
              className="bg-gray-200 rounded px-3 py-1.5 flex-row items-center"
            >
              <Text className="text-gray-900 text-sm font-inter-bold">{getPeriodLabel()}</Text>
              <Feather name="chevron-down" color="#666" size={16} className="ml-1" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="gap-3 mb-6">
            <View className="flex-row gap-3">
              <StatsCard
                title="Total Sales"
                value={reportsData?.summary?.formattedTotalSales || '£0.00'}
                subtitle={`${reportsData?.summary?.completedOrders || 0} completed orders`}
                icon="dollar-sign"
                iconColor="#34C759"
              />
              <StatsCard
                title="Total Orders"
                value={reportsData?.summary?.totalOrders?.toString() || '0'}
                subtitle={`${
                  (reportsData?.summary?.processingOrders || 0) + (reportsData?.summary?.pendingOrders || 0)
                } active`}
                icon="package"
                iconColor="#007AFF"
              />
            </View>

            <View className="flex-row gap-3">
              <StatsCard
                title="Page Views"
                value={reportsData?.summary?.pageviews?.toString() || '0'}
                subtitle={`${listingsStats.published} active listings`}
                icon="eye"
                iconColor="#8B5CF6"
              />
              <StatsCard
                title="Available Balance"
                value={reportsData?.summary?.formattedSellerBalance || '£0.00'}
                subtitle="Ready to withdraw"
                icon="credit-card"
                iconColor="#FF9500"
              />
            </View>

            {/* Average Order Value */}
            {reportsData?.summary && reportsData.summary.totalOrders > 0 && (
              <View className="flex-row gap-3">
                <StatsCard
                  title="Average Order Value"
                  value={
                    reportsData.summary.completedOrders > 0
                      ? `£${(reportsData.summary.totalSales / reportsData.summary.completedOrders).toFixed(2)}`
                      : '£0.00'
                  }
                  subtitle="Per completed order"
                  icon="trending-up"
                  iconColor="#34C759"
                />
                <StatsCard
                  title="Active Listings"
                  value={listingsStats.published.toString()}
                  subtitle={`${listingsStats.draft} draft${listingsStats.draft !== 1 ? 's' : ''}`}
                  icon="grid"
                  iconColor="#007AFF"
                />
              </View>
            )}
          </View>

          {/* Order Status Breakdown */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-inter-bold mb-3">Order Status Breakdown</Text>
            <OrderStatusBreakdown />
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-inter-bold mb-3">Quick Actions</Text>
            <View className="p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity
                  onPress={() => router.push('/seller/orders')}
                  className="flex-1 p-3 mr-1 rounded bg-gray-100 items-center"
                >
                  <Feather name="package" color="#333" size={20} className="mb-1.5" />
                  <Text className="text-xs font-inter-bold text-gray-900">Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/seller/offers')}
                  className="flex-1 p-3 mx-1 rounded bg-gray-100 items-center"
                >
                  <Feather name="heart" color="#8B5CF6" size={20} className="mb-1.5" />
                  <Text className="text-xs font-inter-bold text-gray-900">Offers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/seller/reviews')}
                  className="flex-1 p-3 mx-1 rounded bg-gray-100 items-center"
                >
                  <Feather name="star" color="#FFD700" size={20} className="mb-1.5" />
                  <Text className="text-xs font-inter-bold text-gray-900">Reviews</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/seller/listings')}
                  className="flex-1 p-3 ml-1 rounded bg-gray-100 items-center"
                >
                  <Feather name="grid" color="#34C759" size={20} className="mb-1.5" />
                  <Text className="text-xs font-inter-bold text-gray-900">Listings</Text>
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
                className="p-4 mt-4 flex-row items-center rounded bg-blue-50"
              >
                <Feather name="truck" color="#007AFF" size={20} className="mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-inter-semibold text-gray-900">Shipping Settings</Text>
                  <Text className="text-xs font-inter text-gray-600">
                    Manage your shipping options and delivery times
                  </Text>
                </View>
                <Feather name="chevron-right" color="#666" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Profile */}
          {sellerSettings && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-inter-bold text-gray-900">Store Profile</Text>
                <TouchableOpacity onPress={() => router.push('/seller/shop-settings')}>
                  <View className="flex-row items-center">
                    <Feather name="edit-2" color="#007AFF" size={16} />
                    <Text className="ml-1 text-base font-inter text-blue-600">Edit</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <StoreProfileCard />
            </View>
          )}

          {/* Listings Statistics */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-inter-bold mb-3">Listings Overview</Text>
            <View className="bg-white rounded-lg shadow-lg">
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-100 justify-center items-center mr-3">
                    <Feather name="grid" color="#007AFF" size={20} />
                  </View>
                  <View>
                    <Text className="text-base font-inter-bold text-gray-900">Total Listings</Text>
                    <Text className="text-sm font-inter text-gray-600">{listingsStats.total} items</Text>
                  </View>
                </View>
                <Text className="text-2xl font-inter-bold text-gray-900">{listingsStats.total}</Text>
              </View>

              <View className="h-px bg-gray-200" />

              <View className="gap-2 p-4">
                <View className="flex-row justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    <Text className="text-gray-600 text-sm font-inter">Published</Text>
                  </View>
                  <Text className="text-gray-900 text-sm font-inter-bold">{listingsStats.published}</Text>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                    <Text className="text-gray-600 text-sm font-inter">Draft</Text>
                  </View>
                  <Text className="text-gray-900 text-sm font-inter-bold">{listingsStats.draft}</Text>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                    <Text className="text-gray-600 text-sm font-inter">Private</Text>
                  </View>
                  <Text className="text-gray-900 text-sm font-inter-bold">{listingsStats.private}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Offers Statistics */}
          {offersStats.total > 0 && (
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-inter-bold mb-3">Offers Overview</Text>
              <View className="bg-white rounded-lg p-4 shadow-lg">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-purple-100 justify-center items-center mr-3">
                      <Feather name="heart" color="#8B5CF6" size={20} />
                    </View>
                    <View>
                      <Text className="text-gray-900 text-base font-inter-bold">Total Offers</Text>
                      <Text className="text-gray-600 text-sm font-inter">{offersStats.total} received</Text>
                    </View>
                  </View>
                  <Text className="text-gray-900 text-2xl font-inter-bold">{offersStats.total}</Text>
                </View>

                <View className="h-px bg-gray-200 my-3" />

                {offersStats.pending > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                      <Text className="text-gray-600 text-sm font-inter">Pending</Text>
                    </View>
                    <Text className="text-gray-900 text-sm font-inter-bold">{offersStats.pending}</Text>
                  </View>
                )}

                {offersStats.accepted > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-gray-600 text-sm font-inter">Accepted</Text>
                    </View>
                    <Text className="text-gray-900 text-sm font-inter-bold">{offersStats.accepted}</Text>
                  </View>
                )}

                {offersStats.declined > 0 && (
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      <Text className="text-gray-600 text-sm font-inter">Declined</Text>
                    </View>
                    <Text className="text-gray-900 text-sm font-inter-bold">{offersStats.declined}</Text>
                  </View>
                )}
              </View>
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

      {/* Date Selection Modal */}
      <Modal
        visible={isDateModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDateModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-gray-900 text-xl font-inter-bold">Select Time Period</Text>
              <TouchableOpacity onPress={() => setIsDateModalOpen(false)} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 p-4">
                {/* Quick Period Options */}
                <View>
                  <Text className="text-gray-600 text-sm font-inter-semibold mb-3">Quick Select</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {periodOptions
                      .filter((option) => option.value !== 'custom')
                      .map((option) => {
                        const isSelected = pendingPeriod
                          ? pendingPeriod === option.value
                          : selectedPeriod === option.value && !customDateRange;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => changePeriod(option.value)}
                            className={`rounded-lg px-4 py-2.5 ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}`}
                          >
                            <Text
                              className={`text-sm font-inter-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>

                {/* Custom Date Range */}
                <View>
                  <Text className="text-gray-600 text-sm font-inter-semibold mb-3">Custom Date Range</Text>
                  <View className="bg-gray-50 rounded-lg p-4">
                    {/* Start Date */}
                    <View className="mb-4">
                      <Text className="text-gray-700 text-sm font-inter-semibold mb-2">Start Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowStartDatePicker(true)}
                        className="bg-white rounded-lg p-3 flex-row items-center justify-between border border-gray-200"
                      >
                        <Text className="text-gray-900 text-base font-inter">
                          {tempStartDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                        <Feather name="calendar" size={20} color="#666" />
                      </TouchableOpacity>
                      {showStartDatePicker && (
                        <DateTimePicker
                          value={tempStartDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') {
                              setShowStartDatePicker(false);
                            }
                            if (event.type === 'set' && selectedDate) {
                              setTempStartDate(selectedDate);
                              if (Platform.OS === 'ios') {
                                setShowStartDatePicker(false);
                              }
                            } else if (event.type === 'dismissed') {
                              setShowStartDatePicker(false);
                            }
                          }}
                          maximumDate={tempEndDate}
                        />
                      )}
                    </View>

                    {/* End Date */}
                    <View>
                      <Text className="text-gray-700 text-sm font-inter-semibold mb-2">End Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowEndDatePicker(true)}
                        className="bg-white rounded-lg p-3 flex-row items-center justify-between border border-gray-200"
                      >
                        <Text className="text-gray-900 text-base font-inter">
                          {tempEndDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                        <Feather name="calendar" size={20} color="#666" />
                      </TouchableOpacity>
                      {showEndDatePicker && (
                        <DateTimePicker
                          value={tempEndDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') {
                              setShowEndDatePicker(false);
                            }
                            if (event.type === 'set' && selectedDate) {
                              setTempEndDate(selectedDate);
                              if (Platform.OS === 'ios') {
                                setShowEndDatePicker(false);
                              }
                            } else if (event.type === 'dismissed') {
                              setShowEndDatePicker(false);
                            }
                          }}
                          minimumDate={tempStartDate}
                          maximumDate={new Date()}
                        />
                      )}
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={cancelPeriodChange}
                    className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                  >
                    <Text className="text-gray-900 text-base font-inter-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={applyPeriodChange}
                    className="flex-1 bg-black rounded-lg py-3 items-center"
                    disabled={!pendingPeriod}
                  >
                    <Text className="text-base font-inter-semibold text-white">Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
