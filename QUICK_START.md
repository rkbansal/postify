# 🚀 Quick Start Guide

## ✅ Issues Fixed

- **MongoDB connection**: Fixed deprecated buffer options
- **Duplicate indexes**: Removed duplicate schema indexes
- **Missing OAuth credentials**: Added graceful handling for missing Google OAuth credentials
- **Server startup**: Enhanced error handling and status reporting

## 🏃‍♂️ Quick Start (Without Authentication)

If you want to test the app quickly without setting up Google OAuth:

```bash
# 1. Start MongoDB (if not running)
brew services start mongodb/brew/mongodb-community  # macOS
# or
sudo systemctl start mongod  # Linux

# 2. Start the server
cd server
pnpm dev

# 3. Start the client (in another terminal)
cd client
pnpm dev

# 4. Visit http://localhost:5173
```

The app will work without authentication - posts just won't be saved to history.

## 🔐 Full Setup (With Authentication)

### 1. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3001/auth/google/callback`

### 2. Configure Environment

Edit `server/.env`:

```env
# Required for basic functionality
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/postify

# Required for authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional (has defaults)
SESSION_SECRET=your-session-secret
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Start Services

```bash
# Terminal 1 - Server
cd server
pnpm dev

# Terminal 2 - Client
cd client
pnpm dev
```

## 🔍 Troubleshooting

### Server Won't Start

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Check environment variables
cd server
cat .env

# Check for missing dependencies
pnpm install
```

### Authentication Issues

- Verify Google OAuth credentials in `.env`
- Check redirect URI matches exactly
- Ensure Google+ API is enabled

### Database Issues

- Ensure MongoDB is running locally
- Check connection string format
- Verify database permissions

## 📊 Health Check

Visit http://localhost:3001/health to see system status:

```json
{
  "status": "OK",
  "database": {
    "status": "connected"
  },
  "authentication": {
    "googleOAuth": true,
    "configured": true
  }
}
```

## 🎯 What Works Now

✅ **MongoDB connection** - Fixed and working  
✅ **Server startup** - No more OAuth errors  
✅ **Graceful degradation** - Works with/without auth  
✅ **Better error messages** - Clear status reporting  
✅ **Post generation** - Works for anonymous users  
✅ **User authentication** - When OAuth is configured  
✅ **Post history** - When authenticated

## 🚀 Ready to Go!

Your Postify application is now properly configured and should start without errors. The server will automatically detect what features are available and configure itself accordingly.

**Happy posting! 🎉**
