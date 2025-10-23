import { showSuccessToast } from '@/utils/toast';
import { AuthUtils } from '@/utils/auth-utils';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../api/config/supabase';
import { attributesService } from '../../api/services/attributes.service';
import { brandsService } from '../../api/services/brands.service';
import { listingsService } from '../../api/services/listings.service';
import { StorageService } from '../../api/services/storage.service';
import { CategoryAttributesCard } from '../../components/category-attributes-card';

export default function SellScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [itemType, setItemType] = useState('single');
  const [enableOffers, setEnableOffers] = useState(true);
  const [purchaseNote, setPurchaseNote] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
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
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>({});
  const [attributes, setAttributes] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stockQuantity, setStockQuantity] = useState('');

  const itemTypeOptions = [
    { key: 'single', label: 'Single Item' },
    { key: 'multi', label: 'Multi Item (with quantity)' },
  ];

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

  // Load product data when editing
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId) return;

      try {
        const product = await listingsService.getListingById(productId);

        if (!product) {
          Alert.alert('Error', 'Product not found');
          return;
        }

        // Set basic fields
        setTitle(product.product_name || '');
        setDescription(product.product_description || '');
        setPrice(product.starting_price ? product.starting_price.toString() : '');
        setSalePrice(product.discounted_price ? product.discounted_price.toString() : '');
        setStockQuantity(product.stock_quantity ? product.stock_quantity.toString() : '');

        // Set images
        if (product.product_images && product.product_images.length > 0) {
          setUploadedImageUrls(product.product_images);
        } else if (product.product_image) {
          setUploadedImageUrls([product.product_image]);
        }

        // Set brand
        if (product.brand_id) {
          setSelectedBrandId(product.brand_id);
          const brandData = brands.find((b) => b.id === product.brand_id);
          if (brandData) {
            setBrand(brandData.name);
          }
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
        console.error('Error loading product data:', error);
        Alert.alert('Error', 'Failed to load product data');
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
          Alert.alert('No Valid Images', 'No valid images were selected. Please try again.');
          return;
        }

        const newImages = validImages.map((asset) => asset.uri);

        // Check if adding these images would exceed the limit
        if (productImages.length + newImages.length > 10) {
          Alert.alert('Too Many Images', 'You can upload a maximum of 10 images per product.');
          return;
        }

        setProductImages((prev) => [...prev, ...newImages]);
        setShowImagePickerModal(false);

        // Upload images to Supabase storage
        await uploadImagesToStorage(newImages);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images from gallery. Please try again.');
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
        Alert.alert('Image Limit Reached', 'You can upload a maximum of 10 images per product.');
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
        const newImages = result.assets.map((asset) => asset.uri);
        setProductImages((prev) => [...prev, ...newImages]);
        setShowImagePickerModal(false);

        // Upload images to Supabase storage
        await uploadImagesToStorage(newImages);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Upload images to Supabase storage
  const uploadImagesToStorage = async (imageUris: string[]) => {
    if (imageUris.length === 0) return;

    // Check if user needs re-authentication before starting upload
    const needsReAuth = await AuthUtils.needsReAuthentication();
    if (needsReAuth) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again to continue.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Log In',
            onPress: () => router.replace('/(auth)')
          }
        ]
      );
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
              onPress: () => setIsUploadingImages(false)
            },
            {
              text: 'Try Again',
              onPress: () => {
                // Retry the upload process
                uploadImagesToStorage(imageUris);
              }
            },
            {
              text: 'Log In',
              onPress: () => {
                setIsUploadingImages(false);
                // Navigate to login screen
                router.replace('/(auth)');
              }
            }
          ]
        );
        return;
      }

      // Upload images one by one with progress tracking
      const uploadedUrls: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < imageUris.length; i++) {
        try {
          const result = await StorageService.uploadImage(imageUris[i], user.id);

          if (result.success && result.url) {
            uploadedUrls.push(result.url);
          } else {
            errors.push(`Image ${i + 1}: ${result.error || 'Upload failed'}`);
          }

          // Update progress
          const progress = Math.round(((i + 1) / imageUris.length) * 100);
          setUploadProgress(progress);
        } catch (error) {
          console.error(`Error uploading image ${i + 1}:`, error);
          errors.push(`Image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update state with successful uploads
      if (uploadedUrls.length > 0) {
        setUploadedImageUrls((prev) => [...prev, ...uploadedUrls]);
      }

      // Show results
      if (uploadedUrls.length === imageUris.length) {
        // All images uploaded successfully
        Alert.alert('Success', `${uploadedUrls.length} image(s) uploaded successfully!`);
      } else if (uploadedUrls.length > 0) {
        // Some images uploaded successfully
        Alert.alert(
          'Partial Success',
          `${uploadedUrls.length} of ${imageUris.length} images uploaded successfully. ${errors.length} failed.`
        );
      } else {
        // No images uploaded
        const errorMessage = errors.length > 0 ? errors.join('\n') : 'All uploads failed';
        Alert.alert('Upload Failed', errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload images. Please check your internet connection and try again.');
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
              onPress: () => setIsSavingDraft(false)
            },
            {
              text: 'Log In',
              onPress: () => {
                setIsSavingDraft(false);
                router.replace('/(auth)');
              }
            }
          ]
        );
        return;
      }

      // Create product data
      const productData = {
        seller_id: user.id,
        product_name: title || 'Untitled Draft',
        product_description: description || null,
        starting_price: 0,
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

      // Save dynamic attributes if any
      if (Object.keys(dynamicAttributes).length > 0) {
        await attributesService.saveAttributeValues(product.id, dynamicAttributes);
      }

      // Reset all form fields to initial state
      setTitle('');
      setDescription('');
      setPrice('');
      setSalePrice('');
      setBrand('');
      setCategory('');
      setItemType('single');
      setEnableOffers(true);
      setStockQuantity('');
      setPurchaseNote('');
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
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishItem = async () => {
    if (isPublishing) return;

    if (!title || !price || !category) {
      Alert.alert('Required Fields', 'Please complete all required fields (*) to publish this product.');
      return;
    }

    if (itemType === 'multi' && !stockQuantity) {
      Alert.alert('Stock Quantity Required', 'Please enter the stock quantity for this product.');
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
              onPress: () => setIsPublishing(false)
            },
            {
              text: 'Log In',
              onPress: () => {
                setIsPublishing(false);
                router.replace('/(auth)');
              }
            }
          ]
        );
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
        stock_quantity: itemType === 'multi' && stockQuantity ? parseInt(stockQuantity) : null,
        status: 'published' as const,
        moderation_status: 'approved',
      };

      // Create or update product using listings service
      let product;
      if (productId) {
        product = await listingsService.updateProduct(productId, productData);
        Alert.alert('Success', 'Product updated and published successfully!');
      } else {
        product = await listingsService.createProduct(productData);
        Alert.alert('Success', 'Product published to marketplace successfully!');
      }

      // Save dynamic attributes if any
      if (Object.keys(dynamicAttributes).length > 0) {
        await attributesService.saveAttributeValues(product.id, dynamicAttributes);
      }

      // Reset all form fields to initial state
      setTitle('');
      setDescription('');
      setPrice('');
      setSalePrice('');
      setBrand('');
      setCategory('');
      setItemType('single');
      setEnableOffers(true);
      setStockQuantity('');
      setPurchaseNote('');
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
    } catch (error) {
      console.error('Error publishing product:', error);
      Alert.alert('Error', 'Failed to publish product. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Track if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const hasChanges = Boolean(
      title ||
        description ||
        price ||
        salePrice ||
        brand ||
        category ||
        purchaseNote ||
        stockQuantity ||
        productImages.length > 0 ||
        Object.keys(dynamicAttributes).length > 0 ||
        selectedBrandId ||
        selectedCategoryId
    );
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

  // Handle save as draft from modal
  const handleSaveAsDraftAndLeave = async () => {
    setShowUnsavedChangesModal(false);
    await handleSaveDraft();
  };

  // Handle continue without saving
  const handleContinueWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    // Clear all form data
    setTitle('');
    setDescription('');
    setPrice('');
    setSalePrice('');
    setBrand('');
    setCategory('');
    setItemType('single');
    setEnableOffers(true);
    setStockQuantity('');
    setPurchaseNote('');
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
          <Text className="text-lg font-inter-bold text-white">{productId ? 'Edit Product' : 'Add New Product'}</Text>
        </TouchableOpacity>
        <Feather name="shopping-bag" size={24} color="#fff" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-gray-100">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => {
              setShowItemTypeDropdown(false);
            }}
          >
            <View className="p-4">
              {/* Product Images Section */}
              <View className="bg-white rounded-lg p-4 mb-4">
                <Text className="text-lg font-inter-bold text-black mb-4">Product Images (Multiple)</Text>

                {/* Upload Area */}
                <TouchableOpacity
                  className={`border-2 border-dashed rounded-lg p-6 items-center mb-4 ${
                    productImages.length >= 10 ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
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
                  ) : productImages.length >= 10 ? (
                    <>
                      <Feather name="check-circle" size={32} color="#10B981" />
                      <Text className="text-sm font-inter text-green-600 mt-2">Maximum images reached</Text>
                      <Text className="text-xs font-inter text-green-500 mt-1">
                        You have selected all 10 images for your product
                      </Text>
                    </>
                  ) : (
                    <>
                      <Feather name="upload" size={32} color="#666" />
                      <Text className="text-sm font-inter text-gray-600 mt-2">
                        {productImages.length > 0
                          ? `${productImages.length} of 10 images selected`
                          : 'Upload product images'}
                      </Text>
                      <Text className="text-xs font-inter text-gray-400 mt-1">
                        Up to 10MB each, multiple images supported
                      </Text>
                      <TouchableOpacity
                        className="bg-gray-200 rounded-lg py-2 px-4 mt-3"
                        onPress={() => setShowImagePickerModal(true)}
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
                  <View className="mt-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-inter-semibold text-gray-700">
                        {productImages.length} of 10 images
                      </Text>
                      {isUploadingImages && (
                        <View className="flex-row items-center">
                          <Text className="text-xs font-inter text-gray-500 mr-2">Uploading... {uploadProgress}%</Text>
                          <View className="w-16 h-1 bg-gray-200 rounded-full">
                            <View className="h-1 bg-blue-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
                          </View>
                        </View>
                      )}
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      {productImages.map((imageUri, index) => {
                        const isUploaded = uploadedImageUrls[index];
                        const isUploading = isUploadingImages && !isUploaded;

                        return (
                          <TouchableOpacity key={index} className="relative">
                            <Image
                              source={{ uri: imageUri }}
                              className="w-20 h-20 rounded-lg"
                              resizeMode="cover"
                              style={{ opacity: isUploading ? 0.7 : 1 }}
                            />

                            {/* Upload Status Indicator */}
                            {isUploaded ? (
                              <View className="absolute -top-2 -left-2 bg-green-500 rounded-full w-6 h-6 items-center justify-center">
                                <Feather name="check" size={14} color="#fff" />
                              </View>
                            ) : isUploading ? (
                              <View className="absolute -top-2 -left-2 bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
                                <Feather name="upload" size={14} color="#fff" />
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
                              disabled={isUploading}
                            >
                              <Feather name="x" size={14} color="#fff" />
                            </TouchableOpacity>

                            {/* Upload Progress Overlay */}
                            {isUploading && (
                              <View className="absolute inset-0 bg-black/20 rounded-lg items-center justify-center">
                                <View className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
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
                    className="bg-white rounded-lg border border-gray-300 px-3 text-sm font-inter h-24"
                    placeholder="Describe your product"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Price Fields */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-inter-semibold text-black mb-2">Price *</Text>
                    <View className="flex-row items-center">
                      <View className="bg-gray-200 rounded-l-lg px-3 py-3 border border-gray-300">
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
                      <View className="bg-gray-200 rounded-l-lg px-3 py-3 border border-gray-300">
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
                      <Text className="text-sm font-inter text-black">
                        {itemTypeOptions.find((type) => type.key === itemType)?.label || 'Select item type'}
                      </Text>
                      <Feather name="chevron-down" size={16} color="#999" />
                    </TouchableOpacity>

                    {showItemTypeDropdown && (
                      <View className="absolute top-11 left-0 right-0 z-50 bg-white rounded-lg border border-gray-300 shadow-lg">
                        {itemTypeOptions.map((type, index) => (
                          <TouchableOpacity
                            key={type.key}
                            className={`py-3 px-3 ${
                              index < itemTypeOptions.length - 1 ? 'border-b border-gray-100' : ''
                            } ${type.key === itemType ? 'bg-gray-100' : 'bg-transparent'}`}
                            onPress={(e) => {
                              e.stopPropagation();
                              setItemType(type.key);
                              setShowItemTypeDropdown(false);
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <Text className="text-sm font-inter text-black">{type.label}</Text>
                              {type.key === itemType && <Feather name="check" size={16} color="#000" />}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Stock Quantity Field - Only show for Multi Item */}
                {itemType === 'multi' && (
                  <View className="mb-4">
                    <Text className="text-sm font-inter-semibold text-black mb-2">Stock Quantity *</Text>
                    <TextInput
                      className="bg-white rounded-lg border border-gray-300 px-3 py-3 text-sm font-inter"
                      placeholder="Enter available quantity"
                      value={stockQuantity}
                      onChangeText={setStockQuantity}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  className={`flex-1 rounded-lg py-3 mr-2 items-center ${isSavingDraft ? 'bg-gray-400' : 'bg-black'}`}
                  onPress={handleSaveDraft}
                  disabled={isSavingDraft || isPublishing}
                >
                  <Text className="text-base font-inter-semibold text-white">
                    {isSavingDraft ? 'Saving...' : productId ? 'Update Draft' : 'Save as Draft'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-lg py-3 ml-2 items-center ${isPublishing ? 'bg-gray-400' : 'bg-black'}`}
                  onPress={handlePublishItem}
                  disabled={isSavingDraft || isPublishing}
                >
                  <Text className="text-base font-inter-semibold text-white">
                    {isPublishing
                      ? productId
                        ? 'Updating...'
                        : 'Publishing...'
                      : productId
                      ? 'Update Product'
                      : 'Publish to Marketplace'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
          <View className="bg-white rounded-t-3xl pt-5 px-5 pb-5 max-h-4/5">
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
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-inter-bold text-black mb-3 text-center">Unsaved Changes</Text>

            <Text className="text-sm font-inter text-gray-600 mb-6 text-center leading-5">
              You have unsaved changes. Would you like to save them as a draft before leaving?
            </Text>

            <View className="gap-3">
              <TouchableOpacity
                className={`rounded-lg py-3 items-center ${isSavingDraft ? 'bg-gray-400' : 'bg-black'}`}
                onPress={handleSaveAsDraftAndLeave}
                disabled={isSavingDraft}
              >
                <Text className="text-base font-inter-semibold text-white">
                  {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-500 rounded-lg py-3 items-center"
                onPress={handleContinueWithoutSaving}
                disabled={isSavingDraft}
              >
                <Text className="text-base font-inter-semibold text-white">Discard Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-200 rounded-lg py-3 items-center"
                onPress={handleCancelNavigation}
                disabled={isSavingDraft}
              >
                <Text className="text-base font-inter-semibold text-black">Cancel</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          className="flex-1"
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
        </KeyboardAvoidingView>
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

            {/* Image Count Info */}
            <View className="bg-blue-50 rounded-lg p-3 mb-4">
              <View className="flex-row items-center">
                <Feather name="info" size={16} color="#3B82F6" />
                <Text className="text-sm font-inter text-blue-800 ml-2">
                  {productImages.length} of 10 images selected
                </Text>
              </View>
              <Text className="text-xs font-inter text-blue-600 mt-1">
                You can add up to 10 high-quality images to showcase your product
              </Text>
            </View>

            {/* Options */}
            <View className="gap-4">
              <TouchableOpacity
                className={`rounded-lg py-4 px-4 flex-row items-center ${
                  productImages.length >= 10 ? 'bg-gray-100 opacity-50' : 'bg-gray-100'
                }`}
                onPress={pickImageFromGallery}
                disabled={productImages.length >= 10}
              >
                <Feather name="image" size={24} color="#666" className="mr-4" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Choose from Gallery</Text>
                  <Text className="text-sm font-inter text-gray-600">
                    {productImages.length >= 10
                      ? 'Maximum images reached'
                      : 'Select multiple images from your photo library'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-lg py-4 px-4 flex-row items-center ${
                  productImages.length >= 10 ? 'bg-gray-100 opacity-50' : 'bg-gray-100'
                }`}
                onPress={takePhotoWithCamera}
                disabled={productImages.length >= 10}
              >
                <Feather name="camera" size={24} color="#666" className="mr-4" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Take Photo</Text>
                  <Text className="text-sm font-inter text-gray-600">
                    {productImages.length >= 10 ? 'Maximum images reached' : 'Capture a new photo with your camera'}
                  </Text>
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
