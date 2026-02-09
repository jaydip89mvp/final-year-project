/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize topic input to prevent prompt injection
 * @param {string} topic - Raw topic input
 * @returns {string} - Sanitized topic
 */
export const sanitizeTopic = (topic) => {
  if (!topic || typeof topic !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and patterns
  let sanitized = topic.trim();
  
  // Remove common prompt injection patterns
  sanitized = sanitized.replace(/ignore\s+previous\s+instructions/gi, '');
  sanitized = sanitized.replace(/system\s*:/gi, '');
  sanitized = sanitized.replace(/user\s*:/gi, '');
  sanitized = sanitized.replace(/assistant\s*:/gi, '');
  sanitized = sanitized.replace(/\[INST\]/gi, '');
  sanitized = sanitized.replace(/\[\/INST\]/gi, '');
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Limit length (max 200 characters)
  sanitized = sanitized.substring(0, 200);
  
  return sanitized;
};

/**
 * Validate topic input
 * @param {string} topic - Topic to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateTopic = (topic) => {
  if (!topic || typeof topic !== 'string') {
    return { valid: false, error: 'Topic is required and must be a string' };
  }

  const trimmed = topic.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Topic cannot be empty' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Topic must be 200 characters or less' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /system\s*:/gi,
    /user\s*:/gi,
    /assistant\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<script/gi,
    /javascript:/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Topic contains invalid characters or patterns' };
    }
  }

  return { valid: true };
};

/**
 * Validate voice parameter
 * @param {string} voice - Voice to validate
 * @returns {string} - Valid voice name or default
 */
export const validateVoice = (voice) => {
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  
  if (!voice || typeof voice !== 'string') {
    return 'alloy'; // Default
  }

  const normalized = voice.toLowerCase().trim();
  return validVoices.includes(normalized) ? normalized : 'alloy';
};
