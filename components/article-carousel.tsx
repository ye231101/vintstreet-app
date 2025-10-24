import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

type NavigationType = 'internal' | 'helpCenter';

interface ArticleItem {
  id: number;
  title: string;
  subtitle: string;
  image: any;
  link?: string;
  navigationType?: NavigationType;
  routeName?: string;
}

const articles: ArticleItem[] = [
  {
    id: 1,
    title: 'Meet Vint Street',
    subtitle: 'What, who, where, why, and how',
    image: require('@/assets/images/homepage_slider/1.jpg'),
    link: 'https://vintstreet.com/about',
    navigationType: 'internal',
    routeName: '/articles/meet-vint-street',
  },
  {
    id: 2,
    title: 'Buying, Selling & Re-Listing',
    subtitle: 'Learn how it all works',
    image: require('@/assets/images/homepage_slider/2.jpg'),
    link: 'https://vintstreet.com/sell',
    navigationType: 'internal',
    routeName: '/articles/selling-relisting',
  },
  {
    id: 4,
    title: 'Get Informed',
    subtitle: 'See the best fits. Add yours.',
    image: require('@/assets/images/homepage_slider/4.jpg'),
    link: 'https://vintstreet.com/inspiration',
    navigationType: 'internal',
    routeName: '/articles/get-informed',
  },
  {
    id: 5,
    title: 'Our Community',
    subtitle: 'Join the discussion',
    image: require('@/assets/images/homepage_slider/5.jpg'),
    link: 'https://vintstreet.com/community',
    navigationType: 'internal',
    routeName: '/articles/our-community',
  },
  {
    id: 6,
    title: 'Help Centre',
    subtitle: 'Problem? Solved!',
    image: require('@/assets/images/homepage_slider/6.jpg'),
    link: 'https://vintstreet.com/help',
    navigationType: 'helpCenter',
    routeName: '/account/help-center',
  },
];

export default function ArticleCarousel() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const viewWidth = event.nativeEvent.layoutMeasurement.width;
    const current = Math.round(contentOffsetX / viewWidth);
    if (current !== index) setIndex(current);
  };

  const launchUrl = async (url?: string) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {}
  };

  const handleTap = (item: ArticleItem) => {
    switch (item.navigationType) {
      case 'internal': {
        break;
      }
      case 'helpCenter': {
        break;
      }
      default: {
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
          {articles.map((item) => (
            <View key={item.id} style={{ width: screenWidth - 16 }}>
              <Pressable onPress={() => handleTap(item)} className="w-full relative" style={{ aspectRatio: 16 / 7 }}>
                <Image source={item.image} resizeMode="cover" className="w-full h-full" />
                <LinearGradient
                  colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="absolute inset-0"
                />
                <View className="absolute left-4 right-4 bottom-6">
                  <Text className="text-2xl font-inter-bold text-white mb-3">{item.title}</Text>
                  <Text className="text-base font-inter text-white opacity-95">{item.subtitle}</Text>
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View pointerEvents="none" className="absolute left-0 right-0 bottom-3 flex-row justify-center items-center">
          {articles.map((_, i) => (
            <View
              key={i}
              className="w-1.5 h-1.5 rounded-full mx-1"
              style={{ backgroundColor: i === index ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
