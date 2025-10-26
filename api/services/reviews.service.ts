import { supabase } from '../config/supabase';

export interface ReviewReply {
  id: string;
  review_id: string;
  seller_id: string;
  reply_text: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  buyer_id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  productName: string;
  productImage?: string;
  dateCreated: string;
  isVerified: boolean;
  replies?: ReviewReply[];
}

export interface ApiReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer_id: string;
  buyer_profile?: {
    user_id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string | null;
  };
  review_replies?: ReviewReply[];
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
    try {
      // First get the reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
      }

      if (!reviewsData || reviewsData.length === 0) {
        return [];
      }

      // Get unique buyer IDs
      const buyerIds = [...new Set(reviewsData.map((review: any) => review.buyer_id))];

      // Fetch profiles for all buyers
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', buyerIds);

      // Create a map of profiles
      const profilesMap = new Map((profilesData || []).map((profile: any) => [profile.user_id, profile]));

      // Fetch review replies
      const reviewIds = reviewsData.map((review: any) => review.id);
      const { data: repliesData } = await supabase
        .from('review_replies')
        .select('*')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true });

      // Create a map of replies
      const repliesMap = new Map<string, ReviewReply[]>();
      (repliesData || []).forEach((reply: any) => {
        if (!repliesMap.has(reply.review_id)) {
          repliesMap.set(reply.review_id, []);
        }
        repliesMap.get(reply.review_id)?.push(reply as ReviewReply);
      });

      // Merge reviews with profiles and replies
      const reviewsWithProfiles = reviewsData.map((review: any) => ({
        ...review,
        buyer_profile: profilesMap.get(review.buyer_id) || null,
        review_replies: repliesMap.get(review.id) || [],
      }));

      // Transform API data to match the UI interface
      return this.transformReviewsData((reviewsWithProfiles as unknown as ApiReview[]) || []);
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
      const { data, error } = await supabase.from('reviews').select('rating').eq('seller_id', sellerId);

      if (error) {
        throw new Error(`Failed to fetch review stats: ${error.message}`);
      }

      const reviews = (data as unknown as { rating: number }[]) || [];
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

      // Mock total sales - this would need to be calculated from actual sales data
      const totalSales = Math.floor(totalReviews * 2.5); // Rough estimate

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews,
        totalSales,
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
      // Build query with sorting
      let query = supabase.from('reviews').select('*').eq('seller_id', sellerId);

      // Apply sorting
      if (sortBy === 'high-to-low') {
        query = query.order('rating', { ascending: false });
      } else if (sortBy === 'low-to-high') {
        query = query.order('rating', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) {
        throw new Error(`Failed to fetch sorted reviews: ${reviewsError.message}`);
      }

      if (!reviewsData || reviewsData.length === 0) {
        return [];
      }

      // Get unique buyer IDs
      const buyerIds = [...new Set(reviewsData.map((review: any) => review.buyer_id))];

      // Fetch profiles for all buyers
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', buyerIds);

      // Create a map of profiles
      const profilesMap = new Map((profilesData || []).map((profile: any) => [profile.user_id, profile]));

      // Fetch review replies
      const reviewIds = reviewsData.map((review: any) => review.id);
      const { data: repliesData } = await supabase
        .from('review_replies')
        .select('*')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true });

      // Create a map of replies
      const repliesMap = new Map<string, ReviewReply[]>();
      (repliesData || []).forEach((reply: any) => {
        if (!repliesMap.has(reply.review_id)) {
          repliesMap.set(reply.review_id, []);
        }
        repliesMap.get(reply.review_id)?.push(reply as ReviewReply);
      });

      // Merge reviews with profiles and replies
      const reviewsWithProfiles = reviewsData.map((review: any) => ({
        ...review,
        buyer_profile: profilesMap.get(review.buyer_id) || null,
        review_replies: repliesMap.get(review.id) || [],
      }));

      return this.transformReviewsData((reviewsWithProfiles as unknown as ApiReview[]) || []);
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
      const profile = apiReview.buyer_profile;
      // Prioritize username, then full_name, then fallback to customer ID
      const customerName = profile?.full_name || `Customer #${apiReview.buyer_id.slice(-6)}`;

      return {
        id: apiReview.id,
        buyer_id: apiReview.buyer_id,
        customerName: customerName,
        customerAvatar: profile?.avatar_url || undefined,
        rating: apiReview.rating,
        comment: apiReview.comment,
        productName: `Product #${apiReview.id.slice(-6)}`, // Fallback name - would need to fetch from product data
        productImage: undefined, // Would need to fetch from product data
        dateCreated: apiReview.created_at,
        isVerified: true, // Mock verification status
        replies: apiReview.review_replies || [],
      };
    });
  }

  /**
   * Post a reply to a review
   * @param reviewId - The review ID to reply to
   * @param sellerId - The seller's user ID
   * @param replyText - The reply text
   */
  async postReply(reviewId: string, sellerId: string, replyText: string): Promise<ReviewReply> {
    try {
      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          seller_id: sellerId,
          reply_text: replyText,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to post reply: ${error.message}`);
      }

      return data as unknown as ReviewReply;
    } catch (error) {
      console.error('Error posting reply:', error);
      throw error;
    }
  }
}

export const reviewsService = new ReviewsService();
