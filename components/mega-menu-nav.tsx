import { categoriesService } from '@/api/services';
import { logger } from '@/utils/logger';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProductSubSubSubcategory {
  id: string;
  name: string;
  slug: string;
  sub_subcategory_id: string;
}

interface ProductSubSubcategory {
  id: string;
  name: string;
  slug: string;
  subcategory_id: string;
  show_in_mega_menu?: boolean;
  product_sub_sub_subcategories?: ProductSubSubSubcategory[];
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  show_in_mega_menu?: boolean;
  product_sub_subcategories?: ProductSubSubcategory[];
}

interface Brand {
  id: string;
  name: string;
}

interface CategoryBrand {
  brand_id: string;
  brands: Brand;
}

interface MenuImage {
  id: string;
  image_url: string;
  image_alt?: string;
  image_link?: string;
  layout_id: string;
}

interface CustomListItem {
  id: string;
  name: string;
  url?: string;
  display_name?: string;
  category_id?: string;
  category_level?: number;
  list_id: string;
}

interface CustomList {
  id: string;
  name: string;
  system_name?: string;
  list_type?: string;
  category_id: string;
  items?: CustomListItem[];
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  layout?: unknown;
  images?: MenuImage[];
  brands: CategoryBrand[];
  product_subcategories: ProductSubcategory[];
  trending: Array<{ id: string; name: string; path?: string }>;
  bestSellers: Array<{ id: string; name: string; path?: string }>;
  luxuryBrands: CategoryBrand[];
  customLists?: CustomList[];
}

export const MegaMenuNav = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [allCustomLists, setAllCustomLists] = useState<CustomList[]>([]);
  const [allCustomItems, setAllCustomItems] = useState<CustomListItem[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchCustomLists();
    fetchCustomItems();
  }, []);

  const fetchCustomLists = async () => {
    try {
      const data = await categoriesService.getMegaMenuCustomLists();
      setAllCustomLists(data as unknown as CustomList[]);
    } catch (error) {
      logger.error('Error fetching custom lists:', error);
    }
  };

  const fetchCustomItems = async () => {
    try {
      const data = await categoriesService.getMegaMenuCustomListItems();
      setAllCustomItems(data as CustomListItem[]);
    } catch (error) {
      logger.error('Error fetching custom items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await categoriesService.getMegaMenuCategories();
      setCategories(categoriesData as ProductCategory[]);
    } catch (error) {
      logger.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categorySlug: string) => {
    setActiveCategory(categoryId);
    setShowMenu(true);
  };

  const handleCategoryNavigate = (categorySlug: string) => {
    setShowMenu(false);
    setActiveCategory(null);
    router.push({
      pathname: '/(tabs)/discovery',
      params: { category: categorySlug },
    } as unknown);
  };

  const handleLinkClick = (path: string) => {
    setShowMenu(false);
    setActiveCategory(null);
    // Handle different path formats
    if (path.startsWith('/(tabs)/discovery')) {
      // Parse query params from string like "/(tabs)/discovery?category=x&subcategory=y"
      if (path.includes('?')) {
        const [pathname, queryString] = path.split('?');
        const params: unknown = {};
        const pairs = queryString.split('&');
        pairs.forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
        router.push({
          pathname: '/(tabs)/discovery',
          params,
        } as unknown);
      } else {
        router.push(path as unknown);
      }
    } else if (path.startsWith('/shop/')) {
      // Legacy web-style paths - convert to expo-router format
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const params: unknown = { category: parts[1] };
        if (parts.length >= 3) params.subcategory = parts[2];
        if (parts.length >= 4) params.sub_subcategory = parts[3];
        if (parts.length >= 5) params.sub_sub_subcategory = parts[4];
        router.push({
          pathname: '/(tabs)/discovery',
          params,
        } as unknown);
      }
    } else if (path.startsWith('http://') || path.startsWith('https://')) {
      // External links
      Linking.openURL(path);
    } else {
      router.push(path as unknown);
    }
  };

  const activeCategoryData = categories.find((cat) => cat.id === activeCategory);

  const renderColumnContent = (category: ProductCategory | undefined, type: string, label: string) => {
    if (!category) return null;

    switch (type) {
      case 'popular_brands':
        if (!category.brands || category.brands.length === 0) return null;
        return (
          <View className="gap-1">
            <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">{label}</Text>
            <View>
              {[...category.brands]
                .sort((a, b) => a.brands.name.localeCompare(b.brands.name))
                .map((categoryBrand) => (
                  <Pressable
                    key={categoryBrand.brand_id}
                    onPress={() => {
                      setShowMenu(false);
                      setActiveCategory(null);
                      router.push({
                        pathname: '/(tabs)/discovery',
                        params: {
                          category: category.slug,
                          brandName: categoryBrand.brands.name,
                        },
                      } as unknown);
                    }}
                    className="p-2 active:bg-gray-50 rounded"
                  >
                    <Text className="text-sm font-inter-regular text-gray-700">{categoryBrand.brands.name}</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        );

      case 'categories':
        if (!category.product_subcategories || category.product_subcategories.length === 0) return null;
        const visibleSubcategories = category.product_subcategories.filter(
          (sub: unknown) => sub.show_in_mega_menu !== false
        );
        if (visibleSubcategories.length === 0) return null;
        return (
          <View className="gap-1">
            {visibleSubcategories.map((subcategory: unknown) => (
              <View key={subcategory.id} className="gap-1">
                <Pressable
                  onPress={() => {
                    setShowMenu(false);
                    setActiveCategory(null);
                    router.push({
                      pathname: '/(tabs)/discovery',
                      params: {
                        category: category.slug,
                        subcategory: subcategory.slug,
                      },
                    } as unknown);
                  }}
                  className="active:opacity-70"
                >
                  <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">
                    {subcategory.name}
                  </Text>
                </Pressable>
                {subcategory.product_sub_subcategories && subcategory.product_sub_subcategories.length > 0 && (
                  <View>
                    {subcategory.product_sub_subcategories
                      .filter((subSub: unknown) => subSub.show_in_mega_menu !== false)
                      .map((subSubcategory: unknown) => (
                        <Pressable
                          key={subSubcategory.id}
                          onPress={() => {
                            setShowMenu(false);
                            setActiveCategory(null);
                            router.push({
                              pathname: '/(tabs)/discovery',
                              params: {
                                category: category.slug,
                                subcategory: subcategory.slug,
                                sub_subcategory: subSubcategory.slug,
                              },
                            } as unknown);
                          }}
                          className="p-2 active:bg-gray-50 rounded"
                        >
                          <Text className="text-sm font-inter-regular text-gray-600">{subSubcategory.name}</Text>
                        </Pressable>
                      ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );

      case 'trending':
        if (!category.trending || category.trending.length === 0) return null;
        return (
          <View className="gap-1">
            <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">{label}</Text>
            <View>
              {[...category.trending]
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((item) =>
                  item.path ? (
                    <Pressable
                      key={item.id}
                      onPress={() => handleLinkClick(item.path!)}
                      className="p-2 active:bg-gray-50 rounded"
                    >
                      <Text className="text-sm font-inter-regular text-gray-700">{item.name}</Text>
                    </Pressable>
                  ) : null
                )}
            </View>
          </View>
        );

      case 'best_sellers':
        if (!category.bestSellers || category.bestSellers.length === 0) return null;
        return (
          <View className="gap-1">
            <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">{label}</Text>
            <View>
              {[...category.bestSellers]
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((item) =>
                  item.path ? (
                    <Pressable
                      key={item.id}
                      onPress={() => handleLinkClick(item.path!)}
                      className="p-2 active:bg-gray-50 rounded"
                    >
                      <Text className="text-sm font-inter-regular text-gray-700">{item.name}</Text>
                    </Pressable>
                  ) : null
                )}
            </View>
          </View>
        );

      case 'luxury_brands':
        if (!category.luxuryBrands || category.luxuryBrands.length === 0) return null;
        return (
          <View className="gap-1">
            <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">{label}</Text>
            <View>
              {[...category.luxuryBrands]
                .sort((a, b) => a.brands.name.localeCompare(b.brands.name))
                .map((luxuryBrand) => (
                  <Pressable
                    key={luxuryBrand.brand_id}
                    onPress={() => {
                      setShowMenu(false);
                      setActiveCategory(null);
                      router.push({
                        pathname: '/(tabs)/discovery',
                        params: {
                          category: category.slug,
                          brandName: luxuryBrand.brands.name,
                        },
                      } as unknown);
                    }}
                    className="p-2 active:bg-gray-50 rounded"
                  >
                    <Text className="text-sm font-inter-regular text-gray-700">{luxuryBrand.brands.name}</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        );

      case 'custom':
        // Resolve custom list globally by its system_name (unique identifier)
        const list = allCustomLists?.find((l: CustomList) => l.system_name === label);
        if (!list) {
          return null;
        }
        const items = allCustomItems?.filter((i: CustomListItem) => i.list_id === list.id) || [];
        if (items.length === 0) {
          return null;
        }

        const isHeaderLinks = list.list_type === 'header-links';

        return (
          <View className="gap-1">
            {!isHeaderLinks && (
              <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">{list.name}</Text>
            )}
            <View className="gap-1">
              {items.map((item: unknown) => {
                // The URL is already generated in the allCustomItems query
                const itemUrl = item.url || '/(tabs)/discovery';
                const isExternal = itemUrl.startsWith('http://') || itemUrl.startsWith('https://');

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      if (isExternal) {
                        Linking.openURL(itemUrl);
                      } else {
                        handleLinkClick(itemUrl);
                      }
                    }}
                    className={`p-2 active:bg-gray-50 rounded`}
                  >
                    <Text
                      className={
                        isHeaderLinks
                          ? 'text-sm font-inter-bold text-gray-900'
                          : 'text-sm font-inter-regular text-gray-700'
                      }
                    >
                      {item.display_name || item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderMegaMenuContent = (category: ProductCategory | undefined) => {
    if (!category) return null;

    const layout = category.layout;

    // If no layout configured, use default all-text layout with all sections
    if (!layout) {
      return (
        <View className="p-4">
          <View className="flex-row gap-4" style={{ flexWrap: 'wrap' }}>
            {category.brands && category.brands.length > 0 && (
              <View style={{ flex: 1, minWidth: 140 }}>
                {renderColumnContent(category, 'popular_brands', 'Popular Brands')}
              </View>
            )}
            <View style={{ flex: 1, minWidth: 140 }}>{renderColumnContent(category, 'categories', 'Clothing')}</View>
            {category.trending && category.trending.length > 0 && (
              <View style={{ flex: 1, minWidth: 140 }}>
                {renderColumnContent(category, 'trending', "The Men's Edit")}
              </View>
            )}
            {category.bestSellers && category.bestSellers.length > 0 && (
              <View style={{ flex: 1, minWidth: 140 }}>
                {renderColumnContent(category, 'best_sellers', 'Best Sellers')}
              </View>
            )}
            {category.luxuryBrands && category.luxuryBrands.length > 0 && (
              <View style={{ flex: 1, minWidth: 140 }}>
                {renderColumnContent(category, 'luxury_brands', 'Luxury Brands')}
              </View>
            )}
          </View>
        </View>
      );
    }

    // Render based on configured layout
    let columns = layout.columns || [];
    // Normalize old format to new format
    if (columns.length > 0 && !columns[0].items) {
      columns = columns.map((col: unknown) => ({
        items: [{ type: col.type, label: col.label }],
      }));
    }

    return (
      <View className="p-4">
        <View className="flex-row gap-4" style={{ flexWrap: 'wrap' }}>
          {columns.map((col: unknown, index: number) => (
            <View key={index} style={{ flex: 1, minWidth: 140 }}>
              {col.items?.map((item: unknown, itemIndex: number) => (
                <View key={itemIndex}>{renderColumnContent(category, item.type, item.label)}</View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="bg-white border-b border-gray-200">
        <View className="h-12 flex items-center justify-center">
          <ActivityIndicator size="small" color="#000" />
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center' }}
          className="h-12"
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryPress(category.id, category.slug)}
              className={`h-full px-4 flex-row items-center justify-center ${
                activeCategory === category.id ? 'border-b-2 border-black' : ''
              }`}
            >
              <Text className="text-sm font-inter-medium text-black">{category.name}</Text>
              <Feather
                name={activeCategory === category.id ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#000"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Mega Menu Modal */}
      <Modal
        visible={showMenu && !!activeCategoryData}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowMenu(false);
          setActiveCategory(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView edges={['bottom']} className="w-full h-4/5 rounded-t-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-inter-bold text-gray-900">{activeCategoryData?.name || 'Categories'}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  setActiveCategory(null);
                }}
                hitSlop={8}
              >
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1 bg-white flex-row">
              {/* Left Section - Content */}
              <View className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                  {renderMegaMenuContent(activeCategoryData)}
                </ScrollView>
              </View>

              {/* Right Section - Hero Image */}
              {activeCategoryData?.images && activeCategoryData.images.length > 0 && (
                <View className="w-48 p-4 border-l border-gray-200">
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                    {activeCategoryData.images.map((image: unknown) => (
                      <View key={image.id} className="rounded-xl overflow-hidden shadow-sm bg-gray-100 mb-4">
                        {image.image_link ? (
                          <Pressable
                            onPress={() => {
                              handleLinkClick(image.image_link);
                            }}
                            className="active:opacity-90"
                          >
                            <Image
                              source={{ uri: image.image_url }}
                              style={{ width: '100%', height: 300 }}
                              resizeMode="cover"
                            />
                          </Pressable>
                        ) : (
                          <Image
                            source={{ uri: image.image_url }}
                            style={{ width: '100%', aspectRatio: 1 }}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};
