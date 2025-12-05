/**
 * Categories Service
 * Service for fetching and managing category data
 */

import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { Category } from '../types';

class CategoriesService {
  /**
   * Fetch hierarchical categories from Supabase tables
   * product_categories -> product_subcategories -> product_sub_subcategories -> product_sub_sub_subcategories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const [topRes, subRes, sub2Res, sub3Res] = await Promise.all([
        supabase.from('product_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('product_subcategories').select('*').eq('is_active', true).order('name'),
        supabase.from('product_sub_subcategories').select('*').eq('is_active', true).order('name'),
        supabase.from('product_sub_sub_subcategories').select('*').eq('is_active', true).order('name'),
      ]);

      if (topRes.error) throw new Error(`product_categories: ${topRes.error.message}`);
      if (subRes.error) throw new Error(`product_subcategories: ${subRes.error.message}`);
      if (sub2Res.error) throw new Error(`product_sub_subcategories: ${sub2Res.error.message}`);
      if (sub3Res.error) throw new Error(`product_sub_sub_subcategories: ${sub3Res.error.message}`);

      const top = (topRes.data as unknown[]) || [];
      const sub = (subRes.data as unknown[]) || [];
      const sub2 = (sub2Res.data as unknown[]) || [];
      const sub3 = (sub3Res.data as unknown[]) || [];

      // Index lower levels by their parent foreign keys. We assume conventional FKs:
      // sub.category_id -> product_categories.id
      // sub2.subcategory_id -> product_subcategories.id
      // sub3.sub_subcategory_id -> product_sub_subcategories.id

      const subByCategoryId = new Map<unknown, unknown[]>();
      for (const row of sub) {
        const key = (row as unknown).category_id;
        if (!subByCategoryId.has(key)) subByCategoryId.set(key, []);
        subByCategoryId.get(key)!.push(row);
      }

      const sub2BySubId = new Map<unknown, unknown[]>();
      for (const row of sub2) {
        const key = (row as unknown).subcategory_id;
        if (!sub2BySubId.has(key)) sub2BySubId.set(key, []);
        sub2BySubId.get(key)!.push(row);
      }

      const sub3BySub2Id = new Map<unknown, unknown[]>();
      for (const row of sub3) {
        const key = (row as unknown).sub_subcategory_id;
        if (!sub3BySub2Id.has(key)) sub3BySub2Id.set(key, []);
        sub3BySub2Id.get(key)!.push(row);
      }

      const toSlug = (name: string | undefined) =>
        (name || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');

      const mapLeaf = (row: unknown): Category => ({
        id: String(row.id),
        name: row.name || '',
        slug: row.slug || toSlug(row.name),
        children: [],
        parentId: row.parent_id ? String(row.parent_id) : undefined,
        count: row.count ?? 0,
        description: row.description || '',
        image: row.image || undefined,
      });

      const buildLevel3 = (sub2Row: unknown): Category => {
        const children = (sub3BySub2Id.get(sub2Row.id) || []).map(mapLeaf);
        return {
          id: String(sub2Row.id),
          name: sub2Row.name || '',
          slug: sub2Row.slug || toSlug(sub2Row.name),
          children,
          parentId: sub2Row.subcategory_id ? String(sub2Row.subcategory_id) : undefined,
          count: sub2Row.count ?? 0,
          description: sub2Row.description || '',
          image: sub2Row.image || undefined,
        };
      };

      const buildLevel2 = (subRow: unknown): Category => {
        const children = (sub2BySubId.get(subRow.id) || []).map(buildLevel3);
        return {
          id: String(subRow.id),
          name: subRow.name || '',
          slug: subRow.slug || toSlug(subRow.name),
          children,
          parentId: subRow.category_id ? String(subRow.category_id) : undefined,
          count: subRow.count ?? 0,
          description: subRow.description || '',
          image: subRow.image || undefined,
        };
      };

      const categories: Category[] = top.map((topRow: unknown) => {
        const children = (subByCategoryId.get(topRow.id) || []).map(buildLevel2);
        return {
          id: String(topRow.id),
          name: topRow.name || '',
          slug: topRow.slug || toSlug(topRow.name),
          children,
          parentId: topRow.parent_id ? String(topRow.parent_id) : undefined,
          count: topRow.count ?? 0,
          description: topRow.description || '',
          image: topRow.image || undefined,
        } as Category;
      });

      return categories;
    } catch (error) {
      logger.error('CategoriesService - Error fetching categories from Supabase:', error);
      throw error;
    }
  }

  /**
   * Fetch active stream categories from Supabase
   */
  async getStreamCategories(): Promise<
    {
      id: string;
      name: string;
      description: string;
      icon: string;
      is_active: boolean;
    }[]
  > {
    const { data, error } = await supabase.from('stream_categories').select('*').eq('is_active', true).order('name');
    if (error) {
      throw new Error(`Failed to fetch stream categories: ${error.message}`);
    }
    return data as unknown[] as unknown;
  }

  /**
   * Find a category by its slug in the category hierarchy
   */
  findCategoryBySlug(categories: Category[], targetSlug: string): Category | null {
    for (const category of categories) {
      if (category.slug === targetSlug) {
        return category;
      }

      const found = this.findCategoryBySlug(category.children, targetSlug);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Get the path to a category by its slug
   */
  getCategoryPath(categories: Category[], targetSlug: string): Category[] {
    for (const category of categories) {
      if (category.slug === targetSlug) {
        return [category];
      }

      const childPath = this.getCategoryPath(category.children, targetSlug);
      if (childPath.length > 0) {
        return [category, ...childPath];
      }
    }
    return [];
  }

  /**
   * Get all leaf categories (categories with no children)
   */
  getAllLeafCategories(categories: Category[]): Category[] {
    const leafCategories: Category[] = [];

    const traverse = (cats: Category[]) => {
      cats.forEach((cat) => {
        if (cat.children.length === 0) {
          leafCategories.push(cat);
        } else {
          traverse(cat.children);
        }
      });
    };

    traverse(categories);
    return leafCategories;
  }

  /**
   * Filter categories based on search criteria
   */
  filterCategories(categories: Category[], searchTerm: string): Category[] {
    if (!searchTerm.trim()) {
      return categories;
    }

    const term = searchTerm.toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term) ||
        this.filterCategories(category.children, searchTerm).length > 0
    );
  }

  /**
   * Get mega menu custom lists
   */
  async getMegaMenuCustomLists(): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from('mega_menu_custom_lists')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown[];
    } catch (error) {
      logger.error('Error fetching mega menu custom lists:', error);
      throw error;
    }
  }

  /**
   * Get mega menu custom list items
   */
  async getMegaMenuCustomListItems(): Promise<unknown[]> {
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

      const l1Map = new Map((l1Data.data || []).map((c: unknown) => [c.id, c]));
      const l2Map = new Map((l2Data.data || []).map((c: unknown) => [c.id, c]));
      const l3Map = new Map((l3Data.data || []).map((c: unknown) => [c.id, c]));
      const l4Map = new Map((l4Data.data || []).map((c: unknown) => [c.id, c]));

      // Enhance items with generated URLs and dynamic display names for category-based items
      return ((data || []) as unknown[]).map((item: unknown) => {
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
    } catch (error) {
      logger.error('Error fetching mega menu custom list items:', error);
      throw error;
    }
  }

  /**
   * Get mega menu categories with all related data (brands, trending, best sellers, layouts, images, etc.)
   */
  async getMegaMenuCategories(): Promise<unknown[]> {
    try {
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
      const l2Map = new Map((subs.data || []).map((s: unknown) => [s.id, s]));
      const l3Map = new Map((subSubs.data || []).map((ss: unknown) => [ss.id, ss]));
      const l4Map = new Map((subSubSubs.data || []).map((sss: unknown) => [sss.id, sss]));

      // Build hierarchy client-side for optimal performance
      return ((cats.data || []) as unknown[]).map((cat: unknown) => {
        const layout = (layouts.data || []).find((l: unknown) => l.category_id === cat.id);
        const images = (menuImages.data || []).filter((img: unknown) => {
          const layoutMatch = (layouts.data || []).find((l: unknown) => l.category_id === cat.id);
          return layoutMatch && img.layout_id === (layoutMatch as unknown).id;
        });

        return {
          ...cat,
          layout,
          images,
          brands: (categoryBrands.data || [])
            .filter((cb: unknown) => cb.category_id === cat.id)
            .map((cb: unknown) => ({
              brand_id: cb.brand_id,
              brands: cb.brands,
            })),
          trending: (trending.data || [])
            .filter((t: unknown) => t.category_id === cat.id)
            .map((t: unknown) => {
              const level = t.item_level;
              let itemData: unknown = { id: '', name: '', path: '' };

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
            .filter((bs: unknown) => bs.category_id === cat.id)
            .map((bs: unknown) => {
              const level = bs.item_level;
              let itemData: unknown = { id: '', name: '', path: '' };

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
            .filter((lb: unknown) => lb.category_id === cat.id)
            .map((lb: unknown) => ({
              brand_id: lb.brand_id,
              brands: lb.brands,
            })),
          customLists: (customLists.data || [])
            .filter((cl: unknown) => cl.category_id === cat.id)
            .map((cl: unknown) => ({
              id: cl.id,
              name: cl.name,
              system_name: cl.system_name,
              list_type: cl.list_type,
              items: (customItems.data || [])
                .filter((item: unknown) => item.list_id === cl.id)
                .map((item: unknown) => ({
                  id: item.id,
                  name: item.name,
                  url: item.url,
                  display_name: item.display_name,
                })),
            })),
          product_subcategories: (subs.data || [])
            .filter((sub: unknown) => sub.category_id === cat.id)
            .map((sub: unknown) => ({
              ...sub,
              product_sub_subcategories: (subSubs.data || [])
                .filter((subSub: unknown) => subSub.subcategory_id === sub.id)
                .map((subSub: unknown) => ({
                  ...subSub,
                  product_sub_sub_subcategories: (subSubSubs.data || []).filter(
                    (subSubSub: unknown) => subSubSub.sub_subcategory_id === subSub.id
                  ),
                })),
            })),
        };
      });
    } catch (error) {
      logger.error('Error fetching mega menu categories:', error);
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService();
