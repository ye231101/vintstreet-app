/**
 * Safe Logging Utility
 * Prevents sensitive data from being logged in production builds
 * Sanitizes payment data, user IDs, tokens, and other sensitive information
 */

const isDevelopment = __DEV__;

/**
 * Sensitive data patterns to sanitize
 */
const SENSITIVE_PATTERNS = {
  // Payment data
  card: /card/i,
  payment: /payment|payment_method|payment_intent/i,
  stripe: /stripe/i,
  price: /price|amount|total|cost/i,
  order: /order/i,
  checkout: /checkout/i,

  // Authentication
  token: /token|access_token|refresh_token|jwt|bearer/i,
  password: /password|pwd|passwd/i,
  auth: /auth|authentication|credentials/i,
  session: /session|session_id/i,

  // Personal data
  email: /email|e-mail/i,
  phone: /phone|mobile|telephone/i,
  address: /address|street|city|postal|zip/i,
  ssn: /ssn|social_security/i,

  // User identifiers
  userId: /user_id|userId|user\.id|buyer_id|seller_id/i,
  id: /\bid\b/i,
};

/**
 * Check if a key contains sensitive information
 */
function isSensitiveKey(key: string): boolean {
  return Object.values(SENSITIVE_PATTERNS).some((pattern) => pattern.test(key));
}

/**
 * Sanitize an object by removing or masking sensitive data
 */
function sanitizeData(data: unknown, depth: number = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[Max depth reached]';
  }

  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data;
  }

  // Handle Error objects
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      // Only include stack in development
      stack: isDevelopment ? data.stack : '[Stack trace hidden]',
    };
  }

  // Handle objects
  const sanitized: unknown = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      // Mask sensitive values
      if (typeof value === 'string' && value.length > 0) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'number') {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value, depth + 1);
    }
  }

  return sanitized;
}

/**
 * Safe logger that prevents sensitive data logging in production
 */
class SafeLogger {
  /**
   * Log info messages (only in development)
   */
  info(...args: unknown[]): void {
    if (isDevelopment) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.info(...sanitized);
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(...args: unknown[]): void {
    if (isDevelopment) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.debug(...sanitized);
    }
  }

  /**
   * Log warning messages (sanitized in production)
   */
  warn(...args: unknown[]): void {
    const sanitized = args.map((arg) => sanitizeData(arg));
    console.warn(...sanitized);
  }

  /**
   * Log error messages (sanitized in production)
   * Errors are always logged but sensitive data is redacted
   */
  error(message: string, error?: unknown): void {
    if (isDevelopment) {
      // In development, log full details
      if (error) {
        console.error(`[ERROR] ${message}`, error);
      } else {
        console.error(`[ERROR] ${message}`);
      }
    } else {
      // In production, sanitize error data
      const sanitizedError = error ? sanitizeData(error) : undefined;
      if (sanitizedError) {
        console.error(`[ERROR] ${message}`, sanitizedError);
      } else {
        console.error(`[ERROR] ${message}`);
      }
    }
  }

  /**
   * Log general messages (only in development)
   */
  log(...args: unknown[]): void {
    if (isDevelopment) {
      const sanitized = args.map((arg) => sanitizeData(arg));
      console.log(...sanitized);
    }
  }
}

// Export singleton instance
export const logger = new SafeLogger();

// Export sanitize function for manual use if needed
export { sanitizeData };

