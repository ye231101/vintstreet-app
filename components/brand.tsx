import { brandsService } from '@/api';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Brand {
  id: number;
  name: string;
  image: string;
  brandId?: string; // Database brand ID
}

const brands = [
  {
    id: 1,
    name: "Levi's",
    image: require('../assets/images/brand/Levis-Logo.png'),
  },
  {
    id: 2,
    name: 'Adidas',
    image: require('../assets/images/brand/Adidas-Logo.png'),
  },
  {
    id: 3,
    name: 'H&M',
    image: require('../assets/images/brand/HM-Logo.png'),
  },
  {
    id: 4,
    name: 'Nike',
    image: require('../assets/images/brand/Nike-Logo.png'),
  },
  {
    id: 5,
    name: 'Zara',
    image: require('../assets/images/brand/Zara-Logo.png'),
  },
  {
    id: 6,
    name: 'Gucci',
    image: require('../assets/images/brand/Gucci-Logo.png'),
  },
];

const BrandCard = ({ brand }: { brand: Brand }) => {
  const handlePress = () => {
    // Navigate to discovery screen with brand filter
    if (brand.brandId) {
      router.push(
        `/(tabs)/discovery?brand=${encodeURIComponent(brand.brandId)}&brandName=${encodeURIComponent(
          brand.name
        )}` as any
      );
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="items-center justify-center p-2 mb-2 rounded-lg bg-white border border-gray-200 active:opacity-70"
      style={{
        width: screenWidth / 3,
        height: screenWidth / 4,
      }}
    >
      <Image source={brand.image} contentFit="contain" transition={1000} style={{ width: '100%', height: '100%' }} />
    </Pressable>
  );
};

export default function Brand() {
  const [brandsWithIds, setBrandsWithIds] = useState<Brand[]>(brands);

  useEffect(() => {
    // Fetch brand IDs from database and match with local brands
    const fetchBrandIds = async () => {
      try {
        const dbBrands = await brandsService.getBrands({ is_active: true });

        // Map local brands with database brand IDs
        const updatedBrands = brands.map((brand) => {
          const dbBrand = dbBrands.find((db) => db.name.toLowerCase() === brand.name.toLowerCase());
          return {
            ...brand,
            brandId: dbBrand?.id,
          };
        });

        setBrandsWithIds(updatedBrands);
      } catch (error) {
        console.error('Error fetching brand IDs:', error);
        // Keep using brands without database IDs if fetch fails
      }
    };

    fetchBrandIds();
  }, []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {Array.from({ length: Math.ceil(brandsWithIds.length / 2) }).map((_, colIndex) => {
          const first = brandsWithIds[colIndex * 2];
          const second = brandsWithIds[colIndex * 2 + 1];
          return (
            <View key={colIndex}>
              {first && <BrandCard key={first.id} brand={first} />}
              {second && <BrandCard key={second.id} brand={second} />}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
