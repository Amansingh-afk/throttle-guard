/**
 * @typedef {import('./types.js').HandlerOptions} HandlerOptions
 * @typedef {import('./types.js').RequestContext} RequestContext
 */

import ThrottleGuard from './services/ThrottleGuard.js';
import TokenBucketStrategy from './strategies/TokenBucketStrategy.js';
import SlidingWindowStrategy from './strategies/SlidingWindowStrategy.js';
import RateLimitError from './errors/RateLimitError.js';
import keyGenerator from './utils/keyGenerator.js';
import RateLimitLogger from './utils/logger.js';

/**
 * Creates an Express middleware for rate limiting
 * @param {Object} options
 * @param {ThrottleGuard} options.guard - ThrottleGuard instance
 * @param {string} options.strategyName - Strategy to use
 * @param {(req: any) => string} [options.keyGenerator] - Custom key generator
 * @param {(req: any) => RequestContext} [options.contextGenerator] - Custom context generator
 * @param {(error: RateLimitError, req: any, res: any) => void} [options.onThrottled] - Custom throttle handler
 * @returns {(req: any, res: any, next: Function) => Promise<void>}
 */
const createMiddleware = ({
  guard,
  strategyName,
  keyGenerator: customKeyGen = (req) => keyGenerator.fromIP(req.ip),
  contextGenerator = (req) => ({
    ip: req.ip,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  }),
  onThrottled = (error, req, res) => {
    const retryAfter = error.getRetryAfter();
    if (retryAfter) {
      res.set('Retry-After', Math.ceil(retryAfter / 1000));
    }
    res.status(429).json({
      error: error.message,
      retryAfter
    });
  }
}) => {
  return async (req, res, next) => {
    try {
      await guard.handleRequest({
        key: customKeyGen(req),
        strategyName,
        context: contextGenerator(req),
        handler: async () => next(),
        onThrottled: (error) => onThrottled(error, req, res)
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates a preconfigured ThrottleGuard instance
 * @param {Object} options
 * @param {Object} [options.basic] - Basic strategy options
 * @param {number} [options.basic.capacity=60] - Token capacity
 * @param {number} [options.basic.refillRate=1] - Tokens per second
 * @param {Object} [options.strict] - Strict strategy options
 * @param {number} [options.strict.windowSize=60000] - Window size in ms
 * @param {number} [options.strict.maxRequests=30] - Max requests per window
 * @param {import('./types.js').LoggerOptions} [options.logger] - Logger options
 * @returns {ThrottleGuard}
 */
const createGuard = ({
  basic = { capacity: 60, refillRate: 1 },
  strict = { windowSize: 60000, maxRequests: 30 },
  logger
} = {}) => {
  const guard = new ThrottleGuard({ logger });

  if (basic) {
    guard.setStrategy('basic', new TokenBucketStrategy(
      basic.capacity,
      basic.refillRate
    ));
  }

  if (strict) {
    guard.setStrategy('strict', new SlidingWindowStrategy(
      strict.windowSize,
      strict.maxRequests
    ));
  }

  return guard;
};

export {
  ThrottleGuard,
  TokenBucketStrategy,
  SlidingWindowStrategy,
  RateLimitError,
  keyGenerator,
  RateLimitLogger,
  createMiddleware,
  createGuard
};

// Default export for convenience
export default {
  ThrottleGuard,
  TokenBucketStrategy,
  SlidingWindowStrategy,
  RateLimitError,
  keyGenerator,
  RateLimitLogger,
  createMiddleware,
  createGuard
};