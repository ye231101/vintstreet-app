# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Build for production with EAS

[EAS Build](https://docs.expo.dev/build/introduction/) is a cloud build service that makes it easy to create production builds for iOS and Android.

1. Install EAS CLI globally

   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account

   ```bash
   eas login
   ```

3. Configure your project for EAS Build

   ```bash
   eas build:configure
   ```

4. Run a build

   For Android:
   ```bash
   eas build --platform android
   ```

   For iOS:
   ```bash
   eas build --platform ios
   ```

   For both platforms:
   ```bash
   eas build --platform all
   ```

You can also create builds for different environments:

**Development builds** (for testing with development features):
```bash
# Android
eas build --platform android --profile development

# iOS
eas build --platform ios --profile development

# Both platforms
eas build --platform all --profile development
```

**Preview builds** (for testing before production):
```bash
# Android
eas build --platform android --profile preview

# iOS
eas build --platform ios --profile preview

# Both platforms
eas build --platform all --profile preview
```

**Production builds** (for app store submission):
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Both platforms
eas build --platform all --profile production
```

Learn more about [EAS Build profiles](https://docs.expo.dev/build/eas-json/) and [submitting to app stores](https://docs.expo.dev/submit/introduction/).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
