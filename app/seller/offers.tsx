import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Offer, offersService } from '../../api/services/offers.service';
import { useAuth } from '../../hooks/use-auth';

export default function OffersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const { user } = useAuth();

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
    { key: 'completed', label: 'Completed' },
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
      const fetchedOffers = await offersService.getOffers(user.id, 'seller');
      setOffers(fetchedOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(err instanceof Error ? err.message : 'Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredOffers = () => {
    switch (activeTab) {
      case 'pending': // Pending
        return offers.filter((offer) => offer.status === 'pending');
      case 'accepted': // Accepted
        return offers.filter((offer) => offer.status === 'accepted');
      case 'declined': // Declined
        return offers.filter((offer) => offer.status === 'declined');
      case 'completed': // Completed
        return offers.filter((offer) => offer.status === 'accepted' || offer.status === 'declined');
      default:
        return offers;
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

  const OfferCard = ({ offer }: { offer: Offer }) => (
    <View className="bg-white rounded-xl mb-4 p-4 shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-gray-900 font-inter-bold text-base mb-1">{offer.productName}</Text>
          <Text className="text-gray-600 text-sm font-inter">From {offer.buyerName}</Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${offer.status === 'pending' ? 'bg-orange-500' : 'bg-green-500'}`}>
          <Text className="text-white font-inter-bold text-xs">
            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-gray-600 text-xs font-inter">Original Price</Text>
          <Text className="text-gray-900 text-base font-inter-bold">
            £{offer.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View>
          <Text className="text-gray-600 text-xs font-inter">Offer Amount</Text>
          <Text className="text-green-500 text-base font-inter-bold">
            £{offer.offerAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {offer.message && (
        <View className="bg-gray-100 rounded-lg p-3 mb-3">
          <Text className="text-gray-900 text-sm font-inter">"{offer.message}"</Text>
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <Text className="text-gray-600 text-xs font-inter">Expires: {formatDate(offer.expiresAt)}</Text>
        {offer.status === 'pending' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={async () => {
                try {
                  await offersService.updateOfferStatus(offer.id, 'accepted');
                  Alert.alert('Offer Accepted', 'Offer has been accepted');
                  loadOffers(); // Refresh the offers list
                } catch (error) {
                  Alert.alert('Error', 'Failed to accept offer. Please try again.');
                }
              }}
              className="bg-green-500 rounded px-3 py-1.5"
            >
              <Text className="text-white text-xs font-inter-bold">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await offersService.updateOfferStatus(offer.id, 'declined');
                  Alert.alert('Offer Rejected', 'Offer has been rejected');
                  loadOffers(); // Refresh the offers list
                } catch (error) {
                  Alert.alert('Error', 'Failed to reject offer. Please try again.');
                }
              }}
              className="bg-red-500 rounded px-3 py-1.5"
            >
              <Text className="text-white text-xs font-inter-bold">Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Offers</Text>
      </View>

      <View className="flex-1 bg-gray-50">
        <View className="px-4 border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`py-4 px-5 border-b-2 ${activeTab === tab.key ? 'border-blue-500' : 'border-transparent'}`}
              >
                <Text
                  className={`text-base font-inter-semibold ${
                    activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your orders...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading orders</Text>
            <TouchableOpacity onPress={loadOffers} className="bg-black rounded-lg py-3 px-6">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : getFilteredOffers().length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadOffers} tintColor="#007AFF" />}
            className="flex-1 p-4"
          >
            {getFilteredOffers().map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="shopping-bag" color="#666" size={64} />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4">No orders found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
