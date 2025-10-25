import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Review, reviewsService } from '../../api/services/reviews.service';
import { useAuth } from '../../hooks/use-auth';

export default function ReviewsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [sortFilter, setSortFilter] = useState<'all' | 'high-to-low' | 'low-to-high'>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadReviews();
    }
  }, [user?.id]);

  const loadReviews = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch reviews and stats from the API
      const [fetchedReviews, stats] = await Promise.all([
        reviewsService.getReviewsWithSort(user.id, sortFilter),
        reviewsService.getReviewStats(user.id),
      ]);

      setReviews(fetchedReviews);
      setAverageRating(stats.averageRating);
      setTotalSales(stats.totalSales);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err instanceof Error ? err.message : 'Error loading reviews');
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
      <Text className="text-gray-900 font-inter-bold text-base mb-2">{review.productName}</Text>

      {/* Reviewer and Date */}
      <View className="flex-row items-center mb-2">
        <View className="w-5 h-5 rounded-full bg-gray-200 mr-2 justify-center items-center">
          <Feather name="user" color="#666" size={12} />
        </View>
        <Text className="text-gray-600 text-sm font-inter">
          {review.customerName} on {formatDate(review.dateCreated)}
        </Text>
      </View>

      {/* Star Rating */}
      <View className="flex-row items-center mb-3">{renderStars(review.rating, 16)}</View>

      {/* Review Comment */}
      <Text className="text-gray-900 text-sm font-inter-semibold leading-5">{review.comment}</Text>

      {/* Divider */}
      <View className="h-px bg-gray-200 mt-4" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Reviews</Text>
      </View>

      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 justify-center items-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your reviews...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading reviews</Text>
            <TouchableOpacity onPress={loadReviews} className="bg-black rounded-lg py-3 px-6">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : reviews.length > 0 ? (
          <>
            {/* Overall Rating Section */}
            <View className="items-center py-6 bg-gray-50 border-b border-gray-200">
              <Text className="text-gray-900 text-5xl font-inter-bold mb-2">{averageRating}</Text>

              <View className="flex-row mb-2">{renderStars(Math.floor(averageRating), 24)}</View>

              <Text className="text-gray-600 text-sm font-inter">{totalSales} sales</Text>
            </View>

            {/* Filter Buttons */}
            <View className="flex-row px-4 py-3 bg-gray-50 border-b border-gray-200">
              <TouchableOpacity
                onPress={() => setSortFilter('all')}
                className={`border rounded py-2 px-4 mr-2 ${
                  sortFilter === 'all' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-sm font-inter-medium ${sortFilter === 'all' ? 'text-white' : 'text-gray-900'}`}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortFilter('high-to-low')}
                className={`border rounded py-2 px-4 mr-2 ${
                  sortFilter === 'high-to-low' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-inter-medium ${
                    sortFilter === 'high-to-low' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  High to low
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortFilter('low-to-high')}
                className={`border rounded py-2 px-4 ${
                  sortFilter === 'low-to-high' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-inter-medium ${
                    sortFilter === 'low-to-high' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Low to high
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reviews List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReviews} tintColor="#007AFF" />}
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ScrollView>
          </>
        ) : (
          <View className="flex-1 justify-center items-center p-4">
            <Feather name="star" size={64} color="#666" />
            <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">No reviews yet</Text>
            <Text className="text-gray-600 text-sm font-inter-semibold text-center">
              Reviews from customers will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
