import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listingsService, Product } from '../../api/services/listings.service';
import { useAuth } from '../../hooks/use-auth';

// Interfaces are now imported from the listings service

export default function ListingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('published');
  const { user } = useAuth();

  const tabs = [
    { key: 'published', label: 'Published' },
    { key: 'private', label: 'Private' },
    { key: 'draft', label: 'Draft' },
  ];

  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id]);

  const loadProducts = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch listings from the API for the seller
      const fetchedProducts = await listingsService.getListingsByStatus(user.id, activeTab);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredProducts = () => {
    return products.filter((product) => product.status === activeTab);
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <View className="bg-white rounded-xl mb-4 shadow-sm">
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-gray-900 font-inter-bold text-base mb-1">{product.product_name}</Text>
            <Text className="text-gray-600 text-sm font-inter">
              £{product.starting_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View
            className={`${product.status === 'published' ? 'bg-green-500' : 'bg-orange-500'} rounded-full px-3 py-1.5`}
          >
            <Text className="text-white font-inter-bold text-xs">
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-gray-600 text-xs font-inter">
            Created: {new Date(product.created_at).toLocaleDateString()}
          </Text>
          <View className="flex-row gap-2">
            {product.status === 'published' && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await listingsService.updateListingStatus(product.id, false);
                    Alert.alert('Listing Updated', 'Listing has been made private');
                    loadProducts(); // Refresh the listings
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update listing status');
                  }
                }}
                className="bg-orange-500 rounded-md py-1.5 px-3"
              >
                <Text className="text-white text-xs font-inter-bold">Make Private</Text>
              </TouchableOpacity>
            )}
            {product.status === 'draft' && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await listingsService.updateListingStatus(product.id, true);
                    Alert.alert('Listing Updated', 'Listing has been made live');
                    loadProducts(); // Refresh the listings
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update listing status');
                  }
                }}
                className="bg-green-500 rounded-md py-1.5 px-3"
              >
                <Text className="text-white text-xs font-inter-bold">Make Live</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Edit Product', 'This would open product editing');
              }}
              className="bg-blue-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-inter-bold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('View Product', 'This would show product details');
              }}
              className="bg-gray-500 rounded-md py-1.5 px-3"
            >
              <Text className="text-white text-xs font-inter-bold">View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const ProductsList = ({ products, onRefresh }: { products: Product[]; onRefresh: () => void }) => {
    if (products.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-8 bg-white rounded-xl py-12 shadow-sm">
          <Feather name="package" color="#666" size={64} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4">No products yet</Text>
          <Text className="text-gray-600 text-sm font-inter mt-2 text-center">Create your first product template</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#007AFF" />}
        className="flex-1 p-4"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Listings</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Listings</Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <Feather name="alert-circle" color="#ff4444" size={64} />
          <Text className="text-gray-900 text-lg font-inter-bold mt-4 mb-2">Error loading products</Text>
          <Text className="text-gray-600 text-sm font-inter text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={loadProducts} className="bg-blue-500 rounded-lg py-3 px-6">
            <Text className="text-white text-base font-inter-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-gray-900">My Listings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProducts} tintColor="#007AFF" />}
        className="flex-1 px-4"
      >
        {/* Action Buttons */}
        <View className="mt-4 mb-6">
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Shipping Settings', 'This would open shipping settings');
            }}
            className="bg-gray-200 rounded-lg py-4 px-5 mb-3 items-center shadow-sm"
          >
            <Text className="text-gray-900 text-base font-inter-bold">Shipping Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push('/(tabs)/sell');
            }}
            className="bg-white rounded-lg py-4 px-5 mb-4 items-center border border-gray-300 shadow-sm"
          >
            <Text className="text-gray-900 text-base font-inter-bold">Add Product</Text>
          </TouchableOpacity>

          {/* Information Banner */}
          <View className="bg-blue-500 rounded-lg p-4 mb-4 flex-row items-center shadow-sm">
            <Feather name="info" color="#fff" size={20} className="mr-3" />
            <View className="flex-1">
              <Text className="text-white text-sm font-inter">
                Please <Text className="underline font-inter-bold">select shipping options</Text> for your items to go
                live on the marketplace.
              </Text>
            </View>
          </View>

          {/* Bulk Upload Button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Bulk Upload', 'This would open bulk upload functionality');
            }}
            className="bg-gray-200 rounded-lg py-3 px-4 flex-row items-center self-end shadow-sm"
          >
            <Feather name="upload" color="#333" size={16} className="mr-2" />
            <Text className="text-gray-900 text-sm font-inter-medium">Bulk Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <View className="flex-row gap-3 mb-4">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`${
                activeTab === tab.key ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
              } flex-1 rounded-md py-3 px-2 border shadow-sm`}
            >
              <Text
                className={`${
                  activeTab === tab.key ? 'text-white' : 'text-gray-600'
                } text-xs font-inter-medium text-center`}
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
