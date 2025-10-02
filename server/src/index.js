import MongoStore from 'connect-mongo';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import passport from 'passport';

// Import routes
import { authRoutes } from './routes/auth.js';
import { generatePostsRoute } from './routes/generate.js';
import { postsRoutes } from './routes/posts.js';

// Import configurations
import { connectDatabase, getDatabaseStatus } from './config/database.js';
import { configurePassport } from './config/passport.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and authentication
const initializeApp = async () => {
  console.log('🚀 Initializing app');
  
  // Connect to database
  const dbConnected = await connectDatabase();
  
  // Configure Passport (only if database is connected)
  let authConfigured = false;
  if (dbConnected) {
    authConfigured = configurePassport();
  }
  
  return { dbConnected, authConfigured };
};

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost ports
    if (process.env.NODE_ENV === 'development') {
      const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
      const localhostIPRegex = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;
      
      if (localhostRegex.test(origin) || localhostIPRegex.test(origin)) {
        return callback(null, true);
      }
    }
    
    // In production or for specific origins, check against CLIENT_URL
    const allowedOrigins = process.env.CLIENT_URL 
      ? process.env.CLIENT_URL.split(',').map(url => url.trim())
      : ['http://localhost:5173'];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Reject the request
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_RPM) || 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }) : undefined,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const hasOAuthCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    authentication: {
      googleOAuth: hasOAuthCredentials,
      sessionStore: !!process.env.MONGODB_URI,
      configured: dbStatus.status === 'connected' && hasOAuthCredentials
    }
  });
});

// Authentication routes
app.use('/auth', authRoutes);

// API routes
app.use('/api', generatePostsRoute);
app.use('/api/posts', postsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database and authentication
    const { dbConnected, authConfigured } = await initializeApp();
    
    app.listen(PORT, () => {
      console.log(`🚀 Postify server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/generate`);
      
      if (dbConnected && authConfigured) {
        console.log(`🔐 Authentication: http://localhost:${PORT}/auth/google`);
        console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);
      } else if (dbConnected && !authConfigured) {
        console.log(`⚠️  Database connected but authentication disabled (missing OAuth credentials)`);
        console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);
      } else {
        console.log(`⚠️  Running without database - authentication disabled`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
