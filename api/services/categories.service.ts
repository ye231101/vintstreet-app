/**
 * Categories Service
 * Service for fetching and managing category data
 */

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

      const top = (topRes.data as any[]) || [];
      const sub = (subRes.data as any[]) || [];
      const sub2 = (sub2Res.data as any[]) || [];
      const sub3 = (sub3Res.data as any[]) || [];

      // Index lower levels by their parent foreign keys. We assume conventional FKs:
      // sub.category_id -> product_categories.id
      // sub2.subcategory_id -> product_subcategories.id
      // sub3.sub_subcategory_id -> product_sub_subcategories.id

      const subByCategoryId = new Map<any, any[]>();
      for (const row of sub) {
        const key = (row as any).category_id;
        if (!subByCategoryId.has(key)) subByCategoryId.set(key, []);
        subByCategoryId.get(key)!.push(row);
      }

      const sub2BySubId = new Map<any, any[]>();
      for (const row of sub2) {
        const key = (row as any).subcategory_id;
        if (!sub2BySubId.has(key)) sub2BySubId.set(key, []);
        sub2BySubId.get(key)!.push(row);
      }

      const sub3BySub2Id = new Map<any, any[]>();
      for (const row of sub3) {
        const key = (row as any).sub_subcategory_id;
        if (!sub3BySub2Id.has(key)) sub3BySub2Id.set(key, []);
        sub3BySub2Id.get(key)!.push(row);
      }

      const toSlug = (name: string | undefined) =>
        (name || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

      const mapLeaf = (row: any): Category => ({
        id: String(row.id),
        name: row.name || '',
        slug: row.slug || toSlug(row.name),
        children: [],
        parentId: row.parent_id ? String(row.parent_id) : undefined,
        count: row.count ?? 0,
        description: row.description || '',
        image: row.image || undefined,
      });

      const buildLevel3 = (sub2Row: any): Category => {
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

      const buildLevel2 = (subRow: any): Category => {
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

      const categories: Category[] = top.map((topRow: any) => {
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
      console.error('CategoriesService - Error fetching categories from Supabase:', error);
      throw error;
    }
  }

  /**
   * Fetch active stream categories from Supabase
   */
  async getStreamCategories(): Promise<{
    id: string;
    name: string;
    description: string;
    icon: string;
    is_active: boolean;
  }[]> {
    const { data, error } = await supabase
      .from('stream_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      throw new Error(`Failed to fetch stream categories: ${error.message}`);
    }
    return (data as any[]) as any;
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
}

export const categoriesService = new CategoriesService();
