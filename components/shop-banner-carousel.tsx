import { bannersService } from '@/api/services';
import { blurhash } from '@/utils';
import { logger } from '@/utils/logger';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ShopBanner {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
  category_id?: string;
  display_order?: number;
  is_active: boolean;
}

export default function ShopBannerCarousel() {
  const [banners, setBanners] = useState<ShopBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollPosition = useRef(0);
  const isScrolling = useRef(false);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrolling = useRef(false);
  const userScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0 && scrollRef.current) {
      // Start at the first real banner (after the duplicated ones at the beginning)
      setTimeout(() => {
        const bannerWidth = screenWidth - 16;
        scrollRef.current?.scrollTo({
          x: bannerWidth * banners.length,
          animated: false,
        });
        scrollPosition.current = bannerWidth * banners.length;
      }, 100);
    }
  }, [banners]);

  // Auto-scroll functionality
  useEffect(() => {
    if (banners.length <= 1) return; // Don't auto-scroll if there's only one or no banners

    const startAutoScroll = () => {
      // Clear unknown existing timer
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }

      // Set up auto-scroll interval (change every 5 seconds)
      autoScrollTimer.current = setInterval(() => {
        if (!isUserScrolling.current && scrollRef.current && banners.length > 0) {
          const bannerWidth = screenWidth - 16;
          const currentScrollX = scrollPosition.current;
          const currentIndex = Math.round(currentScrollX / bannerWidth);

          // Calculate next index (we're in the middle set, so add 1)
          let nextIndex = currentIndex + 1;

          // If we've reached the end of the middle set (last real banner at index = banners.length * 2 - 1),
          // loop back to the first real banner (index = banners.length)
          if (nextIndex >= banners.length * 2) {
            // We're at the end, loop back to the first banner
            nextIndex = banners.length;
          }

          scrollRef.current.scrollTo({
            x: bannerWidth * nextIndex,
            animated: true,
          });

          scrollPosition.current = bannerWidth * nextIndex;
        }
      }, 5000); // Change banner every 5 seconds
    };

    startAutoScroll();

    // Cleanup on unmount
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
    };
  }, [banners]);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const data = await bannersService.getShopBanners(10);
      setBanners(data);
    } catch (error) {
      logger.error('Error fetching shop banners:', error);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onScroll = (event: unknown) => {
    if (isScrolling.current || banners.length === 0) return;

    const scrollX = event.nativeEvent.contentOffset.x;
    const bannerWidth = screenWidth - 16;
    const currentIndex = Math.round(scrollX / bannerWidth);

    scrollPosition.current = scrollX;

    // Calculate the actual index for pagination dots (0 to banners.length - 1)
    // We're in the middle set of duplicated banners, so subtract banners.length
    let actualIndex = currentIndex - banners.length;
    if (actualIndex < 0) {
      actualIndex = banners.length + actualIndex;
    }
    if (actualIndex >= banners.length) {
      actualIndex = actualIndex - banners.length;
    }
    setIndex(actualIndex);

    // Mark that user is scrolling
    isUserScrolling.current = true;

    // Clear existing timeout
    if (userScrollTimeout.current) {
      clearTimeout(userScrollTimeout.current);
    }

    // Reset user scrolling flag after a delay
    userScrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 3000); // Resume auto-scroll 3 seconds after user stops scrolling
  };

  const onScrollEnd = (event: unknown) => {
    if (banners.length === 0) return;

    const scrollX = event.nativeEvent.contentOffset.x;
    const bannerWidth = screenWidth - 16;
    const currentIndex = Math.round(scrollX / bannerWidth);

    isScrolling.current = true;

    // If at the duplicated items at the beginning (first set), jump to the real ones (middle set)
    if (currentIndex < banners.length) {
      const targetIndex = currentIndex + banners.length;
      scrollRef.current?.scrollTo({
        x: bannerWidth * targetIndex,
        animated: false,
      });
      scrollPosition.current = bannerWidth * targetIndex;
    }
    // If at the duplicated items at the end (third set), jump to the real ones (middle set)
    else if (currentIndex >= banners.length * 2) {
      const targetIndex = currentIndex - banners.length;
      scrollRef.current?.scrollTo({
        x: bannerWidth * targetIndex,
        animated: false,
      });
      scrollPosition.current = bannerWidth * targetIndex;
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 100);
  };

  const handlePress = (banner: ShopBanner) => {
    if (banner.link_url) {
      // If it's a category link, navigate to discovery with category
      if (banner.category_id) {
        router.push(`/(tabs)/discovery?category=${banner.category_id}` as unknown);
      } else if (banner.link_url.startsWith('/')) {
        // Internal route
        router.push(banner.link_url as unknown);
      }
    }
  };

  if (isLoading || banners.length === 0) {
    return null;
  }

  // Create infinite scroll by duplicating banners
  // Structure: [duplicated end] [real banners] [duplicated beginning]
  const infiniteBanners = [...banners, ...banners, ...banners];

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
          onScrollBeginDrag={() => {
            isUserScrolling.current = true;
          }}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          className="absolute inset-0"
        >
          {infiniteBanners.map((banner, i) => (
            <Pressable
              key={`${banner.id}-${i}`}
              onPress={() => handlePress(banner)}
              className="relative"
              style={{ width: screenWidth - 16, aspectRatio: 16 / 7 }}
            >
              <Image
                source={{ uri: banner.image_url }}
                contentFit="cover"
                placeholder={{ blurhash }}
                style={{ width: '100%', height: '100%' }}
                transition={1000}
              />
              {(banner.title || banner.description) && (
                <>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="absolute inset-0"
                  />
                  <View className="absolute left-4 right-4 bottom-6">
                    {banner.title && <Text className="text-2xl font-inter-bold text-white mb-3">{banner.title}</Text>}
                    {banner.description && (
                      <Text className="text-base font-inter-semibold text-white opacity-95">{banner.description}</Text>
                    )}
                  </View>
                </>
              )}
            </Pressable>
          ))}
        </ScrollView>
        {banners.length > 1 && (
          <View pointerEvents="none" className="absolute left-0 right-0 bottom-3 flex-row items-center justify-center">
            {banners.map((banner, i) => (
              <View
                key={banner.id}
                className="w-1.5 h-1.5 rounded-full mx-1"
                style={{ backgroundColor: i === index ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
