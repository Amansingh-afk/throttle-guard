import RateLimitStrategy from './RateLimitStrategy.js';

/** @implements {import('../types.js').RateLimitStrategy} */
class TokenBucketStrategy extends RateLimitStrategy {
  /**
   * @param {number} capacity - Maximum tokens
   * @param {number} refillRate - Tokens per second
   */
  constructor(capacity, refillRate) {
    super();
    this.capacity = capacity;
    this.refillRate = refillRate;
    /** @type {Map<string, import('../types.js').Bucket>} */
    this.buckets = new Map();
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  isAllowed(key) {
    const now = Date.now();
    const bucket = this.#getBucket(key, now);
    
    if (bucket.tokens < 1) return false;
    
    bucket.tokens--;
    this.buckets.set(key, bucket);
    return true;
  }

  /**
   * @param {string} key
   * @returns {number}
   */
  getRetryAfter(key) {
    const bucket = this.buckets.get(key);
    if (!bucket) return 0;
    
    return Math.ceil((1 - bucket.tokens) * (1000 / this.refillRate));
  }

  /**
   * @private
   * @param {string} key
   * @param {number} now
   * @returns {import('../types.js').Bucket}
   */
  #getBucket(key, now) {
    const bucket = this.buckets.get(key) || { tokens: this.capacity, lastRefill: now };
    const timePassed = now - bucket.lastRefill;
    const refill = (timePassed * this.refillRate) / 1000;
    
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
    bucket.lastRefill = now;
    
    return bucket;
  }
}

export default TokenBucketStrategy;
