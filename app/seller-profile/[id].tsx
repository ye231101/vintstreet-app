import {
  authService,
  listingsService,
  Product,
  Review,
  reviewsService,
  ReviewStats,
  sellerService,
  Stream,
  streamsService,
} from '@/api';
import { ContactModal } from '@/components/contact-modal';
import { useAppSelector } from '@/store/hooks';
import { blurhash } from '@/utils';
import { showInfoToast, showWarningToast } from '@/utils/toast';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

  // Pagination state
  const PRODUCTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  useEffect(() => {
    if (activeTab === 'products' && sellerId) {
      loadProducts();
    }
  }, [currentPage, sellerId, activeTab]);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const loadSellerData = async () => {
    if (!sellerId) return;

    try {
      setIsLoading(true);

      // Load complete seller profile with user data
      const { sellerProfile: sellerProfileData, userProfile } = await sellerService.getCompleteSellerProfile(sellerId);

      const sellerProfile: SellerProfile = {
        user_id: sellerId,
        shop_name: sellerProfileData?.shop_name || '',
        full_name: userProfile?.full_name || '',
        username: userProfile?.username || '',
        avatar_url: userProfile?.avatar_url || null,
        bio: userProfile?.bio || '',
        location: '', // This field doesn't exist in current schema
        joined_date: userProfile?.created_at || '',
        display_name_format: sellerProfileData?.display_name_format || 'shop_name',
      };
      setSellerProfile(sellerProfile);

      // Load upcoming shows
      const streams = await streamsService.getSellerStreams(sellerId);
      const upcomingStreams = streams.filter((stream) => stream.status === 'scheduled');
      setUpcomingShows(upcomingStreams);

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
        const following = await authService.isFollowing(user.id, sellerId);
        setIsFollowing(following);
      }
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!sellerId) return;

    try {
      setIsLoadingProducts(true);
      const pageOffset = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const result = await listingsService.getSellerListingsInfinite(sellerId, pageOffset, PRODUCTS_PER_PAGE);

      setSellerProducts(result.products);
      setTotalProducts(result.total || 0);

      // Calculate total pages
      if (result.total !== undefined) {
        setTotalPages(Math.max(1, Math.ceil(result.total / PRODUCTS_PER_PAGE)));
      } else {
        // If we got fewer products than requested, we're on the last page
        if (result.products.length < PRODUCTS_PER_PAGE) {
          setTotalPages(currentPage);
        } else if (result.nextPage === undefined) {
          setTotalPages(currentPage);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setSellerProducts([]);
    } finally {
      setIsLoadingProducts(false);
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
        await authService.followUser(user.id, sellerId);
        setIsFollowing(true);
      } else {
        await authService.unfollowUser(user.id, sellerId);
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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageInputChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setPageInput(numericValue);
  };

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
  };

  const handleTabChange = (tab: 'products' | 'shows' | 'reviews') => {
    setActiveTab(tab);
    if (tab === 'products' && sellerId) {
      // Reset to page 1 when switching to products tab
      setCurrentPage(1);
    }
  };

  const handleSubmitReview = async () => {
    if (!user?.id || !sellerId) return;

    try {
      setIsSubmittingReview(true);

      await reviewsService.createReview(sellerId, user.id, newReviewRating, newReviewComment);

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
        <Image
          source={item.product_image}
          contentFit="cover"
          placeholder={blurhash}
          transition={1000}
          style={{ width: '100%', aspectRatio: 1 }}
        />
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
    <View className="p-4 mb-3 rounded-lg bg-white border border-gray-200">
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
      <View className="flex-1 items-center justify-center p-4 bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-3 text-sm font-inter-semibold text-gray-600">Loading seller profile...</Text>
      </View>
    );
  }

  if (!sellerProfile) {
    return (
      <View className="flex-1 items-center justify-center p-4 bg-white">
        <Feather name="user-x" size={64} color="#999" />
        <Text className="mt-4 text-xl font-inter-bold text-gray-800">Seller Not Found</Text>
        <Text className="mt-2 text-center text-sm font-inter-semibold text-gray-600">
          This seller profile doesn't exist or has been removed.
        </Text>
        <Pressable className="mt-4 px-6 py-3 rounded-lg bg-black" onPress={() => router.back()}>
          <Text className="text-white text-sm font-inter-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const getPersonalNameDisplay = (fullName: string) => {
    const trimmed = (fullName || '').trim();
    if (!trimmed) return '';
    const parts = trimmed.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    const firstName = parts[0];
    const last = parts[parts.length - 1];
    const initial = last.charAt(0).toUpperCase();
    if (parts.length === 1) return firstName;
    return `${firstName} ${initial}.`;
  };

  const displayName = (() => {
    const pref = sellerProfile.display_name_format || 'shop_name';
    if (pref === 'shop_name' && sellerProfile.shop_name) {
      return sellerProfile.shop_name;
    }
    if (pref === 'personal_name' && sellerProfile.full_name) {
      const personal = getPersonalNameDisplay(sellerProfile.full_name);
      if (personal) return personal;
    }
    return sellerProfile.shop_name || sellerProfile.full_name || sellerProfile.username;
  })();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Section */}
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <View className="flex-row items-start">
            {/* Avatar */}
            <View className="items-center justify-center w-20 h-20 overflow-hidden rounded-full bg-gray-200 mr-4">
              <Image
                source={sellerProfile.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&length=1`}
                contentFit="cover"
                placeholder={blurhash}
                transition={1000}
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text className="text-xl font-inter-bold text-gray-800">{displayName}</Text>
              {sellerProfile.username && (
                <Text className="mt-1 text-sm font-inter-semibold text-gray-500">@{sellerProfile.username}</Text>
              )}
              {sellerProfile.bio && (
                <Text className="text-sm font-inter-semibold text-gray-700 mt-2">{sellerProfile.bio}</Text>
              )}

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
              onPress={() => handleTabChange('products')}
            >
              <Text
                className={`text-center text-sm font-inter-semibold ${
                  activeTab === 'products' ? 'font-inter-semibold text-black' : 'text-gray-600'
                }`}
              >
                Products ({totalProducts})
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-4 ${activeTab === 'shows' ? 'border-b-2 border-black' : ''}`}
              onPress={() => handleTabChange('shows')}
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
              onPress={() => handleTabChange('reviews')}
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
            {isLoadingProducts ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-3 text-sm font-inter-semibold text-gray-600">Loading products...</Text>
              </View>
            ) : sellerProducts.length > 0 ? (
              <>
                <FlatList
                  data={sellerProducts}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                />
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View className="mt-4">
                    <View className="flex-row items-center justify-center gap-3">
                      {/* Prev Arrow */}
                      <TouchableOpacity
                        onPress={goToPrevPage}
                        disabled={currentPage === 1 || isLoadingProducts}
                        className="px-4 py-2"
                      >
                        <Feather
                          name="chevron-left"
                          size={24}
                          color={currentPage === 1 || isLoadingProducts ? '#999' : '#000'}
                        />
                      </TouchableOpacity>

                      {/* Current Page Input / Total Pages */}
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={pageInput}
                          onChangeText={handlePageInputChange}
                          onSubmitEditing={handlePageInputSubmit}
                          onBlur={handlePageInputSubmit}
                          keyboardType="number-pad"
                          returnKeyType="done"
                          editable={!isLoadingProducts}
                          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-center text-base font-inter-medium text-black min-w-[50px]"
                        />
                        <Text className="text-base font-inter-medium text-gray-600">/</Text>
                        <Text className="text-base font-inter-medium text-black">{totalPages}</Text>
                      </View>

                      {/* Next Arrow */}
                      <TouchableOpacity
                        onPress={goToNextPage}
                        disabled={currentPage === totalPages || isLoadingProducts}
                        className="px-4 py-2"
                      >
                        <Feather
                          name="chevron-right"
                          size={24}
                          color={currentPage === totalPages || isLoadingProducts ? '#999' : '#000'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
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
                    <View className="w-full h-40 rounded-lg overflow-hidden mb-3">
                      <Image
                        source={show.thumbnail}
                        contentFit="cover"
                        placeholder={blurhash}
                        transition={1000}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
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
