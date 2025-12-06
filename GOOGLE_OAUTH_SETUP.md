# Google OAuth Setup for Production Domain

## Current Configuration
- **Project ID**: `gomjfnkzhxqfmbwmaphz`
- **Production Domain**: `https://www.plernping.com`
- **Local Development**: `http://localhost:8080`

## Step-by-Step Setup

### 1. Configure Supabase Auth Settings

Go to: https://supabase.com/dashboard/project/gomjfnkzhxqfmbwmaphz/settings/auth

#### A. Set Site URL
- Navigate to **Authentication → Settings → Site URL**
- Set value to: `https://www.plernping.com/`
- Click **Save**

#### B. Add Redirect URLs
- Navigate to **Authentication → Settings → Redirect URLs**
- Add the following URLs (one per line):
  ```
  https://www.plernping.com/
  https://www.plernping.com/auth
  http://localhost:8080/
  http://localhost:8080/auth
  http://127.0.0.1:8080/
  http://127.0.0.1:8080/auth
  ```
- Click **Save**

### 2. Configure Google OAuth Provider

Go to: https://supabase.com/dashboard/project/gomjfnkzhxqfmbwmaphz/settings/auth/providers

#### A. Enable Google Provider
- Click on **Google** in the providers list
- Enable the provider (toggle ON)
- Fill in:
  - **Client ID**: (from Google Cloud Console)
  - **Client Secret**: (from Google Cloud Console)

#### B. If You Don't Have Google OAuth Credentials Yet
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   https://gomjfnkzhxqfmbwmaphz.supabase.co/auth/v1/callback?provider=google
   https://www.plernping.com/auth/v1/callback?provider=google
   ```
7. Copy **Client ID** and **Client Secret**
8. Paste into Supabase Google provider settings

### 3. Update Environment Variables (Optional)
If using custom env vars for Google OAuth:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 4. Deploy Functions
After configuration, deploy Supabase Edge Functions:
```bash
# Link project
npx supabase@latest link --project-ref gomjfnkzhxqfmbwmaphz

# Deploy all functions
npx supabase@latest functions deploy send-line
npx supabase@latest functions deploy contact
npx supabase@latest functions deploy booking
npx supabase@latest functions deploy pricing-chat
npx supabase@latest functions deploy quick-info
```

### 5. Test Local Development
Run dev server:
```bash
npm run dev
```

Then:
1. Navigate to `http://localhost:8080/auth`
2. Click "ดำเนินการต่อด้วย Google"
3. Complete Google login
4. Should redirect back and display user profile name

### 6. Test Production
Once deployed to `https://www.plernping.com`:
1. Navigate to `https://www.plernping.com/auth`
2. Click "ดำเนินการต่อด้วย Google"
3. Complete Google login
4. Should redirect back to `https://www.plernping.com/` and display profile

## Troubleshooting

**Issue**: "redirect_uri_mismatch" error
- **Solution**: Ensure the exact redirect URL (with trailing slash) is registered in both Supabase AND Google Cloud Console

**Issue**: User not showing in header after login
- **Solution**: Check browser console for errors; ensure `profiles` table exists and has write permissions

**Issue**: CORS errors on function calls
- **Solution**: Verify `send-line`, `contact` functions have proper CORS headers (already configured)

## Current Code Status
- ✅ Auth.tsx: Google OAuth configured with production domain fallback
- ✅ useAuth.tsx: Profiles upserted with OAuth user metadata (display_name, avatar_url)
- ✅ Header.tsx: Shows user profile name and avatar when logged in
- ✅ Supabase functions: CORS headers configured correctly

## Next Steps
1. Configure Supabase site URL and redirect URLs (steps 1-2 above)
2. Get Google OAuth credentials from Google Cloud Console (if not already done)
3. Enter credentials in Supabase Dashboard
4. Deploy functions using commands in step 4
5. Test local and production flows
