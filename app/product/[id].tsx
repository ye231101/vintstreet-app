import { attributesService, listingsService } from '@/api/services';
import { Product } from '@/api/types';
import { AuctionDisplay } from '@/components/auction-display';
import { ContactModal } from '@/components/contact-modal';
import { MakeOfferModal } from '@/components/make-offer-modal';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash, formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { addRecentlyViewedProduct } from '@/utils/storage';
import { showInfoToast } from '@/utils/toast';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
  const { isAuthenticated } = useAuth();
  const { addItem, isInCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  // Product attributes
  const [productAttributes, setProductAttributes] = useState<unknown[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);
  // Related products
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  // cart state
  const isCarted = isInCart(product?.id);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addingRelatedProductId, setAddingRelatedProductId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'seller'>('description');

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Offer modal state
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const loadProduct = async () => {
    if (!id) {
      setError('Missing product id');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await listingsService.getListingById(String(id));
      setProduct(res);

      // Add product to recently viewed
      if (res?.id) {
        await addRecentlyViewedProduct(res.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductAttributes = async () => {
    if (!id) {
      setError('Missing product id');
      return;
    }

    try {
      setAttributesLoading(true);
      const res = await attributesService.getProductAttributeValues(id);
      setProductAttributes(res);
    } catch (error) {
      logger.error('Error loading product attributes:', error);
      setProductAttributes([]);
    } finally {
      setAttributesLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    if (!id) {
      setError('Missing product id');
      return;
    }

    try {
      setRelatedProductsLoading(true);
      const res = await listingsService.getRelatedProducts(id);
      setRelatedProducts(res);
    } catch (error) {
      logger.error('Error loading related products:', error);
      setRelatedProducts([]);
    } finally {
      setRelatedProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    loadProductAttributes();
    loadRelatedProducts();
  }, [id]);

  // Keep header title in sync with product name (safe even when product is null)
  useLayoutEffect(() => {
    const headerTitle = product?.product_name || 'Product Detail';
    navigation.setOptions?.({ title: headerTitle });
  }, [navigation, product]);

  const redirectToLogin = () => {
    const currentPath = `/product/${id}`;
    router.push(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleCart = () => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    router.push('/cart');
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    try {
      setIsAddingToCart(true);
      await addItem(product);
    } catch (error) {
      logger.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = (product: Product) => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    toggleItem(product);
  };

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  const handleViewShop = () => {
    router.push(`/seller-profile/${product?.seller_id}` as unknown);
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      showInfoToast('Please sign in to send messages');
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleMakeOffer = () => {
    if (!isAuthenticated) {
      showInfoToast('Please sign in to make an offer');
      return;
    }
    setIsOfferOpen(true);
  };

  // Check if product is an auction
  const isAuction = product?.auction_type === 'timed';

  const formattedDate = (() => {
    try {
      if (!product?.created_at) return '';
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
      <SafeAreaView className="flex-1 items-center justify-center p-4 bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4 bg-white">
        <Feather name="alert-circle" color="#ff4444" size={64} />
        <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading product</Text>
        <TouchableOpacity onPress={loadProduct} className="px-6 py-3 rounded-lg bg-black">
          <Text className="text-base font-inter-bold text-white">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4 bg-white">
        <Feather name="alert-circle" color="#ff4444" size={64} />
        <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Product not found</Text>
        <TouchableOpacity onPress={loadProduct} className="px-6 py-3 rounded-lg bg-black">
          <Text className="text-base font-inter-bold text-white">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text numberOfLines={1} className="flex-1 text-lg font-inter-bold text-black">
          {product.product_name}
        </Text>

        <Pressable onPress={() => handleCart()} hitSlop={8}>
          <Feather name="shopping-bag" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4 py-4">
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
                      source={imageUrl}
                      contentFit="cover"
                      placeholder={blurhash}
                      transition={1000}
                      style={{ width: '100%', aspectRatio: 1 }}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {product.product_images.length > 1 && (
                <View className="flex-row items-center justify-center py-2">
                  {product.product_images.map((_: unknown, index: number) => (
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
          ) : product.product_image ? (
            <View style={{ width: SCREEN_WIDTH }}>
              <Image
                source={product.product_image}
                contentFit="cover"
                placeholder={blurhash}
                transition={1000}
                style={{ width: '100%', aspectRatio: 1 }}
              />
            </View>
          ) : (
            <View className="w-full h-60 items-center justify-center">
              <Text className="text-sm font-inter-semibold text-gray-500">No image</Text>
            </View>
          )}

          <Pressable
            onPress={() => handleToggleWishlist(product)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-sm"
          >
            <FontAwesome
              name={isInWishlist(product.id) ? 'heart' : 'heart-o'}
              size={18}
              color={isInWishlist(product.id) ? '#ef4444' : 'black'}
            />
          </Pressable>

          {/* Title */}
          <View className="px-4">
            <Text className="text-2xl font-inter-bold text-black mb-2">{product.product_name}</Text>

            {/* Category Breadcrumb */}
            {(product.product_categories?.name ||
              product.product_subcategories?.name ||
              product.product_sub_subcategories?.name ||
              product.product_sub_sub_subcategories?.name) && (
              <View className="flex-row flex-wrap items-center gap-2 mb-2">
                {product.product_categories?.name && (
                  <View className="px-3 py-1 rounded-full bg-gray-200">
                    <Text className="text-xs font-inter-semibold text-gray-800">{product.product_categories.name}</Text>
                  </View>
                )}
                {product.product_subcategories?.name && (
                  <View className="px-3 py-1 rounded-full bg-gray-200">
                    <Text className="text-xs font-inter-semibold text-gray-800">
                      {product.product_subcategories.name}
                    </Text>
                  </View>
                )}
                {product.product_sub_subcategories?.name && (
                  <View className="px-3 py-1 rounded-full bg-gray-200">
                    <Text className="text-xs font-inter-semibold text-gray-800">
                      {product.product_sub_subcategories.name}
                    </Text>
                  </View>
                )}
                {product.product_sub_sub_subcategories?.name && (
                  <View className="px-3 py-1 rounded-full bg-gray-200">
                    <Text className="text-xs font-inter-semibold text-gray-800">
                      {product.product_sub_sub_subcategories.name}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Brand */}
            {product.brands?.name && (
              <View className="flex-row items-center mb-2">
                <View className="bg-black px-3 py-1 rounded-full">
                  <Text className="text-xs font-inter-semibold text-white">{product.brands.name}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Price and actions - Show auction display for auctions, otherwise show regular price */}
          {isAuction ? (
            <AuctionDisplay productId={product.id} />
          ) : (
            <View className="px-4">
              <View className="flex-row items-center justify-between">
                <View className="px-1">
                  <Text className="text-2xl font-inter-bold text-black mr-2">
                    £{formatPrice(product.discounted_price || product.starting_price)}
                  </Text>
                  {product.discounted_price !== null && (
                    <Text className="text-base font-inter-semibold text-gray-400 line-through">
                      £{formatPrice(product.starting_price)}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => handleAddToCart(product)}
                    disabled={!!isCarted || isAddingToCart}
                    className={`flex-row items-center px-4 py-2 rounded-lg ${
                      isCarted ? 'bg-gray-100 border border-gray-200' : 'bg-black border border-black'
                    }`}
                  >
                    {isAddingToCart ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="text-base font-inter-semibold text-white">Adding...</Text>
                      </View>
                    ) : isCarted ? (
                      <View className="flex-row items-center gap-2">
                        <Feather name="check" size={16} color="#000" />
                        <Text className="text-base font-inter-semibold text-black">Added to Cart</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Feather name="shopping-cart" size={16} color="white" />
                        <Text className="text-base font-inter-semibold text-white">Add to Cart</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 rounded-lg bg-white border border-gray-200"
                    onPress={handleMakeOffer}
                  >
                    <Feather name="message-circle" size={16} color="#000" className="mr-2" />
                    <Text className="text-base font-inter-semibold text-black">Make Offer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Tabs */}
          <View className="px-4">
            <View className="flex-row rounded-t-lg overflow-hidden border border-gray-200">
              {(['description', 'details', 'seller'] as const).map((t) => (
                <Pressable
                  key={t}
                  className={`flex-1 px-4 py-3 ${
                    activeTab === t ? 'bg-white' : 'bg-gray-100'
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

            <View className="border border-t-0 border-gray-200">
              {activeTab === 'description' && (
                <View className="p-4">
                  <Text className="text-sm font-inter-semibold text-gray-800">
                    {product.product_description || '-'}
                  </Text>
                </View>
              )}
              {activeTab === 'details' && (
                <View>
                  {/* Brand Information */}
                  {product.brands?.name && (
                    <View className="flex-row items-center justify-between p-4">
                      <Text className="text-sm font-inter-bold text-gray-800">Brand</Text>
                      <Text className="text-sm font-inter-semibold text-gray-800">{product.brands.name}</Text>
                    </View>
                  )}

                  <View className="h-px bg-gray-200" />

                  {/* Product Attributes */}
                  {attributesLoading ? (
                    <View className="flex-row items-center justify-center p-4">
                      <ActivityIndicator size="small" color="#000" />
                      <Text className="text-sm font-inter-semibold text-gray-600 ml-2">Loading attributes...</Text>
                    </View>
                  ) : productAttributes.length > 0 ? (
                    <View className="p-4">
                      <Text className="text-sm font-inter-bold text-gray-800 mb-3">Product Attributes</Text>
                      <View className="gap-2">
                        {productAttributes.map((attribute: unknown, index: number) => {
                          // Extract the correct value based on data type
                          const getValue = () => {
                            if (attribute.value_text !== null) {
                              // Try to parse JSON arrays/objects for better display
                              try {
                                const parsed = JSON.parse(attribute.value_text);
                                if (Array.isArray(parsed)) {
                                  return parsed.join(', ');
                                }
                                if (typeof parsed === 'object') {
                                  return JSON.stringify(parsed);
                                }
                                return attribute.value_text;
                              } catch {
                                // Not JSON, return as-is
                                return attribute.value_text;
                              }
                            }
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
                              className="flex-row items-center justify-between border-b border-gray-100 last:border-b-0"
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
                    </View>
                  ) : (
                    <View className="p-4">
                      <Text className="text-sm font-inter-semibold text-gray-600">
                        No additional attributes available.
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {activeTab === 'seller' && (
                <View>
                  <View className="flex-row items-center gap-3 p-4">
                    <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 items-center justify-center">
                      <Image
                        source={
                          product.seller_info_view?.avatar_url ||
                          `https://ui-avatars.com/api/?name=${product.seller_info_view?.shop_name}&length=1`
                        }
                        contentFit="cover"
                        placeholder={blurhash}
                        transition={1000}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-inter-semibold text-gray-800" numberOfLines={1}>
                        {product.seller_info_view?.shop_name || product.seller_info_view?.full_name || 'Seller'}
                      </Text>
                      {formattedDate ? (
                        <Text className="text-sm font-inter-semibold text-gray-500">Listed {formattedDate}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={handleViewShop}
                      className="flex-row items-center gap-2 px-3 py-2 rounded-lg border border-gray-300"
                    >
                      <Feather name="eye" size={20} color="black" />
                      <Text className="text-sm font-inter-semibold text-gray-800">View Shop</Text>
                    </Pressable>
                  </View>

                  <View className="h-px bg-gray-200" />

                  {/* Contact Seller Section */}
                  <View className="p-4">
                    <Text className="mb-3 text-base font-inter-semibold text-gray-800">Contact Seller</Text>
                    <Pressable
                      onPress={handleContactSeller}
                      className="flex-row items-center justify-center px-4 py-3 rounded-lg bg-black"
                    >
                      <Feather name="message-circle" size={20} color="white" className="mr-2" />
                      <Text className="text-white text-sm font-inter-semibold">Send Message</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Related Products Section */}
          {relatedProductsLoading ? (
            <View className="flex-1 items-center justify-center p-4">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading related products...</Text>
            </View>
          ) : relatedProducts.length > 0 ? (
            <View className="px-4">
              <Text className="my-4 text-xl font-inter-bold text-black">Related Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                {relatedProducts.map((relatedProduct: unknown) => {
                  const isRelatedInCart = isInCart(relatedProduct.id);
                  return (
                    <Pressable
                      key={relatedProduct.id}
                      onPress={() => router.push(`/product/${relatedProduct.id}` as unknown)}
                      className="w-44 overflow-hidden mx-2 rounded-lg bg-white border border-gray-200"
                    >
                      {/* Product Image */}
                      <View className="w-full h-44 overflow-hidden relative">
                        <Image
                          source={relatedProduct.product_image || relatedProduct.product_images?.[0]}
                          contentFit="cover"
                          placeholder={blurhash}
                          transition={1000}
                          style={{ width: '100%', height: '100%' }}
                        />

                        {/* Wishlist Heart Icon */}
                        <Pressable
                          onPress={() => handleToggleWishlist(relatedProduct)}
                          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-sm"
                        >
                          <FontAwesome
                            name={isInWishlist(relatedProduct.id) ? 'heart' : 'heart-o'}
                            size={18}
                            color={isInWishlist(relatedProduct.id) ? '#ef4444' : 'black'}
                          />
                        </Pressable>
                      </View>

                      {/* Product Info */}
                      <View className="p-2.5">
                        <Text className="text-sm font-inter-bold text-black mb-1" numberOfLines={1}>
                          {relatedProduct.product_name}
                        </Text>
                        <Text className="text-xs font-inter-semibold text-gray-500 mb-2" numberOfLines={1}>
                          By{' '}
                          {relatedProduct.seller_info_view?.shop_name ||
                            relatedProduct.seller_info_view?.full_name ||
                            'Seller'}
                        </Text>

                        {/* Price and Actions */}
                        <View className="flex-row items-center justify-between">
                          <Text className="text-base font-inter-bold text-black">
                            £{formatPrice(relatedProduct.discounted_price || relatedProduct.starting_price)}
                          </Text>
                          <Pressable
                            onPress={async () => {
                              if (!isAuthenticated) {
                                redirectToLogin();
                                return;
                              }
                              if (isRelatedInCart) return;
                              try {
                                setAddingRelatedProductId(relatedProduct.id);
                                await addItem(relatedProduct);
                              } catch (error) {
                                logger.error('Error adding to cart:', error);
                              } finally {
                                setAddingRelatedProductId(null);
                              }
                            }}
                            disabled={addingRelatedProductId === relatedProduct.id || isRelatedInCart}
                            className={`${
                              isRelatedInCart ? 'bg-gray-100 border border-gray-300' : 'bg-white border border-gray-200'
                            } rounded-lg w-10 h-10 items-center justify-center`}
                          >
                            {addingRelatedProductId === relatedProduct.id ? (
                              <ActivityIndicator size="small" color="#000" />
                            ) : isRelatedInCart ? (
                              <Feather name="check" size={20} color="#000" />
                            ) : (
                              <Feather name="shopping-cart" size={20} color="#000" />
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-xl font-inter-bold text-black">No related products found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Make Offer Modal */}
      <MakeOfferModal isOpen={isOfferOpen} onClose={() => setIsOfferOpen(false)} product={product} />

      {/* Contact Modal */}
      <ContactModal
        visible={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        order={null}
        product={product}
        mode="buyer"
      />
    </SafeAreaView>
  );
}
