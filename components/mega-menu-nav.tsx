import { supabase } from '@/api';
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
  layout?: any;
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
      const { data, error } = await supabase
        .from('mega_menu_custom_lists')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setAllCustomLists((data || []) as unknown as CustomList[]);
    } catch (error) {
      console.error('Error fetching custom lists:', error);
    }
  };

  const fetchCustomItems = async () => {
    try {
      const { data, error } = await supabase
        .from('mega_menu_custom_list_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Fetch categories in parallel to build URLs for category-based items
      const [l1Data, l2Data, l3Data, l4Data] = await Promise.all([
        supabase.from('product_categories').select('id, slug, name').eq('is_active', true),
        supabase.from('product_subcategories').select('id, slug, category_id, name').eq('is_active', true),
        supabase.from('product_sub_subcategories').select('id, slug, subcategory_id, name').eq('is_active', true),
        supabase
          .from('product_sub_sub_subcategories')
          .select('id, slug, sub_subcategory_id, name')
          .eq('is_active', true),
      ]);

      const l1Map = new Map((l1Data.data || []).map((c: any) => [c.id, c]));
      const l2Map = new Map((l2Data.data || []).map((c: any) => [c.id, c]));
      const l3Map = new Map((l3Data.data || []).map((c: any) => [c.id, c]));
      const l4Map = new Map((l4Data.data || []).map((c: any) => [c.id, c]));

      // Enhance items with generated URLs and dynamic display names for category-based items
      const enhancedItems = ((data || []) as any[]).map((item: any) => {
        if (item.url) {
          return { ...item, display_name: item.name };
        }

        let display_name = item.name;
        if (item.category_id && item.category_level) {
          let url = '/(tabs)/discovery';

          if (item.category_level === 4) {
            const l4 = l4Map.get(item.category_id);
            if (l4) {
              display_name = l4.name || display_name;
              const l3 = l3Map.get(l4.sub_subcategory_id);
              if (l3) {
                const l2 = l2Map.get(l3.subcategory_id);
                if (l2) {
                  const l1 = l1Map.get(l2.category_id);
                  if (l1) {
                    url = `/(tabs)/discovery?category=${l1.slug}&subcategory=${l2.slug}&sub_subcategory=${l3.slug}&sub_sub_subcategory=${l4.slug}`;
                  }
                }
              }
            }
          } else if (item.category_level === 3) {
            const l3 = l3Map.get(item.category_id);
            if (l3) {
              display_name = l3.name || display_name;
              const l2 = l2Map.get(l3.subcategory_id);
              if (l2) {
                const l1 = l1Map.get(l2.category_id);
                if (l1) {
                  url = `/(tabs)/discovery?category=${l1.slug}&subcategory=${l2.slug}&sub_subcategory=${l3.slug}`;
                }
              }
            }
          } else if (item.category_level === 2) {
            const l2 = l2Map.get(item.category_id);
            if (l2) {
              display_name = l2.name || display_name;
              const l1 = l1Map.get(l2.category_id);
              if (l1) {
                url = `/(tabs)/discovery?category=${l1.slug}&subcategory=${l2.slug}`;
              }
            }
          } else if (item.category_level === 1) {
            const l1 = l1Map.get(item.category_id);
            if (l1) {
              display_name = l1.name || display_name;
              url = `/(tabs)/discovery?category=${l1.slug}`;
            }
          }

          return { ...item, url, display_name };
        }

        return { ...item, display_name };
      });

      setAllCustomItems(enhancedItems as CustomListItem[]);
    } catch (error) {
      console.error('Error fetching custom items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const [
        cats,
        subs,
        subSubs,
        subSubSubs,
        categoryBrands,
        trending,
        bestSellers,
        luxuryBrands,
        layouts,
        customLists,
        customItems,
        menuImages,
      ] = await Promise.all([
        supabase
          .from('product_categories')
          .select('id, name, slug, icon')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('product_subcategories')
          .select('id, name, slug, category_id, show_in_mega_menu')
          .eq('is_active', true),
        supabase
          .from('product_sub_subcategories')
          .select('id, name, slug, subcategory_id, show_in_mega_menu')
          .eq('is_active', true),
        supabase
          .from('product_sub_sub_subcategories')
          .select('id, name, slug, sub_subcategory_id')
          .eq('is_active', true),
        supabase
          .from('mega_menu_category_brands')
          .select('category_id, brand_id, brands(id, name)')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('mega_menu_trending_items')
          .select('category_id, item_level, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('mega_menu_best_sellers')
          .select('category_id, item_level, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('mega_menu_luxury_brands')
          .select('category_id, brand_id, brands(id, name)')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase.from('mega_menu_layouts').select('*').eq('is_active', true),
        supabase
          .from('mega_menu_custom_lists')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('mega_menu_custom_list_items')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase.from('mega_menu_images').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      ]);

      if (cats.error) throw cats.error;

      // Build maps for quick lookup
      const l2Map = new Map((subs.data || []).map((s: any) => [s.id, s]));
      const l3Map = new Map((subSubs.data || []).map((ss: any) => [ss.id, ss]));
      const l4Map = new Map((subSubSubs.data || []).map((sss: any) => [sss.id, sss]));

      // Build hierarchy client-side for optimal performance
      const categoriesData = ((cats.data || []) as any[]).map((cat: any) => {
        const layout = (layouts.data || []).find((l: any) => l.category_id === cat.id);
        const images = (menuImages.data || []).filter((img: any) => {
          const layoutMatch = (layouts.data || []).find((l: any) => l.category_id === cat.id);
          return layoutMatch && img.layout_id === (layoutMatch as any).id;
        });

        return {
          ...cat,
          layout,
          images,
          brands: (categoryBrands.data || [])
            .filter((cb: any) => cb.category_id === cat.id)
            .map((cb: any) => ({
              brand_id: cb.brand_id,
              brands: cb.brands as Brand,
            })),
          trending: (trending.data || [])
            .filter((t: any) => t.category_id === cat.id)
            .map((t: any) => {
              const level = t.item_level;
              let itemData: any = { id: '', name: '', path: '' };

              if (level === 2) {
                const l2 = l2Map.get(t.subcategory_id);
                itemData = {
                  id: t.subcategory_id,
                  name: l2?.name,
                  path: l2 ? `/(tabs)/discovery?category=${cat.slug}&subcategory=${l2.slug}` : undefined,
                };
              } else if (level === 3) {
                const l3 = l3Map.get(t.sub_subcategory_id);
                const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
                itemData = {
                  id: t.sub_subcategory_id,
                  name: l3?.name,
                  path:
                    l2 && l3
                      ? `/(tabs)/discovery?category=${cat.slug}&subcategory=${l2.slug}&sub_subcategory=${l3.slug}`
                      : undefined,
                };
              } else if (level === 4) {
                const l4 = l4Map.get(t.sub_sub_subcategory_id);
                const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
                const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
                itemData = {
                  id: t.sub_sub_subcategory_id,
                  name: l4?.name,
                  path:
                    l2 && l3 && l4
                      ? `/(tabs)/discovery?category=${cat.slug}&subcategory=${l2.slug}&sub_subcategory=${l3.slug}&sub_sub_subcategory=${l4.slug}`
                      : undefined,
                };
              }

              return itemData;
            }),
          bestSellers: (bestSellers.data || [])
            .filter((bs: any) => bs.category_id === cat.id)
            .map((bs: any) => {
              const level = bs.item_level;
              let itemData: any = { id: '', name: '', path: '' };

              if (level === 2) {
                const l2 = l2Map.get(bs.subcategory_id);
                itemData = {
                  id: bs.subcategory_id,
                  name: l2?.name,
                  path: l2 ? `/(tabs)/discovery?category=${cat.slug}&subcategory=${l2.slug}` : undefined,
                };
              } else if (level === 3) {
                const l3 = l3Map.get(bs.sub_subcategory_id);
                const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
                itemData = {
                  id: bs.sub_subcategory_id,
                  name: l3?.name,
                  path:
                    l2 && l3
                      ? `/(tabs)/discovery?category=${cat.slug}&subcategory=${l2.slug}&sub_subcategory=${l3.slug}`
                      : undefined,
                };
              } else if (level === 4) {
                const l4 = l4Map.get(bs.sub_sub_subcategory_id);
                const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
                const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
                itemData = {
                  id: bs.sub_sub_subcategory_id,
                  name: l4?.name,
                  path:
                    l2 && l3 && l4
                      ? `/(tabs)/discovery?category=${cat.slug}&subcategory=${l2.slug}&sub_subcategory=${l3.slug}&sub_sub_subcategory=${l4.slug}`
                      : undefined,
                };
              }

              return itemData;
            }),
          luxuryBrands: (luxuryBrands.data || [])
            .filter((lb: any) => lb.category_id === cat.id)
            .map((lb: any) => ({
              brand_id: lb.brand_id,
              brands: lb.brands as Brand,
            })),
          customLists: (customLists.data || [])
            .filter((cl: any) => cl.category_id === cat.id)
            .map((cl: any) => ({
              id: cl.id,
              name: cl.name,
              system_name: cl.system_name,
              list_type: cl.list_type,
              items: (customItems.data || [])
                .filter((item: any) => item.list_id === cl.id)
                .map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  url: item.url,
                  display_name: item.display_name,
                })),
            })),
          product_subcategories: (subs.data || [])
            .filter((sub: any) => sub.category_id === cat.id)
            .map((sub: any) => ({
              ...sub,
              product_sub_subcategories: (subSubs.data || [])
                .filter((subSub: any) => subSub.subcategory_id === sub.id)
                .map((subSub: any) => ({
                  ...subSub,
                  product_sub_sub_subcategories: (subSubSubs.data || []).filter(
                    (subSubSub: any) => subSubSub.sub_subcategory_id === subSub.id
                  ),
                })),
            })),
        };
      });

      setCategories(categoriesData as ProductCategory[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    } as any);
  };

  const handleLinkClick = (path: string) => {
    setShowMenu(false);
    setActiveCategory(null);
    // Handle different path formats
    if (path.startsWith('/(tabs)/discovery')) {
      // Parse query params from string like "/(tabs)/discovery?category=x&subcategory=y"
      if (path.includes('?')) {
        const [pathname, queryString] = path.split('?');
        const params: any = {};
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
        } as any);
      } else {
        router.push(path as any);
      }
    } else if (path.startsWith('/shop/')) {
      // Legacy web-style paths - convert to expo-router format
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const params: any = { category: parts[1] };
        if (parts.length >= 3) params.subcategory = parts[2];
        if (parts.length >= 4) params.sub_subcategory = parts[3];
        if (parts.length >= 5) params.sub_sub_subcategory = parts[4];
        router.push({
          pathname: '/(tabs)/discovery',
          params,
        } as any);
      }
    } else if (path.startsWith('http://') || path.startsWith('https://')) {
      // External links
      Linking.openURL(path);
    } else {
      router.push(path as any);
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
                      } as any);
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
          (sub: any) => sub.show_in_mega_menu !== false
        );
        if (visibleSubcategories.length === 0) return null;
        return (
          <View className="gap-1">
            {visibleSubcategories.map((subcategory: any) => (
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
                    } as any);
                  }}
                  className="active:opacity-70"
                >
                  <Text className="text-sm font-inter-bold text-gray-900 uppercase tracking-wide">{subcategory.name}</Text>
                </Pressable>
                {subcategory.product_sub_subcategories && subcategory.product_sub_subcategories.length > 0 && (
                  <View>
                    {subcategory.product_sub_subcategories
                      .filter((subSub: any) => subSub.show_in_mega_menu !== false)
                      .map((subSubcategory: any) => (
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
                            } as any);
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
                      } as any);
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
              {items.map((item: any) => {
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
      columns = columns.map((col: any) => ({
        items: [{ type: col.type, label: col.label }],
      }));
    }

    return (
      <View className="p-4">
        <View className="flex-row gap-4" style={{ flexWrap: 'wrap' }}>
          {columns.map((col: any, index: number) => (
            <View key={index} style={{ flex: 1, minWidth: 140 }}>
              {col.items?.map((item: any, itemIndex: number) => (
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
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => {
            setShowMenu(false);
            setActiveCategory(null);
          }}
        >
          <Pressable className="h-4/5 bg-white rounded-t-2xl" onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-inter-bold text-gray-900">{activeCategoryData?.name || 'Categories'}</Text>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  setActiveCategory(null);
                }}
              >
                <Feather name="x" size={24} color="#000" />
              </Pressable>
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
                    {activeCategoryData.images.map((image: any) => (
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
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
