# Development Guide

This guide provides detailed information for developers working on the VintStreet application.

## Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd vintstreet-app
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Fill in your environment variables
   ```

3. **Start development:**
   ```bash
   npm start
   ```

## Development Workflow

### Daily Development

1. **Start the dev server:**
   ```bash
   npm start
   ```

2. **Choose your platform:**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for Web
   - Scan QR code with Expo Go app

3. **Make changes:**
   - Files are watched automatically
   - Changes hot-reload in the app
   - Check console for errors

### Code Organization

#### Adding a New Feature

1. **Create service (if needed):**
   ```typescript
   // api/services/new-feature.service.ts
   import { supabase } from '../config/supabase';
   import { logger } from '@/utils/logger';

   class NewFeatureService {
     async getData(): Promise<Response> {
       try {
         const { data, error } = await supabase.from('table').select();
         if (error) throw error;
         return { data, error: null };
       } catch (error) {
         logger.error('Error:', error);
         return { data: null, error: error.message };
       }
     }
   }

   export const newFeatureService = new NewFeatureService();
   ```

2. **Add types:**
   ```typescript
   // api/types/new-feature.types.ts
   export interface NewFeature {
     id: string;
     // ... other fields
   }
   ```

3. **Create component:**
   ```typescript
   // components/new-feature.tsx
   import { View, Text } from 'react-native';

   export default function NewFeature() {
     return (
       <View>
         <Text>New Feature</Text>
       </View>
     );
   }
   ```

4. **Add route (if needed):**
   ```typescript
   // app/new-feature.tsx
   import NewFeature from '@/components/new-feature';

   export default function NewFeatureScreen() {
     return <NewFeature />;
   }
   ```

#### Adding a New Screen

1. **Create file in `app/` directory:**
   ```typescript
   // app/new-screen.tsx
   import { View, Text } from 'react-native';

   export default function NewScreen() {
     return (
       <View>
         <Text>New Screen</Text>
       </View>
     );
   }
   ```

2. **Add navigation (if needed):**
   - For tab navigation: Add to `app/(tabs)/`
   - For stack navigation: Use `router.push('/new-screen')`

### State Management

#### Using Redux

```typescript
// store/slices/feature.slice.ts
import { createSlice } from '@reduxjs/toolkit';

const featureSlice = createSlice({
  name: 'feature',
  initialState: { data: null },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { setData } = featureSlice.actions;
export default featureSlice.reducer;
```

```typescript
// In component
import { useDispatch, useSelector } from 'react-redux';
import { setData } from '@/store/slices/feature.slice';

function Component() {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.feature.data);
  
  const handleAction = () => {
    dispatch(setData(newData));
  };
}
```

#### Using Local State

```typescript
import { useState } from 'react';

function Component() {
  const [state, setState] = useState(initialValue);
  
  return (
    // Component JSX
  );
}
```

### API Integration

#### Using Services

```typescript
import { listingsService } from '@/api/services';

function Component() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      const result = await listingsService.getListingsInfinite(0, 20);
      if (!result.error) {
        setListings(result.data);
      }
    };
    fetchListings();
  }, []);

  return (
    // Component JSX
  );
}
```

#### Error Handling

```typescript
const result = await service.method();

if (result.error) {
  // Handle error
  console.error(result.error);
  // Show user-friendly message
  return;
}

// Use result.data
```

### Styling

#### Using NativeWind (Tailwind)

```typescript
import { View, Text } from 'react-native';

export default function Component() {
  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-xl font-bold text-gray-900">
        Hello World
      </Text>
    </View>
  );
}
```

#### Custom Styles

```typescript
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default function Component() {
  return <View style={styles.container} />;
}
```

### Navigation

#### Using Expo Router

```typescript
import { router } from 'expo-router';

// Navigate to screen
router.push('/product/123');

// Navigate back
router.back();

// Replace current screen
router.replace('/home');

// Get params
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams();
```

#### Deep Linking

```typescript
import * as Linking from 'expo-linking';

// Handle deep links
Linking.addEventListener('url', (event) => {
  const { path, queryParams } = Linking.parse(event.url);
  // Handle navigation
});
```

### Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- Component.test.tsx
```

#### Writing Tests

```typescript
// __tests__/Component.test.tsx
import { render, screen } from '@testing-library/react-native';
import Component from '@/components/Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
```

### Debugging

#### React Native Debugger

1. Install React Native Debugger
2. Start dev server: `npm start`
3. Open debugger: `Cmd+D` (iOS) or `Cmd+M` (Android)
4. Select "Debug"

#### Console Logging

```typescript
import { logger } from '@/utils/logger';

// Use logger instead of console.log
logger.info('Info message');
logger.error('Error message', error);
logger.warn('Warning message');
```

#### React DevTools

```bash
# Install React DevTools
npm install -g react-devtools

# Run
react-devtools
```

### Common Tasks

#### Adding a New Dependency

```bash
# Install
npm install package-name

# Install dev dependency
npm install -D package-name

# Update package-lock.json
npm install
```

#### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest
```

#### Code Formatting

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Environment Variables

#### Adding New Variables

1. **Add to `env.example`:**
   ```env
   EXPO_PUBLIC_NEW_VARIABLE=default_value
   ```

2. **Add to `.env`:**
   ```env
   EXPO_PUBLIC_NEW_VARIABLE=actual_value
   ```

3. **Use in code:**
   ```typescript
   const value = process.env.EXPO_PUBLIC_NEW_VARIABLE;
   ```

**Important:** All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

### Git Workflow

#### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/component-name` - Refactoring
- `docs/documentation-name` - Documentation

#### Commit Messages

Follow conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `refactor: improve code structure`
- `docs: update documentation`
- `style: format code`
- `test: add tests`

### Performance Optimization

#### Image Optimization

```typescript
import { Image } from 'expo-image';

// Use expo-image instead of Image from react-native
<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

#### List Optimization

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

#### Memoization

```typescript
import { useMemo, useCallback } from 'react';

// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### Troubleshooting

#### Common Issues

**Issue: Metro bundler cache problems**
```bash
# Clear cache and restart
npm start -- --clear
```

**Issue: Dependencies not installing**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: TypeScript errors**
```bash
# Check TypeScript version
npx tsc --version

# Run type check
npx tsc --noEmit
```

**Issue: Expo Go not connecting**
- Check firewall settings
- Ensure device and computer are on same network
- Try using tunnel: `npm start -- --tunnel`

**Issue: Build errors**
- Clear build cache: `expo start -c`
- Check environment variables
- Verify all dependencies are installed

### Best Practices

1. **Always use TypeScript types**
2. **Follow existing code patterns**
3. **Write descriptive commit messages**
4. **Test your changes before committing**
5. **Use services for API calls**
6. **Handle errors gracefully**
7. **Optimize images and lists**
8. **Keep components small and focused**
9. **Use meaningful variable names**
10. **Document complex logic**

### Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Supabase Documentation](https://supabase.com/docs)

### Getting Help

1. Check the [documentation](./README.md)
2. Review [API documentation](./API.md)
3. Check [architecture documentation](./ARCHITECTURE.md)
4. Search existing issues
5. Ask the development team

---

Happy coding! 🚀

