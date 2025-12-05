import { offersService } from '@/api/services';
import { Product } from '@/api/types';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputComponent } from './common/input';

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
      logger.error('Error submitting offer:', error);
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
        style={styles.container}
      >
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView edges={['bottom']} className="w-full max-h-[80%] rounded-t-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Feather name="tag" size={20} color="#000" />
                <Text className="text-xl font-inter-bold text-gray-900">Make an Offer</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="gap-4 p-4">
                {/* Product Info */}
                <View className="gap-1 p-4 rounded-lg bg-gray-50">
                  <Text className="text-base font-inter-semibold text-gray-800" numberOfLines={2}>
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
                <InputComponent
                  value={offerAmount}
                  label="Your Offer (£)"
                  size="small"
                  required={true}
                  placeholder="Enter your offer amount"
                  onChangeText={(text) => setOfferAmount(text)}
                  keyboardType="decimal-pad"
                />

                {/* Quick Offer Suggestions */}
                <View className="gap-2">
                  <Text className="text-sm font-inter-semibold text-gray-700">Quick suggestions</Text>
                  <View className="flex-row gap-2">
                    {suggestedOffers.map((suggestion) => (
                      <Pressable
                        key={suggestion.percentage}
                        className="px-4 py-2 rounded-lg bg-gray-100"
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
                <InputComponent
                  value={offerMessage}
                  label="Message (Optional)"
                  size="small"
                  placeholder="Add a message to the seller..."
                  onChangeText={(text) => setOfferMessage(text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  height={100}
                  maxLength={500}
                />

                {offerError ? (
                  <View className="mb-4 p-4 bg-red-50 rounded-lg">
                    <Text className="text-sm font-inter-semibold text-red-600">{offerError}</Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View className="flex-row gap-4">
                  <Pressable
                    disabled={isSubmittingOffer || !offerAmount.trim()}
                    onPress={handleSubmitOffer}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-lg bg-black ${
                      isSubmittingOffer ? 'bg-gray-400' : 'bg-black'
                    }`}
                  >
                    <Text className="text-base font-inter-bold text-white">
                      {isSubmittingOffer ? <ActivityIndicator size="small" color="white" /> : 'Submit Offer'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={isSubmittingOffer}
                    onPress={handleClose}
                    className="flex-1 flex-row items-center justify-center py-3 rounded-lg bg-gray-200"
                  >
                    <Text className="text-base font-inter-bold text-gray-900 text-center">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
