import { supabase } from '../config/supabase';

export interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  productName: string;
  productImage?: string;
  dateCreated: string;
  isVerified: boolean;
}

export interface ApiReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  totalSales: number;
}

class ReviewsService {
  /**
   * Get reviews for a specific seller
   * @param sellerId - The seller's user ID
   */
  async getReviews(sellerId: string): Promise<Review[]> {
    console.log('getReviews', sellerId);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      console.log('reviews data', data);
      if (error) {
        throw new Error(`Failed to fetch reviews: ${error.message}`);
      }

      // Transform API data to match the UI interface
      return this.transformReviewsData((data as unknown as ApiReview[]) || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a seller
   * @param sellerId - The seller's user ID
   */
  async getReviewStats(sellerId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);

      if (error) {
        throw new Error(`Failed to fetch review stats: ${error.message}`);
      }

      const reviews = (data as unknown as { rating: number }[]) || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      // Mock total sales - this would need to be calculated from actual sales data
      const totalSales = Math.floor(totalReviews * 2.5); // Rough estimate

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews,
        totalSales
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }

  /**
   * Get reviews with sorting
   * @param sellerId - The seller's user ID
   * @param sortBy - Sort by rating ('high-to-low', 'low-to-high', 'all')
   */
  async getReviewsWithSort(sellerId: string, sortBy: 'all' | 'high-to-low' | 'low-to-high' = 'all'): Promise<Review[]> {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId);

      // Apply sorting
      if (sortBy === 'high-to-low') {
        query = query.order('rating', { ascending: false });
      } else if (sortBy === 'low-to-high') {
        query = query.order('rating', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch sorted reviews: ${error.message}`);
      }

      return this.transformReviewsData((data as unknown as ApiReview[]) || []);
    } catch (error) {
      console.error('Error fetching sorted reviews:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param apiReviews - Raw reviews data from API
   */
  private transformReviewsData(apiReviews: ApiReview[]): Review[] {
    return apiReviews.map((apiReview) => {
      return {
        id: apiReview.id,
        customerName: `Customer #${apiReview.id.slice(-6)}`, // Fallback name - would need to fetch from user data
        customerAvatar: undefined, // Would need to fetch from user profile
        rating: apiReview.rating,
        comment: apiReview.comment,
        productName: `Product #${apiReview.id.slice(-6)}`, // Fallback name - would need to fetch from product data
        productImage: undefined, // Would need to fetch from product data
        dateCreated: apiReview.created_at,
        isVerified: true // Mock verification status
      };
    });
  }
}

export const reviewsService = new ReviewsService();
