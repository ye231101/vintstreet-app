# API Documentation

This document provides detailed information about the API services used in the VintStreet application.

## Overview

The VintStreet app uses a service layer pattern where all API interactions are abstracted into service classes. All services are located in the `api/services/` directory and are exported from `api/services/index.ts`.

## Service Architecture

All services follow a consistent pattern:
- Services are class-based with static or instance methods
- Error handling is centralized with try-catch blocks
- Logging is done via the `logger` utility
- TypeScript types are defined in `api/types/`

## Services

### Auth Service (`auth.service.ts`)

Handles all authentication operations with Supabase.

**Methods:**
- `signUp(data: SignUpData)` - Register a new user
- `signIn(data: SignInData)` - Sign in an existing user
- `signOut()` - Sign out the current user
- `getCurrentUser()` - Get the current authenticated user
- `updateUser(data: Partial<AuthUser>)` - Update user profile
- `resetPassword(email: string)` - Send password reset email
- `resendEmailConfirmation(email: string)` - Resend email confirmation
- `updatePassword(newPassword: string)` - Update user password

**Usage:**
```typescript
import { authService } from '@/api/services';

const response = await authService.signUp({
  email: 'user@example.com',
  password: 'password123',
  username: 'username',
  full_name: 'Full Name'
});
```

### Listings Service (`listings.service.ts`)

Manages product listings with support for infinite scroll, filtering, and search.

**Methods:**
- `getListingsInfinite(pageParam, pageSize, filters)` - Get paginated listings with infinite scroll
- `getListingById(id)` - Get a single listing by ID
- `createListing(data)` - Create a new listing
- `updateListing(id, data)` - Update an existing listing
- `deleteListing(id)` - Delete a listing
- `getUserListings(userId)` - Get all listings for a user
- `getFeaturedListings()` - Get featured listings
- `getRelatedListings(listingId, limit)` - Get related listings

**Usage:**
```typescript
import { listingsService } from '@/api/services';

const result = await listingsService.getListingsInfinite(0, 20, {
  activeCategory: 'category-id',
  searchKeyword: 'vintage',
  selectedBrands: new Set(['brand-id'])
});
```

### Cart Service (`cart.service.ts`)

Manages shopping cart operations.

**Methods:**
- `getCart(userId)` - Get user's cart
- `addToCart(userId, listingId, quantity)` - Add item to cart
- `updateCartItem(cartItemId, quantity)` - Update cart item quantity
- `removeFromCart(cartItemId)` - Remove item from cart
- `clearCart(userId)` - Clear entire cart

**Usage:**
```typescript
import { cartService } from '@/api/services';

await cartService.addToCart(userId, listingId, 1);
const cart = await cartService.getCart(userId);
```

### Orders Service (`orders.service.ts`)

Handles order processing and tracking.

**Methods:**
- `createOrder(data)` - Create a new order
- `getOrderById(id)` - Get order details
- `getUserOrders(userId, status?)` - Get user's orders
- `updateOrderStatus(id, status)` - Update order status
- `cancelOrder(id)` - Cancel an order

**Usage:**
```typescript
import { ordersService } from '@/api/services';

const order = await ordersService.createOrder({
  userId,
  items: [...],
  shippingAddress: {...},
  paymentMethod: {...}
});
```

### Offers Service (`offers.service.ts`)

Manages offer creation and negotiation.

**Methods:**
- `createOffer(data)` - Create a new offer
- `getOfferById(id)` - Get offer details
- `getOffersForListing(listingId)` - Get all offers for a listing
- `getUserOffers(userId, type?)` - Get user's offers (sent/received)
- `acceptOffer(id)` - Accept an offer
- `rejectOffer(id)` - Reject an offer
- `cancelOffer(id)` - Cancel an offer

**Usage:**
```typescript
import { offersService } from '@/api/services';

const offer = await offersService.createOffer({
  listingId: 'listing-id',
  buyerId: 'buyer-id',
  amount: 100,
  message: 'Offer message'
});
```

### Reviews Service (`reviews.service.ts`)

Handles product and seller reviews.

**Methods:**
- `createReview(data)` - Create a new review
- `getReviewById(id)` - Get review details
- `getReviewsForListing(listingId)` - Get reviews for a listing
- `getReviewsForSeller(sellerId)` - Get reviews for a seller
- `updateReview(id, data)` - Update a review
- `deleteReview(id)` - Delete a review

**Usage:**
```typescript
import { reviewsService } from '@/api/services';

const review = await reviewsService.createReview({
  listingId: 'listing-id',
  userId: 'user-id',
  rating: 5,
  comment: 'Great product!'
});
```

### Streams Service (`streams.service.ts`)

Manages live streaming functionality.

**Methods:**
- `createStream(data)` - Create a new stream
- `getStreamById(id)` - Get stream details
- `getUserStreams(userId)` - Get user's streams
- `getActiveStreams()` - Get currently active streams
- `updateStream(id, data)` - Update stream details
- `endStream(id)` - End a stream

**Usage:**
```typescript
import { streamsService } from '@/api/services';

const stream = await streamsService.createStream({
  sellerId: 'seller-id',
  title: 'Live Auction',
  scheduledStart: new Date()
});
```

### Messages Service (`messages.service.ts`)

Handles real-time messaging between users.

**Methods:**
- `createConversation(userId1, userId2)` - Create or get conversation
- `getConversations(userId)` - Get user's conversations
- `getMessages(conversationId)` - Get messages in a conversation
- `sendMessage(conversationId, senderId, content)` - Send a message
- `markAsRead(conversationId, userId)` - Mark messages as read

**Usage:**
```typescript
import { messagesService } from '@/api/services';

const conversation = await messagesService.createConversation(userId1, userId2);
await messagesService.sendMessage(conversationId, senderId, 'Hello!');
```

### Wishlist Service (`wishlist.service.ts`)

Manages user wishlists.

**Methods:**
- `getWishlist(userId)` - Get user's wishlist
- `addToWishlist(userId, listingId)` - Add item to wishlist
- `removeFromWishlist(userId, listingId)` - Remove item from wishlist
- `isInWishlist(userId, listingId)` - Check if item is in wishlist

**Usage:**
```typescript
import { wishlistService } from '@/api/services';

await wishlistService.addToWishlist(userId, listingId);
const wishlist = await wishlistService.getWishlist(userId);
```

### Seller Service (`seller.service.ts`)

Seller-specific operations and dashboard data.

**Methods:**
- `getSellerProfile(sellerId)` - Get seller profile
- `updateSellerProfile(sellerId, data)` - Update seller profile
- `getSellerStats(sellerId)` - Get seller statistics
- `getSellerListings(sellerId, filters?)` - Get seller's listings
- `getSellerOrders(sellerId, status?)` - Get seller's orders

**Usage:**
```typescript
import { sellerService } from '@/api/services';

const stats = await sellerService.getSellerStats(sellerId);
const profile = await sellerService.getSellerProfile(sellerId);
```

### Buyer Service (`buyer.service.ts`)

Buyer-specific operations.

**Methods:**
- `getBuyerProfile(buyerId)` - Get buyer profile
- `updateBuyerProfile(buyerId, data)` - Update buyer profile
- `getPurchaseHistory(buyerId)` - Get purchase history

**Usage:**
```typescript
import { buyerService } from '@/api/services';

const history = await buyerService.getPurchaseHistory(buyerId);
```

### Shipping Service (`shipping.service.ts`)

Manages shipping addresses and shipping calculations.

**Methods:**
- `getSavedAddresses(userId)` - Get saved addresses
- `addAddress(userId, address)` - Add a new address
- `updateAddress(addressId, address)` - Update an address
- `deleteAddress(addressId)` - Delete an address
- `calculateShipping(listingId, address)` - Calculate shipping cost

**Usage:**
```typescript
import { shippingService } from '@/api/services';

const addresses = await shippingService.getSavedAddresses(userId);
const cost = await shippingService.calculateShipping(listingId, address);
```

### Stripe Service (`stripe.service.ts`)

Handles payment processing via Stripe.

**Methods:**
- `createPaymentIntent(amount, currency)` - Create payment intent
- `confirmPayment(paymentIntentId, paymentMethod)` - Confirm payment
- `createStripeAccount(sellerId)` - Create Stripe Connect account
- `getStripeAccount(sellerId)` - Get Stripe account details

**Usage:**
```typescript
import { stripeService } from '@/api/services';

const paymentIntent = await stripeService.createPaymentIntent(10000, 'usd');
await stripeService.confirmPayment(paymentIntentId, paymentMethod);
```

### Storage Service (`storage.service.ts`)

Handles file uploads to Supabase Storage.

**Methods:**
- `uploadImage(file, path)` - Upload an image
- `uploadMultipleImages(files, path)` - Upload multiple images
- `deleteImage(path)` - Delete an image
- `getImageUrl(path)` - Get public URL for an image

**Usage:**
```typescript
import { storageService } from '@/api/services';

const url = await storageService.uploadImage(file, 'listings/image.jpg');
```

### Categories Service (`categories.service.ts`)

Manages product categories and hierarchy.

**Methods:**
- `getCategories()` - Get all categories
- `getCategoryById(id)` - Get category details
- `getSubcategories(categoryId)` - Get subcategories
- `getCategoryAttributes(categoryId)` - Get category attributes

**Usage:**
```typescript
import { categoriesService } from '@/api/services';

const categories = await categoriesService.getCategories();
const attributes = await categoriesService.getCategoryAttributes(categoryId);
```

### Brands Service (`brands.service.ts`)

Manages brand information.

**Methods:**
- `getBrands()` - Get all brands
- `getBrandById(id)` - Get brand details
- `searchBrands(query)` - Search brands

**Usage:**
```typescript
import { brandsService } from '@/api/services';

const brands = await brandsService.getBrands();
```

### Attributes Service (`attributes.service.ts`)

Manages product attributes and specifications.

**Methods:**
- `getAttributes(categoryId?)` - Get attributes for a category
- `getAttributeById(id)` - Get attribute details

**Usage:**
```typescript
import { attributesService } from '@/api/services';

const attributes = await attributesService.getAttributes(categoryId);
```

### Banners Service (`banners.service.ts`)

Manages promotional banners.

**Methods:**
- `getBanners(type?)` - Get banners (optionally filtered by type)
- `getBannerById(id)` - Get banner details

**Usage:**
```typescript
import { bannersService } from '@/api/services';

const banners = await bannersService.getBanners('homepage');
```

### Notifications Service (`notifications.service.ts`)

Handles push notifications.

**Methods:**
- `registerDevice(userId, token)` - Register device for notifications
- `sendNotification(userId, notification)` - Send a notification
- `getNotifications(userId)` - Get user's notifications
- `markAsRead(notificationId)` - Mark notification as read

**Usage:**
```typescript
import { notificationsService } from '@/api/services';

await notificationsService.registerDevice(userId, deviceToken);
```

## Error Handling

All services follow a consistent error handling pattern:

```typescript
try {
  // Service operation
  const result = await supabase.from('table').select();
  if (result.error) throw result.error;
  return { data: result.data, error: null };
} catch (error) {
  logger.error('Service error:', error);
  return { data: null, error: error.message };
}
```

## Type Definitions

All TypeScript types are defined in `api/types/`:

- `auth.types.ts` - Authentication types
- `listings.types.ts` - Listing types
- `cart.types.ts` - Cart types
- `orders.types.ts` - Order types
- `offers.types.ts` - Offer types
- `reviews.types.ts` - Review types
- `stream.types.ts` - Stream types
- `messages.types.ts` - Message types
- `database.types.ts` - Database schema types
- And more...

## Best Practices

1. **Always use services** - Don't call Supabase directly from components
2. **Handle errors** - Always check for errors in service responses
3. **Use TypeScript** - Leverage type definitions for type safety
4. **Log operations** - Services automatically log errors
5. **Cache when appropriate** - Use React Query for server state caching

## Configuration

Service configurations are in `api/config/`:

- `supabase.ts` - Supabase client configuration
- `agora.ts` - Agora configuration
- `algolia.ts` - Algolia configuration

All configurations use environment variables prefixed with `EXPO_PUBLIC_`.

