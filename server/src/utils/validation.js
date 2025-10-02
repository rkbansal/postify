/**
 * Validate the generate request body
 * @param {Object} body - Request body to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateGenerateRequest(body) {
  const errors = [];
  const { url, tone, platforms, hashtags, cta } = body;

  // Validate URL
  if (!url) {
    errors.push('URL is required');
  } else if (typeof url !== 'string') {
    errors.push('URL must be a string');
  } else {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('URL must be a valid URL');
    }
  }

  // Validate tone
  const validTones = ['Professional', 'Witty', 'Punchy', 'Neutral'];
  if (!tone) {
    errors.push('Tone is required');
  } else if (!validTones.includes(tone)) {
    errors.push(`Tone must be one of: ${validTones.join(', ')}`);
  }

  // Validate platforms
  const validPlatforms = ['Twitter', 'LinkedIn', 'Instagram'];
  if (!platforms) {
    errors.push('Platforms array is required');
  } else if (!Array.isArray(platforms)) {
    errors.push('Platforms must be an array');
  } else if (platforms.length === 0) {
    errors.push('At least one platform must be selected');
  } else {
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms are: ${validPlatforms.join(', ')}`);
    }
  }

  // Validate hashtags (optional)
  if (hashtags !== undefined) {
    if (!Array.isArray(hashtags)) {
      errors.push('Hashtags must be an array');
    } else {
      const invalidHashtags = hashtags.filter(h => typeof h !== 'string' || h.trim().length === 0);
      if (invalidHashtags.length > 0) {
        errors.push('All hashtags must be non-empty strings');
      }
      if (hashtags.length > 10) {
        errors.push('Maximum 10 hashtags allowed');
      }
    }
  }

  // Validate CTA (optional)
  if (cta !== undefined) {
    if (typeof cta !== 'string') {
      errors.push('CTA must be a string');
    } else if (cta.length > 100) {
      errors.push('CTA must be 100 characters or less');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input to prevent XSS and other issues
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
