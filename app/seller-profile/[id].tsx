import { listingsService, Product, Review, reviewsService, ReviewStats, Stream } from '@/api';
import { supabase } from '@/api/config/supabase';
import { ContactModal } from '@/components/contact-modal';
import { useAppSelector } from '@/store/hooks';
import { showInfoToast, showWarningToast } from '@/utils/toast';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SellerProfile {
  user_id: string;
  shop_name: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio?: string;
  location?: string;
  joined_date?: string;
  display_name_format?: string;
}

export default function SellerProfileScreen() {
  const router = useRouter();
  const { id: sellerId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<Stream[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'shows' | 'reviews'>('products');
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Review submission state
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    if (!sellerId) return;

    try {
      setIsLoading(true);

      // Load seller profile
      const { data: seller, error: sellerError } = await supabase
        .from('seller_info_view')
        .select('*')
        .eq('user_id', sellerId)
        .single();

      if (sellerError) throw sellerError;
      setSellerProfile(seller as unknown as SellerProfile);

      // Load seller products
      const products = await listingsService.getSellerListings(sellerId);
      setSellerProducts(products.filter((p) => p.status === 'published'));

      // Load upcoming shows
      const { data: streams, error: streamsError } = await supabase
        .from('streams')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true });

      if (!streamsError && streams) {
        setUpcomingShows(streams as unknown as Stream[]);
      }

      // Load reviews and stats
      const reviewsData = await reviewsService.getReviews(sellerId);
      const stats = await reviewsService.getReviewStats(sellerId);

      // Check if user has already reviewed (for showing separately)
      if (user?.id) {
        const userReviewData = reviewsData.find((r: any) => r.buyer_id === user.id);
        setUserReview(userReviewData || null);
      } else {
        setUserReview(null);
      }

      // Show ALL reviews (including user's own)
      setReviews(reviewsData);
      setReviewStats(stats);

      // Check if following (if user is logged in)
      if (user?.id) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('followed_user_id', sellerId)
          .maybeSingle();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?.id || !sellerId) {
      showInfoToast('Please sign in to follow sellers');
      return;
    }

    const action = isFollowing ? 'unfollow' : 'follow';

    try {
      if (action === 'follow') {
        const { error } = await supabase.from('user_follows').insert({
          follower_id: user.id,
          followed_user_id: sellerId,
        });

        if (error) throw error;
        setIsFollowing(true);
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_user_id', sellerId);

        if (error) throw error;
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      showWarningToast('Failed to update follow status');
    }
  };

  const handleMessageSeller = () => {
    if (!user?.id) {
      showInfoToast('Please sign in to send messages');
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!user?.id || !sellerId) return;

    try {
      setIsSubmittingReview(true);

      await supabase.from('reviews').insert({
        seller_id: sellerId,
        buyer_id: user.id,
        rating: newReviewRating,
        comment: newReviewComment,
      });

      // Reload reviews
      const reviewsData = await reviewsService.getReviews(sellerId);
      const stats = await reviewsService.getReviewStats(sellerId);

      // Check if user has already reviewed (for showing separately)
      if (user?.id) {
        const userReviewData = reviewsData.find((r: any) => r.buyer_id === user.id);
        setUserReview(userReviewData || null);
      } else {
        setUserReview(null);
      }

      // Show ALL reviews (including user's own)
      setReviews(reviewsData);
      setReviewStats(stats);

      // Reset form
      setNewReviewRating(5);
      setNewReviewComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-border'}
            size={size}
            color="#EAB308"
          />
        ))}
      </View>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <Pressable className="w-1/2 p-2" onPress={() => router.push(`/product/${item.id}` as any)}>
      <View className="bg-white rounded-lg overflow-hidden border border-gray-200">
        {item.product_image ? (
          <Image
            source={{ uri: item.product_image }}
            className="w-full"
            style={{ aspectRatio: 1 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full bg-gray-100" style={{ aspectRatio: 1 }} />
        )}
        <View className="p-2">
          <Text className="text-sm font-inter-semibold text-gray-800" numberOfLines={2}>
            {item.product_name}
          </Text>
          <Text className="text-base font-inter-semibold text-black mt-1">
            £
            {Number(item.starting_price).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View className="bg-white p-4 mb-3 rounded-lg border border-gray-200">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-inter-semibold text-gray-800">{item.customerName}</Text>
        {renderStars(item.rating, 16)}
      </View>
      <Text className="text-sm font-inter-semibold text-gray-700 leading-5 mb-2">{item.comment}</Text>
      <Text className="text-xs font-inter-semibold text-gray-500">
        {new Date(item.dateCreated).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        })}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-sm font-inter-semibold text-gray-600 mt-3">Loading seller profile...</Text>
      </View>
    );
  }

  if (!sellerProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Feather name="user-x" size={64} color="#999" />
        <Text className="text-xl font-inter-bold text-gray-800 mt-4">Seller Not Found</Text>
        <Text className="text-sm font-inter-semibold text-gray-600 mt-2 text-center">
          This seller profile doesn't exist or has been removed.
        </Text>
        <Pressable className="bg-black px-6 py-3 rounded-lg mt-4" onPress={() => router.back()}>
          <Text className="text-white text-sm font-inter-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = sellerProfile.shop_name || sellerProfile.full_name || sellerProfile.username;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className="flex-1 bg-gray-50">
        {/* Header Section */}
        <View className="bg-white px-4 py-6 border-b border-gray-200">
          <View className="flex-row items-start">
            {/* Avatar */}
            <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mr-4">
              {sellerProfile.avatar_url ? (
                <Image source={{ uri: sellerProfile.avatar_url }} className="w-20 h-20 rounded-full" />
              ) : (
                <Text className="text-2xl font-inter-bold text-gray-700">{displayName.charAt(0).toUpperCase()}</Text>
              )}
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="text-xl font-inter-bold text-gray-800">{displayName}</Text>
              {sellerProfile.username && (
                <Text className="text-sm font-inter-semibold text-gray-500 mt-1">@{sellerProfile.username}</Text>
              )}
              {sellerProfile.bio && <Text className="text-sm font-inter-semibold text-gray-700 mt-2">{sellerProfile.bio}</Text>}

              {/* Stats */}
              <View className="flex-row items-center mt-3">
                {renderStars(reviewStats?.averageRating || 0, 16)}
                <Text className="text-sm font-inter-semibold text-gray-600 ml-2">
                  {reviewStats?.averageRating?.toFixed(1) || '0.0'} ({reviewStats?.totalReviews || 0} reviews)
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row mt-4 gap-2">
            {user?.id && user.id !== sellerId && (
              <>
                <Pressable
                  className={`flex-1 py-3 rounded-lg ${isFollowing ? 'bg-gray-200' : 'bg-black'}`}
                  onPress={handleFollowToggle}
                >
                  <Text
                    className={`text-center text-sm font-inter-semibold ${
                      isFollowing ? 'text-gray-800' : 'text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
                <Pressable className="flex-1 py-3 rounded-lg border border-gray-300" onPress={handleMessageSeller}>
                  <Text className="text-center text-sm font-inter-semibold text-gray-800">Message</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row">
            <Pressable
              className={`flex-1 py-4 ${activeTab === 'products' ? 'border-b-2 border-black' : ''}`}
              onPress={() => setActiveTab('products')}
            >
              <Text
                className={`text-center text-sm font-inter-semibold ${
                  activeTab === 'products' ? 'font-inter-semibold text-black' : 'text-gray-600'
                }`}
              >
                Products ({sellerProducts.length})
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-4 ${activeTab === 'shows' ? 'border-b-2 border-black' : ''}`}
              onPress={() => setActiveTab('shows')}
            >
              <Text
                className={`text-center text-sm font-inter-semibold ${
                  activeTab === 'shows' ? 'font-inter-semibold text-black' : 'text-gray-600'
                }`}
              >
                Shows
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-4 ${activeTab === 'reviews' ? 'border-b-2 border-black' : ''}`}
              onPress={() => setActiveTab('reviews')}
            >
              <Text
                className={`text-center text-sm font-inter-semibold ${
                  activeTab === 'reviews' ? 'font-inter-semibold text-black' : 'text-gray-600'
                }`}
              >
                Reviews ({reviews.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'products' ? (
          <View className="p-2">
            {sellerProducts.length > 0 ? (
              <FlatList
                data={sellerProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Feather name="shopping-bag" size={48} color="#999" />
                <Text className="text-base font-inter-semibold text-gray-600 mt-3">No products available</Text>
              </View>
            )}
          </View>
        ) : activeTab === 'shows' ? (
          <View className="p-4">
            {/* Upcoming Shows Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-inter-semibold text-gray-900">Upcoming Shows</Text>
              {upcomingShows.length > 0 && (
                <Pressable>
                  <Text className="text-sm font-inter-semibold text-gray-600">View All</Text>
                </Pressable>
              )}
            </View>

            {/* Shows List or Empty State */}
            {upcomingShows.length > 0 ? (
              <View>
                {upcomingShows.map((show) => (
                  <Pressable
                    key={show.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 mb-3"
                    onPress={() => router.push(`/stream/${show.id}` as any)}
                  >
                    {show.thumbnail && (
                      <Image
                        source={{ uri: show.thumbnail }}
                        className="w-full h-40 rounded-lg mb-3"
                        resizeMode="cover"
                      />
                    )}
                    <Text className="text-base font-inter-semibold text-gray-900 mb-1">{show.title}</Text>
                    {show.description && (
                      <Text className="text-sm font-inter-semibold text-gray-600 mb-2" numberOfLines={2}>
                        {show.description}
                      </Text>
                    )}
                    <View className="flex-row items-center">
                      <Feather name="calendar" size={14} color="#666" />
                      <Text className="text-xs font-inter-semibold text-gray-500 ml-1">
                        {new Date(show.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-16">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                  <Feather name="calendar" size={32} color="#999" />
                </View>
                <Text className="text-base font-inter-semibold text-gray-600">No upcoming shows</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="p-4">
            {/* Review Form - Only show if user hasn't reviewed yet */}
            {user?.id && user.id !== sellerId && !userReview && (
              <View className="bg-white p-6 rounded-lg border border-gray-200 mb-4">
                <Text className="text-lg font-inter-semibold text-gray-900 mb-4">Leave a Review</Text>

                {/* Rating Label */}
                <Text className="text-sm font-inter-semibold text-gray-600 mb-2">Rating</Text>

                {/* Star Rating */}
                <View className="flex-row mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setNewReviewRating(star)} className="mr-1">
                      <MaterialIcons
                        name={star <= newReviewRating ? 'star' : 'star-border'}
                        size={36}
                        color="#EAB308"
                      />
                    </Pressable>
                  ))}
                </View>

                {/* Comment Label */}
                <Text className="text-sm font-inter-semibold text-gray-600 mb-2">Comment</Text>

                {/* Comment */}
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 mb-4 h-28 bg-gray-50"
                  placeholder="Share your experience..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={newReviewComment}
                  onChangeText={setNewReviewComment}
                />

                {/* Submit Button */}
                <Pressable
                  className="w-full py-4 rounded-lg bg-black"
                  onPress={handleSubmitReview}
                  disabled={isSubmittingReview || !newReviewComment.trim()}
                >
                  <Text className="text-center text-sm font-inter-semibold text-white">
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Reviews Header */}
            {reviews.length > 0 && (
              <Text className="text-lg font-inter-semibold text-gray-900 mb-4">Reviews ({reviews.length})</Text>
            )}

            {/* All Reviews List (including user's) */}
            {reviews.length > 0 ? (
              reviews.map((review) => <View key={review.id}>{renderReviewItem({ item: review })}</View>)
            ) : (
              <View className="items-center justify-center py-12">
                <MaterialIcons name="rate-review" size={48} color="#999" />
                <Text className="text-base font-inter-semibold text-gray-600 mt-3">No reviews yet</Text>
              </View>
            )}

            {/* User's Review Section */}
            {userReview && (
              <View className="mt-4">
                <Text className="text-lg font-inter-semibold text-gray-900 mb-4">Your Review</Text>
                <View className="bg-white p-4 rounded-lg border border-gray-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-inter-semibold text-gray-800">{userReview.customerName}</Text>
                    {renderStars(userReview.rating, 16)}
                  </View>
                  <Text className="text-sm font-inter-semibold text-gray-700 leading-5 mb-2">{userReview.comment}</Text>
                  <Text className="text-xs font-inter-semibold text-gray-500">
                    {new Date(userReview.dateCreated).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* About, Contact, Location Section */}
        <View className="p-4">
          {/* About */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Feather name="user" size={18} color="#000" />
              <Text className="text-base font-inter-semibold text-gray-900 ml-2">About</Text>
            </View>
            <Text className="text-sm font-inter-semibold text-gray-600">{sellerProfile.shop_name || displayName}</Text>
          </View>

          {/* Contact */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Feather name="mail" size={18} color="#000" />
              <Text className="text-base font-inter-semibold text-gray-900 ml-2">Contact</Text>
            </View>
            <Pressable onPress={handleMessageSeller}>
              <Text className="text-sm font-inter-semibold text-blue-600">Contact via message</Text>
            </Pressable>
          </View>

          {/* Location */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Feather name="map-pin" size={18} color="#000" />
              <Text className="text-base font-inter-semibold text-gray-900 ml-2">Location</Text>
            </View>
            <Text className="text-sm font-inter-semibold text-gray-600">
              {sellerProfile.location || 'Location not specified'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Contact Seller Modal */}
      <ContactModal
        visible={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        order={null}
        product={null}
        mode="buyer"
      />
    </SafeAreaView>
  );
}
