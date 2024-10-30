/**
 * @extends {Error}
 */
class RateLimitError extends Error {
  /**
   * @param {string} message
   * @param {Object} [metadata]
   * @param {string} [metadata.strategy]
   * @param {string} [metadata.key]
   * @param {number} [metadata.retryAfter]
   * @param {import('../types.js').RequestContext} [metadata.context]
   */
  constructor(message, metadata = {}) {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
    this.metadata = metadata;
    this.timestamp = Date.now();
  }

  /**
   * @returns {number|undefined}
   */
  getRetryAfter() {
    return this.metadata.retryAfter;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}

export default RateLimitError;