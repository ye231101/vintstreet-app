import { Stream, streamsService } from '@/api/services/streams.service';
import { useAuth } from '@/hooks/use-auth';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StartStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [stream, setStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

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

      if (data.status !== 'scheduled') {
        showErrorToast('This stream cannot be started');
        router.back();
        return;
      }

      setStream(data);
    } catch (error) {
      console.error('Error loading stream:', error);
      showErrorToast('Failed to load stream');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStream = async () => {
    if (!stream) return;

    Alert.alert('Start Stream', 'Are you ready to go live? Make sure your camera and microphone are working.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Go Live',
        onPress: async () => {
          setIsStarting(true);
          try {
            await streamsService.startStream(stream.id);
            showSuccessToast('Stream started successfully! You are now LIVE');
            router.replace(`/stream/${stream.id}` as any);
          } catch (error) {
            console.error('Error starting stream:', error);
            showErrorToast('Failed to start stream');
          } finally {
            setIsStarting(false);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center p-4 bg-gray-50">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stream) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4 gap-4 bg-gray-50">
          {/* Stream Preview */}
          <View className="w-full h-48 rounded-lg overflow-hidden">
            <Image source={stream.thumbnail} contentFit="cover" style={{ width: '100%', height: '100%' }} />
          </View>

          {/* Stream Info Card */}
          <View className="bg-gray-900 rounded-lg p-4 gap-4">
            <Text className="text-white text-xl font-inter-bold">{stream.title}</Text>
            {stream.description && <Text className="text-gray-300 text-base font-inter">{stream.description}</Text>}

            <View className="self-start bg-purple-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-inter-bold">{stream.category}</Text>
            </View>

            <View className="flex-row items-center">
              <Feather name="clock" size={16} color="#fff" />
              <Text className="text-gray-400 text-sm font-inter ml-2">Scheduled: {formatDate(stream.start_time)}</Text>
            </View>
          </View>

          {/* Pre-stream Checklist */}
          <View className="bg-gray-900 rounded-lg p-4 gap-4">
            <Text className="text-white text-lg font-inter-bold">Pre-Stream Checklist</Text>

            <ChecklistItem
              icon="wifi"
              text="Stable internet connection"
              subtext="Minimum 5 Mbps upload speed recommended"
            />
            <ChecklistItem icon="video" text="Camera working properly" subtext="Test your video quality" />
            <ChecklistItem icon="mic" text="Microphone configured" subtext="Check audio levels" />
            <ChecklistItem icon="sun" text="Good lighting" subtext="Make sure you're well lit and visible" />
            <ChecklistItem icon="package" text="Products ready" subtext="Have items prepared to showcase" />
          </View>

          {/* Important Notes */}
          <View className="bg-yellow-100/30 border border-yellow-500/50 rounded-lg p-4">
            <View className="flex-col gap-2">
              <View className="flex-row items-center gap-2">
                <Feather name="alert-triangle" size={20} color="#000" />
                <Text className="text-black text-base font-inter-bold">Important Notes</Text>
              </View>
              <View className="flex-1 pl-6">
                <Text className="text-black text-sm font-inter">
                  • Once you go live, viewers will be able to join immediately
                </Text>
                <Text className="text-black text-sm font-inter">• Be professional and follow community guidelines</Text>
                <Text className="text-black text-sm font-inter">• Engage with your audience through chat</Text>
                <Text className="text-black text-sm font-inter">• You can end the stream at any time</Text>
              </View>
            </View>
          </View>

          {/* Start Stream Button */}
          <TouchableOpacity
            onPress={handleStartStream}
            disabled={isStarting}
            className="bg-red-600 rounded-lg py-4 items-center"
            style={{ opacity: isStarting ? 0.6 : 1 }}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Feather name="video" size={20} color="#fff" />
                <Text className="text-white text-lg font-inter-bold ml-2">Go Live Now</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Edit Stream Button */}
          <TouchableOpacity
            onPress={() => router.push(`/stream/schedule?edit=${stream.id}` as any)}
            className="bg-gray-700 rounded-lg py-4 items-center"
          >
            <View className="flex-row items-center">
              <Feather name="edit" size={20} color="#fff" />
              <Text className="text-white text-lg font-inter-bold ml-2">Edit Stream Details</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChecklistItem({ icon, text, subtext }: { icon: string; text: string; subtext: string }) {
  return (
    <View className="flex-row items-start mb-4 last:mb-0">
      <View className="bg-green-500/20 w-10 h-10 rounded-full items-center justify-center mr-3">
        <Feather name={icon as any} size={18} color="#22C55E" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-inter-semibold">{text}</Text>
        <Text className="text-gray-400 text-xs font-inter mt-0.5">{subtext}</Text>
      </View>
    </View>
  );
}
