// throttle-guard.js

// Strategy interface for different rate limiting algorithms
class RateLimitStrategy {
    isAllowed(key) {
        throw new Error('isAllowed method must be implemented');
    }
}

// Token Bucket implementation
class TokenBucketStrategy extends RateLimitStrategy {
    constructor(capacity, refillRate) {
        super();
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = new Map();
        this.lastRefillTimestamp = new Map();
    }

    refillTokens(key) {
        const now = Date.now();
        const lastRefill = this.lastRefillTimestamp.get(key) || now;
        const timePassed = now - lastRefill;
        
        let currentTokens = this.tokens.get(key) || this.capacity;
        currentTokens = Math.min(
            this.capacity,
            currentTokens + (timePassed * this.refillRate) / 1000
        );

        this.tokens.set(key, currentTokens);
        this.lastRefillTimestamp.set(key, now);
        return currentTokens;
    }

    isAllowed(key) {
        let currentTokens = this.refillTokens(key);
        if (currentTokens >= 1) {
            this.tokens.set(key, currentTokens - 1);
            return true;
        }
        return false;
    }
}

// Sliding Window implementation
class SlidingWindowStrategy extends RateLimitStrategy {
    constructor(windowSize, maxRequests) {
        super();
        this.windowSize = windowSize;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    isAllowed(key) {
        const now = Date.now();
        const windowStart = now - this.windowSize;
        
        let requests = this.requests.get(key) || [];
        requests = requests.filter(timestamp => timestamp > windowStart);
        
        if (requests.length < this.maxRequests) {
            requests.push(now);
            this.requests.set(key, requests);
            return true;
        }
        
        return false;
    }
}

// Main ThrottleGuard service using Singleton pattern
class ThrottleGuard {
    constructor() {
        if (ThrottleGuard.instance) {
            return ThrottleGuard.instance;
        }
        
        this.strategies = new Map();
        this.defaultStrategy = null;
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
            onThrottled = () => ({ 
                status: 429, 
                body: 'Too Many Requests' 
            })
        } = options;

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

        return onThrottled();
    }
}

// Helper function to generate keys
const keyGenerator = {
    fromIP: (ip) => `ip:${ip}`,
    fromUser: (userId) => `user:${userId}`,
    fromEndpoint: (endpoint) => `endpoint:${endpoint}`,
    composite: (...parts) => parts.join(':')
};

// Export as a module
export {
    ThrottleGuard,
    TokenBucketStrategy,
    SlidingWindowStrategy,
    keyGenerator
};


import { 
    ThrottleGuard, 
    TokenBucketStrategy, 
    SlidingWindowStrategy, 
    keyGenerator 
} from './throttle-guard.js';

// Initialize ThrottleGuard
const guard = new ThrottleGuard();

// Configure different strategies
guard.setStrategy('basic', new TokenBucketStrategy(10, 2)); // 10 tokens, refill 2 per second
guard.setStrategy('strict', new SlidingWindowStrategy(60000, 30)); // 30 requests per minute

// Example usage with Express
app.use(async (req, res, next) => {
    try {
        const result = await guard.handleRequest({
            key: keyGenerator.fromIP(req.ip),
            strategyName: 'basic',
            handler: async () => next(),
            onThrottled: () => {
                res.status(429).json({ error: 'Rate limit exceeded' });
            }
        });
    } catch (error) {
        next(error);
    }
});