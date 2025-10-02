# 🔐 Postify Setup Guide with Authentication

Complete setup guide for Postify with Google OAuth and MongoDB integration.

## 🚀 New Features Added

✅ **Google OAuth Authentication**  
✅ **MongoDB Database Integration**  
✅ **User Profiles & Preferences**  
✅ **Post History & Favorites**  
✅ **Usage Statistics**  
✅ **Persistent Sessions**

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MongoDB (local installation or MongoDB Atlas)
- OpenAI API key
- Google Cloud Console account

## 🛠️ Setup Instructions

### 1. Database Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community  # macOS
# or follow MongoDB installation guide for your OS

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Whitelist your IP address

### 2. Google OAuth Setup

1. **Go to Google Cloud Console**

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable APIs**

   - Go to "APIs & Services" > "Library"
   - Search and enable "Google+ API"

3. **Create OAuth Credentials**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3001/auth/google/callback`
     - Production: `https://your-domain.com/auth/google/callback`

4. **Save Credentials**
   - Copy Client ID and Client Secret
   - You'll need these for environment variables

### 3. Environment Configuration

#### Server Environment

```bash
cd server
cp env.example .env
```

Edit `server/.env`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/postify
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/postify

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_from_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
GOOGLE_CALLBACK_URL=/auth/google/callback

# Session Configuration (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Rate Limiting Configuration
RATE_LIMIT_RPM=10

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

#### Client Environment

```bash
cd client
cp env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:3001
```

### 4. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Or install individually
cd server && pnpm install
cd ../client && pnpm install
```

### 5. Start the Application

#### Option 1: Start Both Services

```bash
# From root directory
pnpm dev
```

#### Option 2: Start Separately

```bash
# Terminal 1 - Server
cd server
pnpm dev

# Terminal 2 - Client
cd client
pnpm dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Google Login**: http://localhost:3001/auth/google

## 🔐 Authentication Flow

1. **User clicks "Sign in with Google"**
2. **Redirected to Google OAuth**
3. **User authorizes the application**
4. **Redirected back with authentication**
5. **User profile created/updated in MongoDB**
6. **Session established with secure cookies**

## 📊 New API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout user
- `PUT /auth/preferences` - Update user preferences

### Posts Management

- `GET /api/posts` - Get user's post history
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts/:id/copy` - Mark post as copied
- `POST /api/posts/:id/favorite` - Toggle favorite
- `DELETE /api/posts/:id` - Delete post

### Enhanced Generate Endpoint

- `POST /api/generate` - Generate posts (now saves to history if authenticated)

## 🎯 New Frontend Features

### Header with Authentication

- User avatar and name display
- Generation statistics
- Quick access to history and settings
- Logout functionality

### Post History Modal

- View all generated posts
- Filter by favorites
- Copy posts to clipboard
- Delete unwanted posts
- Pagination support

### User Preferences

- Default tone selection
- Default platforms
- Default hashtags
- Automatic form population

### Enhanced Generation

- Posts automatically saved to history
- User statistics updated
- Visual feedback for saved posts

## 🚀 Deployment Updates

### Environment Variables for Production

#### Server (Railway/Render)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/postify
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_CALLBACK_URL=/auth/google/callback
SESSION_SECRET=super-secure-random-string-for-production
CLIENT_URL=https://your-frontend-domain.vercel.app
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

#### Client (Vercel)

```env
VITE_API_URL=https://your-backend-domain.railway.app
```

### Google OAuth Production Setup

1. Add production callback URL to Google Console
2. Update authorized domains
3. Verify redirect URIs match exactly

## 🧪 Testing the Setup

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Should return database and authentication status.

### 2. Test Authentication

1. Visit http://localhost:5173
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify user appears in header

### 3. Test Post Generation

1. Generate a post while logged in
2. Check that it's saved to history
3. Verify user statistics update

### 4. Test Post History

1. Click on post history in header
2. Verify posts are displayed
3. Test copy, favorite, and delete functions

## 🔧 Troubleshooting

### Database Connection Issues

- Verify MongoDB is running locally
- Check MongoDB Atlas IP whitelist
- Verify connection string format

### Google OAuth Issues

- Check redirect URIs match exactly
- Verify Google+ API is enabled
- Check client ID and secret are correct

### Session Issues

- Verify SESSION_SECRET is set
- Check MongoDB connection for session store
- Clear browser cookies if needed

### CORS Issues

- Verify CLIENT_URL matches frontend domain
- Check that credentials are included in requests

## 📈 Database Schema

### Users Collection

```javascript
{
  googleId: String,
  email: String,
  name: String,
  picture: String,
  preferences: {
    defaultTone: String,
    defaultPlatforms: [String],
    defaultHashtags: [String]
  },
  stats: {
    totalGenerations: Number,
    lastGeneratedAt: Date
  },
  createdAt: Date,
  lastLoginAt: Date
}
```

### Posts Collection

```javascript
{
  userId: ObjectId,
  article: {
    url: String,
    title: String,
    source: { site: String, author: String },
    summary: String
  },
  parameters: {
    tone: String,
    platforms: [String],
    hashtags: [String],
    cta: String
  },
  generatedPosts: {
    twitter: String,
    linkedin: String,
    instagram: String
  },
  interactions: {
    copied: [{ platform: String, copiedAt: Date }],
    favorited: Boolean,
    favoritedAt: Date
  },
  createdAt: Date
}
```

## 🎉 You're All Set!

Your Postify application now includes:

- ✅ Secure Google OAuth authentication
- ✅ MongoDB data persistence
- ✅ User profiles and preferences
- ✅ Complete post history management
- ✅ Enhanced user experience
- ✅ Production-ready deployment

**Happy posting with authentication! 🚀**
