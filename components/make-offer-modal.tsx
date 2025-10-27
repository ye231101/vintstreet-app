import { Product } from '@/api/services/listings.service';
import { offersService } from '@/api/services/offers.service';
import { useAuth } from '@/hooks/use-auth';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({ isOpen, onClose, product }) => {
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmitOffer = async () => {
    if (!user?.id) {
      setOfferError('Please sign in to make an offer.');
      return;
    }

    try {
      setOfferError(null);

      const amountNum = Number(offerAmount);
      if (!amountNum || amountNum <= 0) {
        setOfferError('Enter a valid amount.');
        return;
      }

      if (amountNum >= (product?.discounted_price ?? product?.starting_price ?? 0)) {
        setOfferError('Offer amount should be less than the current price.');
        return;
      }

      setIsSubmittingOffer(true);

      await offersService.createOffer({
        listing_id: product.id,
        buyer_id: user.id,
        seller_id: product.seller_id,
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
    amount: (product?.discounted_price ?? product?.starting_price ?? 0) * mult,
  }));

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <Pressable onPress={handleClose} className="flex-1 bg-black/50 justify-end">
          <View className="flex-1" />
          <Pressable className="bg-white w-full rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 gap-2 border-b border-gray-200">
              <View className="flex-row items-center">
                <Feather name="tag" size={20} color="#000" />
                <Text className="text-xl font-inter-bold text-gray-900 ml-2">Make an Offer</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={8}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
            >
              {/* Product Info */}
              <View className="bg-gray-50 rounded-lg p-4 mb-4">
                <Text className="text-base font-inter-semibold text-gray-800 mb-1" numberOfLines={2}>
                  {product.product_name}
                </Text>
                <Text className="text-sm font-inter-semibold text-gray-500">
                  Current price: £
                  {(product?.discounted_price ?? product?.starting_price ?? 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {/* Offer Amount */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-gray-700 mb-2">Your Offer (£) *</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  placeholder="Enter your offer amount"
                  placeholderTextColor="#9CA3AF"
                  value={offerAmount}
                  onChangeText={setOfferAmount}
                  className="border border-gray-300 rounded-lg px-4 py-3"
                />
              </View>

              {/* Quick Offer Suggestions */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-gray-700 mb-2">Quick suggestions</Text>
                <View className="flex-row gap-2">
                  {suggestedOffers.map((suggestion) => (
                    <Pressable
                      key={suggestion.percentage}
                      className="bg-gray-100 px-4 py-2 rounded-lg"
                      onPress={() =>
                        setOfferAmount(
                          suggestion.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        )
                      }
                    >
                      <Text className="text-sm font-inter-semibold text-gray-800">
                        £
                        {suggestion.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Message */}
              <View className="mb-4">
                <Text className="text-sm font-inter-semibold text-gray-700 mb-2">Message (Optional)</Text>
                <TextInput
                  placeholder="Add a message to the seller..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={offerMessage}
                  onChangeText={setOfferMessage}
                  maxLength={500}
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  style={{ height: 100 }}
                />
                <Text className="text-sm font-inter-semibold text-gray-500 text-right mt-1">
                  {offerMessage.length}/500 characters
                </Text>
              </View>

              {offerError ? (
                <View className="mb-4 p-4 bg-red-50 rounded-lg">
                  <Text className="text-sm font-inter-semibold text-red-600">{offerError}</Text>
                </View>
              ) : null}

              {/* Actions */}
              <View className="flex-row gap-4">
                <Pressable
                  className={`flex-1 bg-black rounded-lg py-3 flex-row items-center justify-center ${
                    isSubmittingOffer ? 'bg-gray-400' : 'bg-black'
                  }`}
                  disabled={isSubmittingOffer || !offerAmount.trim()}
                  onPress={handleSubmitOffer}
                >
                  <Text className="text-base font-inter-bold text-white">
                    {isSubmittingOffer ? <ActivityIndicator size="small" color="white" /> : 'Submit Offer'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isSubmittingOffer}
                  onPress={handleClose}
                  className="flex-1 bg-gray-200 rounded-lg py-3 flex-row items-center justify-center"
                >
                  <Text className="text-base font-inter-bold text-gray-900 text-center">Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
