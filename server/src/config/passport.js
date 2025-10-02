import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

/**
 * Configure Passport with Google OAuth strategy
 */
export const configurePassport = () => {
  // Check if Google OAuth credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not found. Authentication will be disabled.');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file to enable authentication.');
    return false;
  }

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
  // Google OAuth Strategy
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production' 
      ? `${process.env.SERVER_URL || 'https://your-domain.com'}/auth/google/callback`
      : 'http://localhost:3001/auth/google/callback');
  
  console.log('🔐 Configuring Google OAuth with callback:', callbackURL);
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Google OAuth callback received for:', profile.emails[0].value);
      
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // Update existing user's last login
        await user.updateLastLogin();
        console.log('👤 Existing user logged in:', user.email);
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value || '',
        preferences: {
          defaultTone: 'Professional',
          defaultPlatforms: ['Twitter'],
          defaultHashtags: []
        }
      });
      
      await user.save();
      console.log('✨ New user created:', user.email);
      
      return done(null, user);
      
    } catch (error) {
      console.error('❌ Error in Google OAuth strategy:', error);
      return done(error, null);
    }
  }));

  console.log('✅ Google OAuth strategy configured successfully');
  return true;
};

/**
 * Middleware to ensure user is authenticated
 */
export const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Return JSON error for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  // Redirect to login for web routes
  res.redirect('/auth/google');
};

/**
 * Middleware for optional authentication (doesn't block if not authenticated)
 */
export const optionalAuth = (req, res, next) => {
  // User is available in req.user if authenticated, null otherwise
  next();
};
