import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  productName: string;
  productImage?: string;
  dateCreated: string;
  isVerified: boolean;
}

export default function ReviewsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(4.2);
  const [totalSales, setTotalSales] = useState(500);
  const [sortFilter, setSortFilter] = useState('low-to-high');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      const mockReviews: Review[] = [
        {
          id: '1',
          customerName: 'Max Hughes',
          customerAvatar: '',
          rating: 3,
          comment:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
          productName: '90s Jacket',
          productImage: '',
          dateCreated: '2026-10-01T00:00:00Z',
          isVerified: true,
        },
        {
          id: '2',
          customerName: 'Max Hughes',
          customerAvatar: '',
          rating: 3,
          comment:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
          productName: '90s Jacket',
          productImage: '',
          dateCreated: '2026-10-01T00:00:00Z',
          isVerified: true,
        },
      ];

      setReviews(mockReviews);
      setAverageRating(4.2);
      setTotalSales(500);
    } catch (err) {
      setError('Error loading reviews');
    } finally {
      setIsLoading(false);
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

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather key={i} name="star" size={size} color={i <= rating ? '#FFD700' : '#E0E0E0'} className="mr-0.5" />
      );
    }
    return stars;
  };

  const ReviewCard = ({ review }: { review: Review }) => (
    <View className="mb-4">
      {/* Product Name */}
      <Text className="text-white font-poppins-bold text-base mb-2">{review.productName}</Text>

      {/* Reviewer and Date */}
      <View className="flex-row items-center mb-2">
        <View className="w-5 h-5 rounded-full bg-gray-600 mr-2 justify-center items-center">
          <Feather name="user" color="#fff" size={12} />
        </View>
        <Text className="text-gray-400 text-sm font-poppins">
          {review.customerName} on {formatDate(review.dateCreated)}
        </Text>
      </View>

      {/* Star Rating */}
      <View className="flex-row items-center mb-3">{renderStars(review.rating, 16)}</View>

      {/* Review Comment */}
      <Text className="text-white text-sm font-poppins leading-5">{review.comment}</Text>

      {/* Divider */}
      <View className="h-px bg-gray-600 mt-4" />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">Reviews</Text>
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

          <Text className="flex-1 text-lg font-poppins-bold text-white">Reviews</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4 mb-2">Error loading reviews</Text>
          <Text className="text-gray-400 text-sm font-poppins text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadReviews} className="bg-blue-500 rounded-lg py-3 px-6">
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

        <Text className="flex-1 text-lg font-poppins-bold text-white">Reviews</Text>
      </View>

      {/* Overall Rating Section */}
      <View className="items-center py-6 bg-black">
        <Text className="text-white text-5xl font-poppins-bold mb-2">{averageRating}</Text>

        <View className="flex-row mb-2">{renderStars(Math.floor(averageRating), 24)}</View>

        <Text className="text-gray-400 text-sm font-poppins">{totalSales} sales</Text>
      </View>

      {/* Filter Buttons */}
      <View className="flex-row px-4 py-3 bg-black">
        <TouchableOpacity
          onPress={() => setSortFilter('all')}
          className={`border border-white rounded py-2 px-4 mr-2 ${
            sortFilter === 'all' ? 'bg-black' : 'bg-transparent'
          }`}
        >
          <Text className="text-white text-sm font-poppins-medium">All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortFilter('high-to-low')}
          className={`border border-white rounded py-2 px-4 mr-2 ${
            sortFilter === 'high-to-low' ? 'bg-black' : 'bg-transparent'
          }`}
        >
          <Text className="text-white text-sm font-poppins-medium">High to low</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortFilter('low-to-high')}
          className={`border border-white rounded py-2 px-4 ${
            sortFilter === 'low-to-high' ? 'bg-white' : 'bg-transparent'
          }`}
        >
          <Text className={`text-sm font-poppins-medium ${sortFilter === 'low-to-high' ? 'text-black' : 'text-white'}`}>
            Low to high
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReviews} tintColor="#007AFF" />}
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
