import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Brand {
  name: string;
  image: string;
}

const brands = [
  {
    name: "Levi's",
    image: 'https://1000logos.net/wp-content/uploads/2017/03/Levis-Logo.png',
  },
  {
    name: 'Adidas',
    image: 'https://1000logos.net/wp-content/uploads/2016/10/Adidas-Logo.png',
  },
  {
    name: 'H&M',
    image: 'https://1000logos.net/wp-content/uploads/2017/02/HM-Logo.png',
  },
  {
    name: 'Nike',
    image: 'https://1000logos.net/wp-content/uploads/2021/11/Nike-Logo.png',
  },
  {
    name: 'Zara',
    image: 'https://1000logos.net/wp-content/uploads/2022/08/Zara-logо.png',
  },
  {
    name: 'Gucci',
    image: 'https://1000logos.net/wp-content/uploads/2017/01/Gucci-Logo.png',
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
            {first && <BrandCard brand={first} />}
            {second && <BrandCard brand={second} />}
          </View>
        );
      })}
    </ScrollView>
  );
}
