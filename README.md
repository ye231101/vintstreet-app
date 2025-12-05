# VintStreet App

A modern vintage marketplace mobile application built with React Native and Expo. VintStreet enables users to buy, sell, and re-list vintage items with features including live streaming auctions, messaging, reviews, and secure payments.

## 📱 About VintStreet

VintStreet is a vintage marketplace built on second chances, sustainable choices, and stories worth sharing. The platform allows users to:

- **Buy** vintage items from sellers worldwide
- **Sell** pre-loved items with detailed listings
- **Re-list** items to keep good things moving
- **Stream** live auctions with real-time bidding
- **Connect** with sellers and buyers through messaging
- **Discover** unique pieces through advanced search and filtering

## 🚀 Features

### Core Features
- **User Authentication** - Secure sign up, login, and password management
- **Product Listings** - Create, edit, and manage product listings with images
- **Search & Discovery** - Advanced search powered by Algolia with category filtering
- **Shopping Cart** - Add items to cart and manage checkout
- **Offers System** - Make and manage offers on listings
- **Orders Management** - Track orders and order history
- **Reviews & Ratings** - Rate and review products and sellers
- **Wishlist** - Save favorite items for later
- **Messaging** - Real-time messaging between buyers and sellers
- **Live Streaming** - Host and watch live auctions with Agora
- **Payments** - Secure payments via Stripe with Apple Pay and Google Pay support
- **Seller Dashboard** - Comprehensive seller tools and analytics
- **Address Management** - Save and manage shipping addresses

### Technical Features
- **File-based Routing** - Expo Router for navigation
- **State Management** - Redux Toolkit with persistence
- **Real-time Updates** - Supabase real-time subscriptions
- **Image Upload** - Secure image storage and management
- **Push Notifications** - Expo notifications for order updates
- **Dark Mode Support** - Automatic theme switching
- **Cross-platform** - iOS, Android, and Web support

## 🛠 Tech Stack

### Frontend
- **React Native** (0.81.5) - Mobile framework
- **Expo** (~54.0.25) - Development platform
- **Expo Router** (~6.0.15) - File-based routing
- **TypeScript** (~5.9.2) - Type safety
- **NativeWind** (^4.2.1) - Tailwind CSS for React Native
- **Redux Toolkit** (^2.10.1) - State management
- **React Navigation** (^7.x) - Navigation library

### Backend & Services
- **Supabase** (^2.84.0) - Backend as a Service (Database, Auth, Storage)
- **Stripe** (0.50.3) - Payment processing
- **Agora** (^4.5.3) - Live streaming and RTM
- **Algolia** (^5.44.0) - Search and discovery
- **Mapbox** - Location services (via Google Places Autocomplete)

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **EAS Build** - Cloud builds for iOS and Android

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **EAS CLI** (for builds): `npm install -g eas-cli`
- **Supabase CLI** (for functions): See [Deployment Instructions](./docs/DEPLOY_INSTRUCTIONS.md)
- **iOS Development**: Xcode (macOS only)
- **Android Development**: Android Studio

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vintstreet-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   ```env
   # Access Token
   EXPO_PUBLIC_ACCESS_TOKEN=your_access_token
   
   # Mapbox
   EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   
   # Supabase
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Stripe
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   EXPO_PUBLIC_STRIPE_SECRET_KEY=your_stripe_secret_key
   
   # Agora
   EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
   
   # Algolia
   EXPO_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
   EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_algolia_search_key
   EXPO_PUBLIC_ALGOLIA_PRODUCTS_INDEX=products
   EXPO_PUBLIC_ALGOLIA_CATEGORIES_INDEX=categories
   EXPO_PUBLIC_ALGOLIA_BRANDS_INDEX=brands
   EXPO_PUBLIC_ALGOLIA_BRANDS_QUERY_SUGGESTIONS_INDEX=brands_query_suggestions
   EXPO_PUBLIC_ALGOLIA_CATEGORIES_QUERY_SUGGESTIONS_INDEX=categories_query_suggestions
   EXPO_PUBLIC_ALGOLIA_PRODUCTS_QUERY_SUGGESTIONS_INDEX=products_query_suggestions
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   Or use platform-specific commands:
   ```bash
   npm run android  # Android
   npm run ios      # iOS
   npm run web      # Web
   ```

## 📁 Project Structure

```
vintstreet-app/
├── api/                    # API services and configuration
│   ├── config/            # Service configurations (Supabase, Agora, Algolia)
│   ├── services/          # Business logic services
│   │   ├── auth.service.ts
│   │   ├── listings.service.ts
│   │   ├── cart.service.ts
│   │   ├── orders.service.ts
│   │   ├── offers.service.ts
│   │   ├── reviews.service.ts
│   │   ├── streams.service.ts
│   │   └── ... (more services)
│   └── types/             # TypeScript type definitions
├── app/                   # Expo Router app directory (file-based routing)
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main tab navigation screens
│   ├── product/          # Product detail pages
│   ├── seller/           # Seller dashboard
│   ├── stream/           # Live streaming screens
│   └── ...               # Other routes
├── components/           # Reusable React components
│   └── common/          # Common UI components
├── hooks/               # Custom React hooks
├── store/              # Redux store configuration
│   ├── slices/        # Redux slices
│   └── selectors/     # Redux selectors
├── utils/              # Utility functions
├── constants/          # App constants
├── assets/            # Images, fonts, and other assets
├── docs/              # Documentation
└── supabase/          # Supabase Edge Functions
    └── functions/
        └── push/      # Push notification function
```

## 🏗 Architecture

### Service Layer Pattern
The app uses a service layer pattern where all API interactions are abstracted into service classes:

- **Services** (`api/services/`) - Handle all business logic and API calls
- **Types** (`api/types/`) - TypeScript interfaces and types
- **Config** (`api/config/`) - Service configurations and clients

### State Management
- **Redux Toolkit** - Global state management
- **React Query** (via hooks) - Server state and caching
- **Local State** - Component-level state with React hooks

### Routing
- **Expo Router** - File-based routing system
- **Stack Navigation** - For modal and detail screens
- **Tab Navigation** - For main app sections

See [Architecture Documentation](./docs/ARCHITECTURE.md) for more details.

## 🔌 API Services

The app includes the following service modules:

- **Auth Service** - Authentication and user management
- **Listings Service** - Product listing CRUD operations
- **Cart Service** - Shopping cart management
- **Orders Service** - Order processing and tracking
- **Offers Service** - Offer creation and management
- **Reviews Service** - Review and rating system
- **Streams Service** - Live streaming functionality
- **Messages Service** - Real-time messaging
- **Wishlist Service** - Wishlist management
- **Seller Service** - Seller-specific operations
- **Buyer Service** - Buyer-specific operations
- **Shipping Service** - Shipping and address management
- **Stripe Service** - Payment processing
- **Storage Service** - File upload and management
- **Categories Service** - Category management
- **Brands Service** - Brand management
- **Attributes Service** - Product attributes
- **Banners Service** - Banner management
- **Notifications Service** - Push notifications

See [API Documentation](./docs/API.md) for detailed API reference.

## 🧪 Development

### Running the App

**Development mode:**
```bash
npm start
```

**Platform-specific:**
```bash
npm run android  # Run on Android
npm run ios       # Run on iOS
npm run web       # Run on web
```

### Linting
```bash
npm run lint
```

### Type Checking
TypeScript type checking is done automatically by the IDE and during builds.

## 🏗 Building for Production

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure project: `eas build:configure`

### Build Commands

**Development builds:**
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

**Preview builds:**
```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

**Production builds:**
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Both platforms:**
```bash
eas build --platform all --profile production
```

See [EAS Build documentation](https://docs.expo.dev/build/introduction/) for more details.

## 📦 Deployment

### Supabase Functions
Deploy Supabase Edge Functions:

```bash
# Login to Supabase
npm run supabase:login

# Link your project
npm run supabase:link

# Deploy functions
npm run supabase:deploy
```

See [Deployment Instructions](./docs/DEPLOY_INSTRUCTIONS.md) for detailed setup.

## 🔐 Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app. See `env.example` for the complete list.

### Required Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `EXPO_PUBLIC_AGORA_APP_ID` - Agora application ID
- `EXPO_PUBLIC_ALGOLIA_APP_ID` - Algolia application ID
- `EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY` - Algolia search API key

### Optional Variables
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` - For location services
- `EXPO_PUBLIC_ACCESS_TOKEN` - Custom access token

## 🧩 Key Dependencies

### Core
- `expo` - Expo SDK
- `react-native` - React Native framework
- `expo-router` - File-based routing
- `@supabase/supabase-js` - Supabase client

### UI & Styling
- `nativewind` - Tailwind CSS for React Native
- `@expo/vector-icons` - Icon library
- `react-native-reanimated` - Animations

### State & Data
- `@reduxjs/toolkit` - Redux state management
- `react-redux` - React bindings for Redux
- `redux-persist` - State persistence

### Features
- `@stripe/stripe-react-native` - Stripe payments
- `react-native-agora` - Live streaming
- `agora-react-native-rtm` - Real-time messaging
- `algoliasearch` - Search functionality
- `expo-notifications` - Push notifications

## 📚 Documentation

- [API Documentation](./docs/API.md) - Detailed API service reference
- [Architecture Documentation](./docs/ARCHITECTURE.md) - System architecture overview
- [Development Guide](./docs/DEVELOPMENT.md) - Developer workflow and best practices
- [Deployment Instructions](./docs/DEPLOY_INSTRUCTIONS.md) - Deployment guide

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Test your changes
5. Submit a pull request

## 📝 License

[Add your license information here]

## 🆘 Support

For issues and questions:
- Check the [documentation](./docs/)
- Review existing issues
- Contact the development team

## 🔗 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Agora Documentation](https://docs.agora.io/)
- [Algolia Documentation](https://www.algolia.com/doc/)

---

Built with ❤️ for the vintage community
