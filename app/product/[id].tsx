import { typesenseService } from '@/api/services';
import { VintStreetListing } from '@/api/types/product.types';
import { useBasket } from '@/hooks/use-basket';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  likes: number;
  brand: string;
  size: string;
  description: string;
  vendorId: number;
  vendorShopName: string;
  stockQuantity: number;
  onSale: boolean;
  averageRating: number;
  reviewCount: number;
  condition: string;
  colour: string;
  gender: string;
  flaws?: string;
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addProduct } = useRecentlyViewed();
  const { addItem } = useBasket();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['description']));
  const scrollViewRef = useRef<ScrollView>(null);
  const [productListing, setProductListing] = useState<VintStreetListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product and add to recently viewed
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const productId = parseInt(id as string, 10);
        const listing = await typesenseService.getProductById(productId);

        if (listing) {
          setProductListing(listing);
          // Add to recently viewed
          await addProduct(listing);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  // Show error if product not found
  if (!productListing) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="font-poppins text-base">Product not found</Text>
          <Pressable onPress={() => router.back()} className="mt-5">
            <Text className="font-poppins-semibold text-sm text-blue-500">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Convert listing to product format for display
  const product: Product = {
    id: productListing.id,
    name: productListing.name,
    price: productListing.price,
    images: productListing.fullImageUrls.length > 0 ? productListing.fullImageUrls : productListing.thumbnailImageUrls,
    likes: productListing.favoritesCount,
    brand: productListing.brand || 'No Brand',
    size: productListing.attributes.pa_size?.[0] || '',
    description: productListing.description || productListing.shortDescription || '',
    vendorId: productListing.vendorId,
    vendorShopName: productListing.vendorShopName || 'Unknown Vendor',
    stockQuantity: productListing.stockQuantity,
    onSale: productListing.onSale,
    averageRating: productListing.averageRating,
    reviewCount: productListing.reviewCount,
    condition: productListing.attributes.pa_condition?.[0] || '',
    colour: productListing.attributes.pa_colour?.[0] || '',
    gender: productListing.attributes.pa_gender?.[0] || '',
    flaws: productListing.attributes.flaws?.[0],
  };

  const handleShoppingCart = () => {
    router.push('/basket');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddToBasket = () => {
    if (!productListing) return;

    const productData = {
      productId: productListing.id,
      name: productListing.name,
      price: productListing.price,
      quantity: 1,
      image: productListing.fullImageUrls?.[0] || '',
      vendorId: productListing.vendorId,
      vendorName: productListing.vendorShopName,
      protectionFeePercentage: productListing.vendorId === 42 ? 0 : 0.072, // 7.2% protection fee for non-official products
    };

    addItem(productData);
  };

  const handleBuyNow = () => {
    if (!productListing) return;

    // Add to basket first
    const productData = {
      productId: productListing.id,
      name: productListing.name,
      price: productListing.price,
      quantity: 1,
      image: productListing.fullImageUrls?.[0] || '',
      vendorId: productListing.vendorId,
      vendorName: productListing.vendorShopName,
      protectionFeePercentage: productListing.vendorId === 42 ? 0 : 0.072,
    };

    addItem(productData);

    // Navigate to checkout
    router.push('/checkout');
  };

  const formatPrice = (price: number) => {
    return `£${price.toFixed(2)}`;
  };

  const renderImageCarousel = () => (
    <View className="relative" style={{ height: screenWidth * (4 / 3) }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentImageIndex(index);
        }}
        className="h-full"
      >
        {product.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            className="w-full h-full"
            style={{ width: screenWidth }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Image dots */}
      <View className="absolute bottom-5 left-0 right-0 flex-row justify-center items-center">
        {product.images.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </View>
    </View>
  );

  const renderAccordionSection = (title: string, section: string, children: React.ReactNode) => {
    const isExpanded = expandedSections.has(section);

    return (
      <View className="border-b border-gray-200">
        <Pressable className="flex-row justify-between items-center px-4 py-3" onPress={() => toggleSection(section)}>
          <Text className="text-sm font-semibold text-black">{title}</Text>
          <Feather name={isExpanded ? 'chevron-down' : 'chevron-right'} size={20} color="#666" />
        </Pressable>
        {isExpanded && <View className="px-4 pb-4">{children}</View>}
      </View>
    );
  };

  const renderDescriptionContent = () => (
    <View className="py-2">
      <Text className="text-xs font-bold text-black mb-1">{product.name}</Text>
      <Text className="text-xs text-black leading-4">{product.description}</Text>
    </View>
  );

  const renderAttributesContent = () => (
    <View className="py-2">
      <Text className="text-xs font-bold text-black mb-3">Product Details</Text>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Brand</Text>
        <Text className="text-xs text-black">{product.brand}</Text>
      </View>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Colour</Text>
        <Text className="text-xs text-black">{product.colour}</Text>
      </View>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Condition</Text>
        <Text className="text-xs text-black">{product.condition}</Text>
      </View>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Flaws</Text>
        <Text className="text-xs text-black">{product.flaws || 'None'}</Text>
      </View>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Gender</Text>
        <Text className="text-xs text-black">{product.gender}</Text>
      </View>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Size</Text>
        <Text className="text-xs text-black">{product.size}</Text>
      </View>
      <View className="flex-row justify-between items-center py-1.5">
        <Text className="text-xs font-medium text-black">Stock Quantity</Text>
        <Text className="text-xs text-black">{product.stockQuantity}</Text>
      </View>
      {product.onSale && (
        <View className="flex-row justify-between items-center py-1.5">
          <Text className="text-xs font-medium text-black">On Sale</Text>
          <Text className="text-xs text-black">Yes</Text>
        </View>
      )}
    </View>
  );

  const renderSellerContent = () => (
    <View className="py-2">
      <Text className="text-sm font-bold text-black mb-3">Seller Information</Text>
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full bg-gray-100 justify-center items-center mr-3">
          <Feather name="shopping-bag" size={24} color="#666" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-black mb-1">{product.vendorShopName}</Text>
          <View className="flex-row items-center">
            <Feather name="star" size={14} color="#FFA500" />
            <Text className="text-xs text-gray-600 ml-1">
              {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>
      <Pressable className="flex-row items-center justify-center bg-black py-2.5 rounded-md mb-2">
        <Feather name="shopping-bag" size={18} color="#fff" />
        <Text className="text-white text-sm ml-2">Visit Shop</Text>
      </Pressable>
      <Pressable className="flex-row items-center justify-center bg-blue-500 py-2.5 rounded-md">
        <Feather name="message-circle" size={18} color="#fff" />
        <Text className="text-white text-sm ml-2">Contact Seller</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="absolute top-20 left-0 right-0 z-10 flex-row justify-between items-center px-4 pr-6 mt-6">
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </Pressable>
        <Pressable onPress={handleShoppingCart}>
          <Feather name="shopping-bag" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" ref={scrollViewRef}>
        {/* Image Carousel */}
        {renderImageCarousel()}

        {/* Product Info */}
        <View className="bg-white p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-bold text-black mb-1">{product.name}</Text>
              <Text className="text-base font-semibold text-black mb-0.5">{formatPrice(product.price)}</Text>
              <Text className="text-xs text-gray-600">
                {product.vendorId === 42
                  ? '(Official Vint Street Product)'
                  : `(Protection fee: ${formatPrice(product.price * 0.072)})`}
              </Text>
            </View>
            <Pressable className="flex-row items-center ml-4" onPress={handleLike}>
              <Text className="text-base text-gray-600 mr-2">{product.likes}</Text>
              <Feather name={isLiked ? 'heart' : 'heart'} size={20} color={isLiked ? '#FF6B6B' : '#666'} />
            </Pressable>
          </View>
        </View>

        {/* Accordion Sections */}
        <View className="bg-white">
          {renderAccordionSection('Description', 'description', renderDescriptionContent())}
          {renderAccordionSection('Attributes', 'attributes', renderAttributesContent())}
          {renderAccordionSection('Seller', 'seller', renderSellerContent())}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="flex-row bg-white px-3 py-3">
        <Pressable
          className="flex-1 h-10 bg-white border border-black rounded-md justify-center items-center mr-1.5"
          onPress={handleAddToBasket}
        >
          <Text className="text-sm text-black font-bold">Add to Basket</Text>
        </Pressable>
        <Pressable
          className="flex-1 h-10 bg-black rounded-md justify-center items-center ml-1.5"
          onPress={handleBuyNow}
        >
          <Text className="text-sm text-white font-bold">Buy Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
