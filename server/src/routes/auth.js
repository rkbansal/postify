import express from 'express';
import passport from 'passport';
import { ensureAuthenticated } from '../config/passport.js';

const router = express.Router();

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173'
  }),
  (req, res) => {
    // Successful authentication
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}?auth=success`);
  }
);

/**
 * GET /auth/user
 * Get current authenticated user
 */
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
        preferences: req.user.preferences,
        stats: req.user.stats
      }
    });
  } else {
    res.status(401).json({
      error: 'Not authenticated',
      user: null
    });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed',
        message: err.message
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Session destruction failed',
          message: err.message
        });
      }
      
      res.json({
        message: 'Logged out successfully'
      });
    });
  });
});

/**
 * PUT /auth/preferences
 * Update user preferences
 */
router.put('/preferences', ensureAuthenticated, async (req, res) => {
  try {
    const { defaultTone, defaultPlatforms, defaultHashtags } = req.body;
    
    // Validate input
    const validTones = ['Professional', 'Witty', 'Punchy', 'Neutral'];
    const validPlatforms = ['Twitter', 'LinkedIn', 'Instagram'];
    
    if (defaultTone && !validTones.includes(defaultTone)) {
      return res.status(400).json({
        error: 'Invalid tone',
        message: `Tone must be one of: ${validTones.join(', ')}`
      });
    }
    
    if (defaultPlatforms && !Array.isArray(defaultPlatforms)) {
      return res.status(400).json({
        error: 'Invalid platforms',
        message: 'Platforms must be an array'
      });
    }
    
    if (defaultPlatforms) {
      const invalidPlatforms = defaultPlatforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        return res.status(400).json({
          error: 'Invalid platforms',
          message: `Invalid platforms: ${invalidPlatforms.join(', ')}`
        });
      }
    }
    
    // Update preferences
    const updateData = {};
    if (defaultTone) updateData['preferences.defaultTone'] = defaultTone;
    if (defaultPlatforms) updateData['preferences.defaultPlatforms'] = defaultPlatforms;
    if (defaultHashtags) updateData['preferences.defaultHashtags'] = defaultHashtags;
    
    const user = await req.user.updateOne(updateData);
    
    // Fetch updated user
    const updatedUser = await req.user.constructor.findById(req.user._id);
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });
    
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: error.message
    });
  }
});

export { router as authRoutes };
