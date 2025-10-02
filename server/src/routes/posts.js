import express from 'express';
import { ensureAuthenticated } from '../config/passport.js';
import { Post } from '../models/Post.js';

const router = express.Router();

/**
 * GET /posts
 * Get user's post history
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 10, favorited } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { userId: req.user._id };
    if (favorited === 'true') {
      query['interactions.favorited'] = true;
    }
    
    // Get posts with pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await Post.countDocuments(query);
    
    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      error: 'Failed to fetch posts',
      message: error.message
    });
  }
});

/**
 * GET /posts/:id
 * Get specific post by ID
 */
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }
    
    res.json({ post });
    
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      error: 'Failed to fetch post',
      message: error.message
    });
  }
});

/**
 * POST /posts/:id/copy
 * Mark post as copied for a specific platform
 */
router.post('/:id/copy', ensureAuthenticated, async (req, res) => {
  try {
    const { platform } = req.body;
    
    if (!['Twitter', 'LinkedIn', 'Instagram'].includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform',
        message: 'Platform must be Twitter, LinkedIn, or Instagram'
      });
    }
    
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }
    
    await post.markAsCopied(platform);
    
    res.json({
      message: 'Post marked as copied',
      platform
    });
    
  } catch (error) {
    console.error('Error marking post as copied:', error);
    res.status(500).json({
      error: 'Failed to mark post as copied',
      message: error.message
    });
  }
});

/**
 * POST /posts/:id/favorite
 * Toggle favorite status of a post
 */
router.post('/:id/favorite', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }
    
    await post.toggleFavorite();
    
    res.json({
      message: post.interactions.favorited ? 'Post favorited' : 'Post unfavorited',
      favorited: post.interactions.favorited
    });
    
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      error: 'Failed to toggle favorite',
      message: error.message
    });
  }
});

/**
 * DELETE /posts/:id
 * Delete a post
 */
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }
    
    res.json({
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Failed to delete post',
      message: error.message
    });
  }
});

export { router as postsRoutes };
