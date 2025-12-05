import { supabase } from '@/api/config';
import { listingsService, ordersService, streamsService } from '@/api/services';
import { Stream } from '@/api/types';
import LiveChat from '@/components/live-chat';
import { useAgora } from '@/hooks/use-agora';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { RtcSurfaceView } from 'react-native-agora';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MysteryBox {
  id: string;
  name: string;
  boxCount: number;
  createdAt: Date;
}

interface Giveaway {
  id: string;
  title: string;
  description: string;
  duration: number;
  createdAt: Date;
}

interface Sale {
  id: string;
  itemName: string;
  price: number;
  soldAt: Date;
}

export default function StartStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const currentStreamId = id || '';

  const [stream, setStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount] = useState(0);
  const [auctionPrice, setAuctionPrice] = useState('');
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [auctionEndTime, setAuctionEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeListing, setActiveListing] = useState<string | null>(null);

  // Show features state
  const [mysteryBoxes] = useState<MysteryBox[]>([
    { id: 'mb-1', name: 'Vintage Surprise Box', boxCount: 5, createdAt: new Date() },
    { id: 'mb-2', name: 'Designer Items Mystery', boxCount: 3, createdAt: new Date() },
  ]);
  const [giveaways] = useState<Giveaway[]>([
    {
      id: 'g-1',
      title: 'Stream Milestone Giveaway',
      description: 'Celebrate 100 viewers!',
      duration: 15,
      createdAt: new Date(),
    },
  ]);
  const [selectedShowFeatures, setSelectedShowFeatures] = useState<string[]>([]);
  const [runningFeatures, setRunningFeatures] = useState<string[]>([]);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);

  // Quick price selection
  const [quickPrices, setQuickPrices] = useState(['1', '2', '5', '10']);
  const [selectedQuickPrice, setSelectedQuickPrice] = useState<string | null>(null);
  const [showPriceSettings, setShowPriceSettings] = useState(false);

  // Auction duration controls
  const [quickDurations, setQuickDurations] = useState([10, 15, 20, 30]);
  const [auctionDuration, setAuctionDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [showDurationSettings, setShowDurationSettings] = useState(false);

  // Sales tracking
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // UI State for mobile overlays
  const [showChat, setShowChat] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const {
    isConnected,
    isVideoEnabled,
    isAudioEnabled,
    configLoaded,
    configError,
    remoteUsers,
    engine,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    switchCamera,
  } = useAgora({
    channelName: currentStreamId,
    userId: user?.id,
    isHost: true,
  });

  // Load stream data
  useEffect(() => {
    if (id) {
      loadStream();
    }
  }, [id]);

  const loadStream = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await streamsService.getStream(id);
      if (!data) {
        showErrorToast('Stream not found');
        router.back();
        return;
      }

      if (data.seller_id !== user?.id) {
        showErrorToast('You do not have permission to start this stream');
        router.back();
        return;
      }

      setStream(data);
    } catch (error) {
      logger.error('Error loading stream:', error);
      showErrorToast('Failed to load stream');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent sales for this stream
  useEffect(() => {
    const fetchRecentSales = async () => {
      if (!user) return;

      try {
        const salesData = await ordersService.getRecentSalesForStream(currentStreamId, 10);
        setRecentSales(salesData);
      } catch (error) {
        logger.error('Error fetching recent sales:', error);
      }
    };

    if (currentStreamId) {
      fetchRecentSales();

      // Set up real-time subscription for new sales
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `stream_id=eq.${currentStreamId}`,
          },
          () => {
            fetchRecentSales();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, currentStreamId]);

  // Countdown timer for auction
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isAuctionActive && auctionEndTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const end = auctionEndTime.getTime();
        const diff = end - now;

        if (diff <= 0) {
          setTimeRemaining(0);
          setIsAuctionActive(false);
          endAuction();
        } else {
          setTimeRemaining(Math.floor(diff / 1000));
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuctionActive, auctionEndTime]);

  const endAuction = async () => {
    if (!activeListing) return;

    try {
      await listingsService.endAuction(activeListing);

      setIsAuctionActive(false);
      setAuctionEndTime(null);
      setActiveListing(null);

      showSuccessToast('Auction ended successfully');
    } catch (error) {
      logger.error('Error ending auction:', error);
      showErrorToast('Failed to end auction');
    }
  };

  const handleStartStream = async () => {
    try {
      if (!stream) return;

      if (!isConnected) {
        showErrorToast('Please wait for Agora connection to complete');
        return;
      }

      if (!isVideoEnabled) await startVideo();
      if (!isAudioEnabled) await startAudio();

      // Update stream status
      await streamsService.startStream(stream.id);
      setIsLive(true);

      showSuccessToast('Stream started! You are now LIVE');
    } catch (error) {
      logger.error('Error starting stream:', error);
      showErrorToast('Failed to start stream. Please check your camera and microphone permissions');
    }
  };

  const handleStopStream = async () => {
    if (!stream) return;

    Alert.alert('End Stream', 'Are you sure you want to end this stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isVideoEnabled) await stopVideo();
            if (isAudioEnabled) await stopAudio();
            await streamsService.endStream(stream.id);
            setIsLive(false);
            showSuccessToast('Stream ended successfully');
            router.back();
          } catch (error) {
            logger.error('Error stopping stream:', error);
            showErrorToast('Failed to stop stream');
          }
        },
      },
    ]);
  };

  const handleShareStream = async () => {
    const streamUrl = `vintstreetapp://stream/${currentStreamId}`;
    // In React Native, you'd use Clipboard or Sharing
    showSuccessToast('Stream link copied to clipboard');
  };

  const handleToggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        await stopVideo();
      } else {
        await startVideo();
      }
    } catch (error) {
      showErrorToast('Failed to toggle camera');
    }
  };

  const handleToggleAudio = async () => {
    try {
      if (isAudioEnabled) {
        await stopAudio();
      } else {
        await startAudio();
      }
    } catch (error) {
      showErrorToast('Failed to toggle microphone');
    }
  };

  const handleSwitchCamera = async () => {
    try {
      await switchCamera();
    } catch (error) {
      showErrorToast('Failed to switch camera');
    }
  };

  const handleStartAuction = async () => {
    if (!auctionPrice || !user) return;

    try {
      const endTime = new Date(Date.now() + auctionDuration * 1000);
      const data = await listingsService.createAuctionListing({
        seller_id: user.id,
        stream_id: currentStreamId,
        product_name: 'Auction Item',
        product_description: 'Live auction item from stream',
        starting_price: parseFloat(auctionPrice),
        current_bid: parseFloat(auctionPrice),
        auction_end_time: endTime.toISOString(),
      });

      setActiveListing((data as unknown)?.id);
      setIsAuctionActive(true);
      setAuctionEndTime(endTime);

      showSuccessToast(`Auction started! ${auctionDuration}-second auction is now live`);
    } catch (error) {
      logger.error('Error starting auction:', error);
      showErrorToast('Failed to start auction');
    }
  };

  const handleEndAuction = async () => {
    if (!activeListing) return;
    await endAuction();
  };

  const handleToggleShowFeature = (featureId: string) => {
    setSelectedShowFeatures((prev) => {
      if (prev.includes(featureId)) {
        return prev.filter((id) => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  const handleStartFeature = (featureId: string, type: 'mystery-box' | 'giveaway') => {
    setRunningFeatures((prev) => [...prev, featureId]);

    const featureName =
      type === 'mystery-box'
        ? mysteryBoxes.find((mb) => mb.id === featureId)?.name
        : giveaways.find((g) => g.id === featureId)?.title;

    showSuccessToast(`${featureName} is now running`);

    if (type === 'giveaway') {
      const giveaway = giveaways.find((g) => g.id === featureId);
      if (giveaway) {
        setTimeout(() => {
          setRunningFeatures((prev) => prev.filter((id) => id !== featureId));
          showSuccessToast(`${giveaway.title} has finished`);
        }, giveaway.duration * 60 * 1000);
      }
    }
  };

  const handleStopFeature = (featureId: string, type: 'mystery-box' | 'giveaway') => {
    setRunningFeatures((prev) => prev.filter((id) => id !== featureId));

    const featureName =
      type === 'mystery-box'
        ? mysteryBoxes.find((mb) => mb.id === featureId)?.name
        : giveaways.find((g) => g.id === featureId)?.title;

    showSuccessToast(`${featureName} has ended`);
  };

  const handleQuickPriceSelect = (price: string) => {
    setSelectedQuickPrice(price);
    setAuctionPrice(price);
  };

  const handleQuickTimeSelect = (seconds: number) => {
    setAuctionDuration(seconds);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    if (value && !isNaN(Number(value))) {
      setAuctionDuration(Number(value));
    }
  };

  const handleExtendAuction = () => {
    if (auctionEndTime) {
      const extendedTime = new Date(auctionEndTime.getTime() + 60 * 1000);
      setAuctionEndTime(extendedTime);
      showSuccessToast('Auction extended by 60 seconds');
    }
  };

  const allFeatures = [
    ...mysteryBoxes.map((mb) => ({
      ...mb,
      type: 'mystery-box' as const,
      displayName: mb.name,
      details: `${mb.boxCount} boxes`,
    })),
    ...giveaways.map((g) => ({ ...g, type: 'giveaway' as const, displayName: g.title, details: `${g.duration} min` })),
  ];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !stream) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Full Screen Video Container */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View className="flex-1 bg-white relative">
          {/* Video Player - Full Screen */}
          <View className="absolute inset-0 w-full h-full">
            {/* Video View - Render when connected and video enabled */}
            {isConnected && engine && RtcSurfaceView ? (
              <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full">
                <RtcSurfaceView
                  canvas={{ uid: 0 }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  zOrderMediaOverlay={true}
                />
              </View>
            ) : null}

            {/* Overlay States - Only show when video is not active */}
            {configError ? (
              <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full items-center justify-center bg-white">
                <View className="w-full max-w-sm items-center p-10 bg-white rounded-2xl shadow-2xl">
                  <View className="w-20 h-20 items-center justify-center rounded-full bg-red-50">
                    <Feather name="video-off" size={36} color="#ef4444" />
                  </View>
                  <Text className="mt-4 text-2xl font-inter-bold text-gray-900">Configuration Error</Text>
                  <Text className="mt-2 text-base font-inter text-gray-600 text-center leading-6">
                    asdf{configError}
                  </Text>
                </View>
              </View>
            ) : !configLoaded ? (
              <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full items-center justify-center bg-white">
                <View className="w-full max-w-sm items-center p-10 bg-white rounded-2xl shadow-2xl">
                  <ActivityIndicator size="large" color="#000" />
                  <Text className="mt-4 text-2xl font-inter-bold text-gray-900">Loading Stream...</Text>
                  <Text className="mt-2 text-base font-inter text-gray-600">Setting up your camera</Text>
                </View>
              </View>
            ) : !isConnected ? (
              <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full items-center justify-center bg-white">
                <View className="w-full max-w-sm items-center p-10 bg-white rounded-2xl shadow-2xl">
                  <View className="w-20 h-20 items-center justify-center rounded-full bg-blue-50">
                    <Feather name="video" size={36} color="#3b82f6" />
                  </View>
                  <Text className="mt-4 text-2xl font-inter-bold text-gray-900">Connecting...</Text>
                  <Text className="mt-2 text-base font-inter text-gray-600">Preparing your stream</Text>
                </View>
              </View>
            ) : !isVideoEnabled ? (
              <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full items-center justify-center bg-white">
                <View className="w-full max-w-sm items-center p-10 bg-white rounded-2xl shadow-2xl">
                  <View className="w-20 h-20 items-center justify-center rounded-full bg-gray-50">
                    <Feather name="video-off" size={36} color="#6b7280" />
                  </View>
                  <Text className="mt-4 text-2xl font-inter-bold text-gray-900">Camera Off</Text>
                  <Text className="mt-2 text-base font-inter text-gray-600 text-center">
                    Tap the camera button to turn on
                  </Text>
                </View>
              </View>
            ) : !engine || !RtcSurfaceView ? (
              <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full items-center justify-center bg-white">
                <View className="w-full max-w-sm items-center p-10 bg-white rounded-2xl shadow-2xl">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="mt-4 text-2xl font-inter-bold text-gray-900">Initializing video...</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Top Overlay - Live Indicator & Viewers */}
          <View className="absolute top-0 left-0 right-0">
            <View className="flex-row items-center justify-between gap-2 p-4">
              <View className="flex-row items-center gap-2">
                {isLive && (
                  <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-red-500 border border-red-500">
                    <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    <Text className="text-sm font-inter-bold text-white tracking-wider uppercase">LIVE</Text>
                  </View>
                )}
                {isLive && (
                  <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-black/30">
                    <Feather name="users" size={16} color="#fff" />
                    <Text className="text-sm font-inter-semibold text-white">{viewerCount}</Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleShareStream}
                  className="p-3 rounded-xl shadow-xl bg-gray-100 border border-gray-200 active:bg-gray-200"
                >
                  <Feather name="share-2" size={16} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowControls(!showControls)}
                  className="p-3 rounded-xl shadow-xl bg-gray-100 border border-gray-200 active:bg-gray-200"
                >
                  <Feather name="settings" size={16} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Auction/Buying Overlay - Bottom Center - Enhanced Design */}
          {isAuctionActive && (
            <View className="absolute bottom-24 left-0 right-0 z-10 items-center px-5">
              <View
                className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-3 h-3 rounded-full bg-red-500" />
                    <Text className="text-gray-900 font-inter-bold text-lg">Live Auction</Text>
                  </View>
                  <View className="flex-row items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                    <Feather name="clock" size={18} color="#ef4444" />
                    <Text className="font-mono text-xl font-inter-bold text-red-600">{formatTime(timeRemaining)}</Text>
                  </View>
                </View>
                <View className="flex-row items-baseline gap-3 mb-5">
                  <Text className="text-gray-900 text-5xl font-inter-bold">£{auctionPrice}</Text>
                  <Text className="text-gray-500 text-base font-inter-medium">Current Bid</Text>
                </View>
                <TouchableOpacity
                  onPress={handleEndAuction}
                  className="bg-red-500 py-4 rounded-xl items-center active:bg-red-600"
                  style={{
                    shadowColor: '#ef4444',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text className="text-white font-inter-bold text-base">End Auction</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Recent Sales Overlay - Bottom Left - Enhanced Design */}
          {recentSales.length > 0 && (
            <View className="absolute bottom-24 left-5 z-10">
              <View
                className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 max-w-xs border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <View className="flex-row items-center gap-2.5 mb-4">
                  <View className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <Text className="text-gray-900 font-inter-bold text-base">Recent Sales</Text>
                  <View className="bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                    <Text className="text-green-700 text-xs font-inter-bold">{recentSales.length}</Text>
                  </View>
                </View>
                <ScrollView className="max-h-48" showsVerticalScrollIndicator={false}>
                  {recentSales.slice(0, 3).map((sale, index) => (
                    <View
                      key={sale.id}
                      className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <Text className="text-gray-700 text-sm flex-1 font-inter-medium" numberOfLines={1}>
                        {sale.itemName}
                      </Text>
                      <Text className="text-green-600 text-base font-inter-bold ml-4">£{sale.price.toFixed(2)}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Chat Overlay - Full Screen - Enhanced Design */}
          {/* Keep LiveChat mounted to maintain RTM connection */}
          <View
            className={`absolute inset-0 z-20 ${showChat ? '' : 'pointer-events-none'}`}
            style={{ display: showChat ? 'flex' : 'none' }}
          >
            <LiveChat streamId={currentStreamId} onClose={() => setShowChat(false)} isVisible={showChat} />
          </View>

          {/* Bottom Controls Overlay - Enhanced Design */}
          <View className="absolute bottom-0 left-0 right-0 z-10">
            <View className="flex-row items-center justify-center gap-4 px-5 py-4">
              <TouchableOpacity
                onPress={handleToggleVideo}
                disabled={!configLoaded}
                className={`p-4 rounded-xl shadow-xl ${isVideoEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Feather
                  name={isVideoEnabled ? 'video' : 'video-off'}
                  size={22}
                  color={isVideoEnabled ? '#fff' : '#6b7280'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleAudio}
                disabled={!configLoaded}
                className={`p-4 rounded-xl shadow-xl ${isAudioEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Feather
                  name={isAudioEnabled ? 'mic' : 'mic-off'}
                  size={22}
                  color={isAudioEnabled ? '#fff' : '#6b7280'}
                />
              </TouchableOpacity>

              {!isLive ? (
                <TouchableOpacity
                  onPress={handleStartStream}
                  disabled={!isConnected}
                  className="px-8 py-4 rounded-xl shadow-xl bg-red-500 active:bg-red-600"
                >
                  <Text className="text-xl font-inter-bold text-white">Start</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleStopStream}
                  className="px-8 py-4 rounded-xl shadow-xl bg-gray-700 active:bg-gray-800"
                >
                  <Text className="text-xl font-inter-bold text-white">End</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSwitchCamera}
                disabled={!isVideoEnabled}
                className={`p-4 rounded-xl shadow-xl ${isVideoEnabled ? 'bg-gray-100' : 'bg-gray-200 opacity-50'}`}
              >
                <Feather name="refresh-cw" size={22} color="#374151" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowChat(true)} className="p-4 rounded-xl shadow-xl bg-gray-100">
                <Feather name="message-circle" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Stream Controls Drawer Modal - Enhanced Design */}
      <Modal visible={showControls} animationType="slide" transparent onRequestClose={() => setShowControls(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setShowControls(false)}>
            <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
              <View className="flex-col gap-2 p-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-inter-bold text-gray-900">Stream Controls</Text>
                  <TouchableOpacity onPress={() => setShowControls(false)} hitSlop={8}>
                    <Feather name="x" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View className="gap-4 py-4">
                  {/* Show Features Section */}
                  <View className="gap-2 px-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-inter-bold text-gray-900">Show Features</Text>
                      <TouchableOpacity
                        onPress={() => setShowFeaturesModal(true)}
                        className="p-2 rounded-lg bg-blue-50 border border-blue-200 active:bg-blue-100"
                      >
                        <Feather name="plus" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    </View>

                    {selectedShowFeatures.length === 0 ? (
                      <View className="items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        <View className="w-16 h-16 items-center justify-center rounded-full bg-gray-200">
                          <Feather name="package" size={24} color="#9ca3af" />
                        </View>
                        <Text className="mt-4 text-base font-inter-semibold text-gray-600">No features selected</Text>
                        <Text className="mt-1 text-sm font-inter-medium text-gray-400">Tap + to add features</Text>
                      </View>
                    ) : (
                      <View className="gap-2">
                        {selectedShowFeatures.map((featureId) => {
                          const feature = allFeatures.find((f) => f.id === featureId);
                          if (!feature) return null;
                          const isRunning = runningFeatures.includes(featureId);
                          return (
                            <View key={featureId} className="p-4 rounded-lg bg-white border border-gray-200">
                              <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                  <Text className="text-base font-inter-bold text-gray-900">{feature.displayName}</Text>
                                  <Text className="mt-1 text-sm font-inter-medium text-gray-500">
                                    {feature.details}
                                  </Text>
                                  {isRunning && (
                                    <View className="self-start mt-3 px-3 py-1.5 rounded-full bg-green-100 border border-green-200">
                                      <Text className="text-xs font-inter-bold text-green-700">Running</Text>
                                    </View>
                                  )}
                                </View>
                                <TouchableOpacity
                                  onPress={() =>
                                    isRunning
                                      ? handleStopFeature(featureId, feature.type)
                                      : handleStartFeature(featureId, feature.type)
                                  }
                                  className={`px-4 py-2 rounded-lg shadow-lg ${
                                    isRunning ? 'bg-gray-100 border border-gray-200' : 'bg-blue-500'
                                  }`}
                                >
                                  <Text
                                    className={`text-sm font-inter-bold ${isRunning ? 'text-gray-700' : 'text-white'}`}
                                  >
                                    {isRunning ? 'Stop' : 'Start'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Auction Price Selection */}
                  <View className="gap-2 px-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-inter-bold text-gray-900">Starting Auction Price</Text>
                      <TouchableOpacity
                        onPress={() => setShowPriceSettings(true)}
                        className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
                      >
                        <Feather name="settings" size={20} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1 flex-row flex-wrap items-center gap-3">
                      {quickPrices.map((price) => (
                        <TouchableOpacity
                          key={price}
                          onPress={() => handleQuickPriceSelect(price)}
                          className={`px-5 py-3 rounded-lg border ${
                            selectedQuickPrice === price ? 'bg-black border-black' : 'bg-white border-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-sm font-inter-bold ${
                              selectedQuickPrice === price ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            £{price}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TextInput
                        placeholder="£"
                        value={auctionPrice}
                        onChangeText={(text) => {
                          setAuctionPrice(text);
                          setSelectedQuickPrice(null);
                        }}
                        keyboardType="decimal-pad"
                        className="w-24 h-12 bg-white border border-gray-200 rounded-lg text-center text-base font-inter-semibold"
                        editable={!isAuctionActive}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* Auction Time Controls */}
                  <View className="gap-2 px-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-inter-bold text-gray-900">Auction Duration</Text>
                      <TouchableOpacity
                        onPress={() => setShowDurationSettings(true)}
                        className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
                      >
                        <Feather name="settings" size={20} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1 flex-row flex-wrap items-center gap-3">
                      {quickDurations.map((seconds) => (
                        <TouchableOpacity
                          key={seconds}
                          onPress={() => handleQuickTimeSelect(seconds)}
                          disabled={isAuctionActive}
                          className={`px-5 py-3 rounded-lg border ${
                            auctionDuration === seconds && !customDuration
                              ? 'bg-black border-black'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-sm font-inter-bold ${
                              auctionDuration === seconds && !customDuration ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {seconds}s
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TextInput
                        placeholder="s"
                        value={customDuration}
                        onChangeText={handleCustomDurationChange}
                        keyboardType="number-pad"
                        className="w-24 h-12 bg-white border border-gray-200 rounded-lg text-center text-base font-inter-semibold"
                        editable={!isAuctionActive}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    {isAuctionActive && (
                      <TouchableOpacity
                        onPress={handleExtendAuction}
                        className="w-full items-center p-4 rounded-lg bg-gray-100 border border-gray-200 active:bg-gray-200"
                      >
                        <Text className="text-base font-inter-bold text-gray-700">Extend +60s</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Auction Controls */}
                  <View className="gap-2 px-4">
                    {!isAuctionActive ? (
                      <TouchableOpacity
                        onPress={handleStartAuction}
                        disabled={!auctionPrice || !isLive}
                        className={`w-full items-center py-4 rounded-lg ${
                          !auctionPrice || !isLive ? 'bg-gray-200' : 'bg-green-500'
                        }`}
                      >
                        <Text
                          className={`text-lg font-inter-bold ${
                            !auctionPrice || !isLive ? 'text-gray-500' : 'text-white'
                          }`}
                        >
                          Start Auction
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="gap-2">
                        <View className="items-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <View className="flex-row items-center gap-3">
                            <Feather name="clock" size={24} color="#3b82f6" />
                            <Text className="text-2xl font-inter-bold text-blue-600">{formatTime(timeRemaining)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={handleEndAuction}
                          className="w-full items-center py-4 rounded-lg bg-gray-100 border border-gray-200 active:bg-gray-200"
                        >
                          <Text className="text-base font-inter-bold text-gray-700">End Auction</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Stream Stats */}
                  <View className="gap-4 p-4 border-t border-gray-200">
                    <Text className="text-lg font-inter-bold text-gray-900">Stream Status</Text>
                    <View className="gap-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base text-gray-600 font-inter-semibold">Status</Text>
                        <View
                          className={`px-4 py-2 rounded-full ${
                            isLive ? 'bg-red-100 border border-red-200' : 'bg-gray-200'
                          }`}
                        >
                          <Text className={`text-xs font-inter-bold ${isLive ? 'text-red-700' : 'text-gray-600'}`}>
                            {isLive ? 'Live' : 'Offline'}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base text-gray-600 font-inter-semibold">Viewers</Text>
                        <Text className="text-base font-inter-bold text-gray-900">{viewerCount}</Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base text-gray-600 font-inter-semibold">Connection</Text>
                        <View
                          className={`px-4 py-2 rounded-full ${
                            isConnected ? 'bg-green-100 border border-green-200' : 'bg-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-xs font-inter-bold ${isConnected ? 'text-green-700' : 'text-gray-600'}`}
                          >
                            {isConnected ? 'Connected' : 'Disconnected'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Show Features Modal - Enhanced Design */}
      <Modal
        visible={showFeaturesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFeaturesModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setShowFeaturesModal(false)}>
            <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
              <View className="flex-col gap-2 p-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-inter-bold text-gray-900">Select Show Features</Text>
                  <TouchableOpacity onPress={() => setShowFeaturesModal(false)} hitSlop={8}>
                    <Feather name="x" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View className="flex-1 gap-4 p-4">
                  {allFeatures.map((feature) => (
                    <View
                      key={feature.id}
                      className="flex-row items-center justify-between p-4 rounded-lg border border-gray-200 bg-white"
                    >
                      <View className="flex-1 flex-row items-center gap-4">
                        <View
                          className={`items-center justify-center w-12 h-12 rounded-lg ${
                            feature.type === 'mystery-box' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}
                        >
                          <Feather
                            name={feature.type === 'mystery-box' ? 'package' : 'gift'}
                            size={24}
                            color={feature.type === 'mystery-box' ? '#3b82f6' : '#a855f7'}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-inter-bold text-gray-900">{feature.displayName}</Text>
                          <Text className="text-sm text-gray-500 mt-1">{feature.details}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleToggleShowFeature(feature.id)}
                        className={`px-5 py-2.5 rounded-lg border ${
                          selectedShowFeatures.includes(feature.id)
                            ? 'bg-blue-500 border-blue-600'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-sm font-inter-bold ${
                            selectedShowFeatures.includes(feature.id) ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {selectedShowFeatures.includes(feature.id) ? 'Selected' : 'Select'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {allFeatures.length === 0 && (
                    <View className="p-16 items-center">
                      <View className="w-20 h-20 items-center justify-center mb-4 rounded-full bg-gray-100">
                        <Feather name="package" size={28} color="#9ca3af" />
                      </View>
                      <Text className="text-base text-gray-600 font-inter-semibold">No show features available</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Price Settings Modal - Enhanced Design */}
      <Modal
        visible={showPriceSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPriceSettings(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setShowPriceSettings(false)}>
            <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
              <View className="flex-col gap-2 p-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-inter-bold text-gray-900">Customize Price Buttons</Text>
                  <TouchableOpacity onPress={() => setShowPriceSettings(false)} hitSlop={8}>
                    <Feather name="x" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View className="flex-1 gap-4 p-4">
                  <Text className="text-base font-inter-semibold text-gray-600">Set your quick price options</Text>
                  <View className="flex-row flex-wrap gap-4">
                    {quickPrices.map((price, index) => (
                      <View key={index} className="w-24 gap-2">
                        <Text className="text-sm font-inter-semibold text-gray-500">Price {index + 1}</Text>
                        <TextInput
                          value={price}
                          onChangeText={(text) => {
                            const newPrices = [...quickPrices];
                            newPrices[index] = text;
                            setQuickPrices(newPrices);
                          }}
                          keyboardType="decimal-pad"
                          placeholderTextColor="#9ca3af"
                          className="w-full h-12 text-center border border-gray-300 rounded-lg text-base bg-white font-inter-semibold"
                        />
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPriceSettings(false)}
                    className="w-full items-center p-4 rounded-lg bg-black"
                  >
                    <Text className="text-base font-inter-bold text-white">Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Duration Settings Modal - Enhanced Design */}
      <Modal
        visible={showDurationSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDurationSettings(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setShowDurationSettings(false)}>
            <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
              <View className="flex-col gap-2 p-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-inter-bold text-gray-900">Customize Duration Buttons</Text>
                  <TouchableOpacity onPress={() => setShowDurationSettings(false)} hitSlop={8}>
                    <Feather name="x" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View className="flex-1 gap-4 p-4">
                  <Text className="text-base font-inter-semibold text-gray-600">
                    Set your quick duration options (in seconds)
                  </Text>
                  <View className="flex-row flex-wrap gap-4">
                    {quickDurations.map((duration, index) => (
                      <View key={index} className="w-24 gap-2">
                        <Text className="text-sm font-inter-semibold text-gray-500">Duration {index + 1}</Text>
                        <TextInput
                          value={duration.toString()}
                          onChangeText={(text) => {
                            const newDurations = [...quickDurations];
                            newDurations[index] = Number(text) || duration;
                            setQuickDurations(newDurations);
                          }}
                          keyboardType="number-pad"
                          placeholderTextColor="#9ca3af"
                          className="w-full h-12 text-center border border-gray-300 rounded-lg text-base bg-white font-inter-semibold"
                        />
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDurationSettings(false)}
                    className="w-full items-center p-4 rounded-lg bg-black"
                  >
                    <Text className="text-base font-inter-bold text-white">Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
