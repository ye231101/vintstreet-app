import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Review, reviewsService } from '../../api/services/reviews.service';
import { useAuth } from '../../hooks/use-auth';

// Interfaces are now imported from the reviews service

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
      <Text className="text-white font-inter-bold text-base mb-2">{review.productName}</Text>

      {/* Reviewer and Date */}
      <View className="flex-row items-center mb-2">
        <View className="w-5 h-5 rounded-full bg-gray-600 mr-2 justify-center items-center">
          <Feather name="user" color="#fff" size={12} />
        </View>
        <Text className="text-gray-400 text-sm font-inter">
          {review.customerName} on {formatDate(review.dateCreated)}
        </Text>
      </View>

      {/* Star Rating */}
      <View className="flex-row items-center mb-3">{renderStars(review.rating, 16)}</View>

      {/* Review Comment */}
      <Text className="text-white text-sm font-inter leading-5">{review.comment}</Text>

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

          <Text className="flex-1 text-lg font-inter-bold text-white">Reviews</Text>
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

          <Text className="flex-1 text-lg font-inter-bold text-white">Reviews</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-white text-lg font-inter-bold mt-4 mb-2">Error loading reviews</Text>
          <Text className="text-gray-400 text-sm font-inter text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadReviews} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
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

        <Text className="flex-1 text-lg font-inter-bold text-white">Reviews</Text>
      </View>

      {reviews.length === 0 ? (
        <View className="flex-1 justify-center items-center py-20">
          {/* Large outlined star icon */}
          <Feather name="star" size={64} color="#666666" style={{ marginBottom: 24 }} />

          {/* Primary text */}
          <Text className="text-gray-400 text-lg font-inter-bold mb-2">No reviews yet</Text>

          {/* Secondary text */}
          <Text className="text-gray-400 text-sm font-inter text-center">Reviews from customers will appear here</Text>
        </View>
      ) : (
        <>
          {/* Overall Rating Section */}
          <View className="items-center py-6 bg-black">
            <Text className="text-white text-5xl font-inter-bold mb-2">{averageRating}</Text>

            <View className="flex-row mb-2">{renderStars(Math.floor(averageRating), 24)}</View>

            <Text className="text-gray-400 text-sm font-inter">{totalSales} sales</Text>
          </View>

          {/* Filter Buttons */}
          <View className="flex-row px-4 py-3 bg-black">
            <TouchableOpacity
              onPress={() => setSortFilter('all')}
              className={`border border-white rounded py-2 px-4 mr-2 ${
                sortFilter === 'all' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text className={`text-sm font-inter-medium ${sortFilter === 'all' ? 'text-black' : 'text-white'}`}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortFilter('high-to-low')}
              className={`border border-white rounded py-2 px-4 mr-2 ${
                sortFilter === 'high-to-low' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-inter-medium ${sortFilter === 'high-to-low' ? 'text-black' : 'text-white'}`}
              >
                High to low
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortFilter('low-to-high')}
              className={`border border-white rounded py-2 px-4 ${
                sortFilter === 'low-to-high' ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-inter-medium ${sortFilter === 'low-to-high' ? 'text-black' : 'text-white'}`}
              >
                Low to high
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reviews List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReviews} tintColor="#007AFF" />}
            className="flex-1 p-4"
          >
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
