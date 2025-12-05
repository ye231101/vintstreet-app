import { listingsService } from '@/api/services';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/utils';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuctionData {
  id: string;
  listing_id: string;
  current_bid: number | null;
  starting_bid: number | null;
  end_time: string;
  status: string;
  bid_count: number | null;
  reserve_price: number;
  reserve_met: boolean | null;
  created_at: string;
}

interface BidData {
  id: string;
  auction_id: string;
  bidder_id: string;
  bid_amount: number;
  created_at: string;
}

interface AuctionDisplayProps {
  productId: string;
}

export const AuctionDisplay: React.FC<AuctionDisplayProps> = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bids, setBids] = useState<BidData[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const fetchAuction = async () => {
    try {
      const data = await listingsService.getAuctionByListingId(productId);
      if (data) {
        const auctionData = data as unknown as AuctionData;
        setAuction(auctionData);
        return auctionData;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching auction:', error);
      return null;
    }
  };

  const fetchBids = async (auctionId?: string) => {
    if (!auctionId) return;

    try {
      const data = await listingsService.getBidsForAuction(auctionId);
      setBids(data as unknown as BidData[]);
    } catch (error) {
      logger.error('Error fetching bids:', error);
    }
  };

  useEffect(() => {
    const loadAuction = async () => {
      const auctionData = await fetchAuction();
      if (auctionData) {
        await fetchBids(auctionData.id);
      }
    };

    loadAuction();

    // Set up polling every 5 seconds
    const interval = setInterval(async () => {
      loadAuction();
    }, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [productId]);

  // Calculate time remaining
  useEffect(() => {
    if (!auction?.end_time) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(auction?.end_time || '');
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Auction ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auction?.end_time]);

  const handlePlaceBid = async () => {
    if (!isAuthenticated || !user) {
      showErrorToast('Please sign in to place a bid');
      return;
    }

    if (!auction) return;

    const maxBidAmount = parseFloat(bidAmount);
    if (isNaN(maxBidAmount) || maxBidAmount <= 0) {
      showErrorToast('Please enter a valid maximum bid');
      return;
    }

    const currentBid = auction.current_bid || auction.starting_bid || 0;
    const increment = currentBid < 50 ? 1 : currentBid < 100 ? 2 : currentBid < 500 ? 5 : 10;
    const minimumBid = currentBid + increment;

    if (maxBidAmount < minimumBid) {
      showErrorToast(`Maximum bid must be at least £${minimumBid.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await listingsService.placeProxyBid(auction.id, maxBidAmount);

      if (result.success) {
        showSuccessToast(
          result.isLeading
            ? `You're winning! Current bid: £${result.currentBid.toFixed(2)}`
            : `Bid placed! Current bid: £${result.currentBid.toFixed(2)} (another bidder is leading)`
        );
        setBidAmount('');
        await fetchAuction();
        if (auction.id) {
          await fetchBids(auction.id);
        }
      } else {
        throw new Error(result.error || 'Failed to place bid');
      }
    } catch (error: unknown) {
      logger.error('Error placing bid:', error);
      showErrorToast(error.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auction) return null;

  const currentBid = auction.current_bid || auction.starting_bid || 0;
  const minimumNextBid = currentBid + (currentBid < 50 ? 1 : currentBid < 100 ? 2 : currentBid < 500 ? 5 : 10);

  return (
    <View className="mx-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-lg">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="p-2 bg-blue-500 rounded-full">
            <Feather name="clock" size={20} color="#fff" />
          </View>
          <View className="bg-blue-500 px-3 py-1 rounded-full">
            <Text className="text-sm font-inter-bold text-white">LIVE AUCTION</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowHowItWorks(true)}
          className="flex-row items-center gap-2 px-3 py-1 rounded-lg border border-gray-300"
        >
          <Feather name="info" size={16} color="#000" />
          <Text className="text-xs font-inter-semibold text-gray-700">How it works</Text>
        </TouchableOpacity>
      </View>

      {/* Auction Stats */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Current Bid</Text>
          <Text className="text-lg font-inter-bold text-black">£{formatPrice(currentBid)}</Text>
          {!auction.reserve_met && (
            <View className="mt-1 px-2 py-0.5 bg-orange-100 rounded border border-orange-300 self-start">
              <Text className="text-xs font-inter-semibold text-orange-600">Reserve not met</Text>
            </View>
          )}
        </View>

        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-500 mb-1">Time Remaining</Text>
          <View className="flex-row items-center gap-1">
            <Feather name="clock" size={14} color="#000" />
            <Text className="text-base font-inter-semibold text-black">{timeRemaining || 'Loading...'}</Text>
          </View>
        </View>

        <View className="flex-1 items-end">
          <Text className="text-xs text-gray-500 mb-1">Total Bids</Text>
          <View className="flex-row items-center gap-1">
            <Feather name="trending-up" size={14} color="#000" />
            <Text className="text-base font-inter-semibold text-black">{auction.bid_count || 0}</Text>
          </View>
        </View>
      </View>

      <View className="h-px bg-gray-300 my-4" />

      {/* Place Bid Section */}
      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-inter-bold text-black">Place Your Bid</Text>
          <TouchableOpacity
            onPress={() => setShowBidHistory(true)}
            className="flex-row items-center gap-1 px-2 py-1 rounded border border-gray-300"
          >
            <Feather name="trending-up" size={14} color="#000" />
            <Text className="text-xs font-inter-semibold text-gray-700">Bid History</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-gray-500 mb-3">Set your max bid for auto-bidding.</Text>

        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <View className="relative" style={{ height: 50, justifyContent: 'center' }}>
              <Text
                className="absolute text-gray-600 font-inter-semibold z-10"
                style={{
                  left: 12,
                  fontSize: 16,
                }}
              >
                £
              </Text>
              <TextInput
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder={`${minimumNextBid.toFixed(0)}`}
                keyboardType="decimal-pad"
                style={{
                  height: 50,
                  paddingLeft: 32,
                  paddingRight: 12,
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  fontSize: 16,
                  fontFamily: 'inter-semibold',
                  textAlignVertical: 'center',
                }}
                editable={!isSubmitting && isAuthenticated}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={handlePlaceBid}
            disabled={isSubmitting || !isAuthenticated}
            style={{ height: 50 }}
            className={`items-center justify-center px-6 rounded-lg ${
              isAuthenticated && !isSubmitting ? 'bg-black' : 'bg-gray-300'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-inter-bold">Place Bid</Text>
            )}
          </TouchableOpacity>
        </View>

        {!isAuthenticated && (
          <View className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Text className="text-xs font-inter-semibold text-orange-800">
              <Text className="font-inter-bold">Sign in required:</Text> You must be signed in to place a bid
            </Text>
          </View>
        )}
      </View>

      {/* Bid History Modal */}
      <Modal
        visible={showBidHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBidHistory(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <SafeAreaView edges={['bottom']} className="bg-white rounded-t-2xl max-h-[80%]">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-lg font-inter-bold text-black">Bid History ({bids.length})</Text>
                <TouchableOpacity onPress={() => setShowBidHistory(false)} hitSlop={8}>
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-4">
                {bids.length > 0 ? (
                  <View className="gap-2">
                    {bids.map((bid, index) => (
                      <View
                        key={bid.id}
                        className={`p-3 rounded-lg border ${
                          index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                              <Text className="text-lg font-inter-bold text-black">£{formatPrice(bid.bid_amount)}</Text>
                              {index === 0 && (
                                <View className="px-2 py-0.5 bg-blue-500 rounded">
                                  <Text className="text-xs font-inter-semibold text-white">Current High Bid</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-xs text-gray-500">
                              {new Date(bid.created_at).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          <View className="px-2 py-1 bg-gray-100 rounded border border-gray-300">
                            <Text className="text-xs font-inter-semibold text-gray-700">
                              {bid.bidder_id === user?.id ? 'Your Bid' : `Bidder ***${bid.bidder_id.slice(-4)}`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500 text-center">No bids yet. Be the first to bid!</Text>
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* How It Works Modal */}
      <Modal
        visible={showHowItWorks}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHowItWorks(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center p-4"
          onPress={() => setShowHowItWorks(false)}
        >
          <Pressable className="bg-white rounded-2xl p-6 w-full max-w-sm" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-inter-bold text-black">How Auto-Bidding Works</Text>
              <TouchableOpacity onPress={() => setShowHowItWorks(false)} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View className="flex-row items-start gap-2">
                <Text className="text-blue-500 font-inter-bold">•</Text>
                <Text className="flex-1 text-sm font-inter-semibold text-gray-700">
                  Enter your maximum bid - this is the highest amount you're willing to pay
                </Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-blue-500 font-inter-bold">•</Text>
                <Text className="flex-1 text-sm font-inter-semibold text-gray-700">
                  The system will automatically bid incrementally on your behalf
                </Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-blue-500 font-inter-bold">•</Text>
                <Text className="flex-1 text-sm font-inter-semibold text-gray-700">
                  You'll only pay the minimum amount needed to stay in the lead
                </Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-blue-500 font-inter-bold">•</Text>
                <Text className="flex-1 text-sm font-inter-semibold text-gray-700">
                  Your maximum bid is kept confidential from other bidders
                </Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-blue-500 font-inter-bold">•</Text>
                <Text className="flex-1 text-sm font-inter-semibold text-gray-700">
                  <Text className="font-inter-bold">Your bid is binding</Text> - if you win, you must complete the
                  purchase
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
