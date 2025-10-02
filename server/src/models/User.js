import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  // User preferences
  preferences: {
    defaultTone: {
      type: String,
      enum: ['Professional', 'Witty', 'Punchy', 'Neutral'],
      default: 'Professional'
    },
    defaultPlatforms: [{
      type: String,
      enum: ['Twitter', 'LinkedIn', 'Instagram']
    }],
    defaultHashtags: [String]
  },
  // Usage statistics
  stats: {
    totalGenerations: {
      type: Number,
      default: 0
    },
    lastGeneratedAt: Date
  }
}, {
  timestamps: true
});

// Additional indexes for efficient queries
userSchema.index({ createdAt: -1 });

// Update last login timestamp
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Increment generation count
userSchema.methods.incrementGenerations = function() {
  this.stats.totalGenerations += 1;
  this.stats.lastGeneratedAt = new Date();
  return this.save();
};

export const User = mongoose.model('User', userSchema);
