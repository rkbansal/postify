import express from 'express';
import { isDatabaseConnected } from '../config/database.js';
import { ensureAuthenticated } from '../config/passport.js';
import { Post } from '../models/Post.js';
import { ArticleService } from '../services/articleService.js';
import { OpenAIService } from '../services/openaiService.js';
import { validateGenerateRequest } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /api/generate
 * Generate social media posts from a URL
 */
router.post('/generate', ensureAuthenticated, async (req, res) => {
  try {
    // Validate request body
    const validation = validateGenerateRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.errors
      });
    }

    const { url, tone, platforms, hashtags, cta } = req.body;

    console.log(`📝 Processing request for URL: ${url}`);

    // Step 1: Fetch and parse article
    const articleService = new ArticleService();
    const articleData = await articleService.parseArticle(url);

    if (!articleData) {
      return res.status(400).json({
        error: 'Failed to parse article from URL',
        message: 'Please ensure the URL is accessible and contains readable content'
      });
    }

    // Step 2: Generate posts using OpenAI
    const openaiService = new OpenAIService();
    const generatedContent = await openaiService.generatePosts({
      articleData,
      tone,
      platforms,
      hashtags,
      cta
    });

    // Step 3: Save to database (user is guaranteed to be authenticated)
    let postId = null;
    if (isDatabaseConnected()) {
      try {
        const post = new Post({
          userId: req.user._id,
          article: {
            url: articleData.url,
            title: articleData.title,
            source: {
              site: articleData.siteName,
              author: articleData.byline
            },
            summary: generatedContent.summary
          },
          parameters: {
            tone,
            platforms,
            hashtags,
            cta
          },
          generatedPosts: generatedContent.posts
        });
        
        const savedPost = await post.save();
        postId = savedPost._id;
        
        // Update user stats
        await req.user.incrementGenerations();
        
        console.log(`💾 Post saved to database with ID: ${postId}`);
      } catch (dbError) {
        console.error('⚠️  Failed to save post to database:', dbError.message);
        // Continue without failing the request
      }
    }

    // Step 4: Return response
    const response = {
      id: postId,
      title: articleData.title,
      source: {
        url: articleData.url,
        site: articleData.siteName,
        author: articleData.byline
      },
      summary: generatedContent.summary,
      posts: generatedContent.posts,
      savedToHistory: !!postId
    };

    console.log(`✅ Successfully generated posts for ${platforms.length} platform(s)`);
    res.json(response);

  } catch (error) {
    console.error('Error in /generate endpoint:', error);
    
    // Handle specific error types
    if (error.message.includes('fetch')) {
      return res.status(400).json({
        error: 'Failed to fetch URL',
        message: 'Please check that the URL is accessible and try again'
      });
    }
    
    if (error.message.includes('OpenAI')) {
      return res.status(500).json({
        error: 'AI service error',
        message: 'Failed to generate posts. Please try again later.'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
});

export { router as generatePostsRoute };
