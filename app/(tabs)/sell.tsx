import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../api/config/supabase';
import { attributesService } from '../../api/services/attributes.service';
import { brandsService } from '../../api/services/brands.service';
import { listingsService } from '../../api/services/listings.service';
import { StorageService } from '../../api/services/storage.service';
import { CategoryAttributesCard } from '../../components/category-attributes-card';

export default function SellScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [itemType, setItemType] = useState('Single Item');
  const [enableOffers, setEnableOffers] = useState(true);
  const [stockManagement, setStockManagement] = useState(false);
  const [purchaseNote, setPurchaseNote] = useState('');
  const [productStatus, setProductStatus] = useState('Published');
  const [visibility, setVisibility] = useState('Visible');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug?: string; display_order?: number }>
  >([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; category_id: string }>>([]);
  const [subSubcategories, setSubSubcategories] = useState<Array<{ id: string; name: string; subcategory_id: string }>>(
    []
  );
  const [subSubSubcategories, setSubSubSubcategories] = useState<
    Array<{ id: string; name: string; sub_subcategory_id: string }>
  >([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; logo_url?: string; is_popular?: boolean }>>(
    []
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<string>('');
  const [selectedSubSubSubcategoryId, setSelectedSubSubSubcategoryId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [currentCategoryLevel, setCurrentCategoryLevel] = useState<
    'category' | 'subcategory' | 'subSubcategory' | 'subSubSubcategory'
  >('category');
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>({});
  const [attributes, setAttributes] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const statusOptions = ['Published', 'Draft'];
  const visibilityOptions = ['Visible', 'Hidden'];
  const itemTypeOptions = ['Single Item', 'Multi Item (with quantity)'];

  // Load categories and brands on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          listingsService.getProductCategories(),
          brandsService.getActiveBrands(),
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Error loading categories and brands:', error);
      }
    };

    loadData();
  }, []);

  // Load subcategories when category is selected
  const loadSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await listingsService.getSubcategories(categoryId);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  // Load sub-subcategories when subcategory is selected
  const loadSubSubcategories = async (subcategoryId: string) => {
    try {
      const subSubcategoriesData = await listingsService.getSubSubcategories(subcategoryId);
      setSubSubcategories(subSubcategoriesData);
    } catch (error) {
      console.error('Error loading sub-subcategories:', error);
    }
  };

  // Load sub-sub-subcategories when sub-subcategory is selected
  const loadSubSubSubcategories = async (subSubcategoryId: string) => {
    try {
      const subSubSubcategoriesData = await listingsService.getSubSubSubcategories(subSubcategoryId);
      setSubSubSubcategories(subSubSubcategoriesData);
    } catch (error) {
      console.error('Error loading sub-sub-subcategories:', error);
    }
  };

  // Load dynamic attributes when subcategory or sub-subcategory is selected
  const loadAttributes = async (subcategoryId: string, subSubcategoryId?: string) => {
    try {
      const attributesData = await attributesService.getAttributes(subcategoryId, subSubcategoryId);
      setAttributes(attributesData);
    } catch (error) {
      console.error('Error loading attributes:', error);
      setAttributes([]);
    }
  };

  // Reset category modal state
  const resetCategoryModal = () => {
    setCurrentCategoryLevel('category');
    setSubcategories([]);
    setSubSubcategories([]);
    setSubSubSubcategories([]);
    setSelectedSubcategoryId('');
    setSelectedSubSubcategoryId('');
    setSelectedSubSubSubcategoryId('');
    setAttributes([]);
    setDynamicAttributes({});
  };

  // Handle dynamic attribute changes
  const handleAttributeChange = (attributeId: string, value: any) => {
    setDynamicAttributes((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  // Filter brands based on search query and popularity
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase());

    // If searching, show all matching brands
    if (brandSearchQuery.trim()) {
      return matchesSearch;
    }

    // If not searching, show only popular brands
    return brand.is_popular && matchesSearch;
  });

  // Get selected brand info
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId);

  // Image picker functions
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
        base64: true, // Required for Supabase upload
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setProductImages((prev) => [...prev, ...newImages]);
        setShowImagePickerModal(false);

        // Upload images to Supabase storage
        await uploadImagesToStorage(newImages);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images from gallery');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
        base64: true, // Required for Supabase upload
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setProductImages((prev) => [...prev, ...newImages]);
        setShowImagePickerModal(false);

        // Upload images to Supabase storage
        await uploadImagesToStorage(newImages);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Upload images to Supabase storage
  const uploadImagesToStorage = async (imageUris: string[]) => {
    if (imageUris.length === 0) return;

    setIsUploadingImages(true);
    setUploadProgress(0);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to upload images');
        return;
      }

      // Upload images to Supabase storage
      const uploadResult = await StorageService.uploadMultipleImages(imageUris, user.id);

      if (uploadResult.success && uploadResult.urls) {
        setUploadedImageUrls((prev) => [...prev, ...uploadResult.urls!]);
        setUploadProgress(100);
        Alert.alert('Success', `${uploadResult.urls.length} image(s) uploaded successfully!`);
      } else {
        const errorMessage = uploadResult.errors?.join(', ') || 'Failed to upload images';
        Alert.alert('Upload Error', errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload images to storage');
    } finally {
      setIsUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = productImages[index];
    const urlToRemove = uploadedImageUrls[index];

    // Remove from local state
    setProductImages((prev) => prev.filter((_, i) => i !== index));

    // If there's a corresponding uploaded URL, delete from storage
    if (urlToRemove) {
      try {
        await StorageService.deleteImage(urlToRemove);
        setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Error deleting image from storage:', error);
        // Don't show error to user as the image is already removed from UI
      }
    }
  };

  const handleSaveDraft = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save products.');
        setIsSubmitting(false);
        return;
      }

      // Create product data
      const productData = {
        seller_id: user.id,
        product_name: title || 'Untitled Draft',
        product_description: description || null,
        starting_price: price ? parseFloat(price) : null,
        discounted_price: salePrice ? parseFloat(salePrice) : null,
        product_image: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null,
        product_images: uploadedImageUrls,
        offers_enabled: enableOffers,
        product_type: 'shop',
        stream_id: 'shop',
        category_id: selectedCategoryId || null,
        subcategory_id: selectedSubcategoryId || null,
        sub_subcategory_id: selectedSubSubcategoryId || null,
        sub_sub_subcategory_id: selectedSubSubSubcategoryId || null,
        brand_id: selectedBrandId || null,
        stock_quantity: itemType === 'Multi Item (with quantity)' ? 1 : null,
        status: 'draft' as const,
        moderation_status: 'approved',
      };

      // Create product using listings service
      const product = await listingsService.createProduct(productData);

      // Save dynamic attributes if any
      if (Object.keys(dynamicAttributes).length > 0) {
        await attributesService.saveAttributeValues(product.id, dynamicAttributes);
      }

      Alert.alert('Success', 'Draft saved successfully!');

      // Reset all form fields to initial state
      setTitle('');
      setDescription('');
      setPrice('');
      setSalePrice('');
      setBrand('');
      setCategory('');
      setItemType('Single Item');
      setEnableOffers(true);
      setStockManagement(false);
      setPurchaseNote('');
      setProductStatus('Published');
      setVisibility('Visible');
      setProductImages([]);
      setUploadedImageUrls([]);
      setDynamicAttributes({});
      setAttributes([]);
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setSelectedSubSubcategoryId('');
      setSelectedSubSubSubcategoryId('');
      setSelectedBrandId('');
      setSubcategories([]);
      setSubSubcategories([]);
      setSubSubSubcategories([]);
      setCurrentCategoryLevel('category');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishItem = async () => {
    if (isSubmitting) return;

    if (!title || !price || !category) {
      Alert.alert('Required Fields', 'Please complete all required fields (*) to publish this product.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to publish products.');
        setIsSubmitting(false);
        return;
      }

      // Create product data
      const productData = {
        seller_id: user.id,
        product_name: title,
        product_description: description || null,
        starting_price: parseFloat(price),
        discounted_price: salePrice ? parseFloat(salePrice) : null,
        product_image: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null,
        product_images: uploadedImageUrls,
        offers_enabled: enableOffers,
        product_type: 'shop',
        stream_id: 'shop',
        category_id: selectedCategoryId || null,
        subcategory_id: selectedSubcategoryId || null,
        sub_subcategory_id: selectedSubSubcategoryId || null,
        sub_sub_subcategory_id: selectedSubSubSubcategoryId || null,
        brand_id: selectedBrandId || null,
        stock_quantity: itemType === 'Multi Item (with quantity)' ? 1 : null,
        status: 'published' as const,
        moderation_status: 'approved',
      };

      // Create product using listings service
      const product = await listingsService.createProduct(productData);

      // Save dynamic attributes if any
      if (Object.keys(dynamicAttributes).length > 0) {
        await attributesService.saveAttributeValues(product.id, dynamicAttributes);
      }

      Alert.alert('Success', 'Product published to marketplace successfully!');

      // Reset all form fields to initial state
      setTitle('');
      setDescription('');
      setPrice('');
      setSalePrice('');
      setBrand('');
      setCategory('');
      setItemType('Single Item');
      setEnableOffers(true);
      setStockManagement(false);
      setPurchaseNote('');
      setProductStatus('Published');
      setVisibility('Visible');
      setProductImages([]);
      setUploadedImageUrls([]);
      setDynamicAttributes({});
      setAttributes([]);
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
      setSelectedSubSubcategoryId('');
      setSelectedSubSubSubcategoryId('');
      setSelectedBrandId('');
      setSubcategories([]);
      setSubSubcategories([]);
      setSubSubSubcategories([]);
      setCurrentCategoryLevel('category');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error publishing product:', error);
      Alert.alert('Error', 'Failed to publish product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const hasChanges = Boolean(title || description || price || brand || category || purchaseNote || stockManagement);
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
          <Text className="text-lg font-inter-bold text-white">Add New Product</Text>
        </TouchableOpacity>
        <Feather name="shopping-bag" size={24} color="#fff" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-gray-100">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => {
            setShowStatusDropdown(false);
            setShowVisibilityDropdown(false);
            setShowItemTypeDropdown(false);
          }}
        >
          <View className="p-4">
            {/* Product Images Section */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <Text className="text-lg font-inter-bold text-black mb-4">Product Images (Multiple)</Text>

              {/* Upload Area */}
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center mb-4"
                onPress={() => setShowImagePickerModal(true)}
                disabled={isUploadingImages}
              >
                {isUploadingImages ? (
                  <>
                    <Feather name="loader" size={32} color="#666" />
                    <Text className="text-sm font-inter text-gray-600 mt-2">Uploading images...</Text>
                    <Text className="text-xs font-inter text-gray-400 mt-1">{uploadProgress}% complete</Text>
                    <View className="bg-gray-200 rounded-lg py-2 px-4 mt-3 opacity-50">
                      <Text className="text-sm font-inter-semibold text-gray-700">Uploading...</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Feather name="upload" size={32} color="#666" />
                    <Text className="text-sm font-inter text-gray-600 mt-2">Upload product images</Text>
                    <Text className="text-xs font-inter text-gray-400 mt-1">
                      Up to 10MB each, multiple images supported
                    </Text>
                    <TouchableOpacity 
                      className="bg-gray-200 rounded-lg py-2 px-4 mt-3"
                      onPress={() => setShowImagePickerModal(true)}
                    >
                      <Text className="text-sm font-inter-semibold text-gray-700">Choose Images</Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>

              {/* Image Previews */}
              {productImages.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {productImages.map((imageUri, index) => {
                    const isUploaded = uploadedImageUrls[index];
                    return (
                      <TouchableOpacity key={index} className="relative">
                        <Image source={{ uri: imageUri }} className="w-20 h-20 rounded-lg" resizeMode="cover" />

                        {/* Upload Status Indicator */}
                        {isUploaded ? (
                          <View className="absolute -top-2 -left-2 bg-green-500 rounded-full w-6 h-6 items-center justify-center">
                            <Feather name="check" size={14} color="#fff" />
                          </View>
                        ) : (
                          <View className="absolute -top-2 -left-2 bg-yellow-500 rounded-full w-6 h-6 items-center justify-center">
                            <Feather name="clock" size={14} color="#fff" />
                          </View>
                        )}

                        {/* Remove Button */}
                        <TouchableOpacity
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                          onPress={() => removeImage(index)}
                        >
                          <Feather name="x" size={14} color="#fff" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Product Information Section */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <Text className="text-lg font-inter-bold text-black mb-4">Product Information</Text>

              {/* Product Name Field */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-black mb-2">Product Name *</Text>
                <TextInput
                  className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
                  placeholder="Enter product name"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Brand Field */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-black mb-2">Brand</Text>
                <TouchableOpacity
                  className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row justify-between items-center"
                  onPress={() => setShowBrandModal(true)}
                >
                  <View className="flex-row items-center flex-1">
                    <Feather name="tag" size={16} color="#999" className="mr-2" />
                    {selectedBrand ? (
                      <View className="flex-row items-center flex-1">
                        {selectedBrand.logo_url && (
                          <Image
                            source={{ uri: selectedBrand.logo_url }}
                            className="w-5 h-5 mr-2"
                            resizeMode="contain"
                          />
                        )}
                        <Text className="text-sm font-inter text-black">{selectedBrand.name}</Text>
                      </View>
                    ) : (
                      <Text className="text-sm font-inter text-gray-400">Select brand (optional)</Text>
                    )}
                  </View>
                  <Feather name="chevron-down" size={16} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Description Field */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-black mb-2">Description</Text>
                <TextInput
                  className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter h-24"
                  placeholder="Describe your product"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              {/* Price Fields */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-inter-semibold text-black mb-2">Price *</Text>
                  <View className="flex-row items-center">
                    <View className="bg-gray-200 rounded-l-lg px-3 py-3">
                      <Text className="text-sm font-inter text-gray-700">£ GBP</Text>
                    </View>
                    <TextInput
                      className="bg-white rounded-r-lg border border-gray-300 border-l-0 px-3 py-3 text-sm font-inter flex-1"
                      placeholder="0.00"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-inter-semibold text-black mb-2">Sale Price</Text>
                  <View className="flex-row items-center">
                    <View className="bg-gray-200 rounded-l-lg px-3 py-3">
                      <Text className="text-sm font-inter text-gray-700">£ GBP</Text>
                    </View>
                    <TextInput
                      className="bg-white rounded-r-lg border border-gray-300 border-l-0 px-3 py-3 text-sm font-inter flex-1"
                      placeholder="0.00"
                      value={salePrice}
                      onChangeText={setSalePrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Enable Offers Checkbox */}
              <View className="flex-row items-center mt-4">
                <TouchableOpacity
                  className={`w-5 h-5 border-2 rounded ${
                    enableOffers ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  } justify-center items-center mr-3`}
                  onPress={() => setEnableOffers(!enableOffers)}
                >
                  {enableOffers && <Feather name="check" size={14} color="#fff" />}
                </TouchableOpacity>
                <Text className="text-sm font-inter text-black">Enable offers on this product</Text>
              </View>
            </View>

            {/* Category & Attributes Section */}
            <CategoryAttributesCard
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              selectedSubSubcategoryId={selectedSubSubcategoryId}
              selectedSubSubSubcategoryId={selectedSubSubSubcategoryId}
              categories={categories}
              subcategories={subcategories}
              subSubcategories={subSubcategories}
              subSubSubcategories={subSubSubcategories}
              onCategoryPress={() => setShowCategoryModal(true)}
              attributes={attributes}
              dynamicAttributes={dynamicAttributes}
              onAttributeChange={handleAttributeChange}
            />

            {/* Stock Management Section */}
            <View className="bg-white rounded-lg p-4 mb-4">
              <Text className="text-lg font-inter-bold text-black mb-4">Stock Management</Text>

              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-black mb-2">Item Type *</Text>
                <View className="relative">
                  <TouchableOpacity
                    className="bg-white rounded-lg border border-gray-300 px-3 py-3 flex-row justify-between items-center"
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowItemTypeDropdown(!showItemTypeDropdown);
                    }}
                  >
                    <Text className="text-sm font-inter text-black">{itemType}</Text>
                    <Feather name="chevron-down" size={16} color="#999" />
                  </TouchableOpacity>

                  {showItemTypeDropdown && (
                    <View className="absolute top-11 left-0 right-0 z-50 bg-white rounded-lg border border-gray-300 shadow-lg">
                      {itemTypeOptions.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          className={`py-3 px-3 ${
                            index < itemTypeOptions.length - 1 ? 'border-b border-gray-100' : ''
                          } ${type === itemType ? 'bg-gray-100' : 'bg-transparent'}`}
                          onPress={(e) => {
                            e.stopPropagation();
                            setItemType(type);
                            setShowItemTypeDropdown(false);
                          }}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-inter text-black">{type}</Text>
                            {type === itemType && <Feather name="check" size={16} color="#000" />}
                          </View>
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
                className={`flex-1 rounded-lg py-3 mr-2 items-center ${isSubmitting ? 'bg-gray-400' : 'bg-black'}`}
                onPress={handleSaveDraft}
                disabled={isSubmitting}
              >
                <Text className="text-base font-inter-semibold text-white">
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-lg py-3 ml-2 items-center ${isSubmitting ? 'bg-gray-400' : 'bg-black'}`}
                onPress={handlePublishItem}
                disabled={isSubmitting}
              >
                <Text className="text-base font-inter-semibold text-white">
                  {isSubmitting ? 'Publishing...' : 'Publish to Marketplace'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCategoryModal(false);
          resetCategoryModal();
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-2 px-5 pb-5 max-h-4/5">
            {/* Modal Handle */}
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center flex-1">
                {currentCategoryLevel !== 'category' && (
                  <TouchableOpacity
                    onPress={() => {
                      if (currentCategoryLevel === 'subcategory') {
                        setCurrentCategoryLevel('category');
                        setSubcategories([]);
                        setSelectedSubcategoryId('');
                      } else if (currentCategoryLevel === 'subSubcategory') {
                        setCurrentCategoryLevel('subcategory');
                        setSubSubcategories([]);
                        setSelectedSubSubcategoryId('');
                      } else if (currentCategoryLevel === 'subSubSubcategory') {
                        setCurrentCategoryLevel('subSubcategory');
                        setSubSubSubcategories([]);
                        setSelectedSubSubSubcategoryId('');
                      }
                    }}
                    className="mr-3"
                  >
                    <Feather name="arrow-left" size={20} color="#000" />
                  </TouchableOpacity>
                )}
                <Text className="text-lg font-inter-bold text-black">
                  {currentCategoryLevel === 'category' && 'Select Category'}
                  {currentCategoryLevel === 'subcategory' && 'Select Subcategory'}
                  {currentCategoryLevel === 'subSubcategory' && 'Select Type'}
                  {currentCategoryLevel === 'subSubSubcategory' && 'Select Specific Type'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryModal(false);
                  resetCategoryModal();
                }}
                className="w-6 h-6 justify-center items-center"
              >
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
              {currentCategoryLevel === 'category' && (
                <>
                  {categories.length === 0 ? (
                    <View className="py-8 items-center">
                      <Text className="text-sm font-inter text-gray-500">No categories available</Text>
                    </View>
                  ) : (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                        onPress={async () => {
                          setSelectedCategoryId(category.id);
                          setCategory(category.name);
                          await loadSubcategories(category.id);
                          setCurrentCategoryLevel('subcategory');
                        }}
                      >
                        <Text className="text-base font-inter text-black">{category.name}</Text>
                        <Feather name="chevron-right" size={16} color="#999" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}

              {currentCategoryLevel === 'subcategory' && (
                <>
                  {subcategories.length === 0 ? (
                    <View className="py-8 items-center">
                      <Text className="text-sm font-inter text-gray-500">No subcategories available</Text>
                      <TouchableOpacity
                        className="mt-4 bg-black rounded-lg py-3 px-6"
                        onPress={() => {
                          setCurrentCategoryLevel('subSubcategory');
                        }}
                      >
                        <Text className="text-white font-inter-semibold">
                          Continue with {categories.find((c) => c.id === selectedCategoryId)?.name || 'Category'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    subcategories.map((subcategory) => (
                      <TouchableOpacity
                        key={subcategory.id}
                        className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                        onPress={async () => {
                          setSelectedSubcategoryId(subcategory.id);
                          await loadSubSubcategories(subcategory.id);
                          await loadAttributes(subcategory.id);
                          setCurrentCategoryLevel('subSubcategory');
                        }}
                      >
                        <Text className="text-base font-inter text-black">{subcategory.name}</Text>
                        <Feather name="chevron-right" size={16} color="#999" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}

              {currentCategoryLevel === 'subSubcategory' && (
                <>
                  {subSubcategories.length === 0 ? (
                    <View className="py-8 items-center">
                      <Text className="text-sm font-inter text-gray-500">No types available</Text>
                      <TouchableOpacity
                        className="mt-4 bg-black rounded-lg py-3 px-6"
                        onPress={() => {
                          setCurrentCategoryLevel('subSubSubcategory');
                        }}
                      >
                        <Text className="text-white font-inter-semibold">
                          Continue with{' '}
                          {subcategories.find((s) => s.id === selectedSubcategoryId)?.name || 'Subcategory'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    subSubcategories.map((subSubcategory) => (
                      <TouchableOpacity
                        key={subSubcategory.id}
                        className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                        onPress={async () => {
                          setSelectedSubSubcategoryId(subSubcategory.id);
                          await loadSubSubSubcategories(subSubcategory.id);
                          await loadAttributes(selectedSubcategoryId, subSubcategory.id);
                          setCurrentCategoryLevel('subSubSubcategory');
                        }}
                      >
                        <Text className="text-base font-inter text-black">{subSubcategory.name}</Text>
                        <Feather name="chevron-right" size={16} color="#999" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}

              {currentCategoryLevel === 'subSubSubcategory' && (
                <>
                  {subSubSubcategories.length === 0 ? (
                    <View className="py-8 items-center">
                      <Text className="text-sm font-inter text-gray-500">No specific types available</Text>
                      <TouchableOpacity
                        className="mt-4 bg-black rounded-lg py-3 px-6"
                        onPress={() => setShowCategoryModal(false)}
                      >
                        <Text className="text-white font-inter-semibold">
                          Use{' '}
                          {subSubcategories.find((s) => s.id === selectedSubSubcategoryId)?.name || 'Sub-subcategory'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    subSubSubcategories.map((subSubSubcategory) => (
                      <TouchableOpacity
                        key={subSubSubcategory.id}
                        className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                        onPress={() => {
                          setSelectedSubSubSubcategoryId(subSubSubcategory.id);
                          setShowCategoryModal(false);
                        }}
                      >
                        <Text className="text-base font-inter text-black">{subSubSubcategory.name}</Text>
                        <Feather name="check" size={16} color="#000" />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
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

      {/* Brand Selection Modal */}
      <Modal
        visible={showBrandModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBrandModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-2 px-5 pb-5 max-h-4/5">
            {/* Modal Handle */}
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-inter-bold text-black">Select Brand</Text>
              <TouchableOpacity
                onPress={() => setShowBrandModal(false)}
                className="w-6 h-6 justify-center items-center"
              >
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="mb-4">
              <TextInput
                className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
                placeholder="Search brands..."
                value={brandSearchQuery}
                onChangeText={setBrandSearchQuery}
                autoFocus
              />
            </View>

            {/* Brand List */}
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
              {!brandSearchQuery.trim() && (
                <Text className="text-sm font-inter-semibold text-gray-600 mb-3 px-3">Popular Brands</Text>
              )}

              {filteredBrands.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-sm font-inter text-gray-500">No brands found</Text>
                </View>
              ) : (
                filteredBrands.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    className={`py-3 px-3 flex-row justify-between items-center ${
                      selectedBrandId === brand.id ? 'bg-gray-100' : 'bg-transparent'
                    }`}
                    onPress={() => {
                      setSelectedBrandId(brand.id);
                      setBrand(brand.name);
                      setShowBrandModal(false);
                      setBrandSearchQuery('');
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      {brand.logo_url && (
                        <Image source={{ uri: brand.logo_url }} className="w-6 h-6 mr-3" resizeMode="contain" />
                      )}
                      <Text className="text-sm font-inter text-black flex-1">{brand.name}</Text>
                    </View>
                    {selectedBrandId === brand.id && <Feather name="check" size={16} color="#000" />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Clear Selection Button */}
            {selectedBrandId && (
              <TouchableOpacity
                className="mt-4 py-3 px-4 bg-gray-200 rounded-lg items-center"
                onPress={() => {
                  setSelectedBrandId('');
                  setBrand('');
                  setShowBrandModal(false);
                  setBrandSearchQuery('');
                }}
              >
                <Text className="text-sm font-inter-semibold text-black">Clear Selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-2 px-5 pb-5">
            {/* Modal Handle */}
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-inter-bold text-black">Add Product Images</Text>
              <TouchableOpacity
                onPress={() => setShowImagePickerModal(false)}
                className="w-6 h-6 justify-center items-center"
              >
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View className="space-y-3">
              <TouchableOpacity
                className="bg-gray-100 rounded-lg py-4 px-4 flex-row items-center"
                onPress={pickImageFromGallery}
              >
                <Feather name="image" size={24} color="#666" className="mr-4" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Choose from Gallery</Text>
                  <Text className="text-sm font-inter text-gray-600">
                    Select multiple images from your photo library
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 rounded-lg py-4 px-4 flex-row items-center"
                onPress={takePhotoWithCamera}
              >
                <Feather name="camera" size={24} color="#666" className="mr-4" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Take Photo</Text>
                  <Text className="text-sm font-inter text-gray-600">Capture a new photo with your camera</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
