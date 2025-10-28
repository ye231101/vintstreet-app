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

export interface ReviewResponse {
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
