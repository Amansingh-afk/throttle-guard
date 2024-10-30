import RateLimitStrategy from './RateLimitStrategy.js';

/** @implements {import('../types.js').RateLimitStrategy} */
class SlidingWindowStrategy extends RateLimitStrategy {
  /**
   * @param {number} windowSize - Window size in milliseconds
   * @param {number} maxRequests - Maximum requests per window
   */
  constructor(windowSize, maxRequests) {
    super();
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
    /** @type {Map<string, number[]>} */
    this.requests = new Map();
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    
    const timestamps = this.#getValidTimestamps(key, windowStart);
    if (timestamps.length >= this.maxRequests) {
      return false;
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);
    return true;
  }

  /**
   * @param {string} key
   * @returns {number}
   */
  getRetryAfter(key) {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length < this.maxRequests) return 0;
    
    const oldestValidRequest = timestamps[timestamps.length - this.maxRequests];
    return Math.max(0, oldestValidRequest + this.windowSize - Date.now());
  }

  /**
   * @private
   * @param {string} key
   * @param {number} windowStart
   * @returns {number[]}
   */
  #getValidTimestamps(key, windowStart) {
    const timestamps = this.requests.get(key) || [];
    return timestamps.filter(time => time > windowStart);
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    for (const [key, timestamps] of this.requests) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

export default SlidingWindowStrategy;