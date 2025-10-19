import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Offer {
  id: string;
  buyerName: string;
  productName: string;
  offerAmount: number;
  originalPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
  message?: string;
}

export default function OffersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      const mockOffers: Offer[] = [
        // Empty for now to show empty state
      ];
      setOffers(mockOffers);
    } catch (err) {
      setError('Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredOffers = () => {
    if (activeFilter === 'pending') {
      return offers.filter((offer) => offer.status === 'pending');
    } else {
      return offers.filter((offer) => offer.status === 'accepted' || offer.status === 'rejected');
    }
  };

  const getPendingCount = () => {
    return offers.filter((offer) => offer.status === 'pending').length;
  };

  const getCompletedCount = () => {
    return offers.filter((offer) => offer.status === 'accepted' || offer.status === 'rejected').length;
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
    <View className="bg-gray-700 rounded-xl mb-4 p-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-poppins-bold text-base mb-1">{offer.productName}</Text>
          <Text className="text-gray-400 text-sm font-poppins">From {offer.buyerName}</Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${offer.status === 'pending' ? 'bg-orange-500' : 'bg-green-500'}`}>
          <Text className="text-white font-poppins-bold text-xs">
            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-gray-400 text-xs font-poppins">Original Price</Text>
          <Text className="text-white text-base font-poppins-bold">£{offer.originalPrice.toFixed(2)}</Text>
        </View>
        <View>
          <Text className="text-gray-400 text-xs font-poppins">Offer Amount</Text>
          <Text className="text-green-500 text-base font-poppins-bold">£{offer.offerAmount.toFixed(2)}</Text>
        </View>
      </View>

      {offer.message && (
        <View className="bg-gray-600 rounded-lg p-3 mb-3">
          <Text className="text-white text-sm font-poppins">"{offer.message}"</Text>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <Text className="text-gray-400 text-xs font-poppins">Expires: {formatDate(offer.expiresAt)}</Text>
        {offer.status === 'pending' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Accept Offer', 'Offer has been accepted');
              }}
              className="bg-green-500 rounded px-3 py-1.5"
            >
              <Text className="text-white text-xs font-poppins-bold">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Reject Offer', 'Offer has been rejected');
              }}
              className="bg-red-500 rounded px-3 py-1.5"
            >
              <Text className="text-white text-xs font-poppins-bold">Reject</Text>
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
          <Feather name="heart" color="#999" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4">No offers yet</Text>
          <Text className="text-gray-400 text-sm font-poppins mt-2 text-center">
            Offers from buyers will appear here
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#007AFF" />}
        className="flex-1 pb-4"
      >
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Offers</Text>
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

          <Text className="flex-1 text-lg font-poppins-bold text-white">Offers</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4 mb-2">Error loading offers</Text>
          <Text className="text-gray-400 text-sm font-poppins text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadOffers} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-poppins-bold">Retry</Text>
          </TouchableOpacity>
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

        <Text className="flex-1 text-lg font-poppins-bold text-white">Offers</Text>
      </View>

      {/* Product Offers Section */}
      <View className="bg-black px-4 py-4">
        <View className="flex-row items-center mb-4">
          <Feather name="heart" color="#8B5CF6" size={20} className="mr-2" />
          <Text className="text-white text-base font-poppins-bold flex-1">Product Offers</Text>
        </View>

        {/* Filter Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setActiveFilter('pending')}
            className={`border border-orange-500 rounded-full py-2 px-4 ${
              activeFilter === 'pending' ? 'bg-orange-500' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm font-poppins-medium ${activeFilter === 'pending' ? 'text-white' : 'text-orange-500'}`}
            >
              {getPendingCount()} Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('completed')}
            className={`border border-gray-400 rounded-full py-2 px-4 ${
              activeFilter === 'completed' ? 'bg-gray-400' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm font-poppins-medium ${activeFilter === 'completed' ? 'text-white' : 'text-gray-400'}`}
            >
              {getCompletedCount()} Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offers List */}
      <OffersList offers={getFilteredOffers()} onRefresh={loadOffers} />
    </SafeAreaView>
  );
}
