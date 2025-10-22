import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SellScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [stockManagement, setStockManagement] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState('');
  const [productStatus, setProductStatus] = useState('Published');
  const [visibility, setVisibility] = useState('Visible');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const categories = [
    "Men's",
    "Women's",
    "Junior's",
    'Footwear',
    'Games',
    'Consoles',
    'Music',
    'Trading Cards',
    'Collectibles',
    'Uncategorised',
  ];

  const statusOptions = ['Published', 'Draft'];
  const visibilityOptions = ['Visible', 'Hidden'];

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your item has been saved as draft.');
  };

  const handlePublishItem = () => {
    if (!title || !description || !price || !category) {
      Alert.alert('Required Fields', 'Please complete all required fields (*) to publish this product.');
      return;
    }
    Alert.alert('Item Published', 'Your item has been published successfully!');
  };

  const handleGalleryPress = async () => {
    try {
      // Request permission for gallery access
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access photo library is required!');
        return;
      }

      // Open gallery to pick multiple images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 1,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...newImages]);
        Alert.alert('Success', `${newImages.length} image(s) selected from gallery`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access images. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const handleCameraPress = async () => {
    try {
      // Request permission for camera access
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      // Open camera to take a photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 1,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setSelectedImages((prev) => [...prev, newImage]);
        Alert.alert('Success', 'Photo taken successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const handleImageSourceSelection = (source: 'gallery' | 'camera') => {
    setShowImageSourceModal(false);
    if (source === 'gallery') {
      handleGalleryPress();
    } else {
      handleCameraPress();
    }
  };

  // Track if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const hasChanges = Boolean(
      title || description || price || brand || category || purchaseNote || selectedImages.length > 0 || stockManagement
    );
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };

  // Handle navigation away with unsaved changes
  const handleNavigationAway = () => {
    if (checkForUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  // Handle continue without saving
  const handleContinueWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    setHasUnsavedChanges(false);
    // Clear all form data
    setTitle('');
    setDescription('');
    setPrice('');
    setBrand('');
    setCategory('');
    setPurchaseNote('');
    setSelectedImages([]);
    setStockManagement(false);
    // Navigate away (this would be handled by the navigation system)
  };

  // Handle cancel - stay on page
  const handleCancelNavigation = () => {
    setShowUnsavedChangesModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-black px-4 py-3 flex-row justify-between items-center">
        <TouchableOpacity onPress={handleNavigationAway} className="flex-row items-center">
          <Feather name="arrow-left" size={20} color="#fff" className="mr-2" />
          <Text className="text-lg font-inter-bold text-white">Sell an item</Text>
        </TouchableOpacity>
        <Feather name="shopping-bag" size={24} color="#fff" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-white">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => {
            setShowStatusDropdown(false);
            setShowVisibilityDropdown(false);
          }}
        >
          <View className="p-4">
            {/* Add Photos Section */}
            {selectedImages.length === 0 ? (
              <TouchableOpacity
                className="h-60 bg-gray-100 rounded-xl border border-gray-300 border-dashed justify-center items-center mb-4"
                onPress={() => setShowImageSourceModal(true)}
              >
                <Feather name="image" size={48} color="#999" />
                <Text className="text-base font-inter-semibold text-gray-400 mt-2">Add Photos</Text>
              </TouchableOpacity>
            ) : (
              <View className="mb-4">
                <View className="flex-row flex-wrap gap-2">
                  {selectedImages.map((imageUri, index) => (
                    <View key={index} className="relative">
                      <Image
                        source={{ uri: imageUri }}
                        resizeMode="cover"
                        className="w-24 h-24 rounded-lg bg-gray-100"
                      />
                      <TouchableOpacity
                        className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 justify-center items-center"
                        onPress={() => {
                          setSelectedImages((prev) => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Feather name="x" size={14} color="#fff" />
                      </TouchableOpacity>
                      {index === 0 && (
                        <View className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded">
                          <Text className="text-white text-xs font-inter-semibold">Main</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-300 border-dashed justify-center items-center"
                    onPress={() => setShowImageSourceModal(true)}
                  >
                    <Feather name="plus" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs font-inter text-gray-500 mt-2 italic">
                  Drag to reorder. First image will be the main product image.
                </Text>
              </View>
            )}

            {/* Information Box */}
            <View className="bg-blue-100 rounded-lg p-3 mb-6 flex-row items-start">
              <Feather name="info" size={20} color="#1976d2" />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-inter-bold text-blue-700 mb-1">Creating New Product</Text>
                <Text className="text-xs font-inter text-blue-700">
                  Fields marked with * are required. You can save as draft or publish directly.
                </Text>
              </View>
            </View>

            {/* Title Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-black mb-2">Title *</Text>
              <TextInput
                className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
                placeholder="Enter item title"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-black mb-2">Description *</Text>
              <TextInput
                className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter h-25"
                placeholder="Enter item description"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* Price Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-black mb-2">Price *</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter flex-1"
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Brand Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-black mb-2">Brand</Text>
              <TextInput
                className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
                placeholder="Enter brand name (API brands not loaded)"
                value={brand}
                onChangeText={setBrand}
              />
              <View className="bg-yellow-100 rounded p-2 mt-2 flex-row items-center">
                <Feather name="alert-circle" size={16} color="#856404" />
                <Text className="text-xs font-inter text-yellow-800 ml-1">
                  Brand API not responding. Using text input as fallback.
                </Text>
              </View>
            </View>

            {/* Category Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-black mb-2">Category</Text>
              <TouchableOpacity
                className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row justify-between items-center"
                onPress={() => setShowCategoryModal(true)}
              >
                <Text className={`text-sm font-inter ${category ? 'text-black' : 'text-gray-400'}`}>
                  {category || 'Select Category'}
                </Text>
                <Feather name="chevron-right" size={16} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Stock Management Section */}
            <View className="mb-6">
              <Text className="text-lg font-inter-bold text-black mb-4">Stock Management</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className={`w-5 h-5 border-2 rounded ${
                    stockManagement ? 'bg-black border-black' : 'border-gray-300'
                  } justify-center items-center mr-3`}
                  onPress={() => setStockManagement(!stockManagement)}
                >
                  {stockManagement && <Feather name="check" size={14} color="#fff" />}
                </TouchableOpacity>
                <Text className="text-base font-inter text-black">Enable stock management</Text>
              </View>
            </View>

            {/* Purchase Note Field */}
            <View className="mb-4">
              <Text className="text-sm font-inter-semibold text-black mb-2">Purchase Note</Text>
              <TextInput
                className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter h-20"
                placeholder="Customer will get this info in their order email"
                value={purchaseNote}
                onChangeText={setPurchaseNote}
                multiline
              />
            </View>

            {/* Product Status Section */}
            <View className="mb-6">
              <Text className="text-lg font-inter-bold text-black mb-4">Product Status</Text>

              {/* Status Dropdown */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-black mb-2">Status</Text>
                <View className="relative">
                  <TouchableOpacity
                    className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row justify-between items-center"
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowVisibilityDropdown(false);
                    }}
                  >
                    <Text className="text-sm font-inter text-black">{productStatus}</Text>
                    <Feather name="chevron-down" size={16} color="#999" />
                  </TouchableOpacity>

                  {showStatusDropdown && (
                    <View className="absolute top-11 left-0 right-0 z-50 bg-white rounded-lg border border-gray-300 shadow-lg">
                      {statusOptions.map((status, index) => (
                        <TouchableOpacity
                          key={index}
                          className={`py-3 px-3 ${index < statusOptions.length - 1 ? 'border-b border-gray-100' : ''} ${
                            status === productStatus ? 'bg-gray-100' : 'bg-transparent'
                          }`}
                          onPress={(e) => {
                            e.stopPropagation();
                            setProductStatus(status);
                            setShowStatusDropdown(false);
                          }}
                        >
                          <Text className="text-sm font-inter text-black">{status}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Visibility Dropdown */}
              <View>
                <Text className="text-sm font-inter-semibold text-black mb-2">Visibility</Text>
                <View className="relative">
                  <TouchableOpacity
                    className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row justify-between items-center"
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowVisibilityDropdown(!showVisibilityDropdown);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text className="text-sm font-inter text-black">{visibility}</Text>
                    <Feather name="chevron-down" size={16} color="#999" />
                  </TouchableOpacity>

                  {showVisibilityDropdown && (
                    <View className="absolute top-11 left-0 right-0 z-50 bg-white rounded-lg border border-gray-300 shadow-lg">
                      {visibilityOptions.map((vis, index) => (
                        <TouchableOpacity
                          key={index}
                          className={`py-3 px-3 ${
                            index < visibilityOptions.length - 1 ? 'border-b border-gray-100' : ''
                          } ${vis === visibility ? 'bg-gray-100' : 'bg-transparent'}`}
                          onPress={(e) => {
                            e.stopPropagation();
                            setVisibility(vis);
                            setShowVisibilityDropdown(false);
                          }}
                        >
                          <Text className="text-sm font-inter text-black">{vis}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row mb-4">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 mr-2 items-center"
                onPress={handleSaveDraft}
              >
                <Text className="text-base font-inter-semibold text-black">Save as Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 ml-2 items-center"
                onPress={handlePublishItem}
              >
                <Text className="text-base font-inter-semibold text-black">Publish Item</Text>
              </TouchableOpacity>
            </View>

            {/* Warning Message */}
            <View className="bg-yellow-100 rounded-lg p-3 flex-row items-center">
              <Feather name="alert-circle" size={20} color="#856404" />
              <Text className="text-xs font-inter text-yellow-800 ml-2 flex-1">
                Complete all required fields (*) to publish this product
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-2 px-5 pb-5 max-h-4/5">
            {/* Modal Handle */}
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-inter-bold text-black">Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                className="w-6 h-6 justify-center items-center"
              >
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text className="text-base font-inter text-black">{cat}</Text>
                  <Feather name="chevron-right" size={16} color="#999" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Source Selection Modal */}
      <Modal
        visible={showImageSourceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageSourceModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowImageSourceModal(false)}
        >
          <TouchableOpacity
            className="bg-white rounded-t-3xl p-5 pb-10"
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-inter-bold text-center mb-2">Add Photos</Text>
            <Text className="text-sm font-inter text-gray-600 text-center mb-5">
              Choose multiple images or take a photo
            </Text>

            <View className="flex-row justify-around items-center">
              {/* Gallery Option */}
              <TouchableOpacity
                className="items-center py-5 px-8"
                onPress={() => handleImageSourceSelection('gallery')}
              >
                <View className="w-20 h-20 bg-gray-100 rounded-2xl justify-center items-center mb-2 shadow-sm">
                  <Feather name="image" size={36} color="#333" />
                </View>
                <Text className="text-base font-inter-semibold text-gray-800">Gallery</Text>
              </TouchableOpacity>

              {/* Camera Option */}
              <TouchableOpacity className="items-center py-5 px-8" onPress={() => handleImageSourceSelection('camera')}>
                <View className="w-20 h-20 bg-gray-100 rounded-2xl justify-center items-center mb-2 shadow-sm">
                  <Feather name="camera" size={36} color="#333" />
                </View>
                <Text className="text-base font-inter-semibold text-gray-800">Camera</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedChangesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelNavigation}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-5 shadow-2xl">
          <View className="bg-white rounded-xl p-6 w-full max-w-xs">
            <Text className="text-lg font-inter-bold text-black mb-3 text-center">Unsaved Changes</Text>

            <Text className="text-sm font-inter text-gray-600 mb-6 text-center leading-5">
              Your changes will be lost if you leave this page. Do you want to continue?
            </Text>

            <View className="flex-row justify-between gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
                onPress={handleCancelNavigation}
              >
                <Text className="text-base font-inter-semibold text-black">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-lg py-3 items-center"
                onPress={handleContinueWithoutSaving}
              >
                <Text className="text-base font-inter-semibold text-white">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
