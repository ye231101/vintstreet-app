import { supabase } from '@/api';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  product_sub_sub_subcategories?: ProductSubSubSubcategory[];
}

interface ProductSubcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
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

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  brands: CategoryBrand[];
  product_subcategories: ProductSubcategory[];
  trending: Array<{ id: string; name: string; path?: string }>;
  bestSellers: Array<{ id: string; name: string; path?: string }>;
  luxuryBrands: CategoryBrand[];
}

export const MegaMenuNav = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const [cats, subs, subSubs, subSubSubs, categoryBrands, trending, bestSellers, luxuryBrands] = await Promise.all([
        supabase
          .from('product_categories')
          .select('id, name, slug, icon')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase.from('product_subcategories').select('id, name, slug, category_id').eq('is_active', true),
        supabase.from('product_sub_subcategories').select('id, name, slug, subcategory_id').eq('is_active', true),
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
          .select('category_id, sub_sub_subcategory_id')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('mega_menu_best_sellers')
          .select('category_id, sub_sub_subcategory_id')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('mega_menu_luxury_brands')
          .select('category_id, brand_id, brands(id, name)')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
      ]);

      if (cats.error) throw cats.error;

      // Build maps for quick lookup
      const subsData = (subs.data as any[]) || [];
      const subSubsData = (subSubs.data as any[]) || [];
      const subSubSubsData = (subSubSubs.data as any[]) || [];
      const categoryBrandsData = (categoryBrands.data as any[]) || [];
      const trendingData = (trending.data as any[]) || [];
      const bestSellersData = (bestSellers.data as any[]) || [];
      const luxuryBrandsData = (luxuryBrands.data as any[]) || [];

      const l2Map = new Map(subsData.map((s: any) => [s.id, s]));
      const l3Map = new Map(subSubsData.map((ss: any) => [ss.id, ss]));
      const l4Map = new Map(subSubSubsData.map((sss: any) => [sss.id, sss]));

      // Build hierarchy client-side
      const categoriesData = ((cats.data as any[]) || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        brands: categoryBrandsData
          .filter((cb: any) => cb.category_id === cat.id)
          .map((cb: any) => ({
            brand_id: cb.brand_id,
            brands: cb.brands as Brand,
          })),
        trending: trendingData
          .filter((t: any) => t.category_id === cat.id)
          .map((t: any) => {
            const l4 = l4Map.get(t.sub_sub_subcategory_id);
            const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
            const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
            return {
              id: t.sub_sub_subcategory_id,
              name: l4?.name,
              path: l2 && l3 && l4 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}/${l4.slug}` : undefined,
            };
          }),
        bestSellers: bestSellersData
          .filter((bs: any) => bs.category_id === cat.id)
          .map((bs: any) => {
            const l4 = l4Map.get(bs.sub_sub_subcategory_id);
            const l3 = l4 ? l3Map.get(l4.sub_subcategory_id) : undefined;
            const l2 = l3 ? l2Map.get(l3.subcategory_id) : undefined;
            return {
              id: bs.sub_sub_subcategory_id,
              name: l4?.name,
              path: l2 && l3 && l4 ? `/shop/${cat.slug}/${l2.slug}/${l3.slug}/${l4.slug}` : undefined,
            };
          }),
        luxuryBrands: luxuryBrandsData
          .filter((lb: any) => lb.category_id === cat.id)
          .map((lb: any) => ({
            brand_id: lb.brand_id,
            brands: lb.brands as Brand,
          })),
        product_subcategories: subsData
          .filter((sub: any) => sub.category_id === cat.id)
          .map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            category_id: sub.category_id,
            product_sub_subcategories: subSubsData
              .filter((subSub: any) => subSub.subcategory_id === sub.id)
              .map((subSub: any) => ({
                id: subSub.id,
                name: subSub.name,
                slug: subSub.slug,
                subcategory_id: subSub.subcategory_id,
                product_sub_sub_subcategories: subSubSubsData.filter(
                  (subSubSub: any) => subSubSub.sub_subcategory_id === subSub.id
                ),
              })),
          })),
      }));

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categorySlug: string) => {
    setActiveCategory(categoryId);
    setSelectedSubcategory(null); // Reset selected subcategory when opening a new category
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
    setSelectedSubcategory(null);
    // For web-style paths, convert to React Native navigation
    if (path.startsWith('/shop/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        router.push({
          pathname: '/(tabs)/discovery',
          params: { category: parts[1] },
        } as any);
      }
    } else {
      router.push(path as any);
    }
  };

  const activeCategoryData = categories.find((cat) => cat.id === activeCategory);

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
          setSelectedSubcategory(null);
        }}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => {
            setShowMenu(false);
            setActiveCategory(null);
            setSelectedSubcategory(null);
          }}
        >
          <Pressable className="h-3/4 bg-white rounded-t-2xl" onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-inter-bold text-gray-900">
                  {activeCategoryData?.name || 'Categories'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  setActiveCategory(null);
                  setSelectedSubcategory(null);
                }}
              >
                <Feather name="x" size={24} color="#000" />
              </Pressable>
            </View>

            {/* Content */}
            <View className="flex-1 flex-row">
              {/* Left Sidebar - Category Title */}
              <View className="w-32 bg-gray-100 border-r border-gray-200">
                <Pressable
                  onPress={() => {
                    setSelectedSubcategory(null);
                  }}
                  className={`p-4 border-b border-gray-200 ${
                    selectedSubcategory === null ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-inter-bold ${
                      selectedSubcategory === null ? 'text-black' : 'text-gray-700'
                    }`}
                  >
                    {activeCategoryData?.name || 'Category'}
                  </Text>
                </Pressable>
                {activeCategoryData?.product_subcategories && activeCategoryData.product_subcategories.length > 0 && (
                  <ScrollView className="flex-1">
                    {activeCategoryData.product_subcategories.map((subcategory) => (
                      <Pressable
                        key={subcategory.id}
                        onPress={() => {
                          setSelectedSubcategory(subcategory.id);
                        }}
                        className={`p-4 border-b border-gray-200 ${
                          selectedSubcategory === subcategory.id ? 'bg-white' : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`text-sm font-inter-semibold ${
                            selectedSubcategory === subcategory.id ? 'text-black' : 'text-gray-700'
                          }`}
                        >
                          {subcategory.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Right Section - Content */}
              <View className="flex-1 bg-white">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  {selectedSubcategory ? (
                    // Show sub-subcategories when a subcategory is selected
                    <View className="gap-2">
                      {activeCategoryData?.product_subcategories
                        ?.find((sub) => sub.id === selectedSubcategory)
                        ?.product_sub_subcategories?.map((subSubcategory) => (
                          <Pressable
                            key={subSubcategory.id}
                            onPress={() => {
                              setShowMenu(false);
                              setActiveCategory(null);
                              setSelectedSubcategory(null);
                              router.push({
                                pathname: '/(tabs)/discovery',
                                params: {
                                  category: activeCategoryData.slug,
                                  subcategory: activeCategoryData.product_subcategories.find(
                                    (s) => s.id === selectedSubcategory
                                  )?.slug,
                                  sub_subcategory: subSubcategory.slug,
                                },
                              } as any);
                            }}
                            className="py-3 px-4 border-b border-gray-100"
                          >
                            <Text className="text-base font-inter-medium text-black">{subSubcategory.name}</Text>
                          </Pressable>
                        ))}
                    </View>
                  ) : (
                    <View className="gap-4 p-4">
                      {/* Column 1: Popular Brands */}
                      {activeCategoryData?.brands && activeCategoryData.brands.length > 0 && (
                        <View className="gap-2">
                          <Text className="text-sm font-inter-bold text-black">Popular Brands</Text>
                          <View className="gap-2">
                            {[...activeCategoryData.brands]
                              .sort((a, b) => a.brands.name.localeCompare(b.brands.name))
                              .map((categoryBrand) => (
                                <Pressable
                                  key={categoryBrand.brand_id}
                                  onPress={() => {
                                    setShowMenu(false);
                                    setActiveCategory(null);
                                    setSelectedSubcategory(null);
                                    router.push({
                                      pathname: '/(tabs)/discovery',
                                      params: {
                                        category: activeCategoryData.slug,
                                        brandName: categoryBrand.brands.name,
                                      },
                                    } as any);
                                  }}
                                  className="py-2"
                                >
                                  <Text className="text-sm font-inter-medium text-gray-700">
                                    {categoryBrand.brands.name}
                                  </Text>
                                </Pressable>
                              ))}
                          </View>
                        </View>
                      )}

                      {/* Column 2: Trending */}
                      {activeCategoryData?.trending && activeCategoryData.trending.length > 0 && (
                        <View className="gap-2">
                          <Text className="text-sm font-inter-bold text-black">Trending</Text>
                          <View className="gap-2">
                            {[...activeCategoryData.trending]
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((item) =>
                                item.path ? (
                                  <Pressable key={item.id} onPress={() => handleLinkClick(item.path!)} className="py-2">
                                    <Text className="text-sm font-inter-medium text-gray-700">{item.name}</Text>
                                  </Pressable>
                                ) : null
                              )}
                          </View>
                        </View>
                      )}

                      {/* Column 3: Best Sellers */}
                      {activeCategoryData?.bestSellers && activeCategoryData.bestSellers.length > 0 && (
                        <View className="gap-2">
                          <Text className="text-sm font-inter-bold text-black">Best Sellers</Text>
                          <View className="gap-2">
                            {[...activeCategoryData.bestSellers]
                              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                              .map((item) =>
                                item.path ? (
                                  <Pressable key={item.id} onPress={() => handleLinkClick(item.path!)} className="py-2">
                                    <Text className="text-sm font-inter-medium text-gray-700">{item.name}</Text>
                                  </Pressable>
                                ) : null
                              )}
                          </View>
                        </View>
                      )}

                      {/* Column 4: Luxury Brands */}
                      {activeCategoryData?.luxuryBrands && activeCategoryData.luxuryBrands.length > 0 && (
                        <View className="gap-2">
                          <Text className="text-sm font-inter-bold text-black">Luxury Brands</Text>
                          <View className="gap-2">
                            {[...activeCategoryData.luxuryBrands]
                              .sort((a, b) => a.brands.name.localeCompare(b.brands.name))
                              .map((luxuryBrand) => (
                                <Pressable
                                  key={luxuryBrand.brand_id}
                                  onPress={() => {
                                    setShowMenu(false);
                                    setActiveCategory(null);
                                    setSelectedSubcategory(null);
                                    router.push({
                                      pathname: '/(tabs)/discovery',
                                      params: {
                                        category: activeCategoryData.slug,
                                        brandName: luxuryBrand.brands.name,
                                      },
                                    } as any);
                                  }}
                                  className="py-2"
                                >
                                  <Text className="text-sm font-inter-medium text-gray-700">
                                    {luxuryBrand.brands.name}
                                  </Text>
                                </Pressable>
                              ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
