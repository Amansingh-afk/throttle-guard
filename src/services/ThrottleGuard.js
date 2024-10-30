import RateLimitError from '../errors/RateLimitError.js';
import RateLimitLogger from '../utils/logger.js';

/**
 * @typedef {import('../types.js').HandlerOptions} HandlerOptions
 * @typedef {import('../types.js').RateLimitStrategy} RateLimitStrategy
 */

class ThrottleGuard {
  /**
   * @param {Object} [options]
   * @param {import('../types.js').LoggerOptions} [options.logger]
   * @param {(context: import('../types.js').RequestContext) => boolean} [options.skip]
   * @param {Record<string, string>} [options.errorMessages]
   */
  constructor(options = {}) {
    /** @type {Map<string, RateLimitStrategy>} */
    this.strategies = new Map();
    this.logger = new RateLimitLogger(options.logger);
    this.skip = options.skip || (() => false);
    this.errorMessages = {
      default: 'Rate limit exceeded',
      ...options.errorMessages
    };
  }

  /**
   * @param {string} name
   * @param {RateLimitStrategy} strategy
   * @throws {Error} If strategy is invalid
   */
  setStrategy(name, strategy) {
    if (!strategy?.isAllowed) {
      throw new Error('Invalid rate limiting strategy');
    }
    this.strategies.set(name, strategy);
  }

  /**
   * @param {HandlerOptions} options
   * @returns {Promise<any>}
   * @throws {RateLimitError}
   */
  async handleRequest({
    key,
    strategyName = 'default',
    handler,
    context,
    onThrottled,
    bypass = false
  }) {
    if (bypass || (context && this.skip(context))) {
      return handler();
    }

    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy '${strategyName}' not found`);
    }

    if (!strategy.isAllowed(key)) {
      const error = this.#createError(strategyName, key, strategy, context);
      this.logger.log(error, context);
      
      if (onThrottled) {
        return onThrottled(error);
      }
      throw error;
    }

    return handler();
  }

  /**
   * @private
   * @param {string} strategyName
   * @param {string} key
   * @param {RateLimitStrategy} strategy
   * @param {import('../types.js').RequestContext} [context]
   * @returns {RateLimitError}
   */
  #createError(strategyName, key, strategy, context) {
    return new RateLimitError(
      this.errorMessages[strategyName] || this.errorMessages.default,
      {
        strategy: strategyName,
        key,
        retryAfter: strategy.getRetryAfter?.(key),
        context
      }
    );
  }
}

export default ThrottleGuard;