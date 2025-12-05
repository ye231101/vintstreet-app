import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MeetVintStreetScreen() {
  const { title, description } = useLocalSearchParams<{
    title?: string;
    description?: string;
  }>();

  const handleBrowseItems = () => {
    router.push('/(tabs)/discovery');
  };

  const buildSection = ({ title, content, icon }: { title: string; content: string; icon: string }) => (
    <View className="gap-3 p-4 mb-4 rounded-lg bg-gray-100">
      <View className="flex-row items-center gap-3">
        <Feather name={icon as unknown} size={24} color="#000" />
        <Text className="flex-1 text-lg font-inter-bold text-black">{title}</Text>
      </View>
      <Text className="text-sm font-inter text-black/80 leading-6">{content}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-inter-bold text-black">{title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Hero Image */}
        <View className="relative w-full aspect-[16/7] overflow-hidden">
          <Image
            source={require('@/assets/images/homepage_slider/1.jpg')}
            contentFit="cover"
            placeholder={{ blurhash }}
            transition={1000}
            style={{ width: '100%', height: '100%' }}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="absolute inset-0"
          />
          <View className="absolute left-4 right-4 bottom-6">
            <Text className="text-2xl font-inter-bold text-white mb-3">{title}</Text>
            <Text className="text-base font-inter-semibold text-white opacity-95">{description}</Text>
          </View>
        </View>

        <View className="p-4">
          {/* Main Content Section */}
          {buildSection({
            title: 'Meet Vint Street',
            content:
              'Vint Street is a vintage marketplace built on second chances, sustainable choices, and stories worth sharing.',
            icon: 'shopping-bag',
          })}

          {/* Our Story Section */}
          {buildSection({
            title: 'Our Story',
            content:
              "We started in 2023 after rescuing a haul of clothes and collectibles from landfill, the spark that lit our mission to re-love the pre-loved. We've come a long way since then, and we want you to be part of what we're building.",
            icon: 'clock',
          })}

          {/* What We Do Section */}
          {buildSection({
            title: 'What We Do',
            content:
              'Buy, sell, or re-list — we keep good things moving and help you find pieces with soul. No fast fashion. No waste. Just items with history and heart.',
            icon: 'refresh-cw',
          })}

          {/* Community Section */}
          {buildSection({
            title: 'Our Community',
            content:
              "We're powered by a community of sellers, collectors, and treasure-hunters who care about where things come from and where they're going. Join us, and give great pieces the second life they deserve.",
            icon: 'users',
          })}

          {/* Call to Action */}
          <View className="w-full p-4 mt-4 rounded-lg bg-gray-100">
            <Text className="mb-3 text-xl font-inter-bold text-black text-center">Ready to Explore?</Text>
            <Text className="mb-5 text-base text-gray-700 text-center">
              Start your vintage journey today and discover unique pieces that define your style.
            </Text>
            <TouchableOpacity
              onPress={handleBrowseItems}
              className="w-full h-14 items-center justify-center rounded-lg bg-black"
            >
              <Text className="text-base font-inter-bold text-white">Browse Items</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
