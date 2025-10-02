# 🔧 Google OAuth 400 Error Fix

## The Problem

You're getting a Google 400 "malformed request" error because the OAuth configuration is incomplete.

## Quick Fix

### 1. Update your `server/.env` file:

```env
# Add these lines to your server/.env file:
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Your existing config...
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/postify
SESSION_SECRET=your-session-secret
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 2. Get Google OAuth Credentials:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search "Google+ API" and enable it
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. **Copy the Client ID and Client Secret** to your `.env` file

### 3. Restart your server:

```bash
cd server
pnpm dev
```

## Expected Output

After fixing, you should see:

```
🔐 Configuring Google OAuth with callback: http://localhost:3001/auth/google/callback
✅ Google OAuth strategy configured successfully
```

## Test the Fix

1. Visit http://localhost:5173
2. Click "Sign in with Google"
3. Should redirect to Google's OAuth page instead of showing 400 error

## Common Issues

### Issue: Still getting 400 error

**Solution**: Make sure the redirect URI in Google Console exactly matches:
`http://localhost:3001/auth/google/callback`

### Issue: "redirect_uri_mismatch" error

**Solution**: The redirect URI in Google Console must match exactly. Check for:

- Extra spaces
- HTTP vs HTTPS
- Port number (3001)
- Trailing slashes

### Issue: "access_denied" error

**Solution**: Make sure Google+ API is enabled in Google Cloud Console

## Quick Test Command

```bash
# Test if credentials are loaded
cd server
node -e "
import dotenv from 'dotenv';
dotenv.config();
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'Using default');
"
```

This should fix your Google OAuth 400 error! 🎉
