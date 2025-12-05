import { shippingService } from '@/api/services';
import { CartItem, ShippingBand, ShippingOption, ShippingProviderPrice } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { blurhash, formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { getStorageValue, setStorageValue } from '@/utils/storage';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
];

export default function CartScreen() {
  const { user } = useAuth();
  const { items, isLoading, error, removeItem, clearCart, refreshCart } = useCart();
  const [shippingCountry, setShippingCountry] = useState<string>('');
  const [showCountryDialog, setShowCountryDialog] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<Record<string, ShippingOption[]>>({});
  const [selectedShipping, setSelectedShipping] = useState<Record<string, string>>({});
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingBands, setShippingBands] = useState<ShippingBand[]>([]);
  const [shippingProviderPrices, setShippingProviderPrices] = useState<ShippingProviderPrice[]>([]);

  useEffect(() => {
    const loadShippingCountry = async () => {
      try {
        const savedCountry = await getStorageValue('SHIPPING_COUNTRY');
        if (savedCountry) {
          setShippingCountry(savedCountry);
        } else {
          setShowCountryDialog(true);
        }
      } catch (error) {
        logger.error('Error loading shipping country:', error);
      }
    };
    loadShippingCountry();
  }, []);

  const handleCountryChange = async (countryCode: string) => {
    setShippingCountry(countryCode);
    try {
      await setStorageValue('SHIPPING_COUNTRY', countryCode);
    } catch (error) {
      logger.error('Error saving shipping country:', error);
    }
    setShowCountryDialog(false);
  };

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
    clearCart();
    setShowClearModal(false);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const fetchShippingOptions = async () => {
    if (!items || items.length === 0 || !shippingCountry) {
      setShippingOptions({});
      return;
    }

    setShippingLoading(true);
    try {
      const sellerIds = [...new Set(items.map((item: CartItem) => item.product?.seller_id).filter(Boolean))];
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
          logger.error(`Error fetching shipping options for seller ${sellerId}:`, error);
          options[sellerId] = [];
        }
      }

      setShippingOptions(options);
      setSelectedShipping(selected);
    } catch (error) {
      logger.error('Error fetching shipping options:', error);
    } finally {
      setShippingLoading(false);
    }
  };

  // Fetch shipping bands and provider prices
  useEffect(() => {
    const fetchShippingData = async () => {
      try {
        // Fetch shipping bands
        const bands = await shippingService.getShippingBands();
        setShippingBands(bands);

        // Fetch provider prices
        const prices = await shippingService.getShippingProviderPrices();
        setShippingProviderPrices(prices);
      } catch (error) {
        logger.error('Error fetching shipping data:', error);
      }
    };

    fetchShippingData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchShippingOptions();
      }
    }, [user?.id, items, shippingCountry])
  );

  const handleShippingSelection = (sellerId: string, shippingId: string) => {
    setSelectedShipping((prev) => ({
      ...prev,
      [sellerId]: shippingId,
    }));
  };

  // Function to identify which weight band a total weight falls into
  // Weight is in grams, bands are in kg, so we convert
  const getWeightBand = (totalWeight: number, bands: ShippingBand[]): ShippingBand | null => {
    if (totalWeight < 0 || bands.length === 0) return null;

    // Find the band that contains this weight
    // Bands are inclusive on both ends: min_weight <= weight <= max_weight
    const matchingBand = bands.find((band) => totalWeight >= band.min_weight && totalWeight <= band.max_weight);

    return matchingBand || null;
  };

  // Function to get postage price using provider_id and band_id
  const getPostagePrice = (providerId: string | null, bandId: string | null): number | null => {
    if (!providerId || !bandId || !shippingProviderPrices || shippingProviderPrices.length === 0) {
      return null;
    }

    const priceEntry = shippingProviderPrices.find(
      (price) => price.provider_id === providerId && price.band_id === bandId
    );

    return priceEntry ? Number(priceEntry.price) : null;
  };

  // Group cart items by seller
  const groupCartItemsBySeller = () => {
    if (!items || items.length === 0) return {};

    return items.reduce((groups, item) => {
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
    }, {} as Record<string, { sellerInfo: unknown; items: CartItem[] }>);
  };

  const sellerGroups = groupCartItemsBySeller();

  const SellerGroupSection = ({
    sellerId,
    sellerData,
    onRemove,
  }: {
    sellerId: string;
    sellerData: { sellerInfo: unknown; items: CartItem[] };
    onRemove: (productId: string) => void;
  }) => {
    const sellerShippingOptions = shippingOptions[sellerId] || [];
    const hasShippingOptions = sellerShippingOptions.length > 0;
    const sellerName = sellerData.sellerInfo?.shop_name || 'Unknown Seller';

    // Calculate total weight for this seller's items
    const totalWeight = sellerData.items.reduce((weightSum, item) => {
      // Access weight from product - it may be stored as weight or in a nested property
      const weight = (item.product as unknown)?.weight ?? 0;
      return weightSum + (typeof weight === 'number' ? weight : 0);
    }, 0);

    // Identify the weight band for this seller's total weight
    const weightBand = getWeightBand(totalWeight, shippingBands);

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
                  £{formatPrice(product.discounted_price || product.starting_price)}
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

          {!shippingCountry ? (
            <View className="p-4 border border-gray-300 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-600">
                Please select your shipping country above to view shipping options
              </Text>
            </View>
          ) : shippingLoading ? (
            <View className="flex-row items-center justify-center py-4">
              <ActivityIndicator size="small" color="#000" />
              <Text className="ml-2 text-sm text-gray-600">Loading shipping options...</Text>
            </View>
          ) : hasShippingOptions ? (
            <View className="gap-2">
              {sellerShippingOptions.map((option) => {
                // Get postage price using provider_id and band_id
                const postagePrice = getPostagePrice(option.provider_id, weightBand?.id || null);
                // Use provider name from relationship if available, otherwise fall back to option.name
                const providerName = option.shipping_providers?.name || option.name;
                const providerDescription = option.shipping_providers?.description || option.description;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleShippingSelection(sellerId, option.id)}
                    className={`flex-row items-center justify-between p-3 border rounded-lg ${
                      selectedShipping[sellerId] === option.id ? 'border-black bg-black/10' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedShipping[sellerId] === option.id ? 'border-black bg-black' : 'border-gray-300'
                        }`}
                      >
                        {selectedShipping[sellerId] === option.id && (
                          <View className="w-2 h-2 rounded-full bg-white m-0.5" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-inter-semibold text-gray-800">{providerName}</Text>
                        {providerDescription && <Text className="text-xs text-gray-600">{providerDescription}</Text>}
                        {option.estimated_days_min && option.estimated_days_max && (
                          <Text className="text-xs text-gray-600">
                            Estimated delivery: {option.estimated_days_min}-{option.estimated_days_max} days
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-sm font-inter-bold text-gray-800 ml-2">
                      {postagePrice !== null
                        ? postagePrice === 0
                          ? 'Free'
                          : `£${formatPrice(postagePrice)}`
                        : '£0.00'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
            <Text className="text-lg font-inter-bold text-gray-800">£{formatPrice(totalAmount)}</Text>
          </View>

          {/* Weight Information */}
          <View className="flex-row items-center justify-between mb-3">
            {totalWeight >= 0 && (
              <Text className="text-sm text-gray-600">Total Weight: {totalWeight.toFixed(2)}kg</Text>
            )}
            {weightBand && <Text className="text-sm font-inter-semibold text-gray-800">{weightBand.name}</Text>}
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
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">My Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">My Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading cart</Text>
          <TouchableOpacity onPress={handleRefreshCart} className="px-6 py-3 rounded-lg bg-black">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!items || items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">My Cart</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <Feather name="shopping-bag" color="#999" size={64} />
          <Text className="mt-2 mb-4 text-lg font-inter-bold text-gray-900">Your cart is empty</Text>
          <Text className="mb-4 text-sm font-inter-semibold text-center text-gray-600">
            Add some items to get started!
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} className="px-6 py-3 rounded-lg bg-black">
            <Text className="text-base font-inter-bold text-white">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">My Cart</Text>

        <TouchableOpacity onPress={() => setShowClearModal(true)} hitSlop={8}>
          <Feather name="trash-2" color="#000" size={20} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRefreshCart} hitSlop={8}>
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
          {/* Shipping Destination Banner */}
          {items && items.length > 0 && (
            <View className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-row items-center gap-3 flex-1">
                  <Feather name="check-circle" size={20} color="#16a34a" />
                  <View className="flex-1">
                    <Text className="text-sm font-inter-semibold text-gray-600">Shipping to</Text>
                    <Text className="text-base font-inter-bold text-gray-900">
                      {COUNTRIES.find((country) => country.code === shippingCountry)?.name || 'Select a country'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCountryDialog(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <Text className="text-sm font-inter-bold text-gray-700">Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {Object.entries(sellerGroups).map(([sellerId, sellerData]) => (
            <SellerGroupSection
              key={sellerId}
              sellerId={sellerId}
              sellerData={sellerData as { sellerInfo: unknown; items: CartItem[] }}
              onRemove={(productId) => handleRemoveItem(productId)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Shipping Country Selection Modal */}
      <Modal
        visible={showCountryDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryDialog(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-xl p-4 w-full max-w-sm">
            <Text className="text-lg font-inter-bold text-black mb-2 text-center">Select Shipping Destination</Text>
            <Text className="text-sm font-inter-semibold text-gray-600 mb-4 text-center">
              Please select your shipping country to see available shipping options
            </Text>
            <ScrollView className="max-h-96">
              <View className="flex-col gap-2">
                {COUNTRIES.map((country) => (
                  <TouchableOpacity
                    key={country.code}
                    onPress={() => handleCountryChange(country.code)}
                    className={`flex-row items-center justify-between p-4 border rounded-lg ${
                      shippingCountry === country.code ? 'border-black bg-black/10' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text className="text-base font-inter-semibold text-gray-800">{country.name}</Text>
                    {shippingCountry === country.code && <Feather name="check" size={20} color="#000" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-xl p-4 w-full max-w-sm">
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
