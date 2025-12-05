# Architecture Documentation

This document provides an overview of the VintStreet application architecture.

## System Overview

VintStreet is a React Native application built with Expo that follows a modern, scalable architecture pattern. The app uses a service layer pattern for API interactions, Redux for global state management, and Expo Router for navigation.

## Architecture Layers

### 1. Presentation Layer

**Location:** `app/`, `components/`

The presentation layer consists of:
- **Screens** - Route components in `app/` directory (file-based routing)
- **Components** - Reusable UI components in `components/`
- **Hooks** - Custom React hooks in `hooks/`

**Key Technologies:**
- Expo Router for file-based routing
- React Native components
- NativeWind (Tailwind CSS) for styling

### 2. State Management Layer

**Location:** `store/`, `hooks/`

The state management uses a hybrid approach:

**Global State (Redux):**
- Redux Toolkit for state management
- Redux Persist for state persistence
- Slices in `store/slices/`
- Selectors in `store/selectors/`

**Server State:**
- React Query patterns via custom hooks
- Caching and synchronization

**Local State:**
- React hooks (useState, useReducer)
- Component-level state

### 3. Service Layer

**Location:** `api/services/`

All API interactions are abstracted through service classes:

```
api/
├── services/          # Business logic services
├── config/           # Service configurations
└── types/            # TypeScript definitions
```

**Benefits:**
- Separation of concerns
- Reusable business logic
- Centralized error handling
- Type safety

### 4. Data Layer

**Backend Services:**
- **Supabase** - Database, Authentication, Storage, Real-time
- **Stripe** - Payment processing
- **Agora** - Live streaming and RTM
- **Algolia** - Search and discovery

## Directory Structure

```
vintstreet-app/
├── api/                    # API layer
│   ├── config/            # Service configurations
│   │   ├── supabase.ts
│   │   ├── agora.ts
│   │   └── algolia.ts
│   ├── services/          # Business logic services
│   │   ├── auth.service.ts
│   │   ├── listings.service.ts
│   │   └── ... (20+ services)
│   └── types/             # TypeScript types
│       ├── auth.types.ts
│       ├── listings.types.ts
│       └── ... (20+ type files)
│
├── app/                   # Expo Router app directory
│   ├── (auth)/           # Authentication routes
│   │   ├── index.tsx     # Login
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/           # Main tab navigation
│   │   ├── index.tsx     # Home
│   │   ├── discovery.tsx
│   │   ├── auctions.tsx
│   │   ├── sell.tsx
│   │   ├── messages.tsx
│   │   └── account.tsx
│   ├── product/          # Product routes
│   │   └── [id].tsx      # Product detail
│   ├── seller/           # Seller dashboard
│   │   ├── dashboard.tsx
│   │   ├── listings.tsx
│   │   ├── orders.tsx
│   │   └── ...
│   ├── stream/           # Live streaming
│   │   ├── [id].tsx      # Watch stream
│   │   └── start/[id].tsx # Start stream
│   └── _layout.tsx       # Root layout
│
├── components/           # Reusable components
│   ├── common/          # Common UI components
│   │   ├── input.tsx
│   │   └── dropdown.tsx
│   ├── product-card.tsx
│   ├── search-bar.tsx
│   └── ...
│
├── hooks/               # Custom React hooks
│   ├── use-auth.ts
│   ├── use-cart.ts
│   ├── use-agora.ts
│   └── ...
│
├── store/              # Redux store
│   ├── slices/        # Redux slices
│   ├── selectors/     # Redux selectors
│   ├── index.ts       # Store configuration
│   └── hooks.ts       # Typed hooks
│
├── utils/             # Utility functions
│   ├── auth-utils.ts
│   ├── storage.ts
│   ├── logger.ts
│   └── ...
│
├── constants/         # App constants
│   └── theme.ts
│
└── assets/           # Static assets
    └── images/
```

## Data Flow

### 1. User Action Flow

```
User Action
    ↓
Component (app/ or components/)
    ↓
Hook (hooks/) or Direct Service Call
    ↓
Service (api/services/)
    ↓
Supabase/External API
    ↓
Response
    ↓
State Update (Redux or Local)
    ↓
UI Update
```

### 2. Authentication Flow

```
1. User enters credentials
2. Component calls authService.signIn()
3. Service calls Supabase Auth
4. On success:
   - Store session in SecureStore
   - Update Redux auth state
   - Navigate to home
5. On error:
   - Display error message
```

### 3. Data Fetching Flow

```
1. Component mounts
2. Custom hook (e.g., useListings) called
3. Hook uses service to fetch data
4. Service queries Supabase
5. Data cached in React Query (if used)
6. Component re-renders with data
```

## State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: AuthUser | null,
    session: Session | null,
    isLoading: boolean
  },
  cart: {
    items: CartItem[],
    total: number
  },
  // ... other slices
}
```

### State Persistence

- Redux Persist stores auth state in SecureStore
- Cart state persisted in AsyncStorage
- Other state can be persisted as needed

## Navigation

### Routing Structure

Expo Router uses file-based routing:

- `app/(tabs)/` - Tab navigation (bottom tabs)
- `app/(auth)/` - Authentication stack
- `app/product/[id].tsx` - Dynamic product routes
- `app/seller/` - Seller dashboard stack
- `app/stream/` - Streaming stack

### Navigation Patterns

- **Stack Navigation** - For detail screens and modals
- **Tab Navigation** - For main app sections
- **Deep Linking** - Supported via Expo Linking

## Service Layer Pattern

### Service Structure

```typescript
class ServiceName {
  async methodName(params): Promise<Response> {
    try {
      // Business logic
      const result = await supabase.from('table').select();
      
      if (result.error) throw result.error;
      
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Service error:', error);
      return { data: null, error: error.message };
    }
  }
}

export const serviceName = new ServiceName();
```

### Benefits

1. **Separation of Concerns** - Business logic separate from UI
2. **Reusability** - Services can be used across components
3. **Testability** - Services can be unit tested
4. **Type Safety** - Full TypeScript support
5. **Error Handling** - Centralized error handling

## Real-time Features

### Supabase Real-time

- **Subscriptions** - For live data updates
- **Channels** - For messaging and notifications
- **Presence** - For user online status

### Agora Integration

- **Live Streaming** - Video streaming for auctions
- **RTM** - Real-time messaging during streams
- **Token Management** - Secure token generation

## Security

### Authentication

- Supabase Auth handles authentication
- JWT tokens stored in SecureStore
- Automatic token refresh

### Data Security

- Row Level Security (RLS) in Supabase
- API keys stored in environment variables
- Secure storage for sensitive data

## Performance Optimizations

### Image Optimization

- Expo Image for optimized image loading
- Lazy loading for product images
- Image caching

### Data Fetching

- Infinite scroll for listings
- Pagination for large datasets
- React Query caching (where applicable)

### Code Splitting

- Expo Router automatic code splitting
- Lazy loading for routes
- Dynamic imports for heavy components

## Error Handling

### Service Level

- Try-catch blocks in all services
- Error logging via logger utility
- Consistent error response format

### Component Level

- Error boundaries for React errors
- User-friendly error messages
- Retry mechanisms for failed requests

## Testing Strategy

### Unit Tests

- Service layer tests
- Utility function tests
- Redux reducer tests

### Integration Tests

- API integration tests
- Navigation tests
- Authentication flow tests

### E2E Tests

- Critical user flows
- Payment processing
- Order creation

## Build & Deployment

### Development

- Expo Go for quick testing
- Development builds for native features
- Hot reloading enabled

### Production

- EAS Build for iOS and Android
- Environment-specific builds
- Code signing and certificates

## Future Considerations

### Scalability

- Service layer can be extended
- Microservices migration path
- API versioning support

### Performance

- Further optimization opportunities
- Bundle size optimization
- Performance monitoring

### Features

- Offline support
- Advanced caching strategies
- Background sync

## Best Practices

1. **Always use services** - Don't call Supabase directly
2. **Type everything** - Use TypeScript types
3. **Handle errors** - Always check for errors
4. **Log operations** - Use logger utility
5. **Follow patterns** - Maintain consistency
6. **Test thoroughly** - Write tests for critical paths
7. **Document code** - Add JSDoc comments
8. **Optimize performance** - Profile and optimize

## Dependencies

### Core

- React Native 0.81.5
- Expo ~54.0.25
- TypeScript ~5.9.2

### State Management

- Redux Toolkit 2.10.1
- React Redux 9.2.0
- Redux Persist 6.0.0

### Backend

- Supabase 2.84.0
- Stripe React Native 0.50.3
- Agora 4.5.3
- Algolia 5.44.0

See `package.json` for complete dependency list.

