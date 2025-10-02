import fetch from 'node-fetch';

export class OpenRouterService {
  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.preferFreeModels = process.env.OPENROUTER_PREFER_FREE === 'true';
    this.model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    this.appName = process.env.OPENROUTER_APP_NAME || 'Postify';
    this.siteUrl = process.env.OPENROUTER_SITE_URL || 'http://localhost:3001';
    this.freeModelsCache = null;
    this.cacheExpiry = null;
    this.maxRetries = parseInt(process.env.OPENROUTER_MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.OPENROUTER_RETRY_DELAY) || 1000; // ms
    this.modelHealthCache = new Map(); // Track model health
    this.healthCacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get free models from OpenRouter API with caching
   * @returns {Promise<Array>} List of free models
   */
  async getFreeModels() {
    // Check cache first (cache for 1 hour)
    const now = Date.now();
    if (this.freeModelsCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.freeModelsCache;
    }

    try {
      const models = await this.getAvailableModels();
      const freeModels = models.filter(model => {
        const pricing = model.pricing;
        return pricing && 
               (pricing.prompt === "0" || pricing.prompt === 0) && 
               (pricing.completion === "0" || pricing.completion === 0);
      });

      // Cache the results for 1 hour
      this.freeModelsCache = freeModels;
      this.cacheExpiry = now + (60 * 60 * 1000);

      console.log(`🆓 Found ${freeModels.length} free models on OpenRouter`);
      return freeModels;
    } catch (error) {
      console.error('❌ Error fetching free models:', error.message);
      return [];
    }
  }

  /**
   * Track model health based on success/failure
   * @param {string} modelId - Model ID
   * @param {boolean} success - Whether the request was successful
   */
  trackModelHealth(modelId, success) {
    const now = Date.now();
    const health = this.modelHealthCache.get(modelId) || {
      successCount: 0,
      failureCount: 0,
      lastFailure: null,
      consecutiveFailures: 0,
      lastUpdated: now
    };

    if (success) {
      health.successCount++;
      health.consecutiveFailures = 0;
    } else {
      health.failureCount++;
      health.consecutiveFailures++;
      health.lastFailure = now;
    }

    health.lastUpdated = now;
    this.modelHealthCache.set(modelId, health);

    // Clean up old entries
    this.cleanupHealthCache();
  }

  /**
   * Clean up old health cache entries
   */
  cleanupHealthCache() {
    const now = Date.now();
    for (const [modelId, health] of this.modelHealthCache.entries()) {
      if (now - health.lastUpdated > this.healthCacheExpiry) {
        this.modelHealthCache.delete(modelId);
      }
    }
  }

  /**
   * Check if a model is healthy (not recently failed)
   * @param {string} modelId - Model ID
   * @returns {boolean} Whether the model is considered healthy
   */
  isModelHealthy(modelId) {
    const health = this.modelHealthCache.get(modelId);
    if (!health) return true; // Unknown models are considered healthy

    const now = Date.now();
    const recentFailureThreshold = 2 * 60 * 1000; // 2 minutes
    const maxConsecutiveFailures = 3;

    // If model has too many consecutive failures, consider it unhealthy
    if (health.consecutiveFailures >= maxConsecutiveFailures) {
      return false;
    }

    // If model failed recently, consider it temporarily unhealthy
    if (health.lastFailure && (now - health.lastFailure) < recentFailureThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Get fallback chain of free models, ordered by health and preference
   * @returns {Promise<Array>} Ordered list of model IDs to try
   */
  async getFallbackChain() {
    const freeModels = await this.getFreeModels();
    
    if (freeModels.length === 0) {
      return [this.model]; // Fallback to configured model
    }

    // Prioritize models known to work well for text generation
    const preferredFreeModels = [
      'google/gemma-7b-it:free',
      'meta-llama/llama-3-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'openchat/openchat-7b:free',
      'nousresearch/nous-hermes-llama2-13b:free'
    ];

    // Create ordered list: preferred models first, then others
    const orderedModels = [];
    const availableModelIds = freeModels.map(m => m.id);

    // Add preferred models that are available and healthy
    for (const preferredModel of preferredFreeModels) {
      if (availableModelIds.includes(preferredModel) && this.isModelHealthy(preferredModel)) {
        orderedModels.push(preferredModel);
      }
    }

    // Add remaining healthy models
    for (const model of freeModels) {
      if (!orderedModels.includes(model.id) && this.isModelHealthy(model.id)) {
        orderedModels.push(model.id);
      }
    }

    // Add unhealthy models as last resort
    for (const model of freeModels) {
      if (!orderedModels.includes(model.id)) {
        orderedModels.push(model.id);
      }
    }

    // Always include configured model as final fallback
    if (!orderedModels.includes(this.model)) {
      orderedModels.push(this.model);
    }

    console.log(`🔄 Fallback chain: ${orderedModels.slice(0, 3).join(' → ')}${orderedModels.length > 3 ? ` → ... (${orderedModels.length} total)` : ''}`);
    return orderedModels;
  }

  /**
   * Select the best free model for text generation
   * @returns {Promise<string>} Model ID of the best free model
   */
  async selectBestFreeModel() {
    const fallbackChain = await this.getFallbackChain();
    
    if (fallbackChain.length === 0) {
      console.log('⚠️  No models available, using configured model');
      return this.model;
    }

    // Return the first (best) model from the fallback chain
    const selectedModel = fallbackChain[0];
    console.log(`🎯 Selected model: ${selectedModel}`);
    return selectedModel;
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate posts with fallback chain and retry logic
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated content
   */
  async generatePostsWithFallback({ articleData, tone, platforms, hashtags, cta }) {
    const fallbackChain = this.preferFreeModels 
      ? await this.getFallbackChain()
      : [this.model];

    let lastError = null;
    
    for (let i = 0; i < fallbackChain.length; i++) {
      const modelId = fallbackChain[i];
      
      try {
        console.log(`🔄 Trying model ${i + 1}/${fallbackChain.length}: ${modelId}`);
        
        const result = await this.generatePostsWithModel(modelId, {
          articleData, tone, platforms, hashtags, cta
        });
        
        // Track success
        this.trackModelHealth(modelId, true);
        console.log(`✅ Success with model: ${modelId}`);
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Track failure
        this.trackModelHealth(modelId, false);
        
        const isRateLimited = error.message.includes('429') || error.message.includes('rate limit');
        const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
        const isTemporaryError = isRateLimited || isOverloaded;
        
        console.log(`❌ Model ${modelId} failed: ${error.message}`);
        
        // If this is the last model in chain, don't retry
        if (i === fallbackChain.length - 1) {
          console.log('🚨 All models in fallback chain failed');
          break;
        }
        
        // Add delay before trying next model, especially for rate limits
        if (isTemporaryError) {
          const delay = this.retryDelay * (i + 1); // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before trying next model...`);
          await this.sleep(delay);
        }
        
        continue; // Try next model in chain
      }
    }
    
    // If we get here, all models failed
    throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Generate social media posts from article data
   * @param {Object} params - Generation parameters
   * @param {Object} params.articleData - Parsed article data
   * @param {string} params.tone - Tone for the posts
   * @param {Array} params.platforms - Target platforms
   * @param {Array} params.hashtags - User-provided hashtags
   * @param {string} params.cta - Call to action
   * @returns {Promise<Object>} Generated content
   */
  async generatePosts({ articleData, tone, platforms, hashtags, cta }) {
    try {
      console.log(`🤖 Generating posts for platforms: ${platforms.join(', ')} using OpenRouter`);

      // Use fallback chain for better reliability
      return await this.generatePostsWithFallback({
        articleData, tone, platforms, hashtags, cta
      });

    } catch (error) {
      console.error('❌ OpenRouter service error:', error.message);
      throw new Error(`OpenRouter generation failed: ${error.message}`);
    }
  }

  /**
   * Generate posts with a specific model (helper method for fallback)
   * @param {string} model - Model ID to use
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated content
   */
  async generatePostsWithModel(model, { articleData, tone, platforms, hashtags, cta }) {
    const prompt = this.buildPrompt({
      articleData,
      tone,
      platforms,
      hashtags,
      cta
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.siteUrl,
        'X-Title': this.appName,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated from OpenRouter');
    }

    const parsedContent = JSON.parse(content);
    
    // Validate the response structure
    if (!parsedContent.summary || !parsedContent.posts) {
      throw new Error('Invalid response structure from OpenRouter');
    }

    console.log(`✅ Successfully generated posts with OpenRouter using model: ${model}`);
    return parsedContent;
  }

  /**
   * Build the prompt for OpenRouter
   * @param {Object} params - Prompt parameters
   * @returns {string} Formatted prompt
   */
  buildPrompt({ articleData, tone, platforms, hashtags, cta }) {
    const hashtagsText = hashtags && hashtags.length > 0 
      ? `User-provided hashtags: ${hashtags.join(', ')}`
      : 'No specific hashtags provided';

    const ctaText = cta 
      ? `Call-to-action: ${cta}`
      : 'No specific call-to-action provided';

    return `
Article Information:
- Title: ${articleData.title}
- Source: ${articleData.siteName} (${articleData.url})
- Author: ${articleData.byline || 'Not specified'}
- Content: ${articleData.textContent}

Generation Requirements:
- Tone: ${tone}
- Target platforms: ${platforms.join(', ')}
- ${hashtagsText}
- ${ctaText}

Please generate engaging social media posts for the specified platforms based on this article.
    `.trim();
  }

  /**
   * Get the system prompt for OpenRouter
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `
You are a professional social media copywriter specializing in creating engaging, platform-specific content. Your task is to generate social media posts based on article content while maintaining accuracy and engagement.

CRITICAL REQUIREMENTS:
1. Preserve all facts from the source material - never fabricate or embellish information
2. Follow strict character limits and formatting for each platform
3. Match the requested tone while keeping content professional and engaging
4. Include relevant hashtags naturally within the content
5. Incorporate call-to-action when provided

PLATFORM SPECIFICATIONS:

Twitter:
- Maximum 280 characters (including hashtags and links)
- Concise, punchy, and engaging
- Use 1-3 relevant hashtags
- Include key insight or hook from the article

LinkedIn:
- 3-5 short, impactful lines
- Professional tone with personal insights
- Add 2-3 industry-relevant hashtags at the end
- Focus on business value or professional takeaways
- Use line breaks for readability

Instagram:
- Scannable caption with strategic line breaks
- Engaging opening hook
- 3-5 relevant hashtags integrated naturally
- Visual storytelling approach
- Include call-to-action if provided

TONE GUIDELINES:
- Professional: Authoritative, informative, business-focused
- Witty: Clever, humorous, engaging with wordplay
- Punchy: Direct, bold, attention-grabbing
- Neutral: Balanced, informative, straightforward

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence summary of the article's main points",
  "posts": {
    "twitter": "Twitter post content (if requested)",
    "linkedin": "LinkedIn post content (if requested)", 
    "instagram": "Instagram post content (if requested)"
  }
}

Only include platforms that were specifically requested. Ensure all content is factual, engaging, and platform-appropriate.
    `.trim();
  }

  /**
   * Get available models from OpenRouter
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching OpenRouter models:', error.message);
      return [];
    }
  }
}
