/** @implements {import('../types.js').RateLimitStrategy} */
class RateLimitStrategy {
  /**
   * @param {string} key
   * @returns {boolean}
   * @abstract
   */
  isAllowed(key) {
    throw new Error('isAllowed method must be implemented');
  }

  /**
   * @param {string} key
   * @returns {number}
   */
  getRetryAfter(key) {
    return 0;
  }

  /**
   * Reset strategy state
   */
  reset() {
    // Optional method to be implemented by strategies
  }
}

export default RateLimitStrategy;