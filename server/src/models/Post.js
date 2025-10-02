import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Original article data
  article: {
    url: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    source: {
      site: String,
      author: String
    },
    summary: String
  },
  // Generation parameters
  parameters: {
    tone: {
      type: String,
      enum: ['Professional', 'Witty', 'Punchy', 'Neutral'],
      required: true
    },
    platforms: [{
      type: String,
      enum: ['Twitter', 'LinkedIn', 'Instagram']
    }],
    hashtags: [String],
    cta: String
  },
  // Generated content
  generatedPosts: {
    twitter: String,
    linkedin: String,
    instagram: String
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  // User interactions
  interactions: {
    copied: [{
      platform: {
        type: String,
        enum: ['Twitter', 'LinkedIn', 'Instagram']
      },
      copiedAt: {
        type: Date,
        default: Date.now
      }
    }],
    favorited: {
      type: Boolean,
      default: false
    },
    favoritedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ 'article.url': 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'interactions.favorited': 1 });

// Mark as copied
postSchema.methods.markAsCopied = function(platform) {
  this.interactions.copied.push({
    platform,
    copiedAt: new Date()
  });
  return this.save();
};

// Toggle favorite status
postSchema.methods.toggleFavorite = function() {
  this.interactions.favorited = !this.interactions.favorited;
  this.interactions.favoritedAt = this.interactions.favorited ? new Date() : null;
  return this.save();
};

export const Post = mongoose.model('Post', postSchema);
