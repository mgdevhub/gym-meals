/**
 * SECURITY UTILITIES
 * Input validation and sanitization functions
 */

/**
 * Sanitize string input to prevent injection attacks
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input, maxLength = 100) {
    if (!input || typeof input !== 'string') return '';

    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    return sanitized.substring(0, maxLength);
}

/**
 * Validate and sanitize numeric input
 * @param {string|number} input - Raw numeric input
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} - Validated number or null if invalid
 */
export function sanitizeNumber(input, min = 0, max = Infinity) {
    const num = parseFloat(input);

    // Check if valid number
    if (isNaN(num) || !isFinite(num)) {
        return null;
    }

    // Enforce range
    if (num < min || num > max) {
        return null;
    }

    return num;
}

/**
 * Validate calorie input (0-5000 kcal range)
 * @param {string|number} calories - Calorie input
 * @returns {number|null} - Validated calories or null
 */
export function validateCalories(calories) {
    const cal = sanitizeNumber(calories, 0, 5000);

    if (cal === null) {
        return null;
    }

    // Round to nearest integer
    return Math.round(cal);
}

/**
 * Validate macro input (protein, carbs, fat)
 * @param {string|number} macro - Macro input in grams
 * @returns {number|null} - Validated macro or null
 */
export function validateMacro(macro) {
    const m = sanitizeNumber(macro, 0, 1000);

    if (m === null) {
        return null;
    }

    // Round to 1 decimal place
    return Math.round(m * 10) / 10;
}

/**
 * Validate food/exercise name
 * @param {string} name - Food or exercise name
 * @returns {string|null} - Sanitized name or null if invalid
 */
export function validateName(name) {
    const sanitized = sanitizeString(name, 100);

    if (sanitized.length === 0) {
        return null;
    }

    return sanitized;
}

/**
 * Rate limiting helper
 * Prevents API abuse by limiting calls per time window
 */
class RateLimiter {
    constructor(maxCalls, windowMs) {
        this.maxCalls = maxCalls;
        this.windowMs = windowMs;
        this.calls = [];
    }

    /**
     * Check if action is allowed
     * @returns {boolean} - True if action is allowed
     */
    isAllowed() {
        const now = Date.now();

        // Remove old calls outside the time window
        this.calls = this.calls.filter(timestamp => now - timestamp < this.windowMs);

        // Check if limit reached
        if (this.calls.length >= this.maxCalls) {
            return false;
        }

        // Record this call
        this.calls.push(now);
        return true;
    }

    /**
     * Get time until next allowed call
     * @returns {number} - Milliseconds until next call allowed
     */
    getRetryAfter() {
        if (this.calls.length === 0) return 0;

        const oldestCall = Math.min(...this.calls);
        const retryAfter = this.windowMs - (Date.now() - oldestCall);

        return Math.max(0, retryAfter);
    }
}

// Global rate limiters
export const geminiRateLimiter = new RateLimiter(10, 60 * 60 * 1000); // 10 calls per hour
export const photoScanLimiter = new RateLimiter(20, 24 * 60 * 60 * 1000); // 20 scans per day

/**
 * Secure JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parse fails
 * @returns {any} - Parsed object or fallback
 */
export function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('JSON parse error:', error);
        return fallback;
    }
}

/**
 * Secure JSON stringify with error handling
 * @param {any} obj - Object to stringify
 * @param {string} fallback - Fallback string if stringify fails
 * @returns {string} - JSON string or fallback
 */
export function safeJsonStringify(obj, fallback = '{}') {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.warn('JSON stringify error:', error);
        return fallback;
    }
}
