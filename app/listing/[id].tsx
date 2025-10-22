import { listingsService } from '@/api/services/listings.service';
import { offersService } from '@/api/services/offers.service';
import { useCart } from '@/hooks/use-cart';
import { useAppSelector } from '@/store/hooks';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { supabase } from '@/api/config/supabase';

export default function ListingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { addItem } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'seller'>('description');
  const { user } = useAppSelector((state) => state.auth);

  // Offer modal state
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [productAttributes, setProductAttributes] = useState<any[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!id) {
          setError('Missing listing id');
          return;
        }
        const data = await listingsService.getListingById(String(id));
        setListing(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load listing');
      } finally {
        setIsLoading(false);
      }
    };
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
        console.log('**************************************************', data);
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

  // Keep header title in sync with listing name (safe even when listing is null)
  useLayoutEffect(() => {
    const headerTitle = (listing as any)?.product_name || 'Listing';
    // @ts-ignore - expo-router navigation supports setOptions
    navigation.setOptions?.({ title: headerTitle });
  }, [navigation, listing]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-base font-inter text-red-600">{error}</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-base font-inter text-gray-600">Listing not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addItem(listing);
  };

  const openOffer = () => {
    setOfferError(null);
    setOfferAmount('');
    setOfferMessage('');
    setIsOfferOpen(true);
  };

  const submitOffer = async () => {
    try {
      setOfferError(null);
      if (!user?.id) {
        setOfferError('Please sign in to make an offer.');
        return;
      }
      const sellerIdStr = String(listing.seller_id || '');
      const listingIdStr = String(id || '');
      const amountNum = Number(offerAmount);
      if (!amountNum || amountNum <= 0) {
        setOfferError('Enter a valid amount.');
        return;
      }
      setIsSubmittingOffer(true);
      await offersService.createOffer({
        listing_id: listingIdStr,
        buyer_id: user.id,
        seller_id: sellerIdStr,
        offer_amount: amountNum,
        message: offerMessage || undefined,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setIsOfferOpen(false);
    } catch (e) {
      setOfferError(e instanceof Error ? e.message : 'Failed to submit offer');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const formattedDate = (() => {
    try {
      if (!listing.created_at) return '';
      const d = new Date(listing.created_at);
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '';
    }
  })();

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Image */}
      {listing.product_image ? (
        <Image
          source={{ uri: listing.product_image }}
          className="w-full"
          style={{ aspectRatio: 1 }}
          resizeMode="contain"
        />
      ) : (
        <View className="w-full h-60 bg-gray-100 items-center justify-center">
          <Text className="text-sm font-inter text-gray-500">No image</Text>
        </View>
      )}

      {/* Title */}
      <View className="px-4 pt-4">
        <Text className="text-2xl font-inter-bold text-black mb-2">{listing.product_name}</Text>

        {/* Tag */}
        {listing.product_categories?.name ? (
          <View className="self-start bg-gray-100 px-3 py-1 rounded-full mb-3 ml-1">
            <Text className="text-xs font-inter text-gray-800">{listing.product_categories.name}</Text>
          </View>
        ) : null}
      </View>

      {/* Price and actions */}
      <View className="px-4">
        <View className="flex-row items-center justify-between bg-white py-2">
          <View className="flex-row items-center">
            <Text className="text-2xl font-inter-bold text-black mr-2">
              £{Number(listing.starting_price).toFixed(2)}
            </Text>
            {listing.discounted_price != null && (
              <Text className="text-base font-inter text-gray-400 line-through">
                £{Number(listing.starting_price).toFixed(2)}
              </Text>
            )}
          </View>
          <View className="flex-row items-center">
            <Pressable className="bg-black px-4 py-3 rounded-lg mr-2" onPress={handleAddToCart}>
              <Text className="text-white text-sm font-inter-semibold">Add to Cart</Text>
            </Pressable>
            <Pressable className="bg-gray-100 px-4 py-3 rounded-lg" onPress={openOffer}>
              <Text className="text-sm font-inter text-gray-900">Make Offer</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 mt-4">
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
                className={`text-sm font-inter text-center ${
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
            <Text className="text-sm font-inter text-gray-800">{listing.product_description || '-'}</Text>
          )}
          {activeTab === 'details' && (
            <View>
              {attributesLoading ? (
                <View className="flex-row items-center justify-center py-4">
                  <ActivityIndicator size="small" color="#000" />
                  <Text className="text-sm font-inter text-gray-600 ml-2">Loading attributes...</Text>
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
                        className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <Text className="text-sm font-inter text-gray-600 flex-1">
                          {attribute.attributes?.name || 'Attribute'}
                        </Text>
                        <Text className="text-sm font-inter text-gray-800 flex-1 text-right">{getValue()}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View>
                  <Text className="text-sm font-inter text-gray-600">No additional details available.</Text>
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
                    {listing.seller_info_view?.avatar_url ? (
                      <Image source={{ uri: listing.seller_info_view.avatar_url }} className="w-10 h-10 rounded-full" />
                    ) : (
                      <Text className="text-sm font-inter text-gray-700">
                        {listing.seller_info_view?.shop_name?.charAt(0) ||
                          listing.seller_info_view?.full_name?.charAt(0) ||
                          'S'}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-inter-semibold text-gray-800" numberOfLines={1}>
                      {listing.seller_info_view?.shop_name || listing.seller_info_view?.full_name || 'Seller'}
                    </Text>
                    {formattedDate ? (
                      <Text className="text-sm font-inter text-gray-500">Listed {formattedDate}</Text>
                    ) : null}
                  </View>
                  <Pressable className="px-3 py-2 border border-gray-300 rounded-lg flex-row items-center">
                    <Text className="text-sm font-inter text-gray-800">View Shop</Text>
                  </Pressable>
                </View>

                {/* Contact Seller Section */}
                <View className="border-t border-gray-200 pt-3">
                  <Text className="text-base font-inter-semibold text-gray-800 mb-3">Contact Seller</Text>
                  <Pressable className="bg-black px-4 py-3 rounded-lg flex-row items-center justify-center">
                    <Text className="text-white text-sm font-inter-semibold mr-2">💬</Text>
                    <Text className="text-white text-sm font-inter-semibold">Send Message</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className="h-8" />

      {/* Make Offer Modal */}
      <Modal visible={isOfferOpen} transparent animationType="fade" onRequestClose={() => setIsOfferOpen(false)}>
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white w-11/12 rounded-xl p-4">
            <Text className="text-lg font-inter-semibold mb-3">Make an Offer</Text>
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
              <Text className="text-sm font-inter text-gray-800" numberOfLines={1}>
                {listing.product_name}
              </Text>
              <Text className="text-xs font-inter text-gray-500">
                Current price: £{Number(listing.starting_price).toFixed(2)}
              </Text>
            </View>
            <Text className="text-sm font-inter mb-2">Your Offer (£)</Text>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="Enter your offer amount"
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
              value={offerAmount}
              onChangeText={setOfferAmount}
            />
            <View className="flex-row mb-3">
              {[0.85, 0.9, 0.95].map((mult) => {
                const suggested = Number(listing.starting_price) * mult;
                return (
                  <Pressable
                    key={String(mult)}
                    className="bg-gray-100 px-3 py-2 rounded-lg mr-2"
                    onPress={() => setOfferAmount(suggested.toFixed(2))}
                  >
                    <Text className="text-sm font-inter">£{suggested.toFixed(2)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="text-sm font-inter mb-1">Message (Optional)</Text>
            <TextInput
              placeholder="Add a message to the seller..."
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
              multiline
              value={offerMessage}
              onChangeText={setOfferMessage}
            />
            {offerError ? <Text className="text-xs font-inter text-red-600 mb-2">{offerError}</Text> : null}
            <View className="flex-row justify-end">
              <Pressable
                className="px-4 py-2 rounded-lg mr-2 border border-gray-300"
                disabled={isSubmittingOffer}
                onPress={() => setIsOfferOpen(false)}
              >
                <Text className="text-sm font-inter">Cancel</Text>
              </Pressable>
              <Pressable className="px-4 py-2 rounded-lg bg-black" disabled={isSubmittingOffer} onPress={submitOffer}>
                <Text className="text-sm font-inter text-white">
                  {isSubmittingOffer ? 'Submitting...' : 'Submit Offer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
