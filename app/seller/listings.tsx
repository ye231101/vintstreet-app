import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Product {
  id: string;
  title: string;
  price: number;
  status: 'live' | 'private' | 'sold' | 'draft';
  imageUrl?: string;
  dateCreated: string;
  views?: number;
  likes?: number;
}

export default function ListingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('live');

  const tabs = [
    { key: 'live', label: 'Live Listings' },
    { key: 'private', label: 'Private' },
    { key: 'sold', label: 'Sold' },
    { key: 'draft', label: 'Draft' },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      const mockProducts: Product[] = [
        // Empty for now to show empty state
      ];

      setProducts(mockProducts);
    } catch (err) {
      setError('Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredProducts = () => {
    return products.filter((product) => product.status === activeTab);
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <View className="bg-gray-800 rounded-xl mb-4 shadow-lg">
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-white font-poppins-bold text-base mb-1">{product.title}</Text>
            <Text className="text-gray-400 text-sm font-poppins">£{product.price.toFixed(2)}</Text>
          </View>
          <View className={`${product.status === 'live' ? 'bg-green-500' : 'bg-orange-500'} rounded-full px-3 py-1.5`}>
            <Text className="text-white font-poppins-bold text-xs">
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-gray-400 text-xs font-poppins">
            Created: {new Date(product.dateCreated).toLocaleDateString()}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Edit Product', 'This would open product editing');
              }}
              className="bg-blue-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-poppins-bold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('View Product', 'This would show product details');
              }}
              className="bg-gray-600 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-poppins-bold">View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const ProductsList = ({ products, onRefresh }: { products: Product[]; onRefresh: () => void }) => {
    if (products.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-8 bg-gray-800 rounded-xl m-4 py-12">
          <Feather name="package" color="#999" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4">No products yet</Text>
          <Text className="text-gray-400 text-sm font-poppins mt-2 text-center">
            Create your first product template
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#007AFF" />}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">My Listings</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-poppins-bold text-white">My Listings</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-white text-lg font-poppins-bold mt-4 mb-2">Error loading products</Text>
          <Text className="text-gray-400 text-sm font-poppins text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadProducts} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-poppins-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-poppins-bold text-white">My Listings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProducts} tintColor="#007AFF" />}
      >
        {/* Action Buttons */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Shipping Settings', 'This would open shipping settings');
            }}
            className="bg-gray-600 rounded-lg py-4 px-5 mb-3 items-center"
          >
            <Text className="text-white text-base font-poppins-bold">Shipping Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert('Add Product', 'This would open product creation');
            }}
            className="bg-black rounded-lg py-4 px-5 mb-4 items-center border border-white"
          >
            <Text className="text-white text-base font-poppins-bold">Add Product</Text>
          </TouchableOpacity>

          {/* Information Banner */}
          <View className="bg-blue-500 rounded-lg p-4 mb-4 flex-row items-center">
            <Feather name="info" color="#fff" size={20} className="mr-3" />
            <View className="flex-1">
              <Text className="text-white text-sm font-poppins">
                Please <Text className="underline font-poppins-bold">select shipping options</Text> for your items to go
                live on the marketplace.
              </Text>
            </View>
          </View>

          {/* Bulk Upload Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Bulk Upload', 'This would open bulk upload functionality');
            }}
            className="bg-gray-600 rounded-lg py-3 px-4 flex-row items-center self-end"
          >
            <Feather name="upload" color="#fff" size={16} className="mr-2" />
            <Text className="text-white text-sm font-poppins-medium">Bulk Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <View className="flex-row mb-4">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`${
                activeTab === tab.key ? 'bg-black border-white' : 'bg-gray-600 border-gray-500'
              } flex-1 rounded-md py-3 px-2 mr-2 border`}
            >
              <Text
                className={`${
                  activeTab === tab.key ? 'text-white' : 'text-gray-400'
                } text-xs font-poppins-medium text-center`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Products List */}
        <ProductsList products={getFilteredProducts()} onRefresh={loadProducts} />
      </ScrollView>
    </SafeAreaView>
  );
}
