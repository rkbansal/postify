# Postify - URL to Social Media Post Generator

Transform any article URL into engaging, platform-specific social media posts using AI.

## 🚀 Features

- **Smart Article Parsing**: Extracts clean content from any web article using Mozilla Readability
- **AI-Powered Generation**: Uses OpenAI GPT-4o-mini to create engaging, platform-specific posts
- **Multi-Platform Support**: Generate posts for Twitter, LinkedIn, and Instagram
- **Google OAuth Authentication**: Secure login with Google accounts
- **User Profiles & Preferences**: Save default settings and track usage statistics
- **Post History**: View, favorite, and manage all your generated posts
- **MongoDB Integration**: Persistent data storage for users and posts
- **Customizable Tone**: Choose from Professional, Witty, Punchy, or Neutral tones
- **Hashtag Integration**: Add custom hashtags to your posts
- **Call-to-Action Support**: Include custom CTAs in generated content
- **Modern UI**: Clean, responsive interface built with Mantine UI
- **Rate Limited**: Built-in API protection with configurable rate limiting

## 🏗️ Architecture

```
Postify/
├── client/          # React frontend (Vite + Mantine)
├── server/          # Express.js backend
└── README.md        # This file
```

### Frontend Stack

- **React 19** with TypeScript
- **Mantine UI** for components
- **Vite** for build tooling
- **Tabler Icons** for iconography

### Backend Stack

- **Node.js** with Express
- **MongoDB** with Mongoose for data persistence
- **Google OAuth 2.0** with Passport.js for authentication
- **OpenAI API** (GPT-4o-mini)
- **Mozilla Readability** for article parsing
- **JSDOM** for HTML processing
- **Express Rate Limit** for API protection
- **Express Session** with MongoDB store

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MongoDB (local or MongoDB Atlas)
- OpenAI API key
- Google OAuth credentials (for authentication)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Postify

# Install client dependencies
cd client
pnpm install

# Install server dependencies
cd ../server
pnpm install
```

### 2. Environment Configuration

#### Server Environment

```bash
cd server
cp env.example .env
```

Edit `.env` with your configuration:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Rate Limiting Configuration
RATE_LIMIT_RPM=10

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (for development)
CLIENT_URL=http://localhost:5173
```

#### Client Environment (Optional)

```bash
cd client
cp env.example .env
```

Edit `.env` if needed:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
```

### 3. Development

Start both services in development mode:

```bash
# Terminal 1 - Start the server
cd server
pnpm dev

# Terminal 2 - Start the client
cd client
pnpm dev
```

The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📡 API Reference

### POST /api/generate

Generate social media posts from a URL.

**Request Body:**

```json
{
  "url": "https://example.com/article",
  "tone": "Professional",
  "platforms": ["Twitter", "LinkedIn", "Instagram"],
  "hashtags": ["tech", "innovation"],
  "cta": "Read more at example.com"
}
```

**Response:**

```json
{
  "title": "Article Title",
  "source": {
    "url": "https://example.com/article",
    "site": "Example.com",
    "author": "John Doe"
  },
  "summary": "Brief summary of the article...",
  "posts": {
    "twitter": "Engaging Twitter post ≤280 chars #tech",
    "linkedin": "Professional LinkedIn post with insights...",
    "instagram": "Visual Instagram caption with hashtags..."
  }
}
```

**Parameters:**

- `url` (required): Valid HTTP/HTTPS URL
- `tone` (required): One of "Professional", "Witty", "Punchy", "Neutral"
- `platforms` (required): Array of "Twitter", "LinkedIn", "Instagram"
- `hashtags` (optional): Array of hashtag strings
- `cta` (optional): Call-to-action string (≤100 chars)

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Build Settings**:

   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
   - Root Directory: `client`

3. **Environment Variables**:

   ```
   VITE_API_URL=https://your-backend-url.com
   ```

4. **Deploy**: Vercel will automatically deploy on push to main

### Backend Deployment Options

#### Option 1: Railway

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Configure Service**:

   - Root Directory: `server`
   - Start Command: `pnpm start`
   - Health Check Path: `/health`

3. **Environment Variables**:
   ```
   OPENAI_API_KEY=your_key_here
   RATE_LIMIT_RPM=10
   CLIENT_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

#### Option 2: Render

1. **Create Web Service**: Connect your GitHub repo
2. **Configure Build**:

   - Root Directory: `server`
   - Build Command: `pnpm install`
   - Start Command: `pnpm start`

3. **Environment Variables**: Same as Railway above

## 🔧 Configuration

### Rate Limiting

Configure API rate limiting in your environment:

- `RATE_LIMIT_RPM`: Requests per minute per IP (default: 10)

### OpenAI Settings

The application uses GPT-4o-mini for optimal cost/performance balance. To modify:

1. Edit `server/src/services/openaiService.js`
2. Change the `model` property

### CORS Configuration

- **Development**: All localhost ports automatically allowed (no configuration needed)
- **Production**: Set `CLIENT_URL` to your frontend domain(s)
- **Multiple domains**: Use comma-separated values in `CLIENT_URL`

## 🧪 Testing

### Manual Testing

1. Start both client and server
2. Navigate to http://localhost:5173
3. Enter a valid article URL (e.g., from TechCrunch, Medium, etc.)
4. Select tone and platforms
5. Click "Generate Posts"

### Health Check

```bash
curl http://localhost:3001/health
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all request parameters
- **CORS Protection**: Configurable origin restrictions
- **Helmet**: Security headers for Express
- **Environment Variables**: Sensitive data protection

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch URL"**

- Ensure the URL is publicly accessible
- Check if the site blocks automated requests
- Verify URL format (must include http/https)

**"OpenAI API Error"**

- Verify your OpenAI API key is valid
- Check your OpenAI account has sufficient credits
- Ensure API key has proper permissions

**CORS Errors**

- Update `CLIENT_URL` environment variable
- Check that both services are running
- Verify port configurations

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the API documentation
3. Open an issue on GitHub

---

**Built with ❤️ using React, Express, and OpenAI**
