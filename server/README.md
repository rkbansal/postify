# Postify Server

Express.js backend API for the Postify URL-to-Post generator.

## Tech Stack

- **Node.js** with Express.js
- **OpenAI API** (GPT-4o-mini) for content generation
- **Mozilla Readability** for article parsing
- **JSDOM** for HTML processing
- **Express Rate Limit** for API protection

## Development

```bash
# Install dependencies
pnpm install

# Start development server (with auto-reload)
pnpm dev

# Start production server
pnpm start
```

## Environment Variables

Create a `.env` file:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Rate Limiting Configuration
RATE_LIMIT_RPM=10

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
# Development: All localhost ports automatically allowed
# Production: Specify allowed origins (comma-separated)
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### POST /api/generate

Generate social media posts from a URL.

**Request:**

```json
{
  "url": "https://example.com/article",
  "tone": "Professional",
  "platforms": ["Twitter", "LinkedIn"],
  "hashtags": ["tech", "innovation"],
  "cta": "Read more"
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
  "summary": "Article summary...",
  "posts": {
    "twitter": "Twitter post content...",
    "linkedin": "LinkedIn post content..."
  }
}
```

### GET /health

Health check endpoint for monitoring.

## Deployment

### Railway

1. Connect GitHub repository
2. Set root directory to `server`
3. Configure environment variables
4. Deploy automatically

### Render

1. Create new Web Service
2. Connect repository with root directory `server`
3. Set build command: `pnpm install`
4. Set start command: `pnpm start`
5. Configure environment variables

## Architecture

```
src/
├── index.js              # Main server file
├── routes/
│   └── generate.js       # API routes
├── services/
│   ├── articleService.js # Article parsing logic
│   └── openaiService.js  # OpenAI integration
└── utils/
    └── validation.js     # Request validation
```

## Rate Limiting

- Default: 10 requests per minute per IP
- Configurable via `RATE_LIMIT_RPM` environment variable
- Returns 429 status code when exceeded

## CORS Configuration

The server includes flexible CORS support:

### Development Mode

- **Automatic localhost support**: All `localhost` and `127.0.0.1` ports are automatically allowed
- No need to specify exact ports - works with any development server port
- Supports both HTTP and HTTPS localhost connections

### Production Mode

- **Explicit origin control**: Only specified origins in `CLIENT_URL` are allowed
- **Multiple origins**: Comma-separated list supported
- **Secure by default**: Rejects unauthorized origins

### Examples

```env
# Single origin
CLIENT_URL=https://your-app.vercel.app

# Multiple origins
CLIENT_URL=https://your-app.vercel.app,https://custom-domain.com,https://staging.your-app.com
```

## Error Handling

- Comprehensive error handling for all endpoints
- Detailed error messages in development
- Sanitized error responses in production
- Proper HTTP status codes
