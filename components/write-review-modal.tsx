import { supabase } from '@/api/config/supabase';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  sellerId: string;
  productName: string;
  userId?: string;
  onSuccess?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  sellerId,
  productName,
  userId,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!userId) {
      console.log('You must be logged in to submit a review');
      return;
    }

    if (!comment.trim()) {
      console.log('Please write a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        seller_id: sellerId,
        buyer_id: userId,
        rating: rating,
        comment: comment.trim(),
        order_id: orderId,
      });

      if (error) throw error;

      console.log('Review submitted successfully!');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      console.log('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    onClose();
  };

  const renderStarRating = () => {
    return (
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Feather
              name={star <= rating ? 'star' : 'star'}
              size={32}
              color={star <= rating ? '#EAB308' : '#D1D5DB'}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
        <View className="flex-1" />
        <Pressable className="bg-white w-full rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Feather name="star" size={20} color="#000" />
                <Text className="text-lg font-inter-semibold text-gray-900 ml-2">Write Review</Text>
              </View>
              <Pressable onPress={handleClose} className="p-1">
                <Feather name="x" size={20} color="#666" />
              </Pressable>
            </View>
            <Text className="text-sm font-inter text-gray-600">
              Share your experience with this purchase
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            className="p-6"
          >
            {/* Product Name */}
            <View className="p-3 bg-gray-100 rounded-lg mb-6">
              <Text className="text-sm font-inter-medium text-gray-900">{productName}</Text>
              <Text className="text-xs font-inter text-gray-600 mt-1">Order #{orderId.slice(-8)}</Text>
            </View>

            {/* Rating */}
            <View className="mb-6">
              <Text className="text-sm font-inter text-gray-700 mb-3">Your Rating *</Text>
              {renderStarRating()}
              <Text className="text-xs font-inter text-gray-500 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            </View>

            {/* Comment */}
            <View className="mb-4">
              <Text className="text-sm font-inter text-gray-700 mb-2">Your Review *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                style={{ height: 150 }}
                placeholder="Tell us about your experience with this seller and product..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              <Text className="text-xs font-inter text-gray-500 text-right mt-1">
                {comment.length}/500 characters
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3 mt-2">
              <Pressable
                className="flex-1 py-3 rounded-lg border border-gray-300"
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text className="text-center text-sm font-inter-semibold text-gray-800">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-lg bg-black"
                onPress={handleSubmitReview}
                disabled={isSubmitting || !comment.trim()}
              >
                <Text className="text-center text-sm font-inter-semibold text-white">
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

