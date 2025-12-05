import { reviewsService } from '@/api/services';
import { Review } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [sortFilter, setSortFilter] = useState<'all' | 'high-to-low' | 'low-to-high'>('all');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyBox, setShowReplyBox] = useState<{ [key: string]: boolean }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadReviews();
    }
  }, [user?.id, sortFilter]);

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
      logger.error('Error loading reviews:', err);
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

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return dateString;
    }
  };

  const toggleReplyBox = (reviewId: string) => {
    setShowReplyBox((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const updateReplyText = (reviewId: string, text: string) => {
    setReplyText((prev) => ({
      ...prev,
      [reviewId]: text,
    }));
  };

  const handleReply = async (reviewId: string) => {
    const reply = replyText[reviewId]?.trim();
    if (!reply) {
      showErrorToast('Please enter a reply');
      return;
    }

    if (!user?.id) {
      showErrorToast('User not authenticated');
      return;
    }

    setIsSubmittingReply((prev) => ({ ...prev, [reviewId]: true }));

    try {
      const newReply = await reviewsService.postReply(reviewId, user.id, reply);

      // Update the reviews state by adding the new reply to the specific review
      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          if (review.id === reviewId) {
            return {
              ...review,
              replies: [...(review.replies || []), newReply],
            };
          }
          return review;
        })
      );

      // Clear reply text and hide reply box
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
      setShowReplyBox((prev) => ({ ...prev, [reviewId]: false }));

      showSuccessToast('Reply posted successfully!');
    } catch (err) {
      logger.error('Error posting reply:', err);
      showErrorToast('Failed to post reply. Please try again.');
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let starName: 'star' | 'star-half-o' | 'star-o';

      if (rating >= i) {
        // Full star
        starName = 'star';
      } else if (Math.ceil(rating) >= i) {
        // Half star
        starName = 'star-half-o';
      } else {
        // Empty star
        starName = 'star-o';
      }

      stars.push(<FontAwesome key={i} name={starName} size={size} color="#FFD700" className="mr-0.5" />);
    }
    return stars;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">Reviews</Text>
      </View>

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center p-4">
            <ActivityIndicator size="large" color="#000" />
            <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading your reviews...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Feather name="alert-circle" color="#ff4444" size={64} />
            <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading reviews</Text>
            <TouchableOpacity onPress={loadReviews} className="px-6 py-3 rounded-lg bg-black">
              <Text className="text-base font-inter-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : reviews.length > 0 ? (
          <>
            {/* Overall Rating Section */}
            <View className="items-center py-6 border-b border-gray-200">
              <Text className="text-gray-900 text-5xl font-inter-bold mb-2">{averageRating}</Text>

              <View className="flex-row mb-2">{renderStars(averageRating, 24)}</View>

              <Text className="text-gray-600 text-sm font-inter">{totalSales} sales</Text>
            </View>

            {/* Filter Buttons */}
            <View className="flex-row px-4 py-3 border-b border-gray-200">
              <TouchableOpacity
                onPress={() => setSortFilter('all')}
                className={`border rounded py-2 px-4 mr-2 ${
                  sortFilter === 'all' ? 'bg-black border-black' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-sm font-inter-medium ${sortFilter === 'all' ? 'text-white' : 'text-gray-900'}`}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortFilter('high-to-low')}
                className={`border rounded py-2 px-4 mr-2 ${
                  sortFilter === 'high-to-low' ? 'bg-black border-black' : 'bg-white border-gray-300'
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
                  sortFilter === 'low-to-high' ? 'bg-black border-black' : 'bg-white border-gray-300'
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
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReviews} />}
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
            >
              {reviews.map((review) => (
                <View key={review.id} className="mb-4">
                  {/* Reviewer and Date */}
                  <View className="flex-row items-center mb-2">
                    {review.customerAvatar ? (
                      <Image
                        source={{ uri: review.customerAvatar }}
                        className="w-12 h-12 rounded-full mr-2"
                        style={{ backgroundColor: '#e5e7eb' }}
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-gray-200 mr-2 items-center justify-center">
                        <Feather name="user" color="#666" size={24} />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-gray-600 text-sm font-inter">{review.customerName}</Text>
                      <Text className="text-gray-600 text-sm font-inter">{formatDateTime(review.dateCreated)}</Text>
                    </View>
                  </View>

                  {/* Star Rating */}
                  <View className="flex-row items-center mb-3">{renderStars(review.rating, 16)}</View>

                  {/* Review Comment */}
                  <Text className="text-gray-900 text-sm font-inter-semibold leading-5">{review.comment}</Text>

                  {/* Existing Replies */}
                  {review.replies && review.replies.length > 0 && (
                    <View className="mt-4 pl-4 border-l-2 border-gray-300">
                      {review.replies.map((reply) => (
                        <View key={reply.id} className="bg-blue-50 rounded-lg p-3 my-1">
                          <View className="flex-row items-center mb-2">
                            <View className="w-5 h-5 rounded-full bg-blue-200 mr-2 items-center justify-center">
                              <Feather name="corner-down-right" size={12} color="#3b82f6" />
                            </View>
                            <Text className="text-sm font-inter-semibold text-gray-900">You replied</Text>
                            <Text className="text-xs text-gray-600 ml-2">{formatDate(reply.created_at)}</Text>
                          </View>
                          <Text className="text-sm font-inter text-gray-800 pl-7">{reply.reply_text}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Reply Section */}
                  {(!review.replies || review.replies.length === 0) && (
                    <View className="mt-4 pt-4 border-t border-gray-200">
                      {!showReplyBox[review.id] ? (
                        <TouchableOpacity
                          onPress={() => toggleReplyBox(review.id)}
                          className="flex-row items-center bg-black rounded-lg py-2 px-4 self-start"
                        >
                          <Feather name="corner-down-right" size={16} color="#fff" />
                          <Text className="text-white text-sm font-inter-medium ml-2">Reply to Review</Text>
                        </TouchableOpacity>
                      ) : (
                        <View>
                          <TextInput
                            placeholder="Write your reply..."
                            value={replyText[review.id] || ''}
                            onChangeText={(text) => updateReplyText(review.id, text)}
                            multiline
                            numberOfLines={3}
                            className="border border-gray-300 rounded-lg p-3 text-sm font-inter text-gray-900 mb-3"
                            style={{ minHeight: 80, textAlignVertical: 'top' }}
                          />
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => handleReply(review.id)}
                              disabled={!replyText[review.id]?.trim() || isSubmittingReply[review.id]}
                              className={`flex-row items-center rounded-lg py-2 px-4 ${
                                !replyText[review.id]?.trim() || isSubmittingReply[review.id]
                                  ? 'bg-gray-300'
                                  : 'bg-black'
                              }`}
                            >
                              {isSubmittingReply[review.id] ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Feather name="send" size={16} color="#fff" />
                              )}
                              <Text className="text-white text-sm font-inter-medium ml-2">
                                {isSubmittingReply[review.id] ? 'Posting...' : 'Post Reply'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => toggleReplyBox(review.id)}
                              className="border border-gray-300 rounded-lg py-2 px-4"
                            >
                              <Text className="text-gray-900 text-sm font-inter-medium">Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Divider */}
                  <View className="h-px bg-gray-200 mt-4" />
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <View className="flex-1 items-center justify-center p-4">
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
