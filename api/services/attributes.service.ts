import { logger } from '@/utils/logger';
import { supabase } from '../config/supabase';
import { Attribute } from '../types';

class AttributesService {
  /**
   * Get dynamic attributes for a subcategory or sub-subcategory
   * @param subcategoryId - The subcategory ID
   * @param subSubcategoryId - Optional sub-subcategory ID
   */
  async getAttributes(subcategoryId: string, subSubcategoryId?: string): Promise<Attribute[]> {
    try {
      // Prioritize level 3 (sub-subcategory) attributes if available
      if (subSubcategoryId) {
        const { data: level3Data, error: level3Error } = await supabase
          .from('attribute_sub_subcategories')
          .select(
            `
              attribute_id,
              attributes (
                *,
                attribute_options (
                  id,
                  value,
                  is_active,
                  display_order
                )
              )
            `
          )
          .eq('sub_subcategory_id', subSubcategoryId);

        if (level3Error) throw level3Error;

        // If level 3 has attributes, use those exclusively
        if (level3Data && level3Data.length > 0) {
          const attributesData = level3Data
            .map((item: unknown) => item.attributes)
            .filter(Boolean)
            .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));

          return attributesData;
        }
      }

      // Fall back to level 2 (subcategory) attributes if no level 3 attributes found
      if (!subcategoryId) return [];

      const { data, error } = await supabase
        .from('attribute_subcategories')
        .select(
          `
          attribute_id,
          attributes (
            *,
            attribute_options (
              id,
              value,
              is_active,
              display_order
            )
          )
        `
        )
        .eq('subcategory_id', subcategoryId);

      if (error) throw error;

      const attributesData = data
        .map((item: unknown) => item.attributes)
        .filter(Boolean)
        .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));

      return attributesData;
    } catch (error) {
      logger.error('Error fetching attributes:', error);
      throw error;
    }
  }

  /**
   * Save attribute values for a product
   * @param productId - The product ID
   * @param dynamicAttributes - The attribute values to save
   */
  async saveAttributeValues(productId: string, dynamicAttributes: Record<string, unknown>): Promise<void> {
    if (Object.keys(dynamicAttributes).length === 0) return;

    // Delete existing attribute values
    await supabase.from('product_attribute_values').delete().eq('product_id', productId);

    const attributeValues = Object.entries(dynamicAttributes)
      .filter(([_, value]) => {
        if (value === '' || value === null || value === undefined) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .map(([attributeId, value]) => {
        const valueObj: unknown = {
          product_id: productId,
          attribute_id: attributeId,
          value_text: null,
          value_number: null,
          value_boolean: null,
          value_date: null,
        };

        // Determine data type and set appropriate value field
        if (Array.isArray(value)) {
          // Multi-select values
          valueObj.value_text = JSON.stringify(value);
        } else if (typeof value === 'string') {
          valueObj.value_text = value;
        } else if (typeof value === 'number') {
          valueObj.value_number = value;
        } else if (typeof value === 'boolean') {
          valueObj.value_boolean = value;
        } else if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
          valueObj.value_date = value;
        }

        return valueObj;
      })
      .filter(Boolean);

    if (attributeValues.length > 0) {
      const { error } = await supabase.from('product_attribute_values').insert(attributeValues);

      if (error) {
        logger.error('Error saving attributes:', error);
        throw error;
      }
    }
  }

  /**
   * Get product attribute values for a specific product
   * @param productId - The product ID
   */
  async getProductAttributeValues(productId: string): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from('product_attribute_values')
        .select(`*, attributes (id, name, data_type)`)
        .eq('product_id', productId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error loading product attributes:', error);
      throw new Error('Failed to fetch product attributes');
    }
  }
}

export const attributesService = new AttributesService();
