import { listingsService } from '@/api/services/listings.service';
import { offersService } from '@/api/services/offers.service';
import { useCart } from '@/hooks/use-cart';
import { useAppSelector } from '@/store/hooks';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function ListingDetailsScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const navigation = useNavigation();
	const { addItem } = useCart();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [listing, setListing] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<'description' | 'details' | 'seller'>('description');
	const { user } = useAppSelector((state) => state.auth);

	// Offer modal state
	const [isOfferOpen, setIsOfferOpen] = useState(false);
	const [offerAmount, setOfferAmount] = useState<string>('');
	const [offerMessage, setOfferMessage] = useState<string>('');
	const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
	const [offerError, setOfferError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				setIsLoading(true);
				setError(null);
				if (!id) {
					setError('Missing listing id');
					return;
				}
				const data = await listingsService.getListingById(String(id));
				setListing(data);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Failed to load listing');
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [id]);

	// Keep header title in sync with listing name (safe even when listing is null)
	useLayoutEffect(() => {
		const headerTitle = (listing as any)?.product_name || 'Listing';
		// @ts-ignore - expo-router navigation supports setOptions
		navigation.setOptions?.({ title: headerTitle });
	}, [navigation, listing]);

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" color="#000" />
			</View>
		);
	}

	if (error) {
		return (
			<View className="flex-1 items-center justify-center bg-white p-4">
				<Text className="text-base font-inter text-red-600">{error}</Text>
			</View>
		);
	}

	if (!listing) {
		return (
			<View className="flex-1 items-center justify-center bg-white p-4">
				<Text className="text-base font-inter text-gray-600">Listing not found</Text>
			</View>
		);
	}

	const imageUrl = (listing as any).product_image || ((listing as any).product_images?.[0]);
	const title = (listing as any).product_name || '';
	const basePrice = (listing as any).starting_price || 0;
	const currentBid = (listing as any).current_bid || 0;
	const discounted = (listing as any).discounted_price ?? null;
	const priceToShow = discounted ?? basePrice ?? currentBid ?? 0;
	const description = (listing as any).product_description || '';
	const createdAt = (listing as any).created_at || null;
	const sellerId = (listing as any).seller_id || '';
	const productType = (listing as any).product_type || '';

	const handleAddToCart = () => {
		try {
			const vendorIdNum = Number(sellerId) || 0;
			addItem({
				productId: Number(id) || 0,
				name: title,
				price: Number(priceToShow) || 0,
				quantity: 1,
				image: imageUrl || '',
				vendorId: vendorIdNum,
				vendorName: String(sellerId || 'Seller'),
				protectionFeePercentage: vendorIdNum === 42 ? 0 : 0.072,
			});
		} catch {
			// no-op
		}
	};

	const openOffer = () => {
		setOfferError(null);
		setOfferAmount('');
		setOfferMessage('');
		setIsOfferOpen(true);
	};

	const submitOffer = async () => {
		try {
			setOfferError(null);
			if (!user?.id) {
				setOfferError('Please sign in to make an offer.');
				return;
			}
			const sellerIdStr = String(sellerId || '');
			const listingIdStr = String(id || '');
			const amountNum = Number(offerAmount);
			if (!amountNum || amountNum <= 0) {
				setOfferError('Enter a valid amount.');
				return;
			}
			setIsSubmittingOffer(true);
			await offersService.createOffer({
				listing_id: listingIdStr,
				buyer_id: user.id,
				seller_id: sellerIdStr,
				offer_amount: amountNum,
				message: offerMessage || undefined,
				expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
			});
			setIsOfferOpen(false);
		} catch (e) {
			setOfferError(e instanceof Error ? e.message : 'Failed to submit offer');
		} finally {
			setIsSubmittingOffer(false);
		}
	};

const formattedDate = (() => {
	try {
		if (!createdAt) return '';
		const d = new Date(createdAt);
		return d.toLocaleDateString();
	} catch {
		return '';
	}
})();

	return (
		<ScrollView className="flex-1 bg-white">
			{/* Image */}
			{imageUrl ? (
				<Image source={{ uri: imageUrl }} className="w-full" style={{ aspectRatio: 1 }} resizeMode="contain" />
			) : (
				<View className="w-full h-60 bg-gray-100 items-center justify-center">
					<Text className="text-sm font-inter text-gray-500">No image</Text>
				</View>
			)}

			{/* Title and seller row */}
			<View className="px-4 pt-4">
				<Text className="text-2xl font-inter-bold text-black mb-2">{title}</Text>
				<View className="flex-row items-center mb-3">
					<View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center mr-2">
						<Text className="text-xs font-inter text-gray-700">S</Text>
					</View>
					<View className="flex-1">
						<Text className="text-xs font-inter text-gray-800" numberOfLines={1}>By {sellerId || 'Seller'}</Text>
						{formattedDate ? (
							<Text className="text-xs font-inter text-gray-500">Listed {formattedDate}</Text>
						) : null}
					</View>
					<Pressable className="px-3 py-1.5 border border-gray-300 rounded-lg">
						<Text className="text-xs font-inter text-gray-800">View Shop</Text>
					</Pressable>
				</View>

				{/* Tag */}
				{productType ? (
					<View className="self-start bg-gray-100 px-3 py-1 rounded-full mb-3 ml-1">
						<Text className="text-xs font-inter text-gray-800">{productType}</Text>
					</View>
				) : null}
			</View>

			{/* Price and actions */}
			<View className="px-4">
				<View className="flex-row items-center justify-between bg-white py-2">
					<View className="flex-row items-center">
						<Text className="text-2xl font-inter-bold text-black mr-2">£{Number(priceToShow).toFixed(2)}</Text>
						{discounted != null && (
							<Text className="text-base font-inter text-gray-400 line-through">£{Number(basePrice).toFixed(2)}</Text>
						)}
					</View>
					<View className="flex-row items-center">
						<Pressable className="bg-black px-4 py-3 rounded-lg mr-2" onPress={handleAddToCart}>
							<Text className="text-white text-sm font-inter-semibold">Add to Cart</Text>
						</Pressable>
					<Pressable className="bg-gray-100 px-4 py-3 rounded-lg" onPress={openOffer}>
							<Text className="text-sm font-inter text-gray-900">Make Offer</Text>
						</Pressable>
					</View>
				</View>
			</View>

			{/* Tabs */}
			<View className="px-4 mt-4">
				<View className="flex-row bg-white rounded-lg overflow-hidden border border-gray-200">
					{(['description','details','seller'] as const).map((t) => (
						<Pressable
							key={t}
							className={`flex-1 px-4 py-3 ${activeTab === t ? 'bg-white' : 'bg-gray-50'} border-r border-gray-200`}
							onPress={() => setActiveTab(t)}
						>
							<Text className={`text-sm font-inter ${activeTab === t ? 'text-black font-inter-semibold' : 'text-gray-700'}`}>
								{t === 'description' ? 'Description' : t === 'details' ? 'Details' : 'Seller'}
							</Text>
						</Pressable>
					))}
				</View>

				<View className="bg-white border border-t-0 border-gray-200 p-4">
					{activeTab === 'description' && (
						<Text className="text-sm font-inter text-gray-800">{description}</Text>
					)}
					{activeTab === 'details' && (
						<View>
							<Text className="text-sm font-inter text-gray-800 mb-2">Product Type: {productType || '-'}</Text>
							<Text className="text-sm font-inter text-gray-800 mb-2">Current Bid: £{Number(currentBid).toFixed(2)}</Text>
							<Text className="text-sm font-inter text-gray-800">Listing Id: {String(id)}</Text>
						</View>
					)}
					{activeTab === 'seller' && (
						<View>
							<Text className="text-sm font-inter text-gray-800">Seller Id: {sellerId || '-'}</Text>
							{formattedDate ? (
								<Text className="text-sm font-inter text-gray-800 mt-2">Joined/Listed: {formattedDate}</Text>
							) : null}
						</View>
					)}
				</View>
			</View>

			<View className="h-8" />

			{/* Make Offer Modal */}
			<Modal visible={isOfferOpen} transparent animationType="fade" onRequestClose={() => setIsOfferOpen(false)}>
				<View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
					<View className="bg-white w-11/12 rounded-xl p-4">
						<Text className="text-lg font-inter-semibold mb-3">Make an Offer</Text>
						<View className="bg-gray-50 rounded-lg p-3 mb-3">
							<Text className="text-sm font-inter text-gray-800" numberOfLines={1}>{title}</Text>
							<Text className="text-xs font-inter text-gray-500">Current price: £{Number(priceToShow).toFixed(2)}</Text>
						</View>
						<Text className="text-sm font-inter mb-2">Your Offer (£)</Text>
						<TextInput
							keyboardType="decimal-pad"
							placeholder="Enter your offer amount"
							className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
							value={offerAmount}
							onChangeText={setOfferAmount}
						/>
						<View className="flex-row mb-3">
							{[0.85, 0.9, 0.95].map((mult) => {
								const suggested = (Number(priceToShow) * mult);
								return (
									<Pressable key={String(mult)} className="bg-gray-100 px-3 py-2 rounded-lg mr-2" onPress={() => setOfferAmount(suggested.toFixed(2))}>
										<Text className="text-sm font-inter">£{suggested.toFixed(2)}</Text>
									</Pressable>
								);
							})}
						</View>
						<Text className="text-sm font-inter mb-1">Message (Optional)</Text>
						<TextInput
							placeholder="Add a message to the seller..."
							className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
							multiline
							value={offerMessage}
							onChangeText={setOfferMessage}
						/>
						{offerError ? <Text className="text-xs font-inter text-red-600 mb-2">{offerError}</Text> : null}
						<View className="flex-row justify-end">
							<Pressable className="px-4 py-2 rounded-lg mr-2 border border-gray-300" disabled={isSubmittingOffer} onPress={() => setIsOfferOpen(false)}>
								<Text className="text-sm font-inter">Cancel</Text>
							</Pressable>
							<Pressable className="px-4 py-2 rounded-lg bg-black" disabled={isSubmittingOffer} onPress={submitOffer}>
								<Text className="text-sm font-inter text-white">{isSubmittingOffer ? 'Submitting...' : 'Submit Offer'}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}
