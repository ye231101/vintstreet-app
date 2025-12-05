import { attributesService, brandsService, listingsService, storageService } from '@/api/services';
import { CategoryAttributesCard } from '@/components/category-attributes-card';
import { DropdownComponent, InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { AuthUtils } from '@/utils/auth-utils';
import { logger } from '@/utils/logger';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableGrid from 'react-native-draggable-grid';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEM_TYPE_OPTIONS = [
  { label: 'Single Item', value: 'single' },
  { label: 'Multi Item (with quantity)', value: 'multi' },
];

export default function SellScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState('');
  const [itemType, setItemType] = useState('single');
  const [enableOffers, setEnableOffers] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, unknown>>({});
  const [attributes, setAttributes] = useState<unknown[]>([]);
  const [productImages, setProductImages] = useState<
    Array<{ key: string; uri: string; uploadedUrl?: string; isPrimary: boolean }>
  >([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stockQuantity, setStockQuantity] = useState('');
  const [isMarketplaceListing, setIsMarketplaceListing] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);

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
        logger.error('Error loading categories and brands:', error);
      }
    };

    loadData();
  }, []);

  // Load product data when editing
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId) return;

      try {
        const product = await listingsService.getListingById(productId);

        if (!product) {
          showErrorToast('Product not found');
          return;
        }

        // Set basic fields
        setTitle(product.product_name || '');
        setDescription(product.product_description || '');
        setPrice(product.starting_price ? product.starting_price.toString() : '');
        setSalePrice(product.discounted_price ? product.discounted_price.toString() : '');
        setStockQuantity(product.stock_quantity ? product.stock_quantity.toString() : '');

        // Set marketplace visibility based on status
        setIsMarketplaceListing(product.status === 'published');

        // Set images
        const existingImages =
          product.product_images && product.product_images.length > 0
            ? product.product_images
            : product.product_image
            ? [product.product_image]
            : [];

        if (existingImages.length > 0) {
          const imageData = existingImages.map((url: string, index: number) => ({
            key: `image_${Date.now()}_${index}`,
            uri: url,
            uploadedUrl: url,
            isPrimary: index === 0, // First image is primary by default
          }));
          setProductImages(imageData);
        }

        // Set brand
        if (product.brand_id) {
          setSelectedBrandId(product.brand_id);
        }

        // Set categories
        if (product.category_id) {
          setSelectedCategoryId(product.category_id);
          const categoryData = categories.find((c) => c.id === product.category_id);
          if (categoryData) {
            setCategory(categoryData.name);
          }

          // Load subcategories
          if (product.subcategory_id) {
            const subcatsData = await listingsService.getSubcategories(product.category_id);
            setSubcategories(subcatsData);
            setSelectedSubcategoryId(product.subcategory_id);

            // Load sub-subcategories
            if (product.sub_subcategory_id) {
              const subSubcatsData = await listingsService.getSubSubcategories(product.subcategory_id);
              setSubSubcategories(subSubcatsData);
              setSelectedSubSubcategoryId(product.sub_subcategory_id);

              // Load sub-sub-subcategories
              if (product.sub_sub_subcategory_id) {
                const subSubSubcatsData = await listingsService.getSubSubSubcategories(product.sub_subcategory_id);
                setSubSubSubcategories(subSubSubcatsData);
                setSelectedSubSubSubcategoryId(product.sub_sub_subcategory_id);
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error loading product data:', error);
        showErrorToast('Failed to load product data');
      }
    };

    // Only load product data after categories and brands are loaded
    if (productId && categories.length > 0 && brands.length > 0) {
      loadProductData();
    }
  }, [productId, categories, brands]);

  // Load subcategories when category is selected
  const loadSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await listingsService.getSubcategories(categoryId);
      setSubcategories(subcategoriesData);
    } catch (error) {
      logger.error('Error loading subcategories:', error);
    }
  };

  // Load sub-subcategories when subcategory is selected
  const loadSubSubcategories = async (subcategoryId: string) => {
    try {
      const subSubcategoriesData = await listingsService.getSubSubcategories(subcategoryId);
      setSubSubcategories(subSubcategoriesData);
    } catch (error) {
      logger.error('Error loading sub-subcategories:', error);
    }
  };

  // Load sub-sub-subcategories when sub-subcategory is selected
  const loadSubSubSubcategories = async (subSubcategoryId: string) => {
    try {
      const subSubSubcategoriesData = await listingsService.getSubSubSubcategories(subSubcategoryId);
      setSubSubSubcategories(subSubSubcategoriesData);
    } catch (error) {
      logger.error('Error loading sub-sub-subcategories:', error);
    }
  };

  // Load dynamic attributes when subcategory or sub-subcategory is selected
  const loadAttributes = async (subcategoryId: string, subSubcategoryId?: string) => {
    try {
      const attributesData = await attributesService.getAttributes(subcategoryId, subSubcategoryId);
      setAttributes(attributesData);
    } catch (error) {
      logger.error('Error loading attributes:', error);
      setAttributes([]);
    }
  };

  // Handle dynamic attribute changes
  const handleAttributeChange = (attributeId: string, value: unknown) => {
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
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload product images. Please enable this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
        base64: true, // Required for Supabase upload
        selectionLimit: 10, // Limit to 10 images max
      });

      if (!result.canceled && result.assets) {
        // Validate images before processing
        const validImages = result.assets.filter((asset) => {
          // Check file size (max 10MB per image)
          if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
            Alert.alert(
              'Image Too Large',
              `Image "${asset.fileName || 'Unknown'}" is too large. Please select images smaller than 10MB.`
            );
            return false;
          }
          return true;
        });

        if (validImages.length === 0) {
          showWarningToast('No valid images were selected. Please try again.');
          return;
        }

        // Check if adding these images would exceed the limit
        if (productImages.length + validImages.length > 10) {
          showWarningToast('You can upload a maximum of 10 images per product.');
          return;
        }

        const newImageData = validImages.map((asset, index) => ({
          key: `image_${Date.now()}_${productImages.length + index}`,
          uri: asset.uri,
          isPrimary: productImages.length === 0 && index === 0, // First image is primary if no images exist
        }));

        setProductImages((prev) => {
          const updated = [...prev, ...newImageData];
          return updated;
        });
        setShowImagePickerModal(false);

        // Upload images to Supabase storage
        await uploadImagesToStorage(newImageData);
      }
    } catch (error) {
      logger.error('Error picking images:', error);
      showErrorToast('Failed to pick images from gallery. Please try again.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      // Request camera permissions first
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need access to your camera to take product photos. Please enable this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() },
          ]
        );
        return;
      }

      // Check if we're at the image limit
      if (productImages.length >= 10) {
        showWarningToast('Image limit reached. Maximum 10 images per product.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
        base64: true, // Required for Supabase upload
      });

      if (!result.canceled && result.assets) {
        const newImageData = result.assets.map((asset, index) => ({
          key: `image_${Date.now()}_${productImages.length + index}`,
          uri: asset.uri,
          isPrimary: productImages.length === 0 && index === 0, // First image is primary if no images exist
        }));

        setProductImages((prev) => [...prev, ...newImageData]);
        setShowImagePickerModal(false);

        // Upload images to Supabase storage
        await uploadImagesToStorage(newImageData);
      }
    } catch (error) {
      logger.error('Error taking photo:', error);
      showErrorToast('Failed to take photo. Please try again.');
    }
  };

  // Upload images to Supabase storage
  const uploadImagesToStorage = async (imageData: Array<{ key: string; uri: string; isPrimary: boolean }>) => {
    if (imageData.length === 0) return;

    // Check if user needs re-authentication before starting upload
    const needsReAuth = await AuthUtils.needsReAuthentication();
    if (needsReAuth) {
      Alert.alert('Session Expired', 'Your session has expired. Please log in again to continue.', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log In',
          onPress: () => {
            const currentPath = productId ? `/(tabs)/sell?productId=${productId}` : '/(tabs)/sell';
            router.replace(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
          },
        },
      ]);
      return;
    }

    setIsUploadingImages(true);
    setUploadProgress(0);

    try {
      // Get current user with automatic session refresh
      const { user, error: authError } = await AuthUtils.getCurrentUserWithRefresh(2);

      if (!user) {
        Alert.alert(
          'Authentication Error',
          authError || 'Your session has expired. Please log in again to upload images.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsUploadingImages(false),
            },
            {
              text: 'Try Again',
              onPress: () => {
                // Retry the upload process
                uploadImagesToStorage(imageData);
              },
            },
            {
              text: 'Log In',
              onPress: () => {
                setIsUploadingImages(false);
                // Navigate to login screen
                const currentPath = productId ? `/(tabs)/sell?productId=${productId}` : '/(tabs)/sell';
                router.replace(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
              },
            },
          ]
        );
        return;
      }

      // Upload images one by one with progress tracking
      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < imageData.length; i++) {
        try {
          const result = await storageService.uploadImage(imageData[i].uri, user.id);

          if (result.success && result.url) {
            // Update the uploaded URL for this image
            setProductImages((prev) =>
              prev.map((img) => (img.key === imageData[i].key ? { ...img, uploadedUrl: result.url } : img))
            );
            successCount++;
          } else {
            errors.push(`Image ${i + 1}: ${result.error || 'Upload failed'}`);
          }

          // Update progress
          const progress = Math.round(((i + 1) / imageData.length) * 100);
          setUploadProgress(progress);
        } catch (error) {
          logger.error(`Error uploading image ${i + 1}:`, error);
          errors.push(`Image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show results
      if (successCount === imageData.length) {
        // All images uploaded successfully
        showSuccessToast(`${successCount} image(s) uploaded successfully!`);
      } else if (successCount > 0) {
        // Some images uploaded successfully
        showWarningToast(`${successCount} of ${imageData.length} images uploaded. ${errors.length} failed.`);
      } else {
        // No images uploaded
        showErrorToast('All uploads failed. Please try again.');
      }
    } catch (error) {
      logger.error('Upload error:', error);
      showErrorToast('Failed to upload images. Please check your internet connection.');
    } finally {
      setIsUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const removeImage = async (key: string) => {
    const imageToRemove = productImages.find((img) => img.key === key);

    if (!imageToRemove) return;

    // Remove from local state
    setProductImages((prev) => {
      const filtered = prev.filter((img) => img.key !== key);
      // If the removed image was primary, make the first remaining image primary
      if (imageToRemove.isPrimary && filtered.length > 0) {
        return filtered.map((img, index) => ({
          ...img,
          isPrimary: index === 0,
        }));
      }
      return filtered;
    });

    // If there's a corresponding uploaded URL, delete from storage
    if (imageToRemove.uploadedUrl) {
      try {
        await storageService.deleteImage(imageToRemove.uploadedUrl);
      } catch (error) {
        logger.error('Error deleting image from storage:', error);
        // Don't show error to user as the image is already removed from UI
      }
    }
  };

  const setPrimaryImage = (key: string) => {
    // Only mark the tapped image as primary visually, without moving it
    // The actual cover image will be determined by position (first image) when saving
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.key === key,
      }))
    );
  };

  const handleSaveDraft = async () => {
    if (isSavingDraft) return;

    setIsSavingDraft(true);
    try {
      // Get current user with automatic session refresh
      const { user, error: authError } = await AuthUtils.getCurrentUserWithRefresh(2);

      if (!user) {
        Alert.alert(
          'Authentication Error',
          authError || 'Your session has expired. Please log in again to save products.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsSavingDraft(false),
            },
            {
              text: 'Log In',
              onPress: () => {
                setIsSavingDraft(false);
                const currentPath = productId ? `/(tabs)/sell?productId=${productId}` : '/(tabs)/sell';
                router.replace(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
              },
            },
          ]
        );
        return;
      }

      // Get uploaded URLs in order, with primary image first
      const primaryImage = productImages.find((img) => img.isPrimary);
      const otherImages = productImages.filter((img) => !img.isPrimary);
      const orderedImages = primaryImage ? [primaryImage, ...otherImages] : productImages;
      const uploadedUrls = orderedImages
        .map((img) => img.uploadedUrl)
        .filter((url): url is string => url !== undefined);

      // Create product data
      const productData = {
        seller_id: user.id,
        product_name: title || 'Untitled Draft',
        product_description: description || null,
        starting_price: price ? parseFloat(price) : 0,
        discounted_price: salePrice ? parseFloat(salePrice) : null,
        product_image: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        product_images: uploadedUrls,
        offers_enabled: enableOffers,
        product_type: 'shop',
        stream_id: 'shop',
        category_id: selectedCategoryId || null,
        subcategory_id: selectedSubcategoryId || null,
        sub_subcategory_id: selectedSubSubcategoryId || null,
        sub_sub_subcategory_id: selectedSubSubSubcategoryId || null,
        brand_id: selectedBrandId || null,
        stock_quantity: itemType === 'multi' && stockQuantity ? parseInt(stockQuantity) : null,
        status: 'draft' as const,
        moderation_status: 'approved',
      };

      // Create or update product using listings service
      let product;
      if (productId) {
        product = await listingsService.updateProduct(productId, productData);
        showSuccessToast('Product updated successfully!');
      } else {
        product = await listingsService.createProduct(productData);
        showSuccessToast('Draft saved successfully!');
      }

      // Save dynamic attributes if unknown
      if (Object.keys(dynamicAttributes).length > 0) {
        await attributesService.saveAttributeValues(product.id, dynamicAttributes);
      }

      // Reset all form fields to initial state
      setTitle('');
      setDescription('');
      setPrice('');
      setSalePrice('');
      setCategory('');
      setItemType('single');
      setEnableOffers(true);
      setStockQuantity('');
      setProductImages([]);
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
      setIsMarketplaceListing(true);
    } catch (error) {
      logger.error('Error saving draft:', error);
      showErrorToast('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishItem = async () => {
    if (isPublishing) return;

    if (!title || !price || !category) {
      showWarningToast('Please complete all required fields (*) to publish this product.');
      return;
    }

    if (itemType === 'multi' && !stockQuantity) {
      showWarningToast('Please enter the stock quantity for this product.');
      return;
    }

    setIsPublishing(true);
    try {
      // Get current user with automatic session refresh
      const { user, error: authError } = await AuthUtils.getCurrentUserWithRefresh(2);

      if (!user) {
        Alert.alert(
          'Authentication Error',
          authError || 'Your session has expired. Please log in again to publish products.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsPublishing(false),
            },
            {
              text: 'Log In',
              onPress: () => {
                setIsPublishing(false);
                const currentPath = productId ? `/(tabs)/sell?productId=${productId}` : '/(tabs)/sell';
                router.replace(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
              },
            },
          ]
        );
        return;
      }

      // Get uploaded URLs in order, with primary image first
      const primaryImage = productImages.find((img) => img.isPrimary);
      const otherImages = productImages.filter((img) => !img.isPrimary);
      const orderedImages = primaryImage ? [primaryImage, ...otherImages] : productImages;
      const uploadedUrls = orderedImages
        .map((img) => img.uploadedUrl)
        .filter((url): url is string => url !== undefined);

      // Create product data
      const productData = {
        seller_id: user.id,
        product_name: title,
        product_description: description || null,
        starting_price: parseFloat(price),
        discounted_price: salePrice ? parseFloat(salePrice) : null,
        product_image: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        product_images: uploadedUrls,
        offers_enabled: enableOffers,
        product_type: 'shop',
        stream_id: 'shop',
        category_id: selectedCategoryId || null,
        subcategory_id: selectedSubcategoryId || null,
        sub_subcategory_id: selectedSubSubcategoryId || null,
        sub_sub_subcategory_id: selectedSubSubSubcategoryId || null,
        brand_id: selectedBrandId || null,
        stock_quantity: itemType === 'single' ? 1 : itemType === 'multi' && stockQuantity ? parseInt(stockQuantity) : 1,
        status: isMarketplaceListing ? ('published' as const) : ('private' as const),
        moderation_status: 'approved',
      };

      // Create or update product using listings service
      let product;
      if (productId) {
        product = await listingsService.updateProduct(productId, productData);
        const message = isMarketplaceListing
          ? 'Product updated and published to marketplace successfully!'
          : 'Product updated and saved to your shop successfully!';
        showSuccessToast(message);
      } else {
        product = await listingsService.createProduct(productData);
        const message = isMarketplaceListing
          ? 'Product published to marketplace successfully!'
          : 'Product saved to your shop successfully!';
        showSuccessToast(message);
      }

      // Save dynamic attributes if unknown
      if (Object.keys(dynamicAttributes).length > 0) {
        await attributesService.saveAttributeValues(product.id, dynamicAttributes);
      }

      // Reset all form fields to initial state
      setTitle('');
      setDescription('');
      setPrice('');
      setSalePrice('');
      setCategory('');
      setItemType('single');
      setEnableOffers(true);
      setStockQuantity('');
      setProductImages([]);
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
      setIsMarketplaceListing(true);
    } catch (error) {
      logger.error('Error publishing product:', error);
      showErrorToast('Failed to publish product. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="items-center mb-8">
              <View className="w-24 h-24 items-center justify-center mb-6 rounded-full bg-gray-100">
                <Feather name="shopping-bag" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-base font-inter-semibold text-gray-500 text-center max-w-sm">
                Please sign in to list and sell your products
              </Text>
            </View>

            <View className="w-full max-w-sm gap-4">
              <Pressable
                onPress={() => {
                  const currentPath = productId ? `/(tabs)/sell?productId=${productId}` : '/(tabs)/sell';
                  router.push(`/(auth)?redirect=${encodeURIComponent(currentPath)}`);
                }}
                className="w-full h-14 items-center justify-center rounded-lg bg-black"
              >
                <Text className="text-base font-inter-bold text-white">Sign In</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(auth)/register')}
                className="w-full h-14 items-center justify-center rounded-lg border-2 border-gray-300 bg-white"
              >
                <Text className="text-base font-inter-bold text-black">Create Account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Check if user is a buyer and show seller setup message
  if (user?.user_type === 'buyer') {
    return (
      <SafeAreaView className="flex-1 mb-14 bg-white">
        {/* Header */}
        <View className="flex-row items-center gap-4 p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="flex-1 text-lg font-inter-bold text-black">Become a Seller</Text>
        </View>

        {/* Seller Setup Message */}
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-full items-center p-6 rounded-2xl bg-white shadow-lg">
            {/* Icon */}
            <View className="items-center justify-center w-20 h-20 mb-6 rounded-full bg-blue-100">
              <Feather name="user-plus" size={40} color="#3B82F6" />
            </View>

            {/* Title */}
            <Text className="mb-4 text-center text-2xl font-inter-bold text-black">Become a Seller</Text>

            {/* Description */}
            <Text className="mb-6 text-center text-sm font-inter-semibold text-gray-600 leading-6">
              You're currently set up as a buyer. To start selling products on Vint Street, you'll need to set up your
              seller account first.
            </Text>

            {/* Benefits List */}
            <View className="w-full mb-8">
              <Text className="mb-3 text-center text-base font-inter-bold text-black">Why become a seller?</Text>

              <View className="gap-1 mb-4">
                <View className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text className="ml-3 text-sm font-inter-semibold text-gray-700">List unlimited products</Text>
                </View>

                <View className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text className="ml-3 text-sm font-inter-semibold text-gray-700">Reach thousands of buyers</Text>
                </View>

                <View className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text className="ml-3 text-sm font-inter-semibold text-gray-700">Manage your own shop</Text>
                </View>

                <View className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text className="ml-3 text-sm font-inter-semibold text-gray-700">Track sales and analytics</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-2 mb-4">
              <TouchableOpacity
                className="w-full h-14 items-center justify-center rounded-lg bg-black"
                onPress={() => {
                  router.push('/seller/seller-setup');
                }}
              >
                <Text className="text-base font-inter-bold text-white">Set Up Seller Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-14 items-center justify-center rounded-lg bg-gray-200"
                onPress={() => router.back()}
              >
                <Text className="text-base font-inter-bold text-gray-800">Maybe Later</Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <Text className="mt-6 text-center text-sm font-inter-semibold text-gray-500">
              Need help? Contact our support team for assistance with seller setup.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 mb-14 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">
          {productId ? 'Edit Product' : 'Add New Product'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          directionalLockEnabled={false}
          nestedScrollEnabled={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 gap-4 p-4">
            {/* Product Images Section */}
            <View className="w-full gap-4 p-4 rounded-lg bg-white shadow-lg">
              <Text className="text-lg font-inter-bold text-black">Product Images (Multiple)</Text>

              {/* Upload Area */}
              <TouchableOpacity
                onPress={() => setShowImagePickerModal(true)}
                disabled={isUploadingImages}
                className={`w-full items-center p-6 rounded-lg border-2 border-dashed ${
                  productImages.length >= 10 ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
              >
                {isUploadingImages ? (
                  <>
                    <ActivityIndicator size="small" color="#666" />
                    <Text className="mt-2 text-sm font-inter-semibold text-gray-600">Uploading images...</Text>
                    <Text className="mt-1 text-xs font-inter-semibold text-gray-400">{uploadProgress}% complete</Text>
                    <View className="mt-3 px-4 py-2 rounded-lg bg-gray-200">
                      <Text className="text-sm font-inter-semibold text-gray-700">Uploading...</Text>
                    </View>
                  </>
                ) : productImages.length >= 10 ? (
                  <>
                    <Feather name="check-circle" size={32} color="#10b981" />
                    <Text className="mt-2 text-sm font-inter-semibold text-green-600">Maximum images reached</Text>
                    <Text className="mt-1 text-xs font-inter-semibold text-green-500">
                      You have selected all 10 images for your product
                    </Text>
                  </>
                ) : (
                  <>
                    <Feather name="upload" size={32} color="#666" />
                    <Text className="mt-2 text-sm font-inter-semibold text-gray-600">
                      {productImages.length > 0
                        ? `${productImages.length} of 10 images selected`
                        : 'Upload product images'}
                    </Text>
                    <Text className="mt-1 text-xs font-inter-semibold text-gray-400">
                      Up to 10MB each, multiple images supported
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowImagePickerModal(true)}
                      className="mt-3 px-4 py-2 rounded-lg bg-gray-200"
                    >
                      <Text className="text-sm font-inter-semibold text-gray-700">
                        {productImages.length > 0 ? 'Add More Images' : 'Choose Images'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </TouchableOpacity>

              {/* Image Previews */}
              {productImages.length > 0 && (
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-inter-bold text-gray-700">{productImages.length} of 10 images</Text>
                    {isUploadingImages && (
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-inter-semibold text-gray-500">
                          Uploading... {uploadProgress}%
                        </Text>
                        <View className="w-16 h-1 bg-gray-200 rounded-full">
                          <View className="h-1 bg-black rounded-full" style={{ width: `${uploadProgress}%` }} />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Info about drag and primary image */}
                  <View className="p-2 rounded-lg bg-blue-50">
                    <Text className="text-sm font-inter-semibold text-blue-800">
                      💡 Long press and drag images to reorder. The first image will be your cover photo.
                    </Text>
                  </View>

                  <View
                    onTouchStart={() => setScrollEnabled(false)}
                    onTouchEnd={() => setTimeout(() => setScrollEnabled(true), 200)}
                    onTouchCancel={() => setTimeout(() => setScrollEnabled(true), 200)}
                    className="w-full"
                  >
                    <DraggableGrid
                      numColumns={3}
                      data={productImages}
                      itemHeight={(Dimensions.get('window').width - 48) / 3}
                      delayLongPress={150}
                      renderItem={(item: unknown) => {
                        const isUploaded = !!item.uploadedUrl;
                        const isUploading = isUploadingImages && !isUploaded;

                        const imageSize = (Dimensions.get('window').width - 48) / 3 - 8;

                        return (
                          <View
                            className="m-1"
                            style={{
                              width: imageSize,
                              height: imageSize,
                            }}
                          >
                            <View
                              className="w-full h-full rounded-lg overflow-hidden"
                              style={{
                                borderWidth: item.isPrimary ? 3 : 1,
                                borderColor: item.isPrimary ? '#ffd700' : '#ccc',
                              }}
                            >
                              <Image
                                source={{ uri: item.uploadedUrl || item.uri }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  opacity: isUploading ? 0.7 : 1,
                                }}
                                resizeMode="cover"
                                onError={(error) => {
                                  logger.error('Image load error:', error.nativeEvent.error);
                                  logger.error('Image URI:', item.uri);
                                }}
                                onLoad={() => {
                                  logger.info('Image loaded successfully:', item.key);
                                }}
                              />

                              {/* Primary Badge */}
                              {item.isPrimary && (
                                <View
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    padding: 4,
                                  }}
                                >
                                  <Text className="text-center text-xs font-inter-bold text-white">⭐ COVER</Text>
                                </View>
                              )}

                              {/* Upload Status Indicator */}
                              {isUploaded ? (
                                <View
                                  style={{
                                    position: 'absolute',
                                    top: 5,
                                    left: 5,
                                    backgroundColor: '#10B981',
                                    borderRadius: 12,
                                    width: 24,
                                    height: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Feather name="check" size={14} color="#fff" />
                                </View>
                              ) : isUploading ? (
                                <View
                                  style={{
                                    position: 'absolute',
                                    top: 5,
                                    left: 5,
                                    backgroundColor: '#3B82F6',
                                    borderRadius: 12,
                                    width: 24,
                                    height: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Feather name="upload" size={14} color="#fff" />
                                </View>
                              ) : (
                                <View
                                  style={{
                                    position: 'absolute',
                                    top: 5,
                                    left: 5,
                                    backgroundColor: '#EAB308',
                                    borderRadius: 12,
                                    width: 24,
                                    height: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Feather name="clock" size={14} color="#fff" />
                                </View>
                              )}

                              {/* Remove Button */}
                              <TouchableOpacity
                                style={{
                                  position: 'absolute',
                                  top: 5,
                                  right: 5,
                                  backgroundColor: '#EF4444',
                                  borderRadius: 12,
                                  width: 24,
                                  height: 24,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  removeImage(item.key);
                                }}
                                disabled={isUploading}
                              >
                                <Feather name="x" size={14} color="#fff" />
                              </TouchableOpacity>

                              {/* Upload Progress Overlay */}
                              {isUploading && (
                                <View
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <ActivityIndicator size="small" color="#fff" />
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      }}
                      onDragRelease={(data: unknown) => {
                        // After reordering, automatically set the first image as primary/cover
                        const reorderedImages = data.map((img: unknown, index: number) => ({
                          ...img,
                          isPrimary: index === 0,
                        }));
                        setProductImages(reorderedImages);
                        setScrollEnabled(true);
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Product Information Section */}
            <View className="w-full gap-4 p-4 rounded-lg bg-white shadow-lg">
              <Text className="text-lg font-inter-bold text-black">Product Information</Text>

              {/* Product Name Field */}
              <InputComponent
                value={title}
                label="Product Name"
                size="small"
                required={true}
                placeholder="Enter product name"
                onChangeText={(text) => setTitle(text)}
                returnKeyType="next"
                textContentType="name"
                autoComplete="name"
              />

              {/* Brand Field */}
              <View className="gap-2">
                <Text className="text-sm font-inter-semibold text-black">Brand</Text>
                <TouchableOpacity
                  className="flex-row items-center justify-between px-3 py-3 bg-white rounded-lg border border-gray-300"
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
                        <Text className="text-sm font-inter-semibold text-black">{selectedBrand.name}</Text>
                      </View>
                    ) : (
                      <Text className="text-sm font-inter-semibold text-gray-400">Select brand (optional)</Text>
                    )}
                  </View>
                  <Feather name="chevron-down" size={16} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Description Field */}
              <InputComponent
                value={description}
                label="Description"
                size="small"
                placeholder="Describe your product"
                onChangeText={(text) => setDescription(text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                height={100}
              />

              {/* Price Fields */}
              <View className="flex-row gap-4">
                <View className="flex-1 gap-2">
                  <Text className="text-sm font-inter-semibold text-gray-700">
                    Price <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="flex-row items-center" style={{ height: 40 }}>
                    <View className="h-full items-center justify-center p-3 rounded-l-lg bg-gray-200 border border-gray-300">
                      <Text className="text-sm font-inter-bold text-gray-700">£ GBP</Text>
                    </View>
                    <TextInput
                      className="h-full flex-1 p-3 rounded-r-lg bg-white border border-gray-300 border-l-0 text-sm font-inter-semibold"
                      placeholder="0.00"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View className="flex-1 gap-2">
                  <Text className="text-sm font-inter-semibold text-gray-700">Sale Price</Text>
                  <View className="flex-row items-center" style={{ height: 40 }}>
                    <View className="h-full items-center justify-center p-3 rounded-l-lg bg-gray-200 border border-gray-300">
                      <Text className="text-sm font-inter-bold text-gray-700">£ GBP</Text>
                    </View>
                    <TextInput
                      className="h-full flex-1 p-3 rounded-r-lg bg-white border border-gray-300 border-l-0 text-sm font-inter-semibold"
                      placeholder="0.00"
                      value={salePrice}
                      onChangeText={setSalePrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Enable Offers Checkbox */}
              <Pressable onPress={() => setEnableOffers(!enableOffers)} className="flex-row items-center gap-2">
                <View
                  className={`w-5 h-5 items-center justify-center rounded border-2 ${
                    enableOffers ? 'bg-black border-black' : 'border-gray-300'
                  }`}
                >
                  {enableOffers && <Feather name="check" size={14} color="#fff" />}
                </View>
                <Text className="text-sm font-inter-semibold text-black">Enable offers on this product</Text>
              </Pressable>
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
            <View className="w-full gap-4 p-4 rounded-lg bg-white shadow-lg">
              <Text className="text-lg font-inter-bold text-black">Stock Management</Text>

              <DropdownComponent
                data={ITEM_TYPE_OPTIONS}
                value={itemType}
                label="Item Type"
                size="small"
                required={true}
                placeholder="Choose your item type"
                onChange={(item) => setItemType(item.value)}
              />

              {/* Stock Quantity Field - Only show for Multi Item */}
              {itemType === 'multi' && (
                <InputComponent
                  value={stockQuantity}
                  label="Stock Quantity"
                  size="small"
                  required={true}
                  placeholder="Enter available quantity"
                  onChangeText={(text) => setStockQuantity(text)}
                  keyboardType="numeric"
                />
              )}
            </View>

            {/* Product Visibility Section */}
            <View className="w-full gap-4 p-4 rounded-lg bg-white shadow-lg">
              <View className="w-full gap-2">
                <View className="flex-row items-center gap-2">
                  <Feather name="globe" size={20} color="#000" />
                  <Text className="text-lg font-inter-bold text-black">Product Visibility</Text>
                </View>

                <Text className="text-sm font-inter-semibold text-gray-700">Control where your product appears</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-inter-semibold text-black">List on Marketplace</Text>
                  <Text className="text-xs font-inter-semibold text-gray-500">
                    {isMarketplaceListing ? 'Visible to all users' : 'Only visible in your shop'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setIsMarketplaceListing(!isMarketplaceListing)}
                  className={`w-14 h-8 items-center justify-center p-1 rounded-full ${
                    isMarketplaceListing ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <View
                    className={`w-6 h-6 items-center justify-center rounded-full bg-white shadow-lg ${
                      isMarketplaceListing ? 'self-end' : 'self-start'
                    }`}
                  />
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full flex-row gap-4">
              <TouchableOpacity
                onPress={handleSaveDraft}
                disabled={isSavingDraft || isPublishing}
                className={`flex-1 items-center justify-center py-3 rounded-lg ${
                  isSavingDraft ? 'bg-gray-400' : 'bg-black'
                }`}
              >
                {isSavingDraft ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-base font-inter-semibold text-white">
                    {productId ? 'Update Draft' : 'Save as Draft'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePublishItem}
                disabled={isSavingDraft || isPublishing}
                className={`flex-1 items-center py-3 rounded-lg ${isPublishing ? 'bg-gray-400' : 'bg-black'}`}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-base font-inter-semibold text-white">
                    {productId ? 'Update Product' : 'Publish to Marketplace'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Brand Selection Modal */}
      <Modal
        visible={showBrandModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBrandModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={styles.container}
        >
          <View className="flex-1 justify-end bg-black/50">
            <SafeAreaView edges={['bottom']} className="w-full rounded-t-2xl bg-white">
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-lg font-inter-bold text-black">Select Brand</Text>
                <TouchableOpacity onPress={() => setShowBrandModal(false)} hitSlop={8}>
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View className="p-4">
                <InputComponent
                  value={brandSearchQuery}
                  size="small"
                  placeholder="Search brands..."
                  onChangeText={(text) => setBrandSearchQuery(text)}
                />
              </View>

              {/* Brand List */}
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-4">
                  {filteredBrands.length === 0 ? (
                    <View className="items-center justify-center p-8">
                      <Text className="text-sm font-inter-semibold text-gray-500">No brands found</Text>
                    </View>
                  ) : (
                    filteredBrands.map((brand) => (
                      <TouchableOpacity
                        key={brand.id}
                        onPress={() => {
                          setSelectedBrandId(brand.id);
                          setShowBrandModal(false);
                          setBrandSearchQuery('');
                        }}
                        className={`flex-row items-center justify-between p-4 rounded-lg ${
                          selectedBrandId === brand.id ? 'bg-gray-100' : 'bg-transparent'
                        }`}
                      >
                        <View className="flex-1 flex-row items-center gap-4">
                          {brand.logo_url && (
                            <Image source={{ uri: brand.logo_url }} className="w-6 h-6" resizeMode="contain" />
                          )}
                          <Text className="flex-1 text-sm font-inter-semibold text-black">{brand.name}</Text>
                        </View>
                        {selectedBrandId === brand.id && <Feather name="check" size={16} color="#000" />}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </ScrollView>

              {/* Clear Selection Button */}
              {selectedBrandId && (
                <View className="p-4">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBrandId('');
                      setBrandSearchQuery('');
                      setShowBrandModal(false);
                    }}
                    className="items-center justify-center p-4 rounded-lg bg-gray-200"
                  >
                    <Text className="text-sm font-inter-semibold text-black">Clear Selection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 items-center justify-center p-4 bg-black/50">
          <View className="w-full h-3/5 rounded-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-row items-center gap-3">
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

              <TouchableOpacity onPress={() => setShowCategoryModal(false)} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              {currentCategoryLevel === 'category' &&
                (categories.length === 0 ? (
                  <View className="items-center justify-center p-8">
                    <Text className="text-sm font-inter-semibold text-gray-500">No categories available</Text>
                  </View>
                ) : (
                  categories.map((category) => (
                    <View key={category.id} className="border-b border-gray-200">
                      <TouchableOpacity
                        onPress={async () => {
                          setSelectedCategoryId(category.id);
                          setCategory(category.name);
                          await loadSubcategories(category.id);
                          setCurrentCategoryLevel('subcategory');
                        }}
                        className="flex-row items-center justify-between p-4"
                      >
                        <Text className="text-base font-inter-semibold text-black">{category.name}</Text>
                        <Feather name="chevron-right" size={16} color="#999" />
                      </TouchableOpacity>
                    </View>
                  ))
                ))}

              {currentCategoryLevel === 'subcategory' &&
                (subcategories.length === 0 ? (
                  <View className="items-center justify-center p-8 gap-4">
                    <Text className="text-sm font-inter-semibold text-gray-500">No subcategories available</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentCategoryLevel('subSubcategory');
                      }}
                      className="px-6 py-3 rounded-lg bg-black"
                    >
                      <Text className="text-base font-inter-semibold text-white">
                        Continue with {categories.find((c) => c.id === selectedCategoryId)?.name || 'Category'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  subcategories.map((subcategory) => (
                    <View key={subcategory.id} className="border-b border-gray-200">
                      <TouchableOpacity
                        onPress={async () => {
                          setSelectedSubcategoryId(subcategory.id);
                          await loadSubSubcategories(subcategory.id);
                          await loadAttributes(subcategory.id);
                          setCurrentCategoryLevel('subSubcategory');
                        }}
                        className="flex-row items-center justify-between p-4"
                      >
                        <Text className="text-base font-inter-semibold text-black">{subcategory.name}</Text>
                        <Feather name="chevron-right" size={16} color="#999" />
                      </TouchableOpacity>
                    </View>
                  ))
                ))}

              {currentCategoryLevel === 'subSubcategory' &&
                (subSubcategories.length === 0 ? (
                  <View className="items-center justify-center p-8 gap-4">
                    <Text className="text-sm font-inter-semibold text-gray-500">No types available</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentCategoryLevel('subSubSubcategory');
                      }}
                      className="px-6 py-3 rounded-lg bg-black"
                    >
                      <Text className="text-base font-inter-semibold text-white">
                        Continue with {subcategories.find((s) => s.id === selectedSubcategoryId)?.name || 'Subcategory'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  subSubcategories.map((subSubcategory) => (
                    <View key={subSubcategory.id} className="border-b border-gray-200">
                      <TouchableOpacity
                        onPress={async () => {
                          setSelectedSubSubcategoryId(subSubcategory.id);
                          await loadSubSubSubcategories(subSubcategory.id);
                          await loadAttributes(selectedSubcategoryId, subSubcategory.id);
                          setCurrentCategoryLevel('subSubSubcategory');
                        }}
                        className="flex-row items-center justify-between p-4"
                      >
                        <Text className="text-base font-inter-semibold text-black">{subSubcategory.name}</Text>
                        <Feather name="chevron-right" size={16} color="#999" />
                      </TouchableOpacity>
                    </View>
                  ))
                ))}

              {currentCategoryLevel === 'subSubSubcategory' &&
                (subSubSubcategories.length === 0 ? (
                  <View className="items-center justify-center p-8 gap-4">
                    <Text className="text-sm font-inter-semibold text-gray-500">No specific types available</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowCategoryModal(false);
                      }}
                      className="px-6 py-3 rounded-lg bg-black"
                    >
                      <Text className="text-base font-inter-semibold text-white">
                        Use {subSubcategories.find((s) => s.id === selectedSubSubcategoryId)?.name || 'Sub-subcategory'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  subSubSubcategories.map((subSubSubcategory) => (
                    <View key={subSubSubcategory.id} className="border-b border-gray-200">
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedSubSubSubcategoryId(subSubSubcategory.id);
                          setShowCategoryModal(false);
                        }}
                        className="flex-row items-center justify-between p-4"
                      >
                        <Text className="text-base font-inter-semibold text-black">{subSubSubcategory.name}</Text>
                        {selectedSubSubSubcategoryId === subSubSubcategory.id && (
                          <Feather name="check" size={16} color="#999" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                ))}
            </ScrollView>
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
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView edges={['bottom']} className="rounded-t-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-inter-bold text-black">Add Product Images</Text>
              <TouchableOpacity onPress={() => setShowImagePickerModal(false)} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View className="p-4 gap-4">
              {/* Image Count Info */}
              <View className="p-4 rounded-lg bg-blue-50">
                <View className="flex-row items-center">
                  <Feather name="info" size={16} color="#3B82F6" />
                  <Text className="ml-2 text-sm font-inter-semibold text-blue-800">
                    {productImages.length} of 10 images selected
                  </Text>
                </View>
                <Text className="mt-1 text-xs font-inter-semibold text-blue-600">
                  You can add up to 10 high-quality images to showcase your product
                </Text>
              </View>

              {/* Options */}
              <TouchableOpacity
                className={`flex-row items-center gap-1 p-4 rounded-lg ${
                  productImages.length >= 10 ? 'bg-gray-100 opacity-50' : 'bg-gray-100'
                }`}
                onPress={pickImageFromGallery}
                disabled={productImages.length >= 10}
              >
                <Feather name="image" size={24} color="#666" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Choose from Gallery</Text>
                  <Text className="text-sm font-inter-semibold text-gray-600">
                    {productImages.length >= 10
                      ? 'Maximum images reached'
                      : 'Select multiple images from your photo library'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center gap-1 p-4 rounded-lg ${
                  productImages.length >= 10 ? 'bg-gray-100 opacity-50' : 'bg-gray-100'
                }`}
                onPress={takePhotoWithCamera}
                disabled={productImages.length >= 10}
              >
                <Feather name="camera" size={24} color="#666" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Take Photo</Text>
                  <Text className="text-sm font-inter-semibold text-gray-600">
                    {productImages.length >= 10 ? 'Maximum images reached' : 'Capture a new photo with your camera'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
