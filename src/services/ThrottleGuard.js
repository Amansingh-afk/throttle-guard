import RateLimitError from '../errors/RateLimitError.js';
import RateLimitLogger from '../utils/logger.js';

class ThrottleGuard {
    constructor(options = {}) {
        if (ThrottleGuard.instance) {
            return ThrottleGuard.instance;
        }
        
        this.strategies = new Map();
        this.defaultStrategy = null;
        this.logger = new RateLimitLogger(options.logger);
        this.skipFunction = options.skip || (() => false);
        this.errorMessages = {
            default: 'Too Many Requests',
            ...options.errorMessages
        };
        
        ThrottleGuard.instance = this;
    }

    setStrategy(name, strategy) {
        this.strategies.set(name, strategy);
        if (!this.defaultStrategy) {
            this.defaultStrategy = strategy;
        }
    }

    setDefaultStrategy(name) {
        const strategy = this.strategies.get(name);
        if (strategy) {
            this.defaultStrategy = strategy;
        } else {
            throw new Error(`Strategy ${name} not found`);
        }
    }

    async handleRequest(options) {
        const {
            key,
            strategyName = null,
            handler,
            request = {},
            onThrottled,
            skipCheck = false
        } = options;

        // Check if request should be skipped
        if (skipCheck && this.skipFunction(request)) {
            return handler();
        }

        const strategy = strategyName 
            ? this.strategies.get(strategyName) 
            : this.defaultStrategy;

        if (!strategy) {
            throw new Error('No rate limiting strategy available');
        }

        if (strategy.isAllowed(key)) {
            try {
                return await handler();
            } catch (error) {
                throw error;
            }
        }

        // Create rate limit error with metadata
        const error = new RateLimitError(
            this.errorMessages[strategyName] || this.errorMessages.default,
            {
                strategy: strategyName,
                key,
                requestPath: request.path,
                requestMethod: request.method
            }
        );

        // Log the rate limit error
        this.logger.log(error, request);

        // Handle throttled request
        if (onThrottled) {
            return onThrottled(error);
        }

        return {
            status: error.status,
            body: {
                error: error.message,
                retryAfter: strategy.getRetryAfter?.(key)
            }
        };
    }
}

export default ThrottleGuard;