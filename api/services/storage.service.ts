import { supabase } from '../config/supabase';
import { decode } from 'base64-arraybuffer';

export interface UploadResult {
  success: boolean;
  urls?: string[];
  errors?: string[];
}

export class StorageService {
  private static readonly BUCKET_NAME = 'product-images';

  /**
   * Upload a single image to Supabase storage
   * @param imageUri - Local URI of the image
   * @param userId - User ID for organizing files
   * @returns Promise with upload result
   */
  static async uploadImage(imageUri: string, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      
      // Generate unique filename
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return { success: true, url: publicUrlData.publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Upload multiple images to Supabase storage
   * @param imageUris - Array of local URIs
   * @param userId - User ID for organizing files
   * @returns Promise with upload results
   */
  static async uploadMultipleImages(imageUris: string[], userId: string): Promise<UploadResult> {
    const results: string[] = [];
    const errors: string[] = [];

    for (const imageUri of imageUris) {
      const result = await this.uploadImage(imageUri, userId);
      if (result.success && result.url) {
        results.push(result.url);
      } else {
        errors.push(result.error || 'Unknown error');
      }
    }

    return {
      success: results.length > 0,
      urls: results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Delete an image from Supabase storage
   * @param imageUrl - Public URL of the image to delete
   * @returns Promise with deletion result
   */
  static async deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const fullPath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fullPath]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete multiple images from Supabase storage
   * @param imageUrls - Array of public URLs to delete
   * @returns Promise with deletion results
   */
  static async deleteMultipleImages(imageUrls: string[]): Promise<{ success: boolean; errors?: string[] }> {
    const errors: string[] = [];

    for (const imageUrl of imageUrls) {
      const result = await this.deleteImage(imageUrl);
      if (!result.success) {
        errors.push(result.error || 'Unknown error');
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
