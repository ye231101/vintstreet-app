import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { offersService } from '@/api/services/offers.service';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentPrice: number;
  sellerId: string;
  userId?: string;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  currentPrice,
  sellerId,
  userId,
}) => {
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const handleSubmitOffer = async () => {
    try {
      setOfferError(null);

      if (!userId) {
        setOfferError('Please sign in to make an offer.');
        return;
      }

      const amountNum = Number(offerAmount);
      if (!amountNum || amountNum <= 0) {
        setOfferError('Enter a valid amount.');
        return;
      }

      if (amountNum >= currentPrice) {
        setOfferError('Offer amount should be less than the current price.');
        return;
      }

      setIsSubmittingOffer(true);

      await offersService.createOffer({
        listing_id: productId,
        buyer_id: userId,
        seller_id: sellerId,
        offer_amount: amountNum,
        message: offerMessage || undefined,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      showSuccessToast('Offer submitted successfully! The seller will be notified.');
      handleClose();
    } catch (error) {
      console.error('Error submitting offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit offer';
      setOfferError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleClose = () => {
    setOfferAmount('');
    setOfferMessage('');
    setOfferError(null);
    onClose();
  };

  const suggestedOffers = [0.85, 0.9, 0.95].map((mult) => ({
    percentage: Math.round((1 - mult) * 100),
    amount: currentPrice * mult,
  }));

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
        <View className="flex-1" />
        <Pressable className="bg-white w-full rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Feather name="tag" size={20} color="#000" />
                <Text className="text-lg font-inter-semibold text-gray-900 ml-2">Make an Offer</Text>
              </View>
              <Pressable onPress={handleClose} className="p-1">
                <Feather name="x" size={20} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            className="p-6"
          >
            {/* Product Info */}
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-sm font-inter-semibold text-gray-800 mb-1" numberOfLines={1}>
                {productName}
              </Text>
              <Text className="text-xs font-inter text-gray-500">Current price: £{currentPrice.toFixed(2)}</Text>
            </View>

            {/* Offer Amount */}
            <View className="mb-4">
              <Text className="text-sm font-inter text-gray-700 mb-2">Your Offer (£) *</Text>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="Enter your offer amount"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 rounded-lg px-4 py-3"
                value={offerAmount}
                onChangeText={setOfferAmount}
              />
            </View>

            {/* Quick Offer Suggestions */}
            <View className="mb-4">
              <Text className="text-sm font-inter text-gray-700 mb-2">Quick suggestions</Text>
              <View className="flex-row">
                {suggestedOffers.map((suggestion) => (
                  <Pressable
                    key={suggestion.percentage}
                    className="bg-gray-100 px-4 py-2 rounded-lg mr-2"
                    onPress={() => setOfferAmount(suggestion.amount.toFixed(2))}
                  >
                    <Text className="text-sm font-inter text-gray-800">£{suggestion.amount.toFixed(2)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Message */}
            <View className="mb-4">
              <Text className="text-sm font-inter text-gray-700 mb-2">Message (Optional)</Text>
              <TextInput
                placeholder="Add a message to the seller..."
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 rounded-lg px-4 py-3"
                style={{ height: 100 }}
                multiline
                textAlignVertical="top"
                value={offerMessage}
                onChangeText={setOfferMessage}
                maxLength={500}
              />
              <Text className="text-xs font-inter text-gray-500 text-right mt-1">
                {offerMessage.length}/500 characters
              </Text>
            </View>

            {offerError ? (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-sm font-inter text-red-600">{offerError}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 py-3 rounded-lg border border-gray-300"
                disabled={isSubmittingOffer}
                onPress={handleClose}
              >
                <Text className="text-center text-sm font-inter-semibold text-gray-800">Cancel</Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-3 rounded-lg items-center justify-center ${
                  isSubmittingOffer ? 'bg-gray-400' : 'bg-black'
                }`}
                disabled={isSubmittingOffer || !offerAmount.trim()}
                onPress={handleSubmitOffer}
              >
                <Text className="text-center text-sm font-inter-semibold text-white">
                  {isSubmittingOffer ? <ActivityIndicator size="small" color="white" /> : 'Submit Offer'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
