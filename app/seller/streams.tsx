import { streamsService } from '@/api/services';
import { Stream } from '@/api/types';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StreamsScreen() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal states
  const [endStreamModal, setEndStreamModal] = useState<{ visible: boolean; streamId: string | null }>({
    visible: false,
    streamId: null,
  });
  const [cancelStreamModal, setCancelStreamModal] = useState<{ visible: boolean; streamId: string | null }>({
    visible: false,
    streamId: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const loadStreams = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await streamsService.getSellerStreams(user.id);
      setStreams(data);
    } catch (err) {
      logger.error('Error loading streams:', err);
      setError(err instanceof Error ? err.message : 'Error loading streams');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh streams when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadStreams();
      }
    }, [user?.id])
  );

  // Update current time every second for countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStreams();
    setRefreshing(false);
  };

  const handleEndStream = (streamId: string) => {
    setEndStreamModal({ visible: true, streamId });
  };

  const handleCancelStream = (streamId: string) => {
    setCancelStreamModal({ visible: true, streamId });
  };

  const confirmEndStream = async () => {
    if (!endStreamModal.streamId) return;

    setIsProcessing(true);
    try {
      await streamsService.endStream(endStreamModal.streamId);
      showSuccessToast('Stream ended successfully');
      loadStreams();
      setEndStreamModal({ visible: false, streamId: null });
    } catch (error) {
      logger.error('Error ending stream:', error);
      showErrorToast('Failed to end stream');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCancelStream = async () => {
    if (!cancelStreamModal.streamId) return;

    setIsProcessing(true);
    try {
      await streamsService.cancelStream(cancelStreamModal.streamId);
      showSuccessToast('Stream cancelled');
      loadStreams();
      setCancelStreamModal({ visible: false, streamId: null });
    } catch (error) {
      logger.error('Error cancelling stream:', error);
      showErrorToast('Failed to cancel stream');
    } finally {
      setIsProcessing(false);
    }
  };

  const now = new Date();
  const overdueStreams = streams.filter((stream) => {
    if (stream.status !== 'scheduled') return false;
    const startTime = new Date(stream.start_time);
    const diffInMs = now.getTime() - startTime.getTime();
    return diffInMs > 60 * 60 * 1000; // More than 1 hour overdue
  });

  const upcomingStreams = streams.filter((stream) => {
    if (stream.status !== 'scheduled') return false;
    const startTime = new Date(stream.start_time);
    const diffInMs = now.getTime() - startTime.getTime();
    return diffInMs <= 60 * 60 * 1000; // Not more than 1 hour overdue
  });

  const liveStream = streams.find((stream) => stream.status === 'live');
  const previousStreams = streams
    .filter((stream) => stream.status === 'ended')
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">My Streams</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-base font-inter-bold text-gray-600">Loading streams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">My Streams</Text>
        </View>

        <View className="flex-1 items-center justify-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="mt-2 mb-4 text-lg font-inter-bold text-red-500">Error loading streams</Text>
          <TouchableOpacity onPress={loadStreams} className="px-6 py-3 rounded-lg bg-black">
            <Text className="text-base font-inter-bold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-inter-bold text-black">My Streams</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 gap-4 p-4">
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => router.push('/stream/schedule')}
              className="flex-1 items-center justify-center py-3 bg-white border border-gray-300 rounded-lg"
            >
              <Text className="text-black text-base font-inter-bold">Design my Show</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/stream/schedule')}
              className="flex-1 items-center justify-center py-3 bg-black border border-gray-300 rounded-lg"
            >
              <Text className="text-white text-base font-inter-bold">Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Live Stream */}
          {liveStream && (
            <View className="gap-3">
              <Text className="text-lg font-inter-bold text-black">Current Live Stream</Text>
              <View className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 gap-3">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center">
                      <View className="bg-red-500 px-2 py-1 rounded-full flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-white mr-1" />
                        <Text className="text-white text-xs font-inter-bold">LIVE NOW</Text>
                      </View>
                    </View>
                    <Text className="text-gray-900 text-base font-inter-bold">{liveStream.title}</Text>
                    <View className="flex-row items-center gap-6">
                      <View className="flex-row items-center gap-2">
                        <Feather name="users" size={14} color="#666" />
                        <Text className="text-gray-600 text-sm font-inter">{liveStream.viewer_count} viewers</Text>
                      </View>
                      <Text className="text-gray-500 text-sm font-inter">{liveStream.category}</Text>
                    </View>
                  </View>
                  <View className="w-20 h-20 rounded-lg overflow-hidden">
                    <Image
                      source={liveStream.thumbnail}
                      contentFit="cover"
                      placeholder={{ blurhash }}
                      transition={1000}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => router.push(`/stream/${liveStream.id}` as unknown)}
                    className="flex-1 bg-white border border-gray-300 rounded-lg py-3 items-center"
                  >
                    <Text className="text-gray-900 text-sm font-inter-bold">View Stream</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEndStream(liveStream.id)}
                    className="bg-red-500 rounded-lg py-3 px-4 items-center"
                  >
                    <Text className="text-white text-sm font-inter-bold">End Stream</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Next Stream */}
          {upcomingStreams.length > 0 && (
            <View className="bg-green-100 rounded-lg p-4 gap-3 border border-green-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-inter-bold text-black">Next Stream</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/stream/schedule?edit=${upcomingStreams[0].id}` as unknown)}
                  className="flex-row items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2"
                >
                  <Feather name="edit-2" size={16} color="#000" />
                  <Text className="text-black text-sm font-inter-bold">Edit</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center gap-4">
                {/* Thumbnail */}
                <View className="w-40 h-40 rounded-lg overflow-hidden border border-green-200">
                  <Image
                    source={upcomingStreams[0].thumbnail}
                    contentFit="cover"
                    placeholder={{ blurhash }}
                    transition={1000}
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>

                {/* Details */}
                <View className="flex-1 gap-3">
                  <Text className="text-gray-900 text-lg font-inter-bold">{upcomingStreams[0].title}</Text>

                  <View className="flex-row items-center gap-3">
                    <View className="bg-green-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-inter-bold">SCHEDULED</Text>
                    </View>
                    <Text className="text-gray-500 text-sm font-inter">{upcomingStreams[0].category}</Text>
                  </View>

                  <Text className="text-green-800 text-xl font-inter-bold">
                    {(() => {
                      const startTime = new Date(upcomingStreams[0].start_time);
                      const diffMs = startTime.getTime() - currentTime.getTime();

                      if (diffMs <= 0) {
                        return 'Ready to go live!';
                      }

                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

                      if (hours > 0) {
                        return `${hours}h ${minutes}m ${seconds}s`;
                      } else if (minutes > 0) {
                        return `${minutes}m ${seconds}s`;
                      } else {
                        return `${seconds}s`;
                      }
                    })()}
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push(`/stream/start/${upcomingStreams[0].id}` as unknown)}
                    className="bg-green-600 rounded-lg py-3 items-center"
                  >
                    <Text className="text-white text-base font-inter-bold">Go Live</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Upcoming Streams */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-inter-bold text-black">
                {showAllUpcoming ? `All Upcoming Streams (${upcomingStreams.length - 1})` : 'Next 3 Upcoming Streams'}
              </Text>
              {upcomingStreams.length > 4 && (
                <TouchableOpacity onPress={() => setShowAllUpcoming(!showAllUpcoming)}>
                  <Text className="text-blue-600 text-sm font-inter-bold">
                    {showAllUpcoming ? 'Show Less' : `Show All ${upcomingStreams.length - 1}`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {upcomingStreams.length === 0 ? (
              <View className="items-center p-4 rounded-lg bg-white border border-gray-200">
                <Feather name="video" size={48} color="#ccc" />
                <Text className="text-gray-600 text-base font-inter-bold mt-3 mb-2">No upcoming streams</Text>
                <TouchableOpacity
                  onPress={() => router.push('/stream/schedule')}
                  className="px-6 py-3 rounded-lg bg-black mt-3"
                >
                  <Text className="text-white text-base font-inter-bold">Schedule New Stream</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {(showAllUpcoming ? upcomingStreams.slice(1) : upcomingStreams.slice(1, 4)).map((stream) => (
                  <View key={stream.id} className="p-4 rounded-lg bg-white border border-gray-200">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-inter-bold mb-1">{stream.title}</Text>
                        <View className="flex-row items-center gap-2">
                          <View className="bg-blue-500 px-2 py-1 rounded">
                            <Text className="text-white text-xs font-inter-bold">{stream.status.toUpperCase()}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs font-inter">{stream.category}</Text>

                          <View className="flex-row items-center gap-1">
                            <Feather name="clock" size={16} color="#8B5CF6" />
                            <Text className="text-sm font-inter-semibold text-purple-600">
                              {(() => {
                                const startTime = new Date(stream.start_time);
                                const diffMs = now.getTime() - startTime.getTime();
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                                if (diffMs < 0) {
                                  // Stream hasn't started yet - show time until start
                                  const timeUntilStart = Math.abs(diffMs);
                                  const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60));
                                  const minutesUntil = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));

                                  if (hoursUntil < 1) {
                                    return `in ${minutesUntil}m`;
                                  } else if (hoursUntil < 24) {
                                    return `in ${hoursUntil}h`;
                                  } else {
                                    const daysUntil = Math.floor(hoursUntil / 24);
                                    return `in ${daysUntil}d`;
                                  }
                                } else if (diffHours < 1) {
                                  return `${diffMinutes}m ago`;
                                } else if (diffHours < 24) {
                                  return `${diffHours}h ago`;
                                } else {
                                  const diffDays = Math.floor(diffHours / 24);
                                  return `${diffDays}d ago`;
                                }
                              })()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="w-20 h-20 rounded-lg overflow-hidden">
                        <Image
                          source={stream.thumbnail}
                          contentFit="cover"
                          placeholder={{ blurhash }}
                          transition={1000}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 text-sm font-inter-semibold">{formatDate(stream.start_time)}</Text>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => router.push(`/stream/schedule?edit=${stream.id}` as unknown)}
                          className="bg-transparent rounded-lg p-2"
                        >
                          <Feather name="edit" size={16} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => router.push(`/stream/start/${stream.id}` as unknown)}
                          className="bg-green-600 rounded-lg px-4 py-2"
                        >
                          <Text className="text-white text-sm font-inter-bold">Go Live</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Overdue Streams */}
          {overdueStreams.length > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-inter-bold text-red-600">Overdue Streams ({overdueStreams.length})</Text>
                {overdueStreams.length > 1 && (
                  <TouchableOpacity onPress={() => setShowAllOverdue(!showAllOverdue)}>
                    <Text className="text-red-600 text-sm font-inter-bold">
                      {showAllOverdue ? 'Show Less' : `Show All (${overdueStreams.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {(showAllOverdue ? overdueStreams : overdueStreams.slice(0, 1)).map((stream) => (
                <View key={stream.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 gap-3">
                      <View className="w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          source={stream.thumbnail}
                          contentFit="cover"
                          placeholder={{ blurhash }}
                          transition={1000}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                      <View className="flex-1 gap-2">
                        <Text className="text-gray-900 text-base font-inter-bold" numberOfLines={1}>
                          {stream.title}
                        </Text>
                        <View className="flex-row items-center">
                          <View className="bg-red-600 px-2 py-0.5 rounded">
                            <Text className="text-white text-xs font-inter-bold">OVERDUE</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleCancelStream(stream.id)}
                        className="bg-red-500 rounded-lg p-2"
                      >
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push(`/stream/schedule?edit=${stream.id}` as unknown)}
                        className="bg-white border border-gray-300 rounded-lg p-2"
                      >
                        <Feather name="edit" size={16} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Previous Streams */}
          <View className="gap-3">
            <Text className="text-lg font-inter-bold text-black">Previous Streams</Text>
            {previousStreams.length > 0 ? (
              <View className="gap-3">
                {previousStreams.slice(0, 5).map((stream) => (
                  <TouchableOpacity
                    key={stream.id}
                    onPress={() => router.push(`/stream/${stream.id}` as unknown)}
                    className="flex-row items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <View className="w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        source={stream.thumbnail}
                        contentFit="cover"
                        placeholder={{ blurhash }}
                        transition={1000}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                    <View className="flex-1 gap-2">
                      <Text className="text-gray-900 text-base font-inter-bold" numberOfLines={1}>
                        {stream.title}
                      </Text>
                      <Text className="text-gray-500 text-sm font-inter">
                        {formatDate(stream.start_time)} • {stream.category}
                      </Text>
                    </View>
                    <View className="items-end gap-2">
                      <Text className="text-gray-900 text-sm font-inter-bold">{stream.viewer_count} views</Text>
                      <View className="bg-gray-200 px-2 py-1 rounded">
                        <Text className="text-gray-600 text-xs font-inter-bold">{stream.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-white rounded-lg p-8 items-center">
                <View className="w-16 h-16 rounded-full border-2 border-gray-300 items-center justify-center mb-4">
                  <Feather name="play" size={24} color="#9CA3AF" />
                </View>
                <Text className="text-gray-600 text-base font-inter-bold mb-2">No previous streams yet</Text>
                <Text className="text-gray-500 text-sm font-inter text-center">
                  Your completed streams will appear here
                </Text>
              </View>
            )}
          </View>

          {streams.length === 0 && (
            <View className="flex-1 items-center justify-center p-8">
              <Feather name="video" size={64} color="#ccc" />
              <Text className="text-gray-600 text-lg font-inter-bold mt-4 mb-2">No streams yet</Text>
              <Text className="text-gray-500 text-sm font-inter text-center mb-6">
                Start engaging with your audience by scheduling your first live stream
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/stream/schedule')}
                className="px-6 py-3 rounded-lg bg-black"
              >
                <Text className="text-white text-base font-inter-bold">Schedule Your First Stream</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={endStreamModal.visible}
        onClose={() => setEndStreamModal({ visible: false, streamId: null })}
        onConfirm={confirmEndStream}
        title="End Stream"
        message="Are you sure you want to end this stream? This action cannot be undone."
        confirmText="End Stream"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        isLoading={isProcessing}
      />

      <ConfirmationModal
        visible={cancelStreamModal.visible}
        onClose={() => setCancelStreamModal({ visible: false, streamId: null })}
        onConfirm={confirmCancelStream}
        title="Cancel Stream"
        message="Are you sure you want to cancel this stream? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No"
        confirmButtonStyle="destructive"
        isLoading={isProcessing}
      />
    </SafeAreaView>
  );
}
