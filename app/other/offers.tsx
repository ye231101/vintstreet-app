import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Offer {
  id: string;
  productName: string;
  sellerName: string;
  originalPrice: number;
  offerPrice: number;
  discount: number;
  status: 'active' | 'expired' | 'accepted' | 'declined';
  expiryDate: string;
  imageUrl?: string;
  description?: string;
}

export default function MyOffersScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const tabs = [
    { key: 'active', label: 'Active Offers' },
    { key: 'expired', label: 'Expired' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
  ];

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
        {
          id: '1',
          productName: 'Vintage Nike Air Jordan 1',
          sellerName: 'SneakerHead_Store',
          originalPrice: 150,
          offerPrice: 120,
          discount: 20,
          status: 'active',
          expiryDate: '2024-02-15',
          description: 'Great condition, worn only a few times',
        },
        {
          id: '2',
          productName: '90s Denim Jacket',
          sellerName: 'RetroFashion',
          originalPrice: 80,
          offerPrice: 65,
          discount: 18.75,
          status: 'expired',
          expiryDate: '2024-01-20',
          description: 'Authentic vintage denim',
        },
        // Add more mock offers as needed
      ];

      setOffers(mockOffers);
    } catch (err) {
      setError('Error loading offers');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredOffers = () => {
    return offers.filter((offer) => offer.status === activeTab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'expired':
        return '#FF9500';
      case 'accepted':
        return '#007AFF';
      case 'declined':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  const OfferCard = ({ offer }: { offer: Offer }) => (
    <View className="bg-gray-800 rounded-xl mb-4 p-4 border border-gray-600">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-poppins-bold text-base mb-1">{offer.productName}</Text>
          <Text className="text-gray-400 text-sm font-poppins mb-2">by {offer.sellerName}</Text>
        </View>
        <View className={`rounded-xl px-2 py-1 bg-[#${getStatusColor(offer.status)}]`}>
          <Text className="text-white text-xs font-poppins-bold">{getStatusText(offer.status).toUpperCase()}</Text>
        </View>
      </View>

      {offer.description && (
        <Text className="text-gray-300 text-sm font-poppins mb-3 leading-5">{offer.description}</Text>
      )}

      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-gray-400 text-xs font-poppins line-through">£{offer.originalPrice.toFixed(2)}</Text>
          <Text className="text-white text-lg font-poppins-bold">£{offer.offerPrice.toFixed(2)}</Text>
        </View>
        <View className="bg-green-500 rounded-lg px-2 py-1">
          <Text className="text-white text-xs font-poppins-bold">{offer.discount}% OFF</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-400 text-xs font-poppins">
          Expires: {new Date(offer.expiryDate).toLocaleDateString()}
        </Text>
        {offer.status === 'active' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Accept Offer', 'Are you sure you want to accept this offer?');
              }}
              className="bg-green-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-poppins-bold">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Decline Offer', 'Are you sure you want to decline this offer?');
              }}
              className="bg-red-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-poppins-bold">Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const OffersList = ({ offers, onRefresh }: { offers: Offer[]; onRefresh: () => void }) => {
    if (offers.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-8 bg-gray-800 rounded-xl m-4 py-12">
          <Feather name="tag" color="#999" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4">No offers yet</Text>
          <Text className="text-gray-400 text-sm font-poppins mt-2 text-center">
            Your received offers will appear here
          </Text>
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
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">My Offers</Text>
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
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">My Offers</Text>
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

        <Text className="flex-1 text-lg font-poppins-bold text-white">My Offers</Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-gray-800 px-4 py-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pr-4">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`${
                activeTab === tab.key ? 'bg-black border-white' : 'bg-gray-600 border-gray-500'
              } py-2 px-4 mr-2 rounded-md border`}
            >
              <Text className={`${activeTab === tab.key ? 'text-white' : 'text-gray-400'} text-sm font-poppins-medium`}>
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
