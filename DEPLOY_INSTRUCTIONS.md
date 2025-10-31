# Supabase CLI Installation for Windows

## Option 1: Install via Scoop (Recommended)

### Step 1: Install Scoop (if not already installed)
```powershell
# Open PowerShell as Administrator and run:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Step 2: Install Supabase CLI
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 3: Verify installation
```bash
supabase --version
```

## Option 2: Download Binary Directly

1. Go to https://github.com/supabase/cli/releases
2. Download the latest `supabase_windows_amd64.zip`
3. Extract and add to your PATH

## Option 3: Use Docker (Alternative)

If you have Docker installed:
```bash
docker run --rm supabase/cli:latest functions deploy push
```

## After Installation

Once Supabase CLI is installed, you can use these commands:

1. **Login to Supabase:**
   ```bash
   supabase login
   ```

2. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Set environment secrets:**
   ```bash
   supabase secrets set EXPO_PUBLIC_ACCESS_TOKEN=your_token_here
   ```

4. **Deploy your function:**
   ```bash
   supabase functions deploy
   ```

   Or use the npm script:
   ```bash
   npm run supabase:deploy
   ```

## Troubleshooting

If you encounter issues:
- Make sure you're using the latest version: `supabase update`
- Check your Supabase project is linked: `supabase projects list`
- Verify your function exists: `supabase functions list`

