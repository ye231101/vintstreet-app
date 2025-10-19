import { useBasket } from '@/hooks/use-basket';
import { useAppSelector } from '@/store/hooks';
import {
  selectBasketVendorIds,
  selectBasketVendorItems,
  selectBasketVendors,
  selectVendorTotals,
} from '@/store/selectors/basketSelectors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Use the interfaces from the basket slice
import { Basket, BasketItem, Vendor } from '@/store/slices/basketSlice';

export default function BasketScreen() {
  const { basket, isLoading, error, removeItem, updateItemQuantity, clearAll } = useBasket();
  const vendorIds = useAppSelector(selectBasketVendorIds);
  const vendors = useAppSelector(selectBasketVendors);
  const vendorItems = useAppSelector(selectBasketVendorItems);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Basket data is managed by the provider

  const refreshBasket = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Basket data is managed by the provider, no need to reload
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearBasket = () => {
    clearAll();
    setShowClearModal(false);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateItemQuantity(itemId, quantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const proceedToCheckout = () => {
    router.push('/checkout');
  };

  const VendorItemsSection = ({
    vendor,
    items,
    onQuantityChanged,
    onRemove,
  }: {
    vendor: Vendor;
    items: BasketItem[];
    onQuantityChanged: (item: BasketItem, quantity: number) => void;
    onRemove: (item: BasketItem) => void;
  }) => {
    const vendorTotals = useAppSelector(selectVendorTotals(vendor.id));

    return (
      <View className="bg-white rounded-xl mb-4">
        {/* Vendor Header */}
        <View className="flex-row items-center p-4 border-b border-gray-100">
          <Feather name="shopping-bag" color="#333" size={20} />
          <Text className="text-base font-poppins-bold text-gray-800 ml-2 flex-1">{vendor.name}</Text>
          <Text className="text-sm font-poppins text-gray-600">
            {vendor.itemCount} item{vendor.itemCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Items */}
        {items.map((item, index) => (
          <View key={item.id}>
            <View className="flex-row p-4 items-center">
              {/* Product Image */}
              <View className="w-20 h-20 rounded-lg bg-gray-100 mr-3 overflow-hidden">
                <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
              </View>

              {/* Product Details */}
              <View className="flex-1">
                <Text className="text-base font-poppins-bold text-gray-800 mb-1" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="text-lg font-poppins-bold text-gray-800 mb-1">£{item.price.toFixed(2)}</Text>
                <Text className="text-xs font-poppins text-gray-600">D&@</Text>
              </View>

              {/* Remove Button */}
              <TouchableOpacity onPress={() => onRemove(item)} className="absolute top-4 right-4 p-1">
                <Feather name="x" color="#999" size={20} />
              </TouchableOpacity>

              {/* Quantity Controls */}
              <View className="flex-row items-center mt-2">
                <TouchableOpacity
                  onPress={() => onQuantityChanged(item, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
                >
                  <Feather name="minus" color="#333" size={16} />
                </TouchableOpacity>

                <Text className="text-base font-poppins-bold text-gray-800 mx-4 min-w-5 text-center">
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => onQuantityChanged(item, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center"
                >
                  <Feather name="plus" color="#333" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            {index < items.length - 1 && <View className="h-px bg-gray-100 ml-4" />}
          </View>
        ))}

        {/* Vendor Totals */}
        <View className="p-4 border-t border-gray-100">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-poppins text-gray-600">Subtotal</Text>
            <Text className="text-sm font-poppins text-gray-800">£{vendorTotals.subtotal.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-poppins text-gray-600">Protection Fee</Text>
            <Text className="text-sm font-poppins text-gray-800">£{vendorTotals.protectionFee.toFixed(2)}</Text>
          </View>

          <View className="h-px bg-gray-100 my-2" />

          <View className="flex-row justify-between mb-4">
            <Text className="text-base font-poppins-bold text-gray-800">Vendor Total</Text>
            <Text className="text-base font-poppins-bold text-gray-800">£{vendorTotals.total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity className="bg-black rounded-lg py-3 px-6 items-center">
            <Text className="text-white text-base font-poppins-bold">Checkout with {vendor.name}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const BasketSummary = ({ basket }: { basket: Basket }) => (
    <View className="bg-white p-4 border-t border-gray-100">
      <View className="flex-row justify-between mb-2">
        <Text className="text-base font-poppins text-gray-800">Subtotal</Text>
        <Text className="text-base font-poppins-bold text-gray-800">{basket.formattedSubtotal}</Text>
      </View>

      <View className="flex-row justify-between mb-2">
        <Text className="text-base font-poppins text-gray-800">Protection Fee</Text>
        <Text className="text-base font-poppins-bold text-gray-800">{basket.formattedTotalProtectionFee}</Text>
      </View>

      <View className="h-px bg-gray-100 my-3" />

      <View className="flex-row justify-between mb-4">
        <Text className="text-lg font-poppins-bold text-gray-800">Total</Text>
        <Text className="text-lg font-poppins-bold text-gray-800">{basket.formattedTotal}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Your Basket</Text>
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

          <Text className="flex-1 text-lg font-poppins-bold text-white">Your Basket</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={48} />
          <Text className="text-white text-lg font-poppins-bold mt-4 mb-2">Error loading basket</Text>
          <Text className="text-gray-400 text-sm font-poppins text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={refreshBasket} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-poppins-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!basket || basket.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Your Basket</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="shopping-bag" color="#999" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4 mb-2">Your basket is empty</Text>
          <Text className="text-gray-400 text-sm font-poppins text-center mb-4">
            Items you add to your basket will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-poppins-bold text-white">Your Basket</Text>

        <TouchableOpacity onPress={() => setShowClearModal(true)} className="mr-4 p-2">
          <Feather name="trash-2" color="#fff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={refreshBasket} className="p-2">
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="refresh-cw" color="#fff" size={20} />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-gray-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshBasket} tintColor="#007AFF" />}
        >
          <View className="p-4">
            {/* Display items by vendor */}
            {vendorIds.map((vendorId) => (
              <VendorItemsSection
                key={vendorId}
                vendor={vendors[vendorId]}
                items={vendorItems[vendorId] || []}
                onQuantityChanged={(item, quantity) => handleUpdateQuantity(item.id, quantity)}
                onRemove={(item) => handleRemoveItem(item.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Basket Summary */}
        <BasketSummary basket={basket} />

        {/* Checkout Button */}
        <View className="px-4 py-2 pb-4">
          <TouchableOpacity onPress={proceedToCheckout} className="bg-black rounded-lg py-4 items-center">
            <Text className="text-white text-base font-poppins-bold">Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clear Basket Modal */}
      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-poppins-bold text-gray-800 mb-4 text-center">Clear Basket</Text>
            <Text className="text-base font-poppins text-gray-600 mb-6 text-center">
              Are you sure you want to remove all items from your basket?
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowClearModal(false)}
                className="flex-1 bg-gray-100 rounded-lg py-3 mr-2 items-center"
              >
                <Text className="text-gray-800 text-base font-poppins-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearBasket}
                className="flex-1 bg-red-500 rounded-lg py-3 ml-2 items-center"
              >
                <Text className="text-white text-base font-poppins-bold">Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
