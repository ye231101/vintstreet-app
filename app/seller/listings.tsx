import { listingsService, Product } from '@/api';
import { ShippingSettingsModal } from '@/components/shipping-settings-modal';
import { useAuth } from '@/hooks/use-auth';
import { blurhash } from '@/utils';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('published');
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
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
  }, [user?.id, activeTab]);

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

  const parseCSV = (csv: string): Array<Record<string, string>> => {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = (() => {
      const row = lines[0];
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());
      return fields.map((h) => h.replace(/^"|"$/g, ''));
    })();

    const rows: Array<Record<string, string>> = [];
    for (let li = 1; li < lines.length; li++) {
      const row = lines[li];
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cols.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      cols.push(current);
      if (cols.every((c) => c.trim() === '')) continue;
      const record: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i];
        const val = (cols[i] ?? '').trim().replace(/^"|"$/g, '');
        record[key] = val;
      }
      rows.push(record);
    }
    return rows;
  };

  const handleBulkUpload = async () => {
    try {
      if (!user?.id) {
        showErrorToast('Please sign in to bulk upload');
        return;
      }
      setIsBulkUploading(true);
      const csvMimeTypes = [
        'text/csv',
        'application/csv',
        'text/comma-separated-values',
        'application/vnd.ms-excel',
        'application/octet-stream',
        '*/*',
      ];
      const res = await DocumentPicker.getDocumentAsync({ type: csvMimeTypes as any, copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }
      const asset = res.assets[0];
      const fileUri = asset.uri;
      const mime = asset.mimeType || '';
      const name = asset.name || '';

      const looksCsv =
        name.toLowerCase().endsWith('.csv') ||
        /csv|comma\-separated\-values|vnd\.ms\-excel/i.test(mime || '');
      if (!looksCsv) {
        showErrorToast('Please select a CSV file');
        return;
      }

      const readCsvContent = async (): Promise<string> => {
        try {
          if (Platform.OS === 'web') {
            const resp = await fetch(fileUri);
            return await resp.text();
          }
          // Try expo-file-system first
          return await FileSystem.readAsStringAsync(fileUri);
        } catch (_) {
          try {
            // Fallback for content:// URIs and others
            const resp = await fetch(fileUri as any);
            return await resp.text();
          } catch (err) {
            throw err;
          }
        }
      };

      const content = await readCsvContent();
      const rows = parseCSV(content);
      if (rows.length === 0) {
        showErrorToast('No rows found in CSV');
        return;
      }

      const normalized = rows.map((r) => {
        const collectImageUrls = (): string[] => {
          const candidates: string[] = [];
          const pushSplit = (val?: string) => {
            if (!val) return;
            val
              .split(/[,;\s]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
              .forEach((u) => candidates.push(u));
          };

          // Common CSV columns
          pushSplit(r.product_image);
          pushSplit(r.image_url);
          pushSplit(r.image);
          pushSplit(r.images);
          pushSplit(r.image_urls);

          // image1..image10 style
          for (let i = 1; i <= 10; i++) {
            const key = `image${i}` as keyof typeof r;
            const v = (r as any)[key];
            pushSplit(v);
          }

          // Deduplicate while preserving order
          const seen = new Set<string>();
          const unique = candidates.filter((u) => {
            if (seen.has(u)) return false;
            seen.add(u);
            return true;
          });
          return unique;
        };

        const imageUrls = collectImageUrls();
        const primaryImage = imageUrls.length > 0 ? imageUrls[0] : null;

        return {
          product_name: r.product_name || r.name || '',
          product_description: r.product_description || r.description || null,
          starting_price: r.starting_price ? Number(r.starting_price) : r.price ? Number(r.price) : null,
          discounted_price: r.discounted_price ? Number(r.discounted_price) : null,
          stock_quantity: r.stock_quantity ? Number(r.stock_quantity) : null,
          category_id: r.category_id || null,
          subcategory_id: r.subcategory_id || null,
          sub_subcategory_id: r.sub_subcategory_id || null,
          sub_sub_subcategory_id: r.sub_sub_subcategory_id || null,
          brand_id: r.brand_id || null,
          status: (r.status as any) || 'draft',
          product_image: primaryImage,
          product_images: imageUrls.length > 0 ? imageUrls : null,
        } as any;
      });

      const valid = normalized.filter((n) => n.product_name && (n.starting_price === null || !Number.isNaN(n.starting_price)));
      if (valid.length === 0) {
        showErrorToast('CSV has no valid rows');
        return;
      }

      const createdCount = await listingsService.bulkCreateProducts(user.id, valid as any);
      showSuccessToast(`Created ${createdCount} products`);
      await loadProducts();
    } catch (e) {
      console.error(e);
      showErrorToast('Bulk upload failed');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = product.product_image || (product.product_images && product.product_images[0]) || null;

    return (
      <View className="bg-white rounded-xl mb-4 shadow-lg overflow-hidden">
        {/* Product Image */}
        <View className="relative">
          <Image
            source={imageUrl}
            contentFit="cover"
            placeholder={{ blurhash }}
            transition={1000}
            style={{ width: '100%', height: 200 }}
          />

          {/* Status Badge Overlay */}
          <View className="absolute top-3 right-3">
            <View
              className={`${
                product.status === 'published'
                  ? 'bg-green-500'
                  : product.status === 'draft'
                  ? 'bg-orange-500'
                  : 'bg-gray-500'
              } rounded-full px-3 py-1.5 shadow-md`}
            >
              <Text className="text-white font-inter-bold text-xs">
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          {/* Product Name */}
          <Text className="text-gray-900 font-inter-bold text-lg mb-2" numberOfLines={2}>
            {product.product_name}
          </Text>

          {/* Product Description */}
          {product.product_description && (
            <Text className="text-gray-600 text-sm font-inter-semibold mb-3" numberOfLines={2}>
              {product.product_description}
            </Text>
          )}

          {/* Price Section */}
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl font-inter-bold text-black">
              £
              {product.discounted_price !== null
                ? product.discounted_price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : product.starting_price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </Text>
            {product.discounted_price !== null && (
              <Text className="text-sm font-inter-semibold text-gray-400 line-through ml-2">
                £
                {product.starting_price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )}
          </View>

          {/* Category Info */}
          {product.product_categories && (
            <View className="flex-row items-center mb-3">
              <Feather name="tag" size={14} color="#666" />
              <Text className="text-gray-600 text-xs font-inter-semibold ml-1">{product.product_categories.name}</Text>
            </View>
          )}

          {/* Created Date */}
          <View className="flex-row items-center mb-4 border-t border-gray-100 pt-3">
            <Feather name="calendar" size={14} color="#666" />
            <Text className="text-gray-600 text-xs font-inter-semibold ml-1">
              Created {new Date(product.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 flex-wrap">
            {product.status === 'published' && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await listingsService.updateListingStatus(product.id, 'private');
                    showSuccessToast('Listing has been made private');
                    loadProducts();
                  } catch (error) {
                    showErrorToast('Failed to update listing status');
                  }
                }}
                className="bg-orange-500 rounded-lg py-2.5 px-4 flex-row items-center justify-center flex-1"
              >
                <Feather name="eye-off" size={16} color="white" />
                <Text className="text-white text-center text-sm font-inter-bold ml-1.5">Make Private</Text>
              </TouchableOpacity>
            )}
            {product.status === 'draft' && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await listingsService.updateListingStatus(product.id, 'published');
                    showSuccessToast('Listing has been made live');
                    loadProducts();
                  } catch (error) {
                    showErrorToast('Failed to update listing status');
                  }
                }}
                className="bg-green-500 rounded-lg py-2.5 px-4 flex-row items-center justify-center flex-1"
              >
                <Feather name="check-circle" size={16} color="white" />
                <Text className="text-white text-center text-sm font-inter-bold ml-1.5">Make Live</Text>
              </TouchableOpacity>
            )}
            {product.status === 'private' && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await listingsService.updateListingStatus(product.id, 'published');
                    showSuccessToast('Listing has been published');
                    loadProducts();
                  } catch (error) {
                    showErrorToast('Failed to update listing status');
                  }
                }}
                className="bg-green-500 rounded-lg py-2.5 px-4 flex-row items-center justify-center flex-1"
              >
                <Feather name="check-circle" size={16} color="white" />
                <Text className="text-white text-center text-sm font-inter-bold ml-1.5">Publish</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/sell',
                  params: { productId: product.id },
                } as any);
              }}
              className="bg-blue-500 rounded-lg py-2.5 px-4 flex-row items-center justify-center flex-1"
            >
              <Feather name="edit-2" size={16} color="white" />
              <Text className="text-white text-sm font-inter-bold ml-1.5">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push(`/product/${product.id}` as any);
              }}
              className="bg-gray-700 rounded-lg py-2.5 px-4 flex-row items-center justify-center flex-1"
            >
              <Feather name="eye" size={16} color="white" />
              <Text className="text-white text-sm font-inter-bold ml-1.5">View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">My Listings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProducts} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 p-4">
          {/* Action Buttons */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => {
                setIsShippingModalOpen(true);
              }}
              className="bg-gray-200 rounded-lg py-4 px-5 mb-3 items-center shadow-lg"
            >
              <Text className="text-gray-900 text-base font-inter-bold">Shipping Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                router.push('/(tabs)/sell');
              }}
              className="bg-white rounded-lg py-4 px-5 mb-4 items-center border border-gray-300 shadow-lg"
            >
              <Text className="text-gray-900 text-base font-inter-bold">Add Product</Text>
            </TouchableOpacity>

            {/* Information Banner */}
            <View className="bg-blue-500 rounded-lg p-4 mb-4 flex-row items-center shadow-lg">
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
              onPress={handleBulkUpload}
              disabled={isBulkUploading}
              className="bg-gray-200 border border-gray-300 rounded-lg py-3 px-4 flex-row items-center justify-center flex-1 shadow-lg"
            >
              {isBulkUploading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <>
                  <Feather name="upload" color="#333" size={16} className="mr-2" />
                  <Text className="text-gray-900 text-sm font-inter-medium">Bulk Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <View className="flex-row gap-3 mb-4">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key ? 'bg-black border-black' : 'bg-white border-gray-300'
                } flex-1 rounded-md py-3 px-2 border shadow-lg`}
              >
                <Text
                  className={`${
                    activeTab === tab.key ? 'text-white' : 'text-black'
                  } text-xs font-inter-medium text-center`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Products List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center p-4 bg-white rounded-xl shadow-lg">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading your listings...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center p-4 bg-white rounded-xl shadow-lg">
              <Feather name="alert-circle" color="#ff4444" size={64} />
              <Text className="my-4 text-lg font-inter-bold text-red-500">Error loading products</Text>
              <TouchableOpacity onPress={loadProducts} className="bg-black rounded-lg py-3 px-6">
                <Text className="text-base font-inter-bold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : products.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProducts} />}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center p-4 bg-white rounded-xl shadow-lg">
              <Feather name="package" color="#666" size={64} />
              <Text className="text-gray-900 text-lg font-inter-bold mt-4">No products yet</Text>
              <Text className="text-gray-600 text-sm font-inter-semibold mt-2 text-center">
                Create your first product template
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Shipping Settings Modal */}
      <ShippingSettingsModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        userId={user?.id}
      />
    </SafeAreaView>
  );
}
