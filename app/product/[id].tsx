import { supabase } from '@/api/config/supabase';
import { listingsService } from '@/api/services/listings.service';
import { ContactSellerModal } from '@/components/contact-seller-modal';
import { MakeOfferModal } from '@/components/make-offer-modal';
import { useCart } from '@/hooks/use-cart';
import { useAppSelector } from '@/store/hooks';
import { showInfoToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { addItem } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'seller'>('description');
  const { user } = useAppSelector((state) => state.auth);
  const scrollViewRef = useRef<ScrollView>(null);

  // Offer modal state
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [productAttributes, setProductAttributes] = useState<any[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!id) {
        setError('Missing product id');
        return;
      }
      const data = await listingsService.getListingById(String(id));
      setProduct(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Load product attributes
  useEffect(() => {
    const loadAttributes = async () => {
      if (!id) return;

      try {
        setAttributesLoading(true);
        const { data, error } = await supabase
          .from('product_attribute_values')
          .select(`*, attributes (id, name, data_type)`)
          .eq('product_id', id);

        if (error) throw error;
        setProductAttributes(data || []);
      } catch (error) {
        console.error('Error loading product attributes:', error);
        setProductAttributes([]);
      } finally {
        setAttributesLoading(false);
      }
    };

    loadAttributes();
  }, [id]);

  // Keep header title in sync with product name (safe even when product is null)
  useLayoutEffect(() => {
    const headerTitle = product?.product_name || 'Product Detail';
    // @ts-ignore - expo-router navigation supports setOptions
    navigation.setOptions?.({ title: headerTitle });
  }, [navigation, product]);

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleViewShop = () => {
    router.push(`/seller-profile/${product.seller_id}` as any);
  };

  const handleContactSeller = () => {
    if (!user?.id) {
      showInfoToast('Please sign in to send messages');
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  const formattedDate = (() => {
    try {
      if (!product.created_at) return '';
      const d = new Date(product.created_at);
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '';
    }
  })();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4 bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-3 text-sm font-inter-semibold text-gray-600">Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 p-4">
        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading product</Text>
          <TouchableOpacity onPress={load} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4 bg-gray-50">
        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">Product not found</Text>
          <TouchableOpacity onPress={load} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text numberOfLines={1} className="flex-1 ml-4 text-lg font-inter-bold text-white">
          {product.product_name}
        </Text>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4 py-4 bg-gray-50">
          {/* Image Carousel */}
          {product.product_images?.length > 0 ? (
            <View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
              >
                {product.product_images.map((imageUrl: string, index: number) => (
                  <View key={index} style={{ width: SCREEN_WIDTH }}>
                    <Image
                      source={{ uri: imageUrl }}
                      className="w-full"
                      style={{ aspectRatio: 1 }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {product.product_images.length > 1 && (
                <View className="flex-row justify-center items-center py-2">
                  {product.product_images.map((_: any, index: number) => (
                    <View
                      key={index}
                      className={`h-2 rounded-full mx-1 ${
                        index === currentImageIndex ? 'w-6 bg-black' : 'w-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="w-full h-60 bg-gray-100 items-center justify-center">
              <Text className="text-sm font-inter-semibold text-gray-500">No image</Text>
            </View>
          )}

          {/* Title */}
          <View className="px-4">
            <Text className="text-2xl font-inter-bold text-black mb-2">{product.product_name}</Text>

            {/* Tag */}
            {product.product_categories?.name ? (
              <View className="self-start bg-gray-200 px-3 py-1 rounded-full mb-3 ml-1">
                <Text className="text-xs font-inter-semibold text-gray-800">{product.product_categories.name}</Text>
              </View>
            ) : null}
          </View>

          {/* Price and actions */}
          <View className="px-4">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <Text className="text-2xl font-inter-bold text-black mr-2">
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
                {product.discounted_price !== null && (
                  <Text className="text-base font-inter-semibold text-gray-400 line-through">
                    £
                    {product.starting_price.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center">
                <Pressable
                  className="flex-row items-center bg-black px-4 py-3 rounded-lg mr-2"
                  onPress={handleAddToCart}
                >
                  <Text className="text-white text-sm font-inter-semibold">Add to Cart</Text>
                </Pressable>
                <Pressable className="bg-gray-200 px-4 py-3 rounded-lg" onPress={() => setIsOfferOpen(true)}>
                  <Text className="text-sm font-inter-semibold text-black">Make Offer</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View className="px-4">
            <View className="flex-row bg-white rounded-lg overflow-hidden border border-gray-200">
              {(['description', 'details', 'seller'] as const).map((t) => (
                <Pressable
                  key={t}
                  className={`flex-1 px-4 py-3 ${
                    activeTab === t ? 'bg-white' : 'bg-gray-50'
                  } border-r border-gray-200 items-center justify-center`}
                  onPress={() => setActiveTab(t)}
                >
                  <Text
                    className={`text-sm font-inter-semibold text-center ${
                      activeTab === t ? 'text-black font-inter-semibold' : 'text-gray-700'
                    }`}
                  >
                    {t === 'description' ? 'Description' : t === 'details' ? 'Details' : 'Seller'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="bg-white border border-t-0 border-gray-200 p-4">
              {activeTab === 'description' && (
                <Text className="text-sm font-inter-semibold text-gray-800">{product.product_description || '-'}</Text>
              )}
              {activeTab === 'details' && (
                <View>
                  {attributesLoading ? (
                    <View className="flex-row items-center justify-center py-4">
                      <ActivityIndicator size="small" color="#000" />
                      <Text className="text-sm font-inter-semibold text-gray-600 ml-2">Loading attributes...</Text>
                    </View>
                  ) : productAttributes.length > 0 ? (
                    <View>
                      {productAttributes.map((attribute: any, index: number) => {
                        // Extract the correct value based on data type
                        const getValue = () => {
                          if (attribute.value_text !== null) return attribute.value_text;
                          if (attribute.value_number !== null) return attribute.value_number.toString();
                          if (attribute.value_boolean !== null) return attribute.value_boolean ? 'Yes' : 'No';
                          if (attribute.value_date !== null) {
                            try {
                              return new Date(attribute.value_date).toLocaleDateString();
                            } catch {
                              return attribute.value_date;
                            }
                          }
                          return '-';
                        };

                        return (
                          <View
                            key={index}
                            className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                          >
                            <Text className="text-sm font-inter-semibold text-gray-600 flex-1">
                              {attribute.attributes?.name || 'Attribute'}
                            </Text>
                            <Text className="text-sm font-inter-semibold text-gray-800 flex-1 text-right">
                              {getValue()}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View>
                      <Text className="text-sm font-inter-semibold text-gray-600">
                        No additional details available.
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {activeTab === 'seller' && (
                <View>
                  {/* Seller Profile Section */}
                  <View className="bg-white p-4 mb-4">
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                        {product.seller_info_view?.avatar_url ? (
                          <Image
                            source={{ uri: product.seller_info_view.avatar_url }}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <Text className="text-sm font-inter-semibold text-gray-700">
                            {product.seller_info_view?.shop_name?.charAt(0) ||
                              product.seller_info_view?.full_name?.charAt(0) ||
                              'S'}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-inter-semibold text-gray-800" numberOfLines={1}>
                          {product.seller_info_view?.shop_name || product.seller_info_view?.full_name || 'Seller'}
                        </Text>
                        {formattedDate ? (
                          <Text className="text-sm font-inter-semibold text-gray-500">Listed {formattedDate}</Text>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={handleViewShop}
                        className="px-3 py-2 border border-gray-300 rounded-lg flex-row items-center"
                      >
                        <Feather name="eye" size={20} color="black" className="mr-2" />
                        <Text className="text-sm font-inter-semibold text-gray-800">View Shop</Text>
                      </Pressable>
                    </View>

                    {/* Contact Seller Section */}
                    <View className="border-t border-gray-200 pt-3">
                      <Text className="text-base font-inter-semibold text-gray-800 mb-3">Contact Seller</Text>
                      <Pressable
                        onPress={handleContactSeller}
                        className="bg-black px-4 py-3 rounded-lg flex-row items-center justify-center"
                      >
                        <Feather name="message-circle" size={20} color="white" className="mr-2" />
                        <Text className="text-white text-sm font-inter-semibold">Send Message</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={isOfferOpen}
        onClose={() => setIsOfferOpen(false)}
        productId={String(id || '')}
        productName={product.product_name}
        currentPrice={Number(product.starting_price)}
        sellerId={String(product.seller_id || '')}
        userId={user?.id}
      />

      {/* Contact Seller Modal */}
      <ContactSellerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        sellerId={String(product.seller_id || '')}
        sellerName={product.seller_info_view?.shop_name || product.seller_info_view?.full_name || 'Seller'}
        userId={user?.id}
        productName={product.product_name}
      />
    </SafeAreaView>
  );
}
