import { offersService } from '@/api/services';
import { Offer, Product } from '@/api/types';
import { MakeOfferModal } from '@/components/make-offer-modal';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyOffersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const { user } = useAuth();

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
  ];

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
      // Fetch offers from the API
      const fetchedOffers = await offersService.getOffers(user.id, 'buyer');
      setOffers(fetchedOffers);
    } catch (err) {
      logger.error('Error loading offers:', err);
      setError(err instanceof Error ? err.message : 'Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredOffers = () => {
    switch (activeTab) {
      case 'pending':
        return offers.filter((offer) => offer.status === 'pending');
      case 'accepted':
        return offers.filter((offer) => offer.status === 'accepted');
      case 'declined':
        return offers.filter((offer) => offer.status === 'declined');
      case 'completed':
        return offers.filter((offer) => offer.status === 'accepted' || offer.status === 'declined');
      default:
        return offers;
    }
  };

  const getTabCount = (key: string) => {
    switch (key) {
      case 'all':
        return offers.length;
      case 'pending':
        return offers.filter((o) => o.status === 'pending').length;
      case 'accepted':
        return offers.filter((o) => o.status === 'accepted').length;
      case 'declined':
        return offers.filter((o) => o.status === 'declined').length;
      default:
        return 0;
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

  const handlePayNow = async (offerId: string) => {
    // try {
    //   await offersService.updateOfferStatus(offerId, 'paid');
    //   showSuccessToast('Offer paid successfully');
    //   loadOffers();
    // } catch (error) {
    //   showErrorToast('Failed to pay for offer. Please try again.');
    // }
  };

  const handleMakeNewOffer = async (offer: Offer) => {
    if (!offer.listings) {
      showErrorToast('Unable to make a new offer. Missing product information.');
      return;
    }
    setSelectedOffer(offer);
    setIsOfferModalOpen(true);
  };

  const handleCancelOffer = async (offerId: string) => {
    try {
      await offersService.deleteOffer(offerId);
      showSuccessToast('Offer cancelled successfully');
      loadOffers();
    } catch (error) {
      showErrorToast('Failed to cancel offer. Please try again.');
    }
  };

  const OfferCard = ({ offer }: { offer: Offer }) => {
    const productName = offer.listings?.product_name || 'Product';
    const originalPrice = offer.listings?.discounted_price || offer.listings?.starting_price;
    const expiresAt = offer.expires_at || new Date().toISOString();
    const productImage = offer.listings?.product_image;

    return (
      <View className="bg-white rounded-lg mb-4 p-4 shadow-lg">
        <View className="flex-row mb-3">
          {/* Product Image */}
          <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 mr-3">
            <Image
              source={productImage}
              contentFit="cover"
              placeholder={{ blurhash }}
              transition={1000}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          {/* Product Info */}
          <View className="flex-1 gap-2">
            <View className="flex-row justify-between items-start gap-2">
              <Text className="text-gray-900 font-inter-bold text-base flex-1" numberOfLines={2}>
                {productName}
              </Text>
              <View
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: `#${offer.status_color.toString(16).padStart(6, '0')}` }}
              >
                <Text className="text-white font-inter-bold text-xs">
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </Text>
              </View>
            </View>

            <View className="flex-1">
              <View className="flex-row justify-between items-center gap-2">
                <Text className="text-gray-600 text-sm font-inter">Original Price</Text>
                <Text className="text-gray-900 text-base font-inter-bold">
                  £{originalPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="flex-row justify-between items-center gap-2">
                <Text className="text-gray-600 text-sm font-inter">Your Offer</Text>
                <Text className="text-green-500 text-base font-inter-bold">
                  £{offer.offer_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {offer.message && (
          <View className="bg-gray-100 rounded-lg p-3 mb-3">
            <Text className="text-gray-900 text-sm font-inter">"{offer.message}"</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-gray-600 text-xs font-inter">Expires: {formatDate(expiresAt)}</Text>
          {offer.status === 'pending' && (
            <TouchableOpacity
              onPress={() => handleCancelOffer(offer.id)}
              className="items-center justify-center bg-red-500 rounded px-4 py-2"
            >
              <Text className="text-white text-sm font-inter-bold">Cancel</Text>
            </TouchableOpacity>
          )}
          {offer.status === 'accepted' && (
            <TouchableOpacity
              onPress={() => handlePayNow(offer.id)}
              className="flex-row items-center justify-center gap-2 bg-black rounded px-4 py-2"
            >
              <Feather name="credit-card" size={16} color="#fff" />
              <Text className="text-white text-sm font-inter-bold">Pay Now</Text>
            </TouchableOpacity>
          )}
          {offer.status === 'declined' && (
            <TouchableOpacity
              onPress={() => handleMakeNewOffer(offer)}
              className="flex-row items-center justify-center gap-2 rounded px-4 py-2 bg-white border border-gray-200"
            >
              <Text className="text-black text-sm font-inter-bold">Make New Offer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">My Offers</Text>
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
            <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading your offers...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading offers</Text>
            <TouchableOpacity onPress={loadOffers} className="px-6 py-3 rounded-lg bg-black">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : getFilteredOffers().length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadOffers} />}
            contentContainerStyle={{ flexGrow: 1 }}
            className="p-4"
          >
            {getFilteredOffers().map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="tag" color="#666" size={64} />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4">No offers found</Text>
          </View>
        )}
      </View>

      {/* Make Offer Modal */}
      {selectedOffer?.listings && (
        <MakeOfferModal
          isOpen={isOfferModalOpen}
          onClose={() => {
            setIsOfferModalOpen(false);
            setSelectedOffer(null);
            loadOffers(); // Reload offers after making a new one
          }}
          product={selectedOffer.listings as Product}
        />
      )}
    </SafeAreaView>
  );
}
