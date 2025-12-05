# Deployment Instructions

This guide covers deployment procedures for the VintStreet application, including Supabase Edge Functions, EAS Builds, and environment configuration.

## Table of Contents

1. [Supabase CLI Installation](#supabase-cli-installation)
2. [Supabase Functions Deployment](#supabase-functions-deployment)
3. [EAS Build Setup](#eas-build-setup)
4. [Environment Configuration](#environment-configuration)
5. [App Store Submission](#app-store-submission)
6. [Troubleshooting](#troubleshooting)

## Supabase CLI Installation

### Windows

#### Option 1: Install via Scoop (Recommended)

**Step 1: Install Scoop (if not already installed)**
```powershell
# Open PowerShell as Administrator and run:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

**Step 2: Install Supabase CLI**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Step 3: Verify installation**
```bash
supabase --version
```

#### Option 2: Download Binary Directly

1. Go to https://github.com/supabase/cli/releases
2. Download the latest `supabase_windows_amd64.zip`
3. Extract and add to your PATH

#### Option 3: Use Docker (Alternative)

If you have Docker installed:
```bash
docker run --rm supabase/cli:latest functions deploy push
```

### macOS

**Using Homebrew:**
```bash
brew install supabase/tap/supabase
```

**Or download binary:**
1. Go to https://github.com/supabase/cli/releases
2. Download `supabase_darwin_amd64.tar.gz` (Intel) or `supabase_darwin_arm64.tar.gz` (Apple Silicon)
3. Extract and add to PATH

### Linux

**Using Homebrew:**
```bash
brew install supabase/tap/supabase
```

**Or download binary:**
1. Go to https://github.com/supabase/cli/releases
2. Download `supabase_linux_amd64.tar.gz`
3. Extract and add to PATH

## Supabase Functions Deployment

### Initial Setup

1. **Login to Supabase:**
   ```bash
   supabase login
   ```
   Or use the npm script:
   ```bash
   npm run supabase:login
   ```

2. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   Or use the npm script:
   ```bash
   npm run supabase:link
   ```
   
   You can find your project reference in your Supabase dashboard URL:
   `https://app.supabase.com/project/[project-ref]`

3. **Set environment secrets:**
   ```bash
   supabase secrets set EXPO_PUBLIC_ACCESS_TOKEN=your_token_here
   ```
   
   You can set multiple secrets:
   ```bash
   supabase secrets set KEY1=value1 KEY2=value2
   ```

### Deploy Functions

**Deploy all functions:**
```bash
supabase functions deploy
```

**Or use the npm script:**
```bash
npm run supabase:deploy
```

**Deploy a specific function:**
```bash
supabase functions deploy push
```

**Deploy with environment variables:**
```bash
supabase functions deploy push --env-file .env.production
```

### Verify Deployment

**List deployed functions:**
```bash
supabase functions list
```

**View function logs:**
```bash
supabase functions logs push
```

## EAS Build Setup

### Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure your project:**
   ```bash
   eas build:configure
   ```
   
   This creates/updates `eas.json` with build profiles.

### Build Profiles

The project includes three build profiles (defined in `eas.json`):

#### Development Build
- **Purpose:** Testing with development features
- **Distribution:** Internal
- **Android:** APK format
- **iOS:** Development client

**Build command:**
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

#### Preview Build
- **Purpose:** Testing before production
- **Distribution:** Internal
- **Android:** APK format
- **iOS:** Ad-hoc distribution

**Build command:**
```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

#### Production Build
- **Purpose:** App store submission
- **Distribution:** Store
- **Android:** App Bundle (AAB)
- **iOS:** Release configuration

**Build command:**
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Build for both platforms:**
```bash
eas build --platform all --profile production
```

### Build Configuration

The `eas.json` file contains build profiles. Key settings:

- **Development:** Includes development client, internal distribution
- **Preview:** Internal distribution for testing
- **Production:** Store distribution, optimized builds

### Environment Variables in EAS

Set environment variables for builds:

```bash
# Set for a specific build profile
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-url --type string

# Or set multiple secrets
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value your-key --type string
```

**View secrets:**
```bash
eas secret:list
```

**Update secrets:**
```bash
eas secret:update --name EXPO_PUBLIC_SUPABASE_URL --value new-value
```

### Local Builds (Optional)

For local builds, you need:
- **Android:** Android SDK and build tools
- **iOS:** Xcode (macOS only)

```bash
eas build --platform android --local
eas build --platform ios --local
```

## Environment Configuration

### Development Environment

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Fill in required variables:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
   EXPO_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
   EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_algolia_key
   ```

3. **Environment variables are automatically loaded** by Expo

### Production Environment

For production builds, set secrets in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value production-url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value production-key
# ... set all required variables
```

### Environment-Specific Builds

You can create environment-specific build profiles in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_ENV": "staging"
      }
    }
  }
}
```

## App Store Submission

### iOS App Store

1. **Build for production:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

3. **Or submit manually:**
   - Download the build from EAS
   - Use Transporter app or Xcode to upload

**Requirements:**
- Apple Developer account
- App Store Connect app created
- App icons and screenshots configured
- Privacy policy URL (if required)

### Google Play Store

1. **Build for production:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

3. **Or submit manually:**
   - Download the AAB file from EAS
   - Upload to Google Play Console

**Requirements:**
- Google Play Developer account
- Play Console app created
- App icons and screenshots configured
- Privacy policy URL (required)

### App Store Metadata

Update app metadata in `app.json`:

- App name, description
- Version numbers
- Bundle identifiers
- Icons and splash screens
- Permissions

## Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm install -g eas-cli
      - run: eas build --platform all --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Troubleshooting

### Supabase CLI Issues

**Issue: Command not found**
- Ensure Supabase CLI is in your PATH
- Verify installation: `supabase --version`
- Reinstall if necessary

**Issue: Authentication failed**
- Run `supabase login` again
- Check your Supabase account credentials
- Verify you have project access

**Issue: Function deployment fails**
- Check function code for errors
- Verify environment secrets are set
- Check function logs: `supabase functions logs push`
- Ensure project is linked: `supabase projects list`

**Issue: Project not linked**
- Run `supabase link --project-ref your-project-ref`
- Verify project reference is correct
- Check you have access to the project

### EAS Build Issues

**Issue: Build fails**
- Check build logs in EAS dashboard
- Verify environment variables are set
- Check `eas.json` configuration
- Ensure dependencies are up to date

**Issue: Missing credentials**
- iOS: Run `eas credentials` to set up certificates
- Android: EAS handles signing automatically
- Check credential status: `eas credentials`

**Issue: Environment variables not loading**
- Verify variables are prefixed with `EXPO_PUBLIC_`
- Check secrets are set: `eas secret:list`
- Rebuild after setting secrets

**Issue: App crashes on startup**
- Check environment variables are set correctly
- Verify API keys are valid
- Check app logs: `eas build:view`

### General Issues

**Issue: Can't find project reference**
- Check Supabase dashboard URL
- Project ref is in the URL: `app.supabase.com/project/[ref]`

**Issue: Function not updating**
- Clear function cache
- Redeploy: `supabase functions deploy push --no-verify-jwt`

**Issue: Build taking too long**
- Use `--local` flag for faster local builds (requires setup)
- Check EAS build queue status
- Consider upgrading EAS plan for faster builds

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

## Support

If you encounter issues not covered here:
1. Check the [troubleshooting section](#troubleshooting)
2. Review service-specific documentation
3. Check Expo and Supabase community forums
4. Contact the development team
