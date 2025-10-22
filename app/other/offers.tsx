import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Offer, offersService } from '../../api/services/offers.service';
import { useAuth } from '../../hooks/use-auth';

// Interfaces are now imported from the offers service

export default function MyOffersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const { user } = useAuth();

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
    { key: 'expired', label: 'Expired' },
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
      // Fetch offers from the API for the buyer
      const fetchedOffers = await offersService.getOffers(user.id, 'buyer');
      setOffers(fetchedOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(err instanceof Error ? err.message : 'Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredOffers = () => {
    return offers.filter((offer) => offer.status === activeTab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'expired':
        return '#999';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const OfferCard = ({ offer }: { offer: Offer }) => (
    <View className="bg-white rounded-xl mb-4 p-4 border border-gray-200 shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-gray-900 font-inter-bold text-base mb-1">{offer.productName}</Text>
          <Text className="text-gray-600 text-sm font-inter mb-2">by {offer.buyerName}</Text>
        </View>
        <View className={`rounded-xl px-2 py-1`} style={{ backgroundColor: getStatusColor(offer.status) }}>
          <Text className="text-white text-xs font-inter-bold">{getStatusText(offer.status).toUpperCase()}</Text>
        </View>
      </View>

      {offer.message && (
        <Text className="text-gray-600 text-sm font-inter mb-3 leading-5">"{offer.message}"</Text>
      )}

      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-gray-600 text-xs font-inter line-through">£{offer.originalPrice.toFixed(2)}</Text>
          <Text className="text-gray-900 text-lg font-inter-bold">£{offer.offerAmount.toFixed(2)}</Text>
        </View>
        <View className="bg-green-500 rounded-lg px-2 py-1">
          <Text className="text-white text-xs font-inter-bold">
            {Math.round(((offer.originalPrice - offer.offerAmount) / offer.originalPrice) * 100)}% OFF
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-600 text-xs font-inter">
          Expires: {new Date(offer.expiresAt).toLocaleDateString()}
        </Text>
        {offer.status === 'pending' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Offer Status', 'This offer is pending seller response');
              }}
              className="bg-gray-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-inter-bold">Waiting</Text>
            </TouchableOpacity>
          </View>
        )}
        {offer.status === 'accepted' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Offer Accepted', 'Congratulations! Your offer has been accepted');
              }}
              className="bg-green-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-inter-bold">View Details</Text>
            </TouchableOpacity>
          </View>
        )}
        {offer.status === 'declined' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Offer Declined', 'This offer was declined by the seller');
              }}
              className="bg-red-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-inter-bold">Declined</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const OffersList = ({ offers, onRefresh }: { offers: Offer[]; onRefresh: () => void }) => {
    if (offers.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-8">
          <Feather name="tag" color="#666" size={64} />
          <Text className="text-gray-900 text-lg font-inter-medium mt-4">No offers found</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#007AFF" />}
        className="flex-1 p-4"
      >
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Offers</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Offers</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading offers</Text>
          <Text className="text-gray-600 text-sm font-inter text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadOffers} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
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
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Offers</Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-gray-50 px-4 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`py-4 px-5 border-b-2 ${activeTab === tab.key ? 'border-blue-500' : 'border-transparent'}`}
            >
              <Text className={`text-base font-inter ${activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Offers List */}
      <OffersList offers={getFilteredOffers()} onRefresh={loadOffers} />
    </SafeAreaView>
  );
}
