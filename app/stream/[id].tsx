import { Stream, streamsService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (id) {
      loadStream();
    }
  }, [id]);

  useEffect(() => {
    // Increment viewer count when joining
    if (stream && stream.status === 'live' && !isJoined) {
      streamsService.incrementViewerCount(stream.id);
      setIsJoined(true);
    }

    // Decrement viewer count when leaving
    return () => {
      if (stream && stream.status === 'live' && isJoined) {
        streamsService.decrementViewerCount(stream.id);
      }
    };
  }, [stream, isJoined]);

  const loadStream = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await streamsService.getStream(id);
      if (!data) {
        setError('Stream not found');
        return;
      }
      setStream(data);
    } catch (err) {
      console.error('Error loading stream:', err);
      setError(err instanceof Error ? err.message : 'Error loading stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!stream || stream.seller_id !== user?.id) return;

    Alert.alert('End Stream', 'Are you sure you want to end this stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream',
        style: 'destructive',
        onPress: async () => {
          try {
            await streamsService.endStream(stream.id);
            showSuccessToast('Stream ended successfully');
            router.back();
          } catch (error) {
            console.error('Error ending stream:', error);
            showErrorToast('Failed to end stream');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading stream...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !stream) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-red-500">{error ? error : 'Stream not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-black rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-black">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isStreamOwner = stream.seller_id === user?.id;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4">
          {/* Stream Video Placeholder */}
          <View className="relative">
            <View className="w-full h-64">
              <Image
                source={stream.thumbnail}
                contentFit="cover"
                placeholder={{ blurhash }}
                transition={1000}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            {stream.status === 'live' && (
              <View className="absolute top-4 left-4 bg-red-500 px-3 py-1.5 rounded-full flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-white mr-2" />
                <Text className="text-white text-xs font-inter-bold">LIVE</Text>
              </View>
            )}
            {stream.status === 'live' && (
              <View className="absolute top-4 right-4 bg-black/70 px-3 py-1.5 rounded-full flex-row items-center">
                <Feather name="users" size={14} color="#fff" />
                <Text className="text-white text-xs font-inter-bold ml-1.5">{stream.viewer_count}</Text>
              </View>
            )}
            {stream.status !== 'live' && (
              <View className="absolute inset-0 bg-black/60 items-center justify-center">
                <Feather name="play-circle" size={64} color="#fff" />
                <Text className="text-white text-base font-inter-bold mt-4">
                  {stream.status === 'scheduled' ? 'Stream Scheduled' : 'Stream Ended'}
                </Text>
              </View>
            )}
          </View>

          {/* Stream Info */}
          <View className="p-4 gap-4">
            <Text className="text-black text-2xl font-inter-bold">{stream.title}</Text>

            {/* Description */}
            {stream.description && <Text className="text-black text-base font-inter">{stream.description}</Text>}

            {/* Category Badge */}
            <View className="flex-row items-center">
              <View className="bg-purple-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-inter-bold">{stream.category}</Text>
              </View>
            </View>

            {/* Stream Details */}
            <View className="bg-gray-900 rounded-xl p-4 gap-3">
              <View className="gap-2">
                <View className="flex-row items-center gap-3">
                  <Feather name="clock" size={18} color="#fff" />
                  <Text className="text-white text-lg font-inter-semibold">
                    {stream.status === 'scheduled' ? 'Starts' : 'Started'}
                  </Text>
                </View>

                <Text className="text-gray-400 text-sm font-inter ml-8">{formatDate(stream.start_time)}</Text>
              </View>

              {stream.end_time && (
                <View className="gap-2">
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text className="text-white text-sm font-inter-semibold ml-3">Ended</Text>
                  </View>
                  <Text className="text-gray-400 text-sm font-inter ml-8">{formatDate(stream.end_time)}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {isStreamOwner && stream.status === 'scheduled' && (
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => router.push(`/stream/start/${stream.id}` as any)}
                  className="flex-1 bg-green-600 rounded-lg py-4 items-center"
                >
                  <Text className="text-white text-base font-inter-bold">Go Live</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/stream/schedule?edit=${stream.id}` as any)}
                  className="bg-gray-700 rounded-lg py-4 px-6 items-center"
                >
                  <Feather name="edit" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
