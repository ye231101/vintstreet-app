import { supabase } from '../config/supabase';
import { Review, ReviewReply, ReviewResponse, ReviewStats } from '../types';

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
      return this.transformReviewsData((reviewsWithProfiles as unknown as ReviewResponse[]) || []);
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

      return this.transformReviewsData((reviewsWithProfiles as unknown as ReviewResponse[]) || []);
    } catch (error) {
      console.error('Error fetching sorted reviews:', error);
      throw error;
    }
  }

  /**
   * Transform API data to match UI interface
   * @param apiReviews - Raw reviews data from API
   */
  private transformReviewsData(apiReviews: ReviewResponse[]): Review[] {
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
   * Create a new review
   * @param sellerId - The seller's user ID
   * @param buyerId - The buyer's user ID
   * @param rating - The rating (1-5)
   * @param comment - The review comment
   * @param orderId - Optional order ID associated with the review
   */
  async createReview(sellerId: string, buyerId: string, rating: number, comment: string, orderId?: string): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          seller_id: sellerId,
          buyer_id: buyerId,
          rating: rating,
          comment: comment.trim(),
          ...(orderId && { order_id: orderId }),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create review: ${error.message}`);
      }

      // Get buyer profile for the review
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .eq('user_id', buyerId)
        .single();

      const reviewData = {
        ...(data as any),
        buyer_profile: profile || null,
        review_replies: [],
      };

      return this.transformReviewsData([reviewData as unknown as ReviewResponse])[0];
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
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
