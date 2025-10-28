import { Stream, streamsService } from '@/api';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveStreamsScreen() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await streamsService.getLiveStreams();
      setStreams(data);
    } catch (err) {
      console.error('Error loading live streams:', err);
      setError(err instanceof Error ? err.message : 'Error loading live streams');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStreams();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Live Streams</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-3 text-base font-inter-bold text-white">Loading live streams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Live Streams</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="my-4 text-lg font-inter-bold text-white">Error loading streams</Text>
          <TouchableOpacity onPress={loadStreams} className="bg-white rounded-lg py-3 px-6">
            <Text className="text-base font-inter-bold text-black">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Live Streams</Text>
        <TouchableOpacity onPress={loadStreams}>
          <Feather name="refresh-cw" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000']} tintColor="#000" />
        }
      >
        {streams.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8 mt-20">
            <Feather name="video-off" size={64} color="#ccc" />
            <Text className="text-gray-600 text-lg font-inter-bold mt-4 mb-2">No live streams</Text>
            <Text className="text-gray-500 text-sm font-inter text-center">
              Check back later for live streams from sellers
            </Text>
          </View>
        ) : (
          <View className="p-4">
            <View className="flex-row items-center mb-4">
              <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              <Text className="text-gray-600 text-sm font-inter-bold">{streams.length} LIVE NOW</Text>
            </View>

            {streams.map((stream) => (
              <TouchableOpacity
                key={stream.id}
                onPress={() => router.push(`/stream/${stream.id}` as any)}
                className="bg-white rounded-xl overflow-hidden mb-4 shadow-sm"
              >
                {/* Stream Thumbnail */}
                <View className="relative">
                  <Image
                    source={{
                      uri: stream.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=450&fit=crop',
                    }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                  {/* Live Badge */}
                  <View className="absolute top-3 left-3 bg-red-500 px-3 py-1.5 rounded-full flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-white mr-2" />
                    <Text className="text-white text-xs font-inter-bold">LIVE</Text>
                  </View>
                  {/* Viewer Count */}
                  <View className="absolute top-3 right-3 bg-black/70 px-3 py-1.5 rounded-full flex-row items-center">
                    <Feather name="users" size={12} color="#fff" />
                    <Text className="text-white text-xs font-inter-bold ml-1.5">{stream.viewer_count}</Text>
                  </View>
                </View>

                {/* Stream Info */}
                <View className="p-4">
                  <Text className="text-gray-900 text-lg font-inter-bold mb-1">{stream.title}</Text>
                  <Text className="text-gray-600 text-sm font-inter mb-2" numberOfLines={2}>
                    {stream.description}
                  </Text>
                  <View className="flex-row items-center">
                    <View className="bg-purple-500 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-inter-bold">{stream.category}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

