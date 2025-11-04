import { CartItem, ShippingOption, shippingService } from '@/api';
import { useCart } from '@/hooks/use-cart';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { cart, isLoading, error, removeItem, clearAll, refreshCart } = useCart();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<Record<string, ShippingOption[]>>({});
  const [selectedShipping, setSelectedShipping] = useState<Record<string, string>>({});
  const [shippingLoading, setShippingLoading] = useState(false);

  const handleRefreshCart = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshCart();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCart = () => {
    clearAll();
    setShowClearModal(false);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  // Fetch shipping options for all sellers in cart
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!cart || cart.items.length === 0) {
        setShippingOptions({});
        return;
      }

      setShippingLoading(true);
      try {
        const sellerIds = [...new Set(cart.items.map((item) => item.product?.seller_id).filter(Boolean))];
        const options: Record<string, ShippingOption[]> = {};
        const selected: Record<string, string> = {};

        for (const sellerId of sellerIds) {
          if (!sellerId) continue;
          try {
            const sellerOptions = await shippingService.getSellerShippingOptionsForBuyer(sellerId);
            options[sellerId] = sellerOptions;
            // Auto-select the first (cheapest) option
            if (sellerOptions.length > 0) {
              selected[sellerId] = sellerOptions[0].id;
            }
          } catch (error) {
            console.error(`Error fetching shipping options for seller ${sellerId}:`, error);
            options[sellerId] = [];
          }
        }

        setShippingOptions(options);
        setSelectedShipping(selected);
      } catch (error) {
        console.error('Error fetching shipping options:', error);
      } finally {
        setShippingLoading(false);
      }
    };

    fetchShippingOptions();
  }, [cart]);

  const handleShippingSelection = (sellerId: string, shippingId: string) => {
    setSelectedShipping((prev) => ({
      ...prev,
      [sellerId]: shippingId,
    }));
  };

  // Group cart items by seller
  const groupCartItemsBySeller = () => {
    if (!cart || cart.items.length === 0) return {};

    return cart.items.reduce((groups, item) => {
      if (!item.product?.seller_id) return groups;

      const sellerId = item.product.seller_id;
      if (!groups[sellerId]) {
        groups[sellerId] = {
          sellerInfo: item.product.seller_info_view,
          items: [],
        };
      }
      groups[sellerId].items.push(item);
      return groups;
    }, {} as Record<string, { sellerInfo: any; items: CartItem[] }>);
  };

  const sellerGroups = groupCartItemsBySeller();

  const SellerGroupSection = ({
    sellerId,
    sellerData,
    onRemove,
  }: {
    sellerId: string;
    sellerData: { sellerInfo: any; items: CartItem[] };
    onRemove: (productId: string) => void;
  }) => {
    const sellerShippingOptions = shippingOptions[sellerId] || [];
    const hasShippingOptions = sellerShippingOptions.length > 0;
    const sellerName = sellerData.sellerInfo?.shop_name || 'Unknown Seller';

    // Calculate total for this seller
    const totalAmount = sellerData.items.reduce((sum, item) => {
      if (!item.product) return sum;
      const price =
        item.product.discounted_price !== null ? item.product.discounted_price : item.product.starting_price;
      return sum + price;
    }, 0);

    const handleSellerCheckout = () => {
      // Get all product IDs for this seller
      const productIds = sellerData.items.map((item) => item.product?.id).filter(Boolean);
      router.push(`/checkout?sellerId=${sellerId}&productIds=${productIds.join(',')}`);
    };

    return (
      <View key={sellerId} className="rounded-xl overflow-hidden bg-white border border-gray-400">
        {/* Seller Header */}
        <View className="flex-row items-center gap-3 p-4 bg-gray-200">
          <Feather name="shopping-bag" color="#000" size={20} />
          <Text className="text-base font-inter-bold text-gray-800">Sold by {sellerName}</Text>
          <Text className="text-sm text-gray-600">
            ({sellerData.items.length} item{sellerData.items.length !== 1 ? 's' : ''})
          </Text>
        </View>

        {/* Products for this seller */}
        {sellerData.items.map((cartItem) => {
          if (!cartItem.product) return null;
          const product = cartItem.product;

          return (
            <View key={product.id} className="flex-row items-center gap-3 p-4 border-t border-gray-200">
              <View className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden">
                <Image
                  source={product.product_image}
                  contentFit="cover"
                  placeholder={{ blurhash }}
                  transition={1000}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>

              <View className="flex-1 gap-1">
                <Text className="text-sm font-inter-semibold text-gray-800" numberOfLines={2}>
                  {product.product_name}
                </Text>
                <Text className="text-xs text-gray-600">Qty: 1</Text>
                <Text className="text-sm font-inter-bold text-gray-800">
                  £
                  {product.discounted_price !== null
                    ? product.discounted_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : product.starting_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </Text>
              </View>

              <TouchableOpacity onPress={() => onRemove(product.id)}>
                <Feather name="trash-2" color="#ff4444" size={18} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Shipping Options Section */}
        <View className="p-4 border-t border-gray-200">
          <View className="flex-row items-center gap-2 mb-3">
            <Feather name="truck" color="#000" size={16} />
            <Text className="text-base font-inter-semibold text-gray-800">Shipping Options</Text>
          </View>

          {shippingLoading ? (
            <View className="flex-row items-center justify-center py-4">
              <ActivityIndicator size="small" color="#000" />
              <Text className="ml-2 text-sm text-gray-600">Loading shipping options...</Text>
            </View>
          ) : hasShippingOptions ? (
            <View className="gap-2">
              {sellerShippingOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleShippingSelection(sellerId, option.id)}
                  className={`flex-row items-center justify-between p-3 border rounded-lg ${
                    selectedShipping[sellerId] === option.id ? 'border-black bg-black/10' : 'border-gray-200 bg-white'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedShipping[sellerId] === option.id ? 'border-black bg-black' : 'border-gray-300'
                      }`}
                    >
                      {selectedShipping[sellerId] === option.id && (
                        <View className="w-2 h-2 rounded-full bg-white m-0.5" />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-inter-semibold text-gray-800">{option.name}</Text>
                      {option.estimated_days_min && option.estimated_days_max && (
                        <Text className="text-xs text-gray-600">
                          Estimated delivery: {option.estimated_days_min}-{option.estimated_days_max} days
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text className="text-sm font-inter-bold text-gray-800">
                    {option.price === 0
                      ? 'Free'
                      : `£${option.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
              <Text className="text-sm font-inter-semibold text-yellow-700">
                Shipping options not yet configured by seller
              </Text>
              <Text className="text-xs text-gray-600 mt-1">
                The seller needs to set up shipping options in their dashboard before checkout
              </Text>
            </View>
          )}
        </View>

        {/* Seller Total and Checkout */}
        <View className="p-4 border-t border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-inter-bold text-gray-800">
              Subtotal ({sellerData.items.length} item{sellerData.items.length !== 1 ? 's' : ''})
            </Text>
            <Text className="text-lg font-inter-bold text-gray-800">
              £
              {totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSellerCheckout}
            disabled={!hasShippingOptions}
            className={`items-center justify-center px-6 py-3 rounded-lg ${
              !hasShippingOptions ? 'bg-gray-400' : 'bg-black'
            }`}
          >
            <Text className="text-center text-base font-inter-bold text-white">Checkout with {sellerName}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">Your Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">Your Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading cart</Text>
          <TouchableOpacity onPress={handleRefreshCart} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">Your Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <Feather name="shopping-bag" color="#999" size={64} />
          <Text className="mt-4 mb-2 text-lg font-inter-bold text-gray-900">Your cart is empty</Text>
          <Text className="mb-4 text-sm font-inter-semibold text-center text-gray-600">
            Add some items to get started!
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">Your Cart</Text>

        <TouchableOpacity onPress={() => setShowClearModal(true)} hitSlop={8} className="mr-8">
          <Feather name="trash-2" color="#000" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRefreshCart}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="refresh-cw" color="#000" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshCart} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 gap-4 p-4">
          {Object.entries(sellerGroups).map(([sellerId, sellerData]) => (
            <SellerGroupSection
              key={sellerId}
              sellerId={sellerId}
              sellerData={sellerData}
              onRemove={(productId) => handleRemoveItem(productId)}
            />
          ))}
        </View>
      </ScrollView>

      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-inter-bold text-black mb-4 text-center">Clear Cart</Text>
            <Text className="text-base font-inter-semibold text-gray-600 mb-6 text-center">
              Are you sure you want to remove all items from your cart?
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowClearModal(false)}
                className="flex-1 bg-gray-100 rounded-lg py-3 mr-2 items-center"
              >
                <Text className="text-black text-base font-inter-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearCart}
                className="flex-1 bg-red-500 rounded-lg py-3 ml-2 items-center"
              >
                <Text className="text-white text-base font-inter-bold">Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
