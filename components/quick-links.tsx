import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

enum NavigationType {
  Internal = 'internal',
  HelpCenter = 'helpCenter',
  External = 'external',
}

interface QuickLink {
  id: number;
  title: string;
  description: string;
  imageUrl: any;
  link: string;
  navigationType: NavigationType;
  routeName: string;
}

const quickLinks: QuickLink[] = [
  {
    id: 1,
    title: 'Meet Vint Street',
    description: 'What, who, where, why, and how',
    imageUrl: require('@/assets/images/homepage_slider/1.jpg'),
    link: 'https://vintstreet.com/about',
    navigationType: NavigationType.Internal,
    routeName: '/articles/meet-vint-street',
  },
  {
    id: 2,
    title: 'Buying, Selling & Re-Listing',
    description: 'Learn how it all works',
    imageUrl: require('@/assets/images/homepage_slider/2.jpg'),
    link: 'https://vintstreet.com/sell',
    navigationType: NavigationType.Internal,
    routeName: '/articles/selling-relisting',
  },
  {
    id: 3,
    title: 'Get Informed',
    description: 'See the best fits. Add yours.',
    imageUrl: require('@/assets/images/homepage_slider/3.jpg'),
    link: 'https://vintstreet.com/inspiration',
    navigationType: NavigationType.Internal,
    routeName: '/articles/get-informed',
  },
  {
    id: 4,
    title: 'Our Community',
    description: 'Join the discussion',
    imageUrl: require('@/assets/images/homepage_slider/4.jpg'),
    link: 'https://vintstreet.com/community',
    navigationType: NavigationType.Internal,
    routeName: '/articles/our-community',
  },
  {
    id: 5,
    title: 'Help Centre',
    description: 'Problem? Solved!',
    imageUrl: require('@/assets/images/homepage_slider/5.jpg'),
    link: 'https://vintstreet.com/help',
    navigationType: NavigationType.HelpCenter,
    routeName: '/account/help-center',
  },
];

export default function QuickLinks() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(quickLinks[0].id);

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewWidth = event.nativeEvent.layoutMeasurement.width;
    const current = Math.round(contentOffsetX / viewWidth);
    if (current + 1 !== index) setIndex(current + 1);
  };

  const launchUrl = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {}
  };

  const handleTap = (item: QuickLink) => {
    switch (item.navigationType) {
      case NavigationType.Internal: {
        // Pass the item data as parameters to the article screen
        router.push({
          pathname: item.routeName as any,
          params: {
            title: item.title,
            description: item.description,
            link: item.link,
          },
        });
        break;
      }
      case NavigationType.HelpCenter: {
        router.push('/other/help-center' as any);
        break;
      }
      case NavigationType.External: {
        launchUrl(item.link);
        break;
      }
      default: {
        launchUrl(item.link);
        break;
      }
    }
  };

  return (
    <View className="items-center">
      <View
        className="relative overflow-hidden rounded-xl"
        style={{
          width: screenWidth - 16,
          aspectRatio: 16 / 7,
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          className="absolute inset-0"
        >
          {quickLinks.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleTap(item)}
              className="relative"
              style={{ width: screenWidth - 16, aspectRatio: 16 / 7 }}
            >
              <Image source={item.imageUrl} resizeMode="cover" className="w-full h-full" />
              <LinearGradient
                colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="absolute inset-0"
              />
              <View className="absolute left-4 right-4 bottom-6">
                <Text className="text-2xl font-inter-bold text-white mb-3">{item.title}</Text>
                <Text className="text-base font-inter-semibold text-white opacity-95">{item.description}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <View pointerEvents="none" className="absolute left-0 right-0 bottom-3 flex-row items-center justify-center">
          {quickLinks.map((item) => (
            <View
              key={item.id}
              className="w-1.5 h-1.5 rounded-full mx-1"
              style={{ backgroundColor: item.id === index ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
