import OpenAI from 'openai';

export class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = 'gpt-4o-mini';
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
      console.log(`🤖 Generating posts for platforms: ${platforms.join(', ')}`);

      const prompt = this.buildPrompt({
        articleData,
        tone,
        platforms,
        hashtags,
        cta
      });

      const response = await this.openai.chat.completions.create({
        model: this.model,
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
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      const parsedContent = JSON.parse(content);
      
      // Validate the response structure
      if (!parsedContent.summary || !parsedContent.posts) {
        throw new Error('Invalid response structure from OpenAI');
      }

      console.log('✅ Successfully generated posts with OpenAI');
      return parsedContent;

    } catch (error) {
      console.error('❌ OpenAI service error:', error.message);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  /**
   * Build the prompt for OpenAI
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
   * Get the system prompt for OpenAI
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
}
