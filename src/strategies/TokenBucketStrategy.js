import RateLimitStrategy from './RateLimitStrategy.js';

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
        
        // Initialize tokens and timestamp if not exists
        if (!this.tokens.has(key)) {
            this.tokens.set(key, this.capacity);
            this.lastRefillTimestamp.set(key, now);
            return this.tokens.get(key);
        }

        const lastRefill = this.lastRefillTimestamp.get(key);
        const timePassed = (now - lastRefill) / 1000; // Convert to seconds
        
        let currentTokens = this.tokens.get(key);
        
        // Calculate new tokens
        const newTokens = timePassed * this.refillRate;
        currentTokens = Math.min(
            this.capacity,
            currentTokens + newTokens
        );

        // Update state
        this.tokens.set(key, currentTokens);
        this.lastRefillTimestamp.set(key, now);
        
        return currentTokens;
    }

    isAllowed(key) {
        const currentTokens = this.refillTokens(key);
        
        if (currentTokens >= 1) {
            this.tokens.set(key, currentTokens - 1);
            return true;
        }
        
        return false;
    }

    getRetryAfter(key) {
        const currentTokens = this.tokens.get(key) || 0;
        if (currentTokens >= 1) return 0;
        
        const timeNeeded = (1 - currentTokens) / this.refillRate;
        return Math.ceil(timeNeeded * 1000); // Return milliseconds
    }
}

export default TokenBucketStrategy;
