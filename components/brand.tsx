import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Brand {
  id: number;
  name: string;
  image: string;
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

const BrandCard = ({ brand }: { brand: Brand }) => (
  <View
    className="bg-white rounded-lg p-2 mr-2 mb-2 border border-gray-200 items-center justify-center"
    style={{
      width: screenWidth / 3,
      height: screenWidth / 4,
    }}
  >
    <Image source={brand.image} contentFit="contain" transition={1000} style={{ width: '100%', height: '100%' }} />
  </View>
);

export default function Brand() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {Array.from({ length: Math.ceil(brands.length / 2) }).map((_, colIndex) => {
        const first = brands[colIndex * 2];
        const second = brands[colIndex * 2 + 1];
        return (
          <View key={colIndex}>
            {first && <BrandCard key={first.id} brand={first} />}
            {second && <BrandCard key={second.id} brand={second} />}
          </View>
        );
      })}
    </ScrollView>
  );
}
