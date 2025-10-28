import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
    <View className="p-4 bg-gray-100 rounded-lg mb-4">
      <View className="flex-row items-center mb-3">
        <Feather name={icon as any} size={24} color="#000" />
        <Text className="ml-3 flex-1 text-lg font-inter-bold text-black">{title}</Text>
      </View>
      <Text className="text-base text-black/87 leading-6">{content}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-inter-bold text-black">{title || 'Our Community'}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="w-full aspect-[16/7] overflow-hidden">
          <Image
            source={require('@/assets/images/homepage_slider/5.jpg')}
            contentFit="cover"
            placeholder={{ blurhash }}
            transition={1000}
            style={{ width: '100%', height: '100%' }}
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {description && (
            <View className="absolute left-4 right-4 bottom-6">
              <Text className="text-2xl font-inter-bold text-white mb-3">{title || 'Our Community'}</Text>
              <Text className="text-base font-inter-semibold text-white opacity-95">{description}</Text>
            </View>
          )}
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
          <View className="w-full p-4 bg-gray-100 rounded-lg mt-8">
            <Text className="text-xl font-inter-bold text-black text-center mb-3">Shop Community Items</Text>
            <Text className="text-base text-gray-700 text-center mb-5">
              Discover unique pieces from our community sellers.
            </Text>
            <TouchableOpacity onPress={handleShopCommunityItems} className="w-full bg-black py-4 rounded-lg">
              <Text className="text-white text-base font-inter-bold text-center">Shop Community Items</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
