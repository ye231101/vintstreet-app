import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OurCommunityScreen() {
  const { title, description } = useLocalSearchParams<{
    title?: string;
    description?: string;
  }>();

  const handleShopCommunityItems = () => {
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="relative w-full aspect-[16/7] overflow-hidden">
          <Image
            source={require('@/assets/images/homepage_slider/5.jpg')}
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
          {/* Community Building Section */}
          {buildSection({
            title: 'Powered by People',
            content:
              "At Vint Street, we believe the best things are passed between hands. So we've built more than a marketplace—we've built a community.",
            icon: 'users',
          })}

          {/* Who We Are Section */}
          {buildSection({
            title: 'Who We Are',
            content:
              'A community of sellers, collectors, storytellers, and treasure-hunters. People who care about sustainability. People living with their stock. People like you.',
            icon: 'heart',
          })}

          {/* Word on the Street Section */}
          {buildSection({
            title: 'Word on the Street',
            content:
              'Follow the stories behind the pieces in Word on the Street, where we dive into decades of design, share seller tips, and celebrate the stuff that never goes out of style.',
            icon: 'file-text',
          })}

          {/* Call to Action Section */}
          {buildSection({
            title: 'Join Us',
            content:
              'So come for the bargains. Stay for the stories. And make the circular economy a little more stylish.',
            icon: 'award',
          })}

          {/* Call to Action */}
          <View className="w-full p-4 mt-4 rounded-lg bg-gray-100">
            <Text className="mb-3 text-xl font-inter-bold text-black text-center">Shop Community Items</Text>
            <Text className="mb-5 text-base text-gray-700 text-center">
              Discover unique pieces from our community sellers.
            </Text>
            <TouchableOpacity
              onPress={handleShopCommunityItems}
              className="w-full h-14 items-center justify-center rounded-lg bg-black"
            >
              <Text className="text-base font-inter-bold text-white">Shop Community Items</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
