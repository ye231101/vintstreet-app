import { listingsService } from '@/api/services';
import { useAuth } from '@/hooks/use-auth';
import { useWishlist } from '@/hooks/use-wishlist';
import { blurhash, formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { showErrorToast } from '@/utils/toast';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const PRODUCTS_PER_PAGE = 20;

interface AuctionData {
  id: string;
  current_bid: number | null;
  starting_bid: number | null;
  end_time: string;
  status: string;
  bid_count: number | null;
  reserve_price: number;
  reserve_met: boolean | null;
}

interface AuctionProduct {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  product_image: string | null;
  product_description: string | null;
  seller_id: string;
  status: string;
  created_at: string;
  auction_type: string;
  seller_info_view: {
    shop_name: string;
    display_name_format?: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  auctions: AuctionData[];
}

// Helper function to get seller display name
const getSellerDisplayName = (sellerInfo: {
  shop_name: string;
  display_name_format?: string;
  profile: {
    full_name: string;
    username: string;
  };
}): string => {
  if (!sellerInfo) return 'Unknown Seller';

  const pref = sellerInfo.display_name_format || 'shop_name';

  if (pref === 'shop_name' && sellerInfo.shop_name) {
    return sellerInfo.shop_name;
  }

  if (pref === 'personal_name' && sellerInfo.profile?.full_name) {
    const fullName = sellerInfo.profile.full_name.trim();
    if (!fullName) {
      return sellerInfo.shop_name || sellerInfo.profile.username || 'Unknown Seller';
    }
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 0) {
      return sellerInfo.shop_name || sellerInfo.profile.username || 'Unknown Seller';
    }
    const firstName = parts[0];
    const last = parts[parts.length - 1];
    const initial = last.charAt(0).toUpperCase();
    if (parts.length === 1) {
      return firstName;
    }
    return `${firstName} ${initial}.`;
  }

  return sellerInfo.shop_name || sellerInfo.profile?.username || 'Unknown Seller';
};

const AuctionCard: React.FC<{ auction: AuctionProduct }> = ({ auction }) => {
  const { user, isAuthenticated } = useAuth();
  const { toggleItem, isInWishlist } = useWishlist();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const isProductInWishlist = isInWishlist(auction.id);
  const auctionData = auction.auctions?.[0];
  const currentBid = auctionData?.current_bid || auctionData?.starting_bid || auction.starting_price;

  const sellerDisplayName = auction.seller_info_view
    ? getSellerDisplayName({
        shop_name: auction.seller_info_view.shop_name,
        display_name_format: auction.seller_info_view.display_name_format,
        profile: {
          full_name: auction.seller_info_view.full_name,
          username: auction.seller_info_view.username,
        },
      })
    : 'Unknown Seller';

  useEffect(() => {
    if (!auctionData?.end_time) return;

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(auctionData.end_time).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        setTimeRemaining('Ended');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auctionData?.end_time]);

  const handleWishlistToggle = () => {
    if (!isAuthenticated || !user) {
      router.push('/(auth)');
      return;
    }

    toggleItem(auction as unknown);
  };

  const handlePress = () => {
    router.push(`/product/${auction.id}`);
  };

  const cardWidth = screenWidth / 2 - 12;
  const cardHeight = cardWidth * (4 / 3);

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4"
      style={{ width: cardWidth }}
    >
      <View className="relative">
        {auction.product_image ? (
          <Image
            source={{ uri: auction.product_image }}
            contentFit="cover"
            placeholder={{ blurhash }}
            style={{ width: cardWidth, height: cardHeight }}
            transition={1000}
          />
        ) : (
          <View className="bg-gray-100 items-center justify-center" style={{ width: cardWidth, height: cardHeight }}>
            <Text className="text-gray-400 text-sm">No image</Text>
          </View>
        )}

        <Pressable
          onPress={handleWishlistToggle}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-sm"
        >
          <FontAwesome
            name={isProductInWishlist ? 'heart' : 'heart-o'}
            size={18}
            color={isProductInWishlist ? '#ef4444' : 'black'}
          />
        </Pressable>

        {auctionData && (
          <View className="absolute left-2 top-2 bg-black/70 rounded-full px-2 py-1 flex-row items-center">
            <Feather name="clock" size={12} color="#fff" />
            <Text className="text-white text-xs font-inter-semibold ml-1">{timeRemaining}</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-sm font-inter-semibold mb-3 leading-5" numberOfLines={2}>
          {auction.product_name}
        </Text>

        <View className="flex-row items-center justify-between mb-2">
          <View className="space-y-1">
            <Text className="text-xs text-gray-500">Current Bid</Text>
            <Text className="text-lg font-inter-bold text-black">£{formatPrice(currentBid)}</Text>
          </View>
          {auctionData && auctionData.bid_count !== null && (
            <View className="items-end">
              <Text className="text-xs text-gray-500">Bids</Text>
              <Text className="text-sm font-inter-semibold">{auctionData.bid_count}</Text>
            </View>
          )}
        </View>

        <Text className="text-xs text-gray-500 truncate" numberOfLines={1}>
          {sellerDisplayName}
        </Text>
      </View>
    </Pressable>
  );
};

export default function AuctionsScreen() {
  const [products, setProducts] = useState<AuctionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'ending_soon' | 'newest' | 'price_low' | 'price_high'>('ending_soon');
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuctions = async (page: number = 0, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      }

      const { products: productsWithSellers, total } = await listingsService.getAuctions(
        page,
        PRODUCTS_PER_PAGE,
        sortBy
      );

      if (reset) {
        setProducts(productsWithSellers as AuctionProduct[]);
      } else {
        setProducts((prev) => [...prev, ...(productsWithSellers as AuctionProduct[])]);
      }

      const totalLoaded = (page + 1) * PRODUCTS_PER_PAGE;
      setTotalCount(total);
      setHasMore(totalLoaded < total);
      setCurrentPage(page);
    } catch (err) {
      logger.error('Error fetching auctions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
      showErrorToast('Failed to load auctions');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctions(0, true);
  }, [sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(0);
    setHasMore(true);
    fetchAuctions(0, true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore && !refreshing && products.length < totalCount) {
      fetchAuctions(currentPage + 1, false);
    }
  };

  const handleSortChange = (value: 'ending_soon' | 'newest' | 'price_low' | 'price_high') => {
    setSortBy(value);
    setCurrentPage(0);
    setHasMore(true);
    setProducts([]);
  };

  const renderItem = ({ item }: { item: AuctionProduct }) => <AuctionCard auction={item} />;

  const renderFooter = () => {
    if (!isLoading || currentPage === 0) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Feather name="clock" size={64} color="#999" />
        <Text className="text-xl font-inter-bold text-gray-900 mt-4 mb-2">No Active Auctions</Text>
        <Text className="text-gray-500 text-center px-8">Check back soon for new auctions!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 border-b border-gray-200">
          <View className="mb-4">
            <Text className="text-2xl font-inter-bold text-gray-900 mb-1">Live Auctions</Text>
            <Text className="text-sm text-gray-500">Bid on exclusive items ending soon</Text>
          </View>

          {/* Sort Options */}
          <View className="flex-row gap-2 flex-wrap">
            <TouchableOpacity
              onPress={() => handleSortChange('ending_soon')}
              className={`px-3 py-2 rounded-lg ${sortBy === 'ending_soon' ? 'bg-black' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-sm font-inter-semibold ${sortBy === 'ending_soon' ? 'text-white' : 'text-gray-700'}`}
              >
                Ending Soon
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSortChange('newest')}
              className={`px-3 py-2 rounded-lg ${sortBy === 'newest' ? 'bg-black' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-inter-semibold ${sortBy === 'newest' ? 'text-white' : 'text-gray-700'}`}>
                Newest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSortChange('price_low')}
              className={`px-3 py-2 rounded-lg ${sortBy === 'price_low' ? 'bg-black' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-sm font-inter-semibold ${sortBy === 'price_low' ? 'text-white' : 'text-gray-700'}`}
              >
                Price: Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSortChange('price_high')}
              className={`px-3 py-2 rounded-lg ${sortBy === 'price_high' ? 'bg-black' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-sm font-inter-semibold ${sortBy === 'price_high' ? 'text-white' : 'text-gray-700'}`}
              >
                Price: High
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products List */}
        {isLoading && currentPage === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-4">
            <Feather name="alert-circle" size={48} color="#ef4444" />
            <Text className="text-red-500 text-center mt-4">{error}</Text>
            <TouchableOpacity onPress={() => fetchAuctions(0, true)} className="mt-4 px-4 py-2 bg-black rounded-lg">
              <Text className="text-white font-inter-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Feather name="clock" size={64} color="#999" />
            <Text className="text-xl font-inter-bold text-gray-900 mt-4 mb-2">No Active Auctions</Text>
            <Text className="text-gray-500 text-center px-8">Check back soon for new auctions!</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
