import { ordersService } from '@/api/services';
import { Order } from '@/api/types';
import { OrderDetailsModal } from '@/components/order-details-modal';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as XLSX from 'xlsx';

export default function OrdersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('processing');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  const tabs = [
    { key: 'processing', label: 'To Fulfil' },
    { key: 'all', label: 'All' },
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
      case 'processing':
        return orders.filter((order) => order.delivery_status === 'processing');
      case 'all':
        return orders;
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
      case 'processing':
        return orders.filter((o) => o.delivery_status === 'processing').length;
      case 'all':
        return orders.length;
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

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const exportToExcel = async () => {
    if (isExporting) return; // Prevent multiple clicks

    try {
      setIsExporting(true);

      const filteredOrders = getFilteredOrders();

      if (filteredOrders.length === 0) {
        Alert.alert('No Data', 'There are no orders to export for this tab.');
        setIsExporting(false);
        return;
      }

      // Prepare data for Excel
      const excelData = filteredOrders.map((order) => ({
        'Order Number': order.order_number,
        'Order Date': formatDate(order.order_date),
        'Product Name': order.listings?.product_name || 'N/A',
        Quantity: order.quantity,
        Amount: `£${order.order_amount?.toFixed(2)}`,
        Status: order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1),
        'Buyer Name': order.buyer_profile?.full_name || order.buyer_profile?.username || 'N/A',
        'Buyer ID': order.buyer_id || 'N/A',
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();

      // Get tab label for filename
      const currentTab = tabs.find((t) => t.key === activeTab);
      const tabLabel = currentTab?.label || 'Orders';

      XLSX.utils.book_append_sheet(wb, ws, tabLabel);

      // Generate Excel file as binary string
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
      const fileName = `Orders_${tabLabel.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

      // Save to document directory (persistent storage)
      const file = new File(Paths.document, fileName);

      // Convert binary string to Uint8Array
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xff;
      }

      // Write file to persistent storage
      await file.create();
      const writable = file.writableStream();
      const writer = writable.getWriter();
      await writer.write(view);
      await writer.close();

      // Automatically open share dialog to save to Downloads folder
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        try {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Save Excel File to Downloads',
            UTI: 'com.microsoft.excel.xlsx',
          });
        } catch (shareError) {
          logger.error('Share cancelled or failed', shareError);
          // User cancelled or error occurred
          Alert.alert(
            'File Saved',
            `Excel file created successfully!\n\nFile: ${fileName}\n\nStored in app's Documents folder.\n\nTip: Use the share dialog to save to Downloads folder.`,
            [
              {
                text: 'Try Again',
                onPress: async () => {
                  await Sharing.shareAsync(file.uri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Save Excel File to Downloads',
                    UTI: 'com.microsoft.excel.xlsx',
                  });
                },
              },
              { text: 'OK', style: 'cancel' },
            ]
          );
        }
      } else {
        Alert.alert('Export Successful', `Excel file saved!\n\nFile: ${fileName}\n\nLocation: ${file.uri}`, [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      logger.error('Error exporting to Excel', error);
      Alert.alert('Export Error', 'Failed to export data to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
          onPress={() => handleViewDetails(order)}
          className="flex-1 bg-black rounded-lg py-3 flex-row items-center justify-center"
        >
          <Feather name="eye" size={16} color="#fff" />
          <Text className="text-white text-sm font-inter-bold ml-2">View Details</Text>
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

        <Text className="flex-1 text-lg font-inter-bold text-black">Orders</Text>

        <TouchableOpacity onPress={exportToExcel} disabled={isExporting} className="flex-row items-center" hitSlop={8}>
          {isExporting ? (
            <>
              <ActivityIndicator size="small" color="#000" />
              <Text className="text-black text-sm font-inter-semibold ml-2">Exporting...</Text>
            </>
          ) : (
            <>
              <Feather name="download" size={16} color="#000" />
              <Text className="text-black text-sm font-inter-semibold ml-2">Export Excel</Text>
            </>
          )}
        </TouchableOpacity>
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
            <Feather name="shopping-bag" color="#666" size={64} />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4">No orders found</Text>
            <Text className="text-gray-600 text-sm font-inter mt-2">
              {activeTab === 'all'
                ? 'Orders will appear here when buyers purchase from you'
                : `No ${activeTab} orders at this time`}
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal
          visible={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          order={selectedOrder}
          onOrderUpdated={loadOrders}
        />
      )}
    </SafeAreaView>
  );
}
