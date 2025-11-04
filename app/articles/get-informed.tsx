import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GetInformedScreen() {
  const { title, description } = useLocalSearchParams<{
    title?: string;
    description?: string;
  }>();

  const handleReadMore = async () => {
    const url = 'https://vintstreet.com/always-check-the-label-the-rosetta-stone-of-reselling';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const buildSection = ({ title, content, icon }: { title: string; content: string; icon: string }) => (
    <View className="gap-3 p-4 mb-4 rounded-lg bg-gray-100">
      <View className="flex-row items-center gap-3">
        <Feather name={icon as any} size={24} color="#000" />
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
            source={require('@/assets/images/homepage_slider/4.jpg')}
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
          {/* Main Message Section */}
          {buildSection({
            title: 'Always Check the Label',
            content:
              "Most people don't give a second thought to the inside label of a shirt. It's like blinking, going back for seconds, or some people, not indicating at roundabouts. But in the world of vintage? That tiny tag is everything.",
            icon: 'tag',
          })}

          {/* Brand Matters Section */}
          {buildSection({
            title: 'Brand Matters',
            content:
              "Brand matters — but it's not just about who made it, it's when they made it. Labels evolve over time, and those subtle differences can help you date a piece almost to the year.",
            icon: 'clock',
          })}

          {/* Research Section */}
          {buildSection({
            title: 'Do Your Research',
            content:
              "Even if you're not a label nerd (yet), a quick Google can reveal a lot. Entire Reddit threads and Instagram accounts are devoted to this stuff.",
            icon: 'search',
          })}

          {/* What to Look For Section */}
          {buildSection({
            title: 'What to Look For',
            content:
              "Font & Design – Logos change over time. If it looks different from what's in-store now, you might be holding a legit vintage gem.\n\nCare Instructions – If they're missing, it's probably older than you are. Washing symbols only became standard in the '70s and '80s.",
            icon: 'eye',
          })}

          {/* Example Section */}
          {buildSection({
            title: "Example: Levi's Red Tabs",
            content:
              "For example, Levi's red tabs: If it has a big capital 'E', it was made before '71, and will be worth a bit more. It's these details you have to keep an eye out for.",
            icon: 'info',
          })}

          {/* Final Advice Section */}
          {buildSection({
            title: 'Final Advice',
            content:
              "In short: check the label and give it a Google. And whatever you do, don't cut it out. Read the rest here, and for more on all things second-hand, guides, news, and throwbacks, head over to Word on the Street, our blog on all things vintage.",
            icon: 'help-circle',
          })}

          {/* Call to Action */}
          <View className="w-full p-4 mt-4 rounded-lg bg-gray-100">
            <Text className="mb-3 text-xl font-inter-bold text-black text-center">Ready to Learn More?</Text>
            <Text className="mb-5 text-base text-gray-700 text-center">
              Read more about vintage fashion and reselling on our blog.
            </Text>
            <TouchableOpacity
              onPress={handleReadMore}
              className="w-full h-14 items-center justify-center rounded-lg bg-black"
            >
              <Text className="text-base font-inter-bold text-white">Read More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
