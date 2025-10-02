import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export class ArticleService {
  constructor() {
    this.maxTextLength = 4000; // Limit text to ~4000 chars for OpenAI
  }

  /**
   * Fetch and parse article content from URL
   * @param {string} url - The URL to parse
   * @returns {Promise<Object|null>} Parsed article data or null if failed
   */
  async parseArticle(url) {
    try {
      console.log(`🔍 Fetching article from: ${url}`);

      // Validate URL format
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Fetch the HTML content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Postify/1.0; +https://postify.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      if (!html || html.trim().length === 0) {
        throw new Error('Empty response from URL');
      }

      // Parse HTML with JSDOM
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      // Use Readability to extract clean content
      const reader = new Readability(document);
      const article = reader.parse();

      if (!article) {
        console.warn('⚠️ Readability failed to parse article, trying fallback extraction');
        return this.fallbackExtraction(document, url);
      }

      // Extract and clean the content
      const cleanedData = this.processArticleData(article, url);
      
      console.log(`📄 Successfully parsed article: "${cleanedData.title}"`);
      return cleanedData;

    } catch (error) {
      console.error('❌ Error parsing article:', error.message);
      return null;
    }
  }

  /**
   * Process and clean article data from Readability
   * @param {Object} article - Raw article data from Readability
   * @param {string} url - Original URL
   * @returns {Object} Cleaned article data
   */
  processArticleData(article, url) {
    // Clean and truncate text content
    let textContent = article.textContent || '';
    textContent = this.cleanText(textContent);
    
    // Truncate if too long
    if (textContent.length > this.maxTextLength) {
      textContent = textContent.substring(0, this.maxTextLength) + '...';
    }

    // Extract site name from URL
    const siteName = this.extractSiteName(url);

    return {
      title: this.cleanText(article.title || 'Untitled'),
      textContent,
      byline: this.cleanText(article.byline || ''),
      siteName,
      url,
      length: article.length || 0,
      excerpt: article.excerpt || ''
    };
  }

  /**
   * Fallback extraction when Readability fails
   * @param {Document} document - DOM document
   * @param {string} url - Original URL
   * @returns {Object} Basic article data
   */
  fallbackExtraction(document, url) {
    // Try to extract basic information
    const title = document.querySelector('title')?.textContent ||
                  document.querySelector('h1')?.textContent ||
                  'Untitled';

    // Try to get main content from common selectors
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      'main',
      '.article-body'
    ];

    let textContent = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        textContent = element.textContent || '';
        break;
      }
    }

    // If no content found, get all paragraph text
    if (!textContent) {
      const paragraphs = document.querySelectorAll('p');
      textContent = Array.from(paragraphs)
        .map(p => p.textContent)
        .join(' ');
    }

    textContent = this.cleanText(textContent);
    if (textContent.length > this.maxTextLength) {
      textContent = textContent.substring(0, this.maxTextLength) + '...';
    }

    return {
      title: this.cleanText(title),
      textContent,
      byline: '',
      siteName: this.extractSiteName(url),
      url,
      length: textContent.length,
      excerpt: textContent.substring(0, 200) + '...'
    };
  }

  /**
   * Clean text content by removing extra whitespace and special characters
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
      .trim();
  }

  /**
   * Extract site name from URL
   * @param {string} url - URL to extract site name from
   * @returns {string} Site name
   */
  extractSiteName(url) {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;
      
      // Remove www. prefix
      hostname = hostname.replace(/^www\./, '');
      
      // Capitalize first letter
      return hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {
      return 'Unknown Site';
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
