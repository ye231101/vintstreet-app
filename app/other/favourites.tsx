import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FavouriteItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  brand?: string;
  condition?: string;
}

export default function FavouritesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual data fetching
      setFavourites([]);
    } catch (err) {
      setError('Error loading favourites');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    Alert.alert('Login Required', 'Please log in to view your favourites', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log In',
        onPress: () => {
          // Navigate to login screen
          router.push('/(auth)');
        },
      },
    ]);
  };

  const navigateToDiscovery = () => {
    router.push('/(tabs)/discovery');
  };

  const removeFromFavourites = (itemId: string) => {
    Alert.alert('Remove from Favourites', 'Are you sure you want to remove this item from your favourites?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setFavourites((prev) => prev.filter((item) => item.id !== itemId));
          Alert.alert('Success', 'Item removed from favourites');
        },
      },
    ]);
  };

  const navigateToProduct = (itemId: string) => {
    router.push(`/listing/${itemId}` as any);
  };

  const FavouriteCard = ({ item }: { item: FavouriteItem }) => (
    <TouchableOpacity
      onPress={() => navigateToProduct(item.id)}
      className="bg-gray-800 rounded-xl mb-4 overflow-hidden shadow-lg"
    >
      {/* Product Image */}
      <View className="w-full h-50 bg-gray-600">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full bg-gray-600 justify-center items-center">
            <Feather name="image" color="#999" size={48} />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="p-3">
        <Text className="text-white text-base font-inter-bold mb-1" numberOfLines={2}>
          {item.name}
        </Text>

        {item.brand && <Text className="text-gray-400 text-sm font-inter mb-1">{item.brand}</Text>}

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-white text-lg font-inter-bold">£{item.price.toFixed(2)}</Text>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              removeFromFavourites(item.id);
            }}
            className="p-2"
          >
            <Feather name="heart" color="#ff4444" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Feather name="heart" color="#999" size={64} />
      <Text className="text-gray-400 text-lg font-inter-medium mt-4 mb-2">No favourites yet</Text>
      <TouchableOpacity onPress={navigateToDiscovery} className="bg-blue-500 rounded-lg py-3 px-6 mt-4">
        <Text className="text-white text-base font-inter-bold">Discover Items</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Feather name="alert-circle" color="#ff4444" size={64} />
      <Text className="text-white text-lg font-inter-bold mt-4 mb-2">Error loading favourites</Text>
      <Text className="text-gray-400 text-sm font-inter text-center mb-4">{error}</Text>
      {error?.includes('log in') ? (
        <TouchableOpacity onPress={navigateToLogin} className="bg-blue-500 rounded-lg py-3 px-6">
          <Text className="text-white text-base font-inter-bold">Log In</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={loadFavourites} className="bg-blue-500 rounded-lg py-3 px-6">
          <Text className="text-white text-base font-inter-bold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Favourites</Text>
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
        <View className="flex-row items-center bg-black px-4 py-3 border-b border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-white">Favourites</Text>
        </View>

        <ErrorState />
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

        <Text className="flex-1 text-lg font-inter-bold text-white">Favourites</Text>
      </View>

      {/* Content */}
      {favourites.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={favourites}
          renderItem={({ item }) => <FavouriteCard item={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          className="p-4"
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadFavourites} tintColor="#007AFF" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
