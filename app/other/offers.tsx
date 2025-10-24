import { supabase } from '@/api/config/supabase';
import { MakeOfferModal } from '@/components/make-offer-modal';
import { blurhash } from '@/utils';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Offer } from '../../api/services/offers.service';
import { useAuth } from '../../hooks/use-auth';

interface ExtendedOffer extends Offer {
  payment_completed?: boolean;
  seller_id: string;
  listing_id: string;
  listing?: {
    product_name: string;
    product_image?: string;
    starting_price: number;
    category_id?: string;
    category_name?: string;
  };
}

export default function MyOffersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<ExtendedOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadOffers();
    }
  }, [user?.id]);

  const loadOffers = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch offers with seller_id
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('id, listing_id, seller_id, offer_amount, message, status, created_at, expires_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      if (!offersData || offersData.length === 0) {
        setOffers([]);
        setIsLoading(false);
        return;
      }

      // Type the offers data
      type OfferRow = {
        id: string;
        listing_id: string;
        seller_id: string;
        offer_amount: number;
        message: string | null;
        status: string;
        created_at: string;
        expires_at: string;
      };

      const typedOffersData = offersData as unknown as OfferRow[];

      // Check for payment status on accepted offers
      const acceptedOfferIds = typedOffersData.filter((o) => o.status === 'accepted').map((o) => o.id);
      let paidListingIds = new Set<string>();

      if (acceptedOfferIds.length > 0) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('listing_id')
          .eq('buyer_id', user.id)
          .in(
            'listing_id',
            typedOffersData.map((o) => o.listing_id)
          );

        if (ordersData) {
          paidListingIds = new Set(ordersData.map((o: any) => o.listing_id));
        }
      }

      // Fetch listing details with category information
      const listingIds = typedOffersData.map((o) => o.listing_id);
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(
          `
          id, 
          product_name, 
          product_image, 
          starting_price,
          category_id,
          product_categories(name)
        `
        )
        .in('id', listingIds);

      if (listingsError) throw listingsError;

      type ListingRow = {
        id: string;
        product_name: string;
        product_image: string | null;
        starting_price: number;
        category_id: string | null;
        product_categories?: { name: string } | null;
      };

      const typedListingsData = (listingsData || []) as unknown as ListingRow[];

      // Combine offers with listing details
      const offersWithListings: ExtendedOffer[] = typedOffersData.map((offer) => {
        const listing = typedListingsData.find((l) => l.id === offer.listing_id);
        const paymentCompleted = paidListingIds.has(offer.listing_id);
        return {
          id: offer.id,
          listingId: offer.listing_id,
          listing_id: offer.listing_id,
          buyerId: user.id,
          sellerId: offer.seller_id,
          seller_id: offer.seller_id,
          offerAmount: offer.offer_amount,
          message: offer.message || '',
          status: offer.status as 'pending' | 'accepted' | 'declined',
          expiresAt: offer.expires_at,
          createdAt: offer.created_at,
          productName: listing?.product_name || 'Product',
          buyerName: '',
          originalPrice: listing?.starting_price || 0,
          payment_completed: paymentCompleted,
          listing: listing
            ? {
                product_name: listing.product_name,
                product_image: listing.product_image || undefined,
                starting_price: listing.starting_price,
                category_id: listing.category_id || undefined,
                category_name: listing.product_categories?.name || undefined,
              }
            : undefined,
        };
      });

      setOffers(offersWithListings);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(err instanceof Error ? err.message : 'Error loading offers');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  // Get unique categories from offers
  const availableCategories = Array.from(
    new Set(offers.filter((o) => o.listing?.category_name).map((o) => o.listing!.category_name!))
  ).sort();

  // Apply filters
  const filteredOffers = offers.filter((offer) => {
    const matchesCategory = categoryFilter === 'all' || offer.listing?.category_name === categoryFilter;
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  // Get counts for all offers (not filtered by status)
  const allPendingOffers = offers.filter((offer) => offer.status === 'pending');
  const allAcceptedOffers = offers.filter((offer) => offer.status === 'accepted');
  const allDeclinedOffers = offers.filter((offer) => offer.status === 'declined');

  const pendingOffers = filteredOffers.filter((offer) => offer.status === 'pending');
  const acceptedOffers = filteredOffers.filter((offer) => offer.status === 'accepted');
  const declinedOffers = filteredOffers.filter((offer) => offer.status === 'declined');

  const handleCancelOffer = async (offerId: string) => {
    Alert.alert('Cancel Offer?', 'Are you sure you want to cancel this offer? This action cannot be undone.', [
      { text: 'Keep Offer', style: 'cancel' },
      {
        text: 'Cancel Offer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('offers').delete().eq('id', offerId);
            if (error) throw error;
            showSuccessToast('Offer cancelled successfully');
            loadOffers();
          } catch (error) {
            console.error('Error cancelling offer:', error);
            showErrorToast('Failed to cancel offer');
          }
        },
      },
    ]);
  };

  const handlePayNow = async (offer: ExtendedOffer) => {
    if (!offer.listing || !user?.id) return;

    try {
      const { error } = await supabase.from('orders').insert({
        buyer_id: user.id,
        seller_id: offer.seller_id,
        listing_id: offer.listing_id,
        order_amount: offer.offerAmount,
        quantity: 1,
        stream_id: 'shop',
        status: 'completed',
        delivery_status: 'processing',
      });

      if (error) throw error;

      showSuccessToast('Payment successful! Your order has been placed.');
      loadOffers();
    } catch (error) {
      console.error('Error processing payment:', error);
      showErrorToast('Failed to process payment');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return (
          <View className="flex-row items-center bg-yellow-100 px-2 py-1 rounded-full">
            <Feather name="clock" size={12} color="#D97706" />
            <Text className="text-yellow-700 text-xs font-inter-semibold ml-1">Pending</Text>
          </View>
        );
      case 'accepted':
        return (
          <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
            <Feather name="check" size={12} color="#059669" />
            <Text className="text-green-700 text-xs font-inter-semibold ml-1">Accepted</Text>
          </View>
        );
      case 'declined':
        return (
          <View className="flex-row items-center bg-red-100 px-2 py-1 rounded-full">
            <Feather name="x" size={12} color="#DC2626" />
            <Text className="text-red-700 text-xs font-inter-semibold ml-1">Declined</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const PendingOfferCard = ({ offer }: { offer: ExtendedOffer }) => (
    <View className="bg-yellow-50 rounded-lg mb-3 p-4 border border-yellow-200">
      <View className="flex-row gap-3 mb-3">
        <View className="relative">
          <Image
            source={offer.listing?.product_image}
            placeholder={{ blurhash }}
            transition={1000}
            contentFit="cover"
            style={{ width: 100, height: 100, borderRadius: 8 }}
          />
          <View className="absolute top-1 right-1">
            <View className="bg-yellow-100 px-1.5 py-0.5 rounded-full">
              <Feather name="clock" size={10} color="#D97706" />
            </View>
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-base font-inter-semibold text-gray-900 mb-1" numberOfLines={2}>
            {offer.listing?.product_name || offer.productName}
          </Text>
          {offer.listing?.category_name && (
            <View className="bg-gray-100 px-2 py-1 rounded self-start mb-2">
              <Text className="text-xs font-inter-semibold text-gray-700">{offer.listing.category_name}</Text>
            </View>
          )}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-inter-semibold text-gray-600">Original:</Text>
              <Text className="text-sm font-inter-medium text-gray-800 line-through">
                £{offer.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-inter-semibold text-gray-600">Your Offer:</Text>
              <Text className="text-lg font-inter-bold text-green-600">
                £{offer.offerAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          <Text className="text-xs font-inter-semibold text-gray-500">{new Date(offer.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {offer.message && (
        <View className="bg-whtie p-3 rounded-lg mb-3 border border-yellow-100">
          <Text className="text-sm font-inter-bold text-black mb-1">Your Message:</Text>
          <Text className="text-sm font-inter-semibold text-gray-600" numberOfLines={2}>
            {offer.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        className="bg-red-500 py-3 rounded-lg flex-row items-center justify-center"
        onPress={() => handleCancelOffer(offer.id)}
      >
        <Feather name="trash-2" size={16} color="white" />
        <Text className="text-white text-sm font-inter-semibold ml-2">Cancel Offer</Text>
      </TouchableOpacity>
    </View>
  );

  const AcceptedOfferCard = ({ offer }: { offer: ExtendedOffer }) => (
    <View className="bg-green-50 rounded-lg mb-3 p-4 border border-green-200">
      <View className="flex-row gap-3">
        <View className="relative">
          <Image
            source={offer.listing?.product_image}
            placeholder={{ blurhash }}
            transition={1000}
            contentFit="cover"
            style={{ width: 100, height: 100, borderRadius: 8 }}
          />
          <View className="absolute top-1 right-1">
            <View className="bg-green-100 px-1.5 py-0.5 rounded-full">
              <Feather name="check" size={10} color="#059669" />
            </View>
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-base font-inter-medium text-gray-900" numberOfLines={1}>
                {offer.listing?.product_name || offer.productName}
              </Text>
              {offer.listing?.category_name && (
                <View className="bg-white px-2 py-0.5 rounded self-start mt-1">
                  <Text className="text-xs font-inter-semibold text-gray-700">{offer.listing.category_name}</Text>
                </View>
              )}
              <Text className="text-sm font-inter-semibold text-gray-600 mt-1">
                {new Date(offer.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-inter-bold text-gray-900 mb-1">
                £{offer.offerAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <StatusBadge status={offer.status} />
            </View>
          </View>
          {!offer.payment_completed ? (
            <View>
              <View className="bg-red-100 px-2 py-1 rounded-full self-start mb-2">
                <Text className="text-red-700 text-xs font-inter-semibold">Payment Pending</Text>
              </View>
              <TouchableOpacity
                className="bg-black py-2 px-4 rounded-lg flex-row items-center justify-center"
                onPress={() => handlePayNow(offer)}
              >
                <Feather name="credit-card" size={14} color="white" />
                <Text className="text-white text-sm font-inter-semibold ml-2">Pay Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-green-100 px-2 py-1 rounded-full self-start">
              <Text className="text-green-700 text-xs font-inter-semibold">Payment Completed</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const DeclinedOfferCard = ({ offer }: { offer: ExtendedOffer }) => (
    <View className="bg-red-50 rounded-lg mb-3 p-4 border border-red-200">
      <View className="flex-row gap-3">
        <View className="relative">
          <Image
            source={offer.listing?.product_image}
            placeholder={{ blurhash }}
            transition={1000}
            contentFit="cover"
            style={{ width: 100, height: 100, borderRadius: 8 }}
          />
          <View className="absolute top-1 right-1">
            <View className="bg-red-100 px-1.5 py-0.5 rounded-full">
              <Feather name="x" size={10} color="#DC2626" />
            </View>
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-base font-inter-medium text-gray-900" numberOfLines={1}>
                {offer.listing?.product_name || offer.productName}
              </Text>
              {offer.listing?.category_name && (
                <View className="bg-white px-2 py-0.5 rounded self-start mt-1">
                  <Text className="text-xs font-inter-semibold text-gray-700">{offer.listing.category_name}</Text>
                </View>
              )}
              <Text className="text-sm font-inter-semibold text-gray-600 mt-1">
                {new Date(offer.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-inter-bold text-gray-900 mb-1">
                £{offer.offerAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <StatusBadge status={offer.status} />
            </View>
          </View>
          <Pressable
            className="bg-white border border-gray-300 py-2 px-4 rounded-lg"
            onPress={() => setSelectedOffer(offer)}
          >
            <Text className="text-gray-900 text-sm font-inter-semibold text-center">Make New Offer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Offers</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-600 font-inter-semibold text-sm mt-3">Loading your offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Offers</Text>
        </View>
        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#EF4444" size={64} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading offers</Text>
          <Text className="text-gray-600 text-sm font-inter-semibold text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadOffers} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-semibold">Retry</Text>
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
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Offers</Text>
      </View>

      {/* Status Filter Badges */}
      <View className="px-4 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {/* All */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-2 rounded-full ${
                statusFilter === 'all' ? 'bg-black' : 'bg-gray-200'
              }`}
              onPress={() => setStatusFilter('all')}
            >
              <Text
                className={`text-sm font-inter-semibold ${statusFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
              >
                All ({offers.length})
              </Text>
            </TouchableOpacity>

            {/* Pending */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-2 rounded-full border border-yellow-200 ${
                statusFilter === 'pending' ? 'bg-yellow-500' : 'bg-yellow-50'
              }`}
              onPress={() => setStatusFilter('pending')}
            >
              <Text
                className={`text-sm font-inter-semibold ${
                  statusFilter === 'pending' ? 'text-white' : 'text-yellow-500'
                }`}
              >
                {allPendingOffers.length} Pending
              </Text>
            </TouchableOpacity>

            {/* Accepted */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-2 rounded-full border border-green-200 ${
                statusFilter === 'accepted' ? 'bg-green-500' : 'bg-green-50'
              }`}
              onPress={() => setStatusFilter('accepted')}
            >
              <Text
                className={`text-sm font-inter-semibold ${
                  statusFilter === 'accepted' ? 'text-white' : 'text-green-500'
                }`}
              >
                {allAcceptedOffers.length} Accepted
              </Text>
            </TouchableOpacity>

            {/* Declined */}
            <TouchableOpacity
              className={`flex-row items-center px-4 py-2 rounded-full border border-red-200 ${
                statusFilter === 'declined' ? 'bg-red-500' : 'bg-red-50'
              }`}
              onPress={() => setStatusFilter('declined')}
            >
              <Text
                className={`text-sm font-inter-semibold ${statusFilter === 'declined' ? 'text-white' : 'text-red-500'}`}
              >
                {allDeclinedOffers.length} Declined
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Category Filter */}
      {offers.length > 0 && availableCategories.length > 0 && (
        <View className="bg-gray-50 px-4 py-3 border-b border-t border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${categoryFilter === 'all' ? 'bg-black' : 'bg-gray-100'}`}
              onPress={() => setCategoryFilter('all')}
            >
              <Text
                className={`text-sm font-inter-semibold ${categoryFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category}
                className={`mr-2 px-4 py-2 rounded-full ${categoryFilter === category ? 'bg-black' : 'bg-gray-100'}`}
                onPress={() => setCategoryFilter(category)}
              >
                <Text
                  className={`text-sm font-inter-semibold ${
                    categoryFilter === category ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {offers.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <Feather name="tag" size={64} color="#9CA3AF" />
            <Text className="text-xl font-inter-semibold text-gray-900 mt-4">No offers yet</Text>
            <Text className="text-sm font-inter-semibold text-gray-600 text-center mt-2 mb-6">
              Start making offers on products you're interested in
            </Text>
            <TouchableOpacity className="bg-black px-6 py-3 rounded-lg" onPress={() => router.back()}>
              <Text className="text-white font-inter-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : filteredOffers.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <Feather name="filter" size={64} color="#9CA3AF" />
            <Text className="text-xl font-inter-semibold text-gray-900 mt-4">No matching offers</Text>
            <Text className="text-sm font-inter-semibold text-gray-600 text-center mt-2 mb-6">Try adjusting your filters</Text>
            <TouchableOpacity
              className="bg-black px-6 py-3 rounded-lg"
              onPress={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
            >
              <Text className="text-white font-inter-semibold">Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-4">
            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-inter-bold text-yellow-700 mb-3">
                  Pending Offers ({pendingOffers.length})
                </Text>
                {pendingOffers.map((offer) => (
                  <PendingOfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            )}

            {/* Accepted Offers */}
            {acceptedOffers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-inter-bold text-green-700 mb-3">
                  Accepted Offers ({acceptedOffers.length})
                </Text>
                {acceptedOffers.map((offer) => (
                  <AcceptedOfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            )}

            {/* Declined Offers */}
            {declinedOffers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-inter-bold text-red-700 mb-3">
                  Declined Offers ({declinedOffers.length})
                </Text>
                {declinedOffers.map((offer) => (
                  <DeclinedOfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Make Offer Modal for Declined Offers */}
      {selectedOffer && selectedOffer.listing && (
        <MakeOfferModal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          productId={selectedOffer.listing_id}
          productName={selectedOffer.listing.product_name}
          currentPrice={selectedOffer.listing.starting_price}
          sellerId={selectedOffer.seller_id}
          userId={user?.id}
        />
      )}
    </SafeAreaView>
  );
}
