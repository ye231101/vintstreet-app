import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SellingRelistingScreen() {
  const { user } = useAuth();

  const { title, description } = useLocalSearchParams<{
    title?: string;
    description?: string;
  }>();
  const handleStartShopping = () => {
    router.push('/(tabs)');
  };

  const handleStartSelling = () => {
    if (user?.user_type === 'buyer') {
      router.push('/seller/seller-setup');
    } else {
      router.push('/(tabs)/sell');
    }
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
            source={require('@/assets/images/homepage_slider/2.jpg')}
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
            title: 'Keep It Moving',
            content:
              "Whether you're hunting for your next favourite jacket or finally letting go of those records in the attic, Vint Street keeps it all moving instead of gathering dust.",
            icon: 'refresh-cw',
          })}

          {/* What We Offer Section */}
          {buildSection({
            title: 'Handpicked Stories',
            content:
              'Clothes, games, vinyl, accessories — all handpicked, all with a story. Buy what stands out, not what blends in.',
            icon: 'star',
          })}

          {/* Selling Section */}
          {buildSection({
            title: 'Selling',
            content:
              "If you're finally letting go of those records in the attic, Vint Street can help get them moving instead of gathering dust. Those old jeans you've outgrown? That old Stallone poster from your bedroom? List them. The special collections from your parents' garage? List them (assuming you have permission). Let someone else fall in love with them all over again.\n\nClick the Sell button (bottom centre, can't miss it) and fill out the form. Upload some great photos, give it an accurate title and description (be honest about unknown wear and tear), and set your price. Then add the brand from the list and categories to help buyers find it easily in search. It's simple and easy.\n\nThe more you put into it, the more likely it'll catch someone's eye.",
            icon: 'dollar-sign',
          })}

          {/* Re-Listing Section */}
          {buildSection({
            title: 'Re-Listing',
            content:
              'Bought something from Vint Street and are ready to move it on? Re-list it in seconds.\n\nJust head to your order history and hit Re-List. It will auto-fill, just update unknown new details.\n\nRe-listing made simple by Vint Street.',
            icon: 'refresh-cw',
          })}

          {/* Sustainability Message Section */}
          {buildSection({
            title: 'Sustainable Shopping',
            content:
              "Because sustainable shopping isn't just what you buy—it's what you do with what you already have.",
            icon: 'feather',
          })}

          {/* Call to Action */}
          <View className="w-full p-4 mt-4 rounded-lg bg-gray-100">
            <Text className="mb-3 text-xl font-inter-bold text-black text-center">Ready to Get Started?</Text>
            <Text className="mb-5 text-base text-gray-700 text-center">
              Start selling your vintage items or discover unique pieces from our community.
            </Text>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={handleStartShopping}
                className="w-full h-14 flex-1 items-center justify-center rounded-lg bg-black"
              >
                <Text className="text-base font-inter-bold text-white">Start Shopping</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStartSelling}
                className="w-full h-14 flex-1 items-center justify-center rounded-lg bg-white border border-black"
              >
                <Text className="text-base font-inter-bold text-black">Start Selling</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
